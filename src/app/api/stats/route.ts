import { NextResponse } from 'next/server'
import { getComplianceStreak } from '@/services/medicationService'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const streak = await getComplianceStreak()
    return NextResponse.json({ streak })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
