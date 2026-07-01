import { NextResponse } from 'next/server'
import { getComplianceStreak } from '@/services/medicationService'
import { apiError } from '@/utils/apiError'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const streak = await getComplianceStreak()
    return NextResponse.json({ streak })
  } catch (error) {
    return apiError('Stats API', error)
  }
}
