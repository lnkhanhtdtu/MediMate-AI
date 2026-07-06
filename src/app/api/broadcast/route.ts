import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { apiError } from '@/utils/apiError'

export const dynamic = 'force-dynamic'

/** Latest system broadcast — readable by any authenticated user. */
export async function GET() {
  try {
    const client = await createServerClient()
    const { data: { user }, error: authError } = await client.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Select title/severity too, but fall back gracefully if that migration hasn't
    // been applied yet (older DBs only have message/created_at).
    let data: any[] | null = null
    let error: unknown = null
    {
      const res = await client
        .from('broadcasts')
        .select('id, message, title, severity, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
      data = res.data
      error = res.error
    }
    if (error) {
      const retry = await client
        .from('broadcasts')
        .select('id, message, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
      data = retry.data
      error = retry.error
    }
    // If the table doesn't exist yet (migration not run), fail soft with null.
    if (error) return NextResponse.json({ broadcast: null })
    return NextResponse.json({ broadcast: data && data[0] ? data[0] : null })
  } catch (error) {
    return apiError('Broadcast API (get)', error)
  }
}

/** Create a system broadcast — admin only (allowlist), inserted via service role. */
export async function POST(request: Request) {
  try {
    const client = await createServerClient()
    const { data: { user }, error: authError } = await client.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const adminEmails = (process.env.ADMIN_EMAILS ?? 'admin@medimate.ai')
      .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    if (!adminEmails.includes((user.email ?? '').toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const message = String(body?.message || '').trim().slice(0, 500)
    const title = String(body?.title || '').trim().slice(0, 160) || null
    const severityInput = String(body?.severity || 'info').toLowerCase()
    const severity = ['info', 'warning', 'urgent'].includes(severityInput) ? severityInput : 'info'
    if (!message) return NextResponse.json({ error: 'Nội dung thông báo trống.' }, { status: 400 })

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceRoleKey || serviceRoleKey.startsWith('your_')) {
      return NextResponse.json({ error: 'Cần cấu hình SUPABASE_SERVICE_ROLE_KEY để phát thông báo.' }, { status: 503 })
    }
    const adminClient = createClient(supabaseUrl!, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    // Insert with title/severity; if that migration isn't applied yet, retry with the
    // legacy columns so broadcasting still works on older databases.
    let { error } = await adminClient.from('broadcasts').insert({ message, title, severity, created_by: user.id })
    if (error) {
      const retry = await adminClient.from('broadcasts').insert({ message, created_by: user.id })
      error = retry.error
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError('Broadcast API (post)', error)
  }
}
