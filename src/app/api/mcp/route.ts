import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Interface for OpenFDA label result
interface DrugLabelInfo {
  name: string
  brand_name: string
  generic_name: string
  drug_interactions: string | null
  warnings: string | null
}

// Fetch drug label from OpenFDA with timeout
async function fetchDrugLabel(drugName: string): Promise<DrugLabelInfo | null> {
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
    const extractText = (field: any): string | null => {
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

export async function POST(request: Request) {
  let id: any = null
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    id = body?.id
    const { method, params } = body

    // 2. List tools method
    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        result: {
          tools: [
            {
              name: 'check_drug_interaction',
              description: 'Checks for potential drug-drug interactions or side effects between a list of medications using openFDA API data.',
              inputSchema: {
                type: 'object',
                properties: {
                  drugs: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'An array of drug names (generic or brand name) to analyze, e.g. ["aspirin", "ibuprofen"].',
                  },
                },
                required: ['drugs'],
              },
            },
          ],
        },
        id,
      })
    }

    // 3. Call tool method
    if (method === 'tools/call') {
      const { name, arguments: args } = params

      if (name === 'check_drug_interaction') {
        const drugs: string[] = args?.drugs || []

        if (drugs.length < 2) {
          return NextResponse.json({
            jsonrpc: '2.0',
            result: {
              content: [
                {
                  type: 'text',
                  text: 'Vui lòng cung cấp ít nhất 2 loại thuốc để kiểm tra tương tác thuốc.',
                },
              ],
              isError: false,
            },
            id,
          })
        }

        // Limit the number of drugs to prevent DoS amplification
        if (drugs.length > 10) {
          return NextResponse.json({
            jsonrpc: '2.0',
            result: {
              content: [
                {
                  type: 'text',
                  text: 'Tối đa 10 loại thuốc mỗi lần kiểm tra.',
                },
              ],
              isError: true,
            },
            id,
          })
        }

        // Limit the length of drug names
        for (const drug of drugs) {
          if (typeof drug !== 'string' || drug.length > 100) {
            return NextResponse.json({
              jsonrpc: '2.0',
              error: {
                code: -32602,
                message: 'Tên thuốc không hợp lệ hoặc quá dài (tối đa 100 ký tự).'
              },
              id
            })
          }
        }

        // Fetch labels for all drugs concurrently
        const labelPromises = drugs.map((drug) => fetchDrugLabel(drug))
        const labels = await Promise.all(labelPromises)

        // Build report
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

        return NextResponse.json({
          jsonrpc: '2.0',
          result: {
            content: [
              {
                type: 'text',
                text: reportText,
              },
            ],
            isError: false,
          },
          id,
        })
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: `Tool ${name} not found.`,
        },
        id,
      })
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      error: {
        code: -32601,
        message: `Method ${method} not found.`,
      },
      id,
    })
  } catch (error: any) {
    console.error('MCP Server Route Error:', error)
    return NextResponse.json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal server error.',
      },
      id,
    })
  }
}
