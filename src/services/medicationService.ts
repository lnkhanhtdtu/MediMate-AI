import { createClient } from '@/utils/supabase/server'

export interface Medication {
  id: string
  user_id: string
  name: string
  dosage: string
  frequency: string
  schedule: string[] // e.g. ["08:00", "20:00"]
  total_stock?: number | null
  remaining_stock?: number | null
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
        const [hours, minutes] = timeStr.split(':').map(Number)
        const scheduledTime = new Date(targetDate)
        scheduledTime.setHours(hours, minutes, 0, 0)
        
        newLogsToInsert.push({
          medication_id: med.id,
          scheduled_time: scheduledTime.toISOString(),
          status: 'scheduled',
        })
      }
    }
  }

  if (newLogsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('medication_logs')
      .insert(newLogsToInsert)

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
    const [hours, minutes] = timeStr.split(':').map(Number)
    const scheduledTime = new Date(targetDate)
    scheduledTime.setHours(hours, minutes, 0, 0)

    newLogsToInsert.push({
      medication_id: med.id,
      scheduled_time: scheduledTime.toISOString(),
      status: 'scheduled',
    })
  }

  if (newLogsToInsert.length > 0) {
    const { error } = await supabase
      .from('medication_logs')
      .insert(newLogsToInsert)

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
