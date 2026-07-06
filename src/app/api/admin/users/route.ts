import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { apiError } from '@/utils/apiError'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // 1. Authenticate the requesting user
    const client = await createServerClient()
    const { data: { user }, error: authError } = await client.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the user is an admin.
    // SECURITY: authorize against an explicit, server-side allowlist (ADMIN_EMAILS env),
    // NOT a substring match. A `.includes('admin')` check let anyone who registered an
    // address merely containing "admin" (e.g. notadmin@evil.com) reach the RLS-bypassing
    // service-role client below and read every patient's data.
    const adminEmails = (process.env.ADMIN_EMAILS ?? 'admin@medimate.ai')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    const email = (user.email ?? '').toLowerCase()
    const isAdmin = adminEmails.includes(email)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Initialize Supabase client using Service Role Key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // If the service-role key is not configured we cannot read real users (RLS blocks the
    // anon client). Return an EMPTY, honest dataset with a flag — never fabricated users.
    if (!serviceRoleKey || serviceRoleKey.startsWith('your_')) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Admin data unavailable.')
      return NextResponse.json({
        stats: { totalUsers: 0, totalMeds: 0, totalLogs: 0, complianceRate: 0 },
        users: [],
        serviceKeyMissing: true,
      })
    }

    const adminClient = createClient(supabaseUrl!, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // 3. Fetch ALL users from Supabase Auth admin API.
    // listUsers() is paginated (default 50/page); loop until a short page so the
    // directory and totals don't silently omit users beyond the first page.
    const authUsers: any[] = []
    const PER_PAGE = 200
    for (let page = 1; ; page++) {
      const { data, error: usersError } = await adminClient.auth.admin.listUsers({ page, perPage: PER_PAGE })
      if (usersError) {
        throw new Error(`Failed to list users: ${usersError.message}`)
      }
      authUsers.push(...data.users)
      if (data.users.length < PER_PAGE) break
      // Safety cap to avoid an unbounded loop.
      if (page >= 50) break
    }

    // 4. Fetch medications and logs bypassing RLS
    const { data: allMeds, error: medsError } = await adminClient
      .from('medications')
      .select('*')
    if (medsError) throw new Error(medsError.message)

    const { data: allLogs, error: logsError } = await adminClient
      .from('medication_logs')
      .select('*')
    if (logsError) throw new Error(logsError.message)

    // 5. Combine and calculate statistics per user
    const usersData = authUsers.map((u) => {
      const userMeds = allMeds.filter((m) => m.user_id === u.id)
      const userLogs = allLogs.filter((l) => l.user_id === u.id)

      // Calculate today's logs status
      const todayStr = new Date().toLocaleDateString('en-CA')
      const todayLogs = userLogs.filter((l) => new Date(l.scheduled_time).toLocaleDateString('en-CA') === todayStr)
      const logsTaken = todayLogs.filter((l) => l.status === 'taken').length
      const logsTotal = todayLogs.length

      // Calculate streak
      const streak = calculateAdherenceStreak(userLogs)

      const todayLogDetails = [...todayLogs]
        .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
        .map((l) => ({
          id: l.id,
          status: l.status,
          scheduled_time: l.scheduled_time,
          taken_at: l.taken_at,
          name: userMeds.find((m) => m.id === l.medication_id)?.name || 'Thuốc',
        }))

      return {
        id: u.id,
        email: u.email,
        name: (u.user_metadata as any)?.full_name || null,
        created_at: u.created_at,
        medCount: userMeds.length,
        todayLogs: { taken: logsTaken, total: logsTotal },
        todayLogDetails,
        streak,
        medications: userMeds,
      }
    })

    // Global Stats
    const totalUsers = authUsers.length
    const totalMeds = allMeds.length
    const totalLogs = allLogs.length
    const takenLogs = allLogs.filter((l) => l.status === 'taken').length
    const complianceRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100

    return NextResponse.json({
      stats: {
        totalUsers,
        totalMeds,
        totalLogs,
        complianceRate,
      },
      users: usersData,
    })
  } catch (error) {
    return apiError('Admin API', error)
  }
}

// Shared admin gate: authenticate, enforce the ADMIN_EMAILS allowlist, and return a
// service-role client. On failure, `error` holds the response to return immediately.
async function requireAdmin(): Promise<any> {
  const client = await createServerClient()
  const { data: { user }, error: authError } = await client.auth.getUser()
  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), adminClient: null, user: null }
  }
  const adminEmails = (process.env.ADMIN_EMAILS ?? 'admin@medimate.ai')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  if (!adminEmails.includes((user.email ?? '').toLowerCase())) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), adminClient: null, user: null }
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey || serviceRoleKey.startsWith('your_')) {
    return { error: NextResponse.json({ error: 'Chức năng này cần cấu hình SUPABASE_SERVICE_ROLE_KEY.' }, { status: 503 }), adminClient: null, user: null }
  }
  const adminClient = createClient(supabaseUrl!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return { error: null, adminClient, user }
}

// Create a new user account (admin only).
export async function POST(request: Request) {
  try {
    const gate = await requireAdmin()
    if (gate.error) return gate.error
    const body = await request.json()
    const email = String(body?.email || '').trim()
    const password = String(body?.password || '')
    const name = String(body?.name || '').trim().slice(0, 120)
    if (!email || !email.includes('@') || password.length < 6) {
      return NextResponse.json({ error: 'Email hợp lệ và mật khẩu tối thiểu 6 ký tự là bắt buộc.' }, { status: 400 })
    }
    const { data, error } = await gate.adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      ...(name ? { user_metadata: { full_name: name } } : {}),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, id: data.user?.id })
  } catch (error) {
    return apiError('Admin API (create user)', error)
  }
}

// Delete a user account by id (admin only). Cannot delete the currently signed-in admin.
export async function DELETE(request: Request) {
  try {
    const gate = await requireAdmin()
    if (gate.error) return gate.error
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Thiếu id người dùng.' }, { status: 400 })
    if (id === gate.user.id) {
      return NextResponse.json({ error: 'Không thể tự xoá tài khoản admin đang đăng nhập.' }, { status: 400 })
    }
    const { error } = await gate.adminClient.auth.admin.deleteUser(id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError('Admin API (delete user)', error)
  }
}

function calculateAdherenceStreak(logs: any[]): number {
  if (!logs || logs.length === 0) return 0
  const logsByDay = new Map<string, any[]>()
  for (const log of logs) {
    const dateStr = new Date(log.scheduled_time).toLocaleDateString('en-CA')
    if (!logsByDay.has(dateStr)) logsByDay.set(dateStr, [])
    logsByDay.get(dateStr)!.push(log)
  }

  let streak = 0
  const cursor = new Date()
  while (true) {
    const dateStr = cursor.toLocaleDateString('en-CA')
    const dayLogs = logsByDay.get(dateStr)
    if (!dayLogs || dayLogs.length === 0) {
      if (dateStr === new Date().toLocaleDateString('en-CA')) {
        cursor.setDate(cursor.getDate() - 1)
        continue
      }
      break
    }
    const total = dayLogs.length
    const taken = dayLogs.filter((l) => l.status === 'taken').length
    if (total > 0 && taken / total >= 0.8) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      if (dateStr === new Date().toLocaleDateString('en-CA') && dayLogs.some((l) => l.status === 'scheduled')) {
        cursor.setDate(cursor.getDate() - 1)
        continue
      }
      break
    }
  }
  return streak
}
