import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getMedications, addMedication, deleteMedication, updateMedication, isValidSchedule } from '@/services/medicationService'
import { apiError } from '@/utils/apiError'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const medications = await getMedications()
    return NextResponse.json(medications)
  } catch (error) {
    return apiError('Medications API', error)
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
    const { name, dosage, frequency, schedule, total_stock, dosage_quantity, prescription_name } = body

    if (!name || !dosage || !frequency || !schedule) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!isValidSchedule(schedule)) {
      return NextResponse.json({ error: 'Giờ uống không hợp lệ. Cần định dạng HH:MM (ví dụ: 08:00).' }, { status: 400 })
    }

    const saved = await addMedication({
      name,
      dosage,
      frequency,
      schedule,
      total_stock: total_stock || null,
      remaining_stock: total_stock || null,
      dosage_quantity: dosage_quantity || 1,
      prescription_name: prescription_name || null,
    })
    if (!saved) {
      return NextResponse.json({ error: 'Failed to save medication' }, { status: 500 })
    }

    return NextResponse.json(saved)
  } catch (error) {
    return apiError('Medications API', error)
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    const success = await deleteMedication(id)
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete medication' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError('Medications API', error)
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, dosage, frequency, schedule, total_stock, remaining_stock, dosage_quantity, prescription_name } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing medication id' }, { status: 400 })
    }
    if (schedule !== undefined && !isValidSchedule(schedule)) {
      return NextResponse.json({ error: 'Giờ uống không hợp lệ. Cần định dạng HH:MM (ví dụ: 08:00).' }, { status: 400 })
    }

    // Only forward fields the client actually supplied, so a partial update can't
    // null-out columns it never intended to touch.
    const updates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries({ name, dosage, frequency, schedule, total_stock, remaining_stock, dosage_quantity, prescription_name })) {
      if (value !== undefined) updates[key] = value
    }

    const updated = await updateMedication(id, updates as Parameters<typeof updateMedication>[1])

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update medication' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    return apiError('Medications API', error)
  }
}
