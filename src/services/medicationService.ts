import { createClient } from '@/utils/supabase/server'

// Parse and validate an "HH:MM" time string. Returns null for anything malformed
// (e.g. "9am", "", "25:70") so a bad schedule entry is skipped instead of producing
// an Invalid Date that throws on .toISOString().
export function parseHHMM(timeStr: unknown): { hours: number; minutes: number } | null {
  if (typeof timeStr !== 'string') return null
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const hours = Number(m[1])
  const minutes = Number(m[2])
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return { hours, minutes }
}

// True when `schedule` is a non-empty array of valid HH:MM strings.
export function isValidSchedule(schedule: unknown): schedule is string[] {
  return Array.isArray(schedule) && schedule.length > 0 && schedule.every((t) => parseHHMM(t) !== null)
}

export interface Medication {
  id: string
  user_id: string
  name: string
  dosage: string
  frequency: string
  schedule: string[] // e.g. ["08:00", "20:00"]
  total_stock?: number | null
  remaining_stock?: number | null
  dosage_quantity?: number | null
  prescription_name?: string | null
  created_at: string
  updated_at: string
}

export interface MedicationLog {
  id: string
  user_id: string
  medication_id: string
  scheduled_time: string
  taken_at: string | null
  status: 'taken' | 'missed' | 'scheduled'
  created_at: string
  medication?: Medication
}

export async function getMedications(): Promise<Medication[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching medications:', error)
    return []
  }

  return data || []
}

export async function addMedication(medication: {
  name: string
  dosage: string
  frequency: string
  schedule: string[]
  total_stock?: number | null
  remaining_stock?: number | null
  dosage_quantity?: number | null
  prescription_name?: string | null
}): Promise<Medication | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('medications')
    .insert([medication])
    .select()
    .single()

  if (error) {
    console.error('Error adding medication:', error)
    return null
  }

  // After adding, automatically generate logs for the current day
  if (data) {
    await generateDailyLogsForMedication(data)
  }

  return data
}

export async function deleteMedication(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting medication:', error)
    return false
  }

  return true
}

export async function getMedicationLogs(dateStr?: string): Promise<MedicationLog[]> {
  const supabase = await createClient()
  
  // Default to today
  const targetDate = dateStr ? new Date(dateStr) : new Date()
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString()

  // First generate daily logs if they are not yet generated
  await generateDailyLogs(dateStr)

  const { data, error } = await supabase
    .from('medication_logs')
    .select('*, medication:medications(*)')
    .gte('scheduled_time', startOfDay)
    .lte('scheduled_time', endOfDay)
    .order('scheduled_time', { ascending: true })

  if (error) {
    console.error('Error fetching medication logs:', error)
    return []
  }

  return data || []
}

export async function updateLogStatus(
  logId: string,
  status: 'taken' | 'missed' | 'scheduled',
  takenAt: string | null = null
): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('medication_logs')
    .update({
      status,
      taken_at: takenAt,
    })
    .eq('id', logId)

  if (error) {
    console.error('Error updating log status:', error)
    return false
  }

  return true
}

// Generate logs for all active medications for a specific day
export async function generateDailyLogs(dateStr?: string): Promise<void> {
  const supabase = await createClient()
  const medications = await getMedications()
  if (medications.length === 0) return

  const targetDate = dateStr ? new Date(dateStr) : new Date()
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString()

  // Check existing logs for today
  const { data: existingLogs, error: logError } = await supabase
    .from('medication_logs')
    .select('medication_id')
    .gte('scheduled_time', startOfDay)
    .lte('scheduled_time', endOfDay)

  if (logError) {
    console.error('Error checking existing logs:', logError)
    return
  }

  const existingMedIds = new Set(existingLogs?.map((l) => l.medication_id) || [])

  const newLogsToInsert = []

  for (const med of medications) {
    // If no logs exist for this medication today, create them based on the schedule
    if (!existingMedIds.has(med.id)) {
      for (const timeStr of med.schedule) {
        const parsed = parseHHMM(timeStr)
        if (!parsed) continue // skip malformed schedule entries
        const scheduledTime = new Date(targetDate)
        scheduledTime.setHours(parsed.hours, parsed.minutes, 0, 0)

        newLogsToInsert.push({
          medication_id: med.id,
          scheduled_time: scheduledTime.toISOString(),
          status: 'scheduled',
        })
      }
    }
  }

  if (newLogsToInsert.length > 0) {
    // Upsert with ignoreDuplicates so a concurrent generation (two page loads racing)
    // can't create duplicate logs — the unique (medication_id, scheduled_time) index
    // makes the second insert a no-op instead of a duplicate row.
    const { error: insertError } = await supabase
      .from('medication_logs')
      .upsert(newLogsToInsert, { onConflict: 'medication_id,scheduled_time', ignoreDuplicates: true })

    if (insertError) {
      console.error('Error generating daily logs:', insertError)
    }
  }
}

