import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getMedicationLogs, updateLogStatus } from '@/services/medicationService'
import { apiError } from '@/utils/apiError'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || undefined

    const logs = await getMedicationLogs(date)
    return NextResponse.json(logs)
  } catch (error) {
    return apiError('Logs API', error)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { logId, status } = body

    if (!logId || !status) {
      return NextResponse.json({ error: 'Missing logId or status' }, { status: 400 })
    }
    const ALLOWED_STATUSES = ['taken', 'missed', 'scheduled'] as const
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const takenAt = status === 'taken' ? new Date().toISOString() : null

    const success = await updateLogStatus(logId, status, takenAt)
    if (!success) {
      return NextResponse.json({ error: 'Failed to update log status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError('Logs API', error)
  }
}
