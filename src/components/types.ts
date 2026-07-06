// Shared UI types for MediMate components (extracted from the former page.tsx monolith).

export type Lang = 'vi' | 'en'

/** Top-level app tabs (matches the 4-item template nav + admin). */
export type Tab = 'dashboard' | 'schedule' | 'chat' | 'stats' | 'admin'

export interface Medication {
  id: string
  user_id: string
  name: string
  dosage: string
  frequency: string
  schedule: string[]
  total_stock?: number | null
  remaining_stock?: number | null
  dosage_quantity?: number | null
  prescription_name?: string | null
  created_at: string
}

export interface MedicationLog {
  id: string
  user_id: string
  medication_id: string
  scheduled_time: string
  taken_at: string | null
  status: 'taken' | 'missed' | 'scheduled'
  medication?: Medication
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system'
  content: string
}