// Helper to generate logs for a newly added medication for today
async function generateDailyLogsForMedication(med: Medication): Promise<void> {
  const supabase = await createClient()
  const targetDate = new Date()
  const newLogsToInsert = []

  for (const timeStr of med.schedule) {
    const parsed = parseHHMM(timeStr)
    if (!parsed) continue // skip malformed schedule entries
    const scheduledTime = new Date(targetDate)
    scheduledTime.setHours(parsed.hours, parsed.minutes, 0, 0)

    newLogsToInsert.push({
      medication_id: med.id,
      scheduled_time: scheduledTime.toISOString(),
      status: 'scheduled',
    })
  }

  if (newLogsToInsert.length > 0) {
    const { error } = await supabase
      .from('medication_logs')
      .upsert(newLogsToInsert, { onConflict: 'medication_id,scheduled_time', ignoreDuplicates: true })

    if (error) {
      console.error('Error generating logs for new medication:', error)
    }
  }
}

export async function updateMedicationStock(
  id: string,
  totalStock: number,
  remainingStock: number
): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('medications')
    .update({
      total_stock: totalStock,
      remaining_stock: remainingStock,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating medication stock:', error)
    return false
  }

  return true
}

export async function updateMedication(
  id: string,
  updates: {
    name?: string
    dosage?: string
    frequency?: string
    schedule?: string[]
    total_stock?: number | null
    remaining_stock?: number | null
    dosage_quantity?: number | null
    prescription_name?: string | null
  }
): Promise<Medication | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('medications')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating medication:', error)
    return null
  }

  return data
}

export async function getComplianceStreak(): Promise<number> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return 0
  }

  // Look back up to ~13 months so long adherence streaks aren't silently capped.
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date()
  start.setDate(start.getDate() - 400)
  start.setHours(0, 0, 0, 0)

  const { data: logs, error } = await supabase
    .from('medication_logs')
    .select('*, medication:medications(*)')
    .eq('user_id', user.id)
    .gte('scheduled_time', start.toISOString())
    .lte('scheduled_time', end.toISOString())
    .order('scheduled_time', { ascending: false })

  if (error || !logs || logs.length === 0) {
    return 0
  }

  // Group logs by day (YYYY-MM-DD)
  const logsByDay = new Map<string, typeof logs>()
  for (const log of logs) {
    const dateStr = new Date(log.scheduled_time).toLocaleDateString('en-CA') // YYYY-MM-DD
    if (!logsByDay.has(dateStr)) {
      logsByDay.set(dateStr, [])
    }
    logsByDay.get(dateStr)!.push(log)
  }

  let streak = 0
  const cursor = new Date() // Start from today
  
  while (true) {
    const dateStr = cursor.toLocaleDateString('en-CA')
    const dayLogs = logsByDay.get(dateStr)

    if (!dayLogs || dayLogs.length === 0) {
      // If cursor is today and there are no logs today, look at yesterday
      const todayStr = new Date().toLocaleDateString('en-CA')
      if (dateStr === todayStr) {
        cursor.setDate(cursor.getDate() - 1)
        continue
      }
      break
    }

    const total = dayLogs.length
    const taken = dayLogs.filter((l) => l.status === 'taken').length
    const takenRatio = total > 0 ? taken / total : 0

    if (takenRatio >= 0.8) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      // If today has pending scheduled logs, don't break the streak yet, check yesterday
      const todayStr = new Date().toLocaleDateString('en-CA')
      const hasPending = dayLogs.some((l) => l.status === 'scheduled')
      if (dateStr === todayStr && hasPending) {
        cursor.setDate(cursor.getDate() - 1)
        continue
      }
      break
    }
  }

  return streak
}

