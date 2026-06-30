import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getMedicationLogs, updateLogStatus } from '@/services/medicationService'

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
    console.log('API LOGS RESPONSE SAMPLE:', JSON.stringify(logs.slice(0, 1), null, 2))
    return NextResponse.json(logs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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

    const takenAt = status === 'taken' ? new Date().toISOString() : null

    const success = await updateLogStatus(logId, status, takenAt)
    if (!success) {
      return NextResponse.json({ error: 'Failed to update log status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
