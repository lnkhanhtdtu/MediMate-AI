import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { apiError } from '@/utils/apiError'

export const dynamic = 'force-dynamic'

/**
 * Sends a caregiver / SOS alert email.
 * - Requires an authenticated session.
 * - If RESEND_API_KEY is configured, sends a real email via Resend and returns
 *   { delivered: true }. Otherwise returns { simulated: true } so the UI can show
 *   an honest "demo" state instead of pretending an email was sent.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const caregiverName = String(body?.caregiverName || '').slice(0, 120)
    const caregiverEmail = String(body?.caregiverEmail || '').trim().slice(0, 200)
    const detail = String(body?.detail || '').slice(0, 500)
    if (!caregiverEmail || !caregiverEmail.includes('@')) {
      return NextResponse.json({ error: 'Email người bảo hộ không hợp lệ.' }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      // No email provider configured — clearly-labelled simulation (no PHI logged).
      return NextResponse.json({ delivered: false, simulated: true })
    }

    const from = process.env.SOS_FROM_EMAIL || 'MediMate <onboarding@resend.dev>'
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [caregiverEmail],
        subject: `[MediMate] Cảnh báo chăm sóc cho ${caregiverName || 'người thân của bạn'}`,
        text:
          `Xin chào ${caregiverName || ''},\n\n` +
          `Đây là cảnh báo từ trợ lý sức khoẻ MediMate AI: người thân của bạn cần chú ý về lịch uống thuốc.` +
          (detail ? `\n\nChi tiết: ${detail}` : '') +
          `\n\nVui lòng liên hệ và nhắc nhở giúp họ.\n\n— MediMate AI`,
      }),
    })

    if (!res.ok) {
      console.error('Resend email failed with status', res.status)
      return NextResponse.json({ delivered: false, simulated: false, error: 'send_failed' }, { status: 502 })
    }
    return NextResponse.json({ delivered: true, simulated: false })
  } catch (error) {
    return apiError('SOS API', error)
  }
}
