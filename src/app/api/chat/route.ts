import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenAI } from '@google/genai'
import {
  getMedications,
  addMedication,
  getMedicationLogs,
  updateLogStatus,
} from '@/services/medicationService'

function safeParseJson<T>(text: string | undefined | null): T | null {
  if (!text) return null
  let s = text.trim()
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  }
  try {
    return JSON.parse(s) as T
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user using Supabase Auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập để sử dụng tính năng này.' }, { status: 401 })
    }

    const body = await request.json()
    const { message = '', image } = body

    if (!message && !image) {
      return NextResponse.json({ error: 'Tin nhắn hoặc hình ảnh không được để trống.' }, { status: 400 })
    }

    const activeMessage = message || 'Hãy phân tích hình ảnh đơn thuốc hoặc vỏ hộp thuốc này để thêm vào lịch uống thuốc của tôi.'

    // 2. Initialize Google Gen AI
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json({
        error: 'Chưa cấu hình GEMINI_API_KEY. Vui lòng thiết lập biến môi trường.',
      }, { status: 500 })
    }
    const ai = new GoogleGenAI({ apiKey })

    // 3. Fetch user context (current medications and today's logs)
    const currentMedications = await getMedications()
    const todayLogs = await getMedicationLogs()

    const medContext = currentMedications
      .map((m) => `- ${m.name} (${m.dosage}, tần suất: ${m.frequency}, giờ uống: ${m.schedule.join(', ')})`)
      .join('\n')

    const logsContext = todayLogs
      .map(
        (l) =>
          `- ${l.medication?.name || 'Thuốc'}: scheduled lúc ${new Date(
            l.scheduled_time
          ).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - Trạng thái: ${l.status}`
      )
      .join('\n')

    // 4. Run Intake Agent using Structured Outputs to understand user intent
    const intakeSystemInstruction = `
Bạn là Intake Agent của ứng dụng MediMate AI - trợ lý quản lý lịch uống thuốc cá nhân.
Nhiệm vụ của bạn là phân tích tin nhắn hoặc hình ảnh đơn thuốc/hộp thuốc của người dùng bằng tiếng Việt và phân loại thành các hành động:
- "ADD_MEDICATION": Khi người dùng muốn thêm thuốc mới. Bạn cần trích xuất danh sách các thuốc trong đơn thuốc vào mảng medication_details. Phải tách rời TỪNG loại thuốc riêng biệt thành một phần tử trong mảng (ví dụ: nếu đơn thuốc có Paracetamol và Aspirin, đó phải là 2 phần tử riêng biệt trong mảng medication_details). Với mỗi thuốc, trích xuất tên thuốc, liều lượng, tần suất, danh sách các giờ uống thuốc (định dạng HH:MM), tổng số lượng tồn kho (total_stock) nếu có (ví dụ: "30 viên") và số viên/đơn vị uống mỗi lần (dosage_quantity, ví dụ: "mỗi lần uống 2 viên" -> 2. Mặc định là 1).
- "LOG_TAKEN": Khi người dùng báo đã uống thuốc (ví dụ: "tớ đã uống aspirin rồi"). Bạn cần trích xuất tên thuốc.
- "GENERAL_CHAT": Khi người dùng trò chuyện chung, hỏi đáp về sức khỏe hoặc tư vấn y tế nhẹ nhàng.

Nếu người dùng gửi kèm hình ảnh đơn thuốc hoặc vỏ hộp thuốc, hãy tự động nhận diện và trích xuất thông tin thuốc từ hình ảnh đó để thêm vào lịch uống (ADD_MEDICATION).

Danh sách các thuốc hiện tại của người dùng:
${medContext || 'Chưa có thuốc nào.'}

Nhật ký uống thuốc hôm nay của người dùng:
${logsContext || 'Chưa có nhật ký hôm nay.'}

QUY TẮC AN TOÀN QUAN TRỌNG (GUARDRAILS):
1. Bạn là trợ lý hỗ trợ nhắc lịch, không phải bác sĩ. Tuyệt đối không tự ý chẩn đoán bệnh hay kê đơn thuốc.
2. Nếu người dùng hỏi lời khuyên y tế phức tạp, hãy khuyên họ tham khảo ý kiến bác sĩ chuyên khoa.
3. Luôn phản hồi lịch sự, thân thiện và bằng tiếng Việt.
`

    const schema = {
      type: 'OBJECT',
      properties: {
        action: {
          type: 'STRING',
          enum: ['ADD_MEDICATION', 'LOG_TAKEN', 'GENERAL_CHAT'],
          description: 'Hành động được xác định từ tin nhắn hoặc hình ảnh đơn thuốc.',
        },
        prescription_name: {
          type: 'STRING',
          description: 'Tên hoặc nhãn của đơn thuốc. Hãy tự động nhận diện từ hình ảnh đơn thuốc hoặc tin nhắn (ví dụ: "Đơn thuốc Cao huyết áp - BV Bạch Mai", "Đơn khớp - Bác sĩ Hùng"). Tên nên ngắn gọn, phản ánh đúng chẩn đoán bệnh hoặc bệnh viện. Nếu không xác định được, hãy để trống hoặc trả về null.',
        },
        medication_details: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING', description: 'Tên thuốc' },
              dosage: { type: 'STRING', description: 'Liều lượng, ví dụ: 81mg, 1 viên, 5ml' },
              frequency: { type: 'STRING', description: 'Tần suất, ví dụ: mỗi sáng, ngày 2 lần, mỗi ngày' },
              schedule: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: 'Mảng chứa các giờ uống thuốc ở định dạng HH:MM, ví dụ: ["08:00", "20:00"]',
              },
              total_stock: {
                type: 'NUMBER',
                description: 'Tổng số lượng thuốc được cấp/mua nếu có ghi trong đơn hoặc tin nhắn, ví dụ: 30, 60. Nếu không có hãy để trống hoặc trả về null.',
              },
              dosage_quantity: {
                type: 'NUMBER',
                description: 'Số lượng viên thuốc hoặc đơn vị uống của loại thuốc này trong mỗi lần uống. Hỗ trợ cả số thập phân khi người dùng uống nửa viên (ví dụ: "uống 1/2 viên" -> 0.5, "uống 1 viên rưỡi" -> 1.5). Mặc định là 1.',
              },
            },
            required: ['name', 'dosage', 'frequency', 'schedule'],
          },
          description: 'Danh sách các thuốc cần thêm nếu hành động là ADD_MEDICATION. Trích xuất TỪNG loại thuốc riêng biệt trong đơn thuốc, KHÔNG gộp chung lại với nhau.',
        },
        log_details: {
          type: 'OBJECT',
          properties: {
            medication_name: { type: 'STRING', description: 'Tên thuốc người dùng đã uống' },
          },
          required: ['medication_name'],
          description: 'Chi tiết log uống thuốc nếu hành động là LOG_TAKEN.',
        },
        general_response: {
          type: 'STRING',
          description: 'Lời phản hồi tự nhiên bằng tiếng Việt cho người dùng (đặc biệt là cho GENERAL_CHAT hoặc lời xác nhận/chào hỏi).',
        },
      },
      required: ['action', 'general_response'],
    }

    // Process image base64 if provided
    let contentParts: any[] = [activeMessage]
    if (image && image.data && image.mimeType) {
      const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp']
      const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
      if (!ALLOWED_MIME.includes(image.mimeType)) {
        return NextResponse.json({ error: 'Định dạng ảnh không được hỗ trợ. Vui lòng gửi ảnh PNG, JPEG hoặc WEBP.' }, { status: 415 })
      }
      let base64Data = image.data
      if (base64Data.includes(';base64,')) {
        base64Data = base64Data.split(';base64,')[1]
      }
      if (Buffer.byteLength(base64Data, 'base64') > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Ảnh vượt quá dung lượng tối đa 5MB.' }, { status: 413 })
      }
      contentParts.push({
        inlineData: {
          data: base64Data,
          mimeType: image.mimeType,
        },
      })
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: contentParts,
      config: {
        systemInstruction: intakeSystemInstruction,
        responseMimeType: 'application/json',
        responseSchema: schema as any,
      },
    })

    const nluResult = safeParseJson<any>(response.text)
    if (!nluResult || !nluResult.action) {
      return NextResponse.json({
        action: 'CHAT_RESPONSE',
        message: 'Xin lỗi, tôi chưa hiểu rõ yêu cầu của bạn. Bạn vui lòng nói rõ hơn về tên thuốc và liều lượng nhé.',
      })
    }

    // 5. Handle Action: ADD_MEDICATION
    if (nluResult.action === 'ADD_MEDICATION' && Array.isArray(nluResult.medication_details) && nluResult.medication_details.length > 0) {
      const newMeds = nluResult.medication_details
      const savedMeds = []
      const warnings = []

      // Generate a default prescription name based on source (OCR image vs chat) and date/time
      const now = new Date()
      const dateStr = now.toLocaleDateString('vi-VN')
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      const defaultPrescriptionName = nluResult.prescription_name || (contentParts.some(p => typeof p === 'object' && 'inlineData' in p)
        ? `Đơn thuốc hình ảnh (${dateStr} ${timeStr})`
        : `Đơn thuốc từ chat (${dateStr} ${timeStr})`)

      for (const newMed of newMeds) {
        const existingDrugNames = [
          ...currentMedications.map((m) => m.name),
          ...savedMeds.map((m) => m.name)
        ]

        // If we have existing medications, check for interactions
        if (existingDrugNames.length > 0) {
          const allDrugsToCheck = [...existingDrugNames, newMed.name]
          
          // Call local MCP Server route to query OpenFDA
          const mcpUrl = new URL('/api/mcp', request.url).toString()
          let mcpReport = ''
          try {
            const mcpRes = await fetch(mcpUrl, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || '',
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'check_drug_interaction',
                  arguments: { drugs: allDrugsToCheck },
                },
                id: 1,
              }),
            })
            const mcpData = await mcpRes.json()
            mcpReport = mcpData.result?.content?.[0]?.text || ''
          } catch (e) {
            console.error('Error calling MCP Server:', e)
          }

          // Use Interaction Checker Agent to analyze the MCP report
          if (mcpReport) {
            const checkerInstruction = `
Bạn là chuyên gia kiểm tra tương tác thuốc của MediMate AI.
Nhiệm vụ của bạn là đọc báo cáo thô trích xuất từ OpenFDA dưới đây và xác định xem có bất kỳ tương tác nguy hại nào giữa thuốc mới "${newMed.name}" và các thuốc cũ/khác trong danh sách (${existingDrugNames.join(', ')}) hay không.

Báo cáo tương tác thuốc từ OpenFDA:
${mcpReport}

Hãy trả về phản hữu JSON theo định dạng sau:
{
  "has_interaction": boolean (true nếu có tương tác nguy hại đáng chú ý, ngược lại là false),
  "severity": "high" | "medium" | "low" | "none",
  "explanation": "Lời giải thích chi tiết nhưng ngắn gọn bằng tiếng Việt về tương tác phát hiện được và khuyến cáo người dùng."
}
`
            const checkResponse = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: 'Hãy kiểm tra báo cáo và trả về kết quả tương tác thuốc.',
              config: {
                systemInstruction: checkerInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: 'OBJECT',
                  properties: {
                    has_interaction: { type: 'BOOLEAN' },
                    severity: { type: 'STRING', enum: ['high', 'medium', 'low', 'none'] },
                    explanation: { type: 'STRING' },
                  },
                  required: ['has_interaction', 'severity', 'explanation'],
                } as any,
              },
            })

            const checkResult = safeParseJson<any>(checkResponse.text) || { has_interaction: false, severity: 'none', explanation: '' }

            if (checkResult.has_interaction && (checkResult.severity === 'high' || checkResult.severity === 'medium')) {
              warnings.push({
                severity: checkResult.severity,
                explanation: checkResult.explanation,
                medication: newMed,
              })
              continue
            }
          }
        }

        // No interaction or safe, save it
        const saved = await addMedication({
          name: newMed.name,
          dosage: newMed.dosage,
          frequency: newMed.frequency,
          schedule: newMed.schedule,
          total_stock: newMed.total_stock ?? null,
          remaining_stock: newMed.total_stock ?? null,
          dosage_quantity: newMed.dosage_quantity ?? 1,
          prescription_name: newMed.prescription_name || defaultPrescriptionName,
        })
        if (saved) {
          savedMeds.push(saved)
        }
      }

      // If we have warnings (interaction found for some drugs), return warning details
      if (warnings.length > 0) {
        return NextResponse.json({
          action: 'WARNING_INTERACTION',
          warning: warnings[0],
          message: `⚠️ **Cảnh báo tương tác thuốc cho ${warnings[0].medication.name} (${warnings[0].severity === 'high' ? 'Nguy hiểm cao' : 'Trung bình'}):** ${warnings[0].explanation}\n\nBạn có muốn bỏ qua cảnh báo này và tiếp tục thêm loại thuốc này vào lịch trình của mình không? (Gõ "tiếp tục thêm" hoặc click "Bỏ qua & Thêm")`,
        })
      }

      if (savedMeds.length > 0) {
        const medNames = savedMeds.map((m) => m.name).join(', ')
        return NextResponse.json({
          action: 'MEDICATION_ADDED',
          medication: savedMeds[0],
          message: `✅ **Đã thêm lịch uống ${savedMeds.length} thuốc thành công!**\n- Các thuốc: ${medNames}\n- Hệ thống đã tự động lưu trữ từng loại thuốc riêng biệt để theo dõi tồn kho và cảnh báo chính xác nhất.`,
        })
      } else {
        return NextResponse.json({ error: 'Không thể lưu thuốc vào cơ sở dữ liệu.' }, { status: 500 })
      }
    }

    // 6. Handle Action: LOG_TAKEN
    if (nluResult.action === 'LOG_TAKEN' && nluResult.log_details) {
      const drugName = nluResult.log_details.medication_name.toLowerCase()
      
      // Find a pending scheduled log for today matching this medication name
      const pendingLog = todayLogs.find(
        (log) =>
          log.medication?.name.toLowerCase().includes(drugName) &&
          log.status === 'scheduled'
      )

      if (pendingLog) {
        const success = await updateLogStatus(pendingLog.id, 'taken', new Date().toISOString())
        if (success) {
          return NextResponse.json({
            action: 'LOG_RECORDED',
            log_id: pendingLog.id,
            message: `👍 **Đã ghi nhận!** Đã đánh dấu bạn đã uống thuốc **${pendingLog.medication?.name}** lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}.`,
          })
        }
      } else {
        // If not found in scheduled, check if already taken today
        const alreadyTaken = todayLogs.find(
          (log) =>
            log.medication?.name.toLowerCase().includes(drugName) &&
            log.status === 'taken'
        )
        if (alreadyTaken) {
          return NextResponse.json({
            action: 'LOG_ALREADY_RECORDED',
            message: `ℹ️ Bạn đã uống thuốc **${alreadyTaken.medication?.name}** hôm nay rồi (ghi nhận lúc ${alreadyTaken.taken_at ? new Date(alreadyTaken.taken_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}).`,
          })
        }

        return NextResponse.json({
          action: 'LOG_NOT_FOUND',
          message: `🔍 Không tìm thấy lịch uống thuốc nào hôm nay cho "${nluResult.log_details.medication_name}". Bạn hãy kiểm tra lại danh sách thuốc của mình xem nhé.`,
        })
      }
    }

    // 7. General chat response
    return NextResponse.json({
      action: 'CHAT_RESPONSE',
      message: nluResult.general_response,
    })

  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json({
      error: error.message || 'Đã xảy ra lỗi hệ thống, vui lòng thử lại.',
    }, { status: 500 })
  }
}
