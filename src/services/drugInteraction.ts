// Shared openFDA drug-label lookup + interaction-report builder.
//
// This module is the single source of truth for the `check_drug_interaction`
// tool logic. It is consumed by BOTH tool transports:
//   1. /api/mcp            — the internal JSON-RPC 2.0 endpoint used by the
//                            chat agent pipeline (Supabase-authenticated).
//   2. /api/mcp-server/mcp — the public, spec-compliant MCP server
//                            (Streamable HTTP via @modelcontextprotocol/sdk),
//                            connectable from any MCP client.
// Keeping the logic here guarantees the two transports can never drift apart.

export interface DrugLabelInfo {
  name: string
  brand_name: string
  generic_name: string
  drug_interactions: string | null
  warnings: string | null
}

// DoS limits: this tool fans out one openFDA request per drug, so both the
// list size and the name length are capped before any network call is made.
export const MAX_DRUGS_PER_CHECK = 10
export const MAX_DRUG_NAME_LENGTH = 100

// Fetch drug label from OpenFDA with timeout
export async function fetchDrugLabel(drugName: string): Promise<DrugLabelInfo | null> {
  // We search in brand_name, generic_name, and active_ingredient
  const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(
    drugName
  )}"+OR+openfda.generic_name:"${encodeURIComponent(
    drugName
  )}"+OR+active_ingredient:"${encodeURIComponent(drugName)}"`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) {
      // Do NOT log the drug name (PHI). Log only the opaque status.
      console.warn('OpenFDA lookup returned a non-OK status', { status: res.status })
      return null
    }
    const data = await res.json()
    if (!data.results || data.results.length === 0) {
      return null
    }
    const result = data.results[0]

    // Extract interaction text. It can be a string or an array of strings.
    const extractText = (field: unknown): string | null => {
      if (!field) return null
      if (Array.isArray(field)) return field.join('\n')
      return String(field)
    }

    return {
      name: drugName,
      brand_name: result.openfda?.brand_name?.[0] || drugName,
      generic_name: result.openfda?.generic_name?.[0] || drugName,
      drug_interactions: extractText(result.drug_interactions),
      warnings: extractText(result.warnings),
    }
  } catch (error) {
    // Do NOT log the drug name (PHI).
    console.error('OpenFDA drug-label lookup failed', error)
    return null
  }
}

// Fetches all labels concurrently and renders the Vietnamese report the
// Interaction Checker agent reasons over. The exact wording matters: the
// downstream Gemini prompt expects this structure, so do not localize or
// reformat without also reviewing the checker prompt in /api/chat.
export async function buildInteractionReport(drugs: string[]): Promise<string> {
  const labels = await Promise.all(drugs.map((drug) => fetchDrugLabel(drug)))

  let reportText = `BÁO CÁO TRA CỨU TƯƠNG TÁC THUỐC (NGUỒN: openFDA)\n`
  reportText += `=================================================\n\n`

  let foundAnyData = false

  labels.forEach((label, idx) => {
    const searchName = drugs[idx]
    if (!label) {
      reportText += `- Không tìm thấy dữ liệu nhãn chính thức cho: "${searchName}" trên OpenFDA.\n\n`
      return
    }

    foundAnyData = true
    reportText += `### THUỐC: ${label.brand_name.toUpperCase()} (Tên gốc: ${label.generic_name})\n`

    if (label.drug_interactions) {
      reportText += `* **Thông tin tương tác thuốc:**\n${label.drug_interactions}\n\n`
    } else {
      reportText += `* **Thông tin tương tác thuốc:** Không tìm thấy phần thông tin tương tác cụ thể trong tài liệu nhãn.\n\n`
    }

    if (label.warnings) {
      reportText += `* **Cảnh báo chung (Warnings):**\n${label.warnings.slice(0, 1000)}${label.warnings.length > 1000 ? '...' : ''}\n\n`
    }
    reportText += `-------------------------------------------------\n\n`
  })

  if (!foundAnyData) {
    reportText = `Không thể tìm thấy dữ liệu cho bất kỳ loại thuốc nào trong danh sách: ${drugs.join(', ')} trên OpenFDA.`
  } else {
    reportText += `\n*Lưu ý: Dữ liệu trên được trích xuất từ nhãn thuốc chính thức của FDA Hoa Kỳ. AI Agent cần đọc và phân tích xem có bất kỳ sự tương tác chéo nào giữa các loại thuốc này để đưa ra cảnh báo cho người dùng.*`
  }

  return reportText
}
