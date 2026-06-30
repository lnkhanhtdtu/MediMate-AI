import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getMedications, addMedication, deleteMedication, updateMedication } from '@/services/medicationService'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const medications = await getMedications()
    return NextResponse.json(medications)
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
    const { name, dosage, frequency, schedule, total_stock, dosage_quantity, prescription_name } = body

    if (!name || !dosage || !frequency || !schedule) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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

    const updated = await updateMedication(id, {
      name,
      dosage,
      frequency,
      schedule,
      total_stock,
      remaining_stock,
      dosage_quantity,
      prescription_name,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update medication' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
