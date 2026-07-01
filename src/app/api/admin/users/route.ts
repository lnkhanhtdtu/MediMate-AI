import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // 1. Authenticate the requesting user
    const client = await createServerClient()
    const { data: { user }, error: authError } = await client.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the user is an admin
    const email = user.email || ''
    const isAdmin = email.toLowerCase().includes('admin') || email === 'admin@medimate.ai'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Initialize Supabase client using Service Role Key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // If service role key is not configured, return mock data for preview/demonstration
    if (!serviceRoleKey || serviceRoleKey === 'your_service_role_key_here') {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Returning mock admin data.')
      return NextResponse.json(getMockAdminData(user.id, user.email))
    }

    const adminClient = createClient(supabaseUrl!, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // 3. Fetch all users from Supabase Auth admin API
    const { data: { users: authUsers }, error: usersError } = await adminClient.auth.admin.listUsers()
    if (usersError) {
      throw new Error(`Failed to list users: ${usersError.message}`)
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

      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        medCount: userMeds.length,
        todayLogs: { taken: logsTaken, total: logsTotal },
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
  } catch (error: any) {
    console.error('Admin API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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

function getMockAdminData(currentUserId: string, currentUserEmail: string | undefined) {
  const email = currentUserEmail || 'admin@medimate.ai'
  return {
    stats: {
      totalUsers: 3,
      totalMeds: 8,
      totalLogs: 42,
      complianceRate: 85,
    },
    users: [
      {
        id: currentUserId,
        email: email,
        created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        medCount: 3,
        todayLogs: { taken: 2, total: 3 },
        streak: 4,
        medications: [
          { id: '1', name: 'Paracetamol', dosage: '500mg', frequency: 'Mỗi sáng', schedule: ['08:00'] },
          { id: '2', name: 'Aspirin', dosage: '81mg', frequency: 'Mỗi tối', schedule: ['20:00'] }
        ]
      },
      {
        id: 'user-mock-2',
        email: 'patient_lan@gmail.com',
        created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        medCount: 4,
        todayLogs: { taken: 3, total: 4 },
        streak: 8,
        medications: [
          { id: '3', name: 'Metformin', dosage: '850mg', frequency: 'Ngày 2 lần', schedule: ['07:00', '19:00'] },
          { id: '4', name: 'Atorvastatin', dosage: '10mg', frequency: 'Mỗi tối', schedule: ['21:00'] }
        ]
      },
      {
        id: 'user-mock-3',
        email: 'ong_tu@yahoo.com',
        created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        medCount: 1,
        todayLogs: { taken: 0, total: 1 },
        streak: 0,
        medications: [
          { id: '5', name: 'Amlodipine', dosage: '5mg', frequency: 'Mỗi sáng', schedule: ['06:00'] }
        ]
      }
    ]
  }
}
