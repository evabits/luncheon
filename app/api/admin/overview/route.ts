import { NextRequest, NextResponse } from 'next/server'
import { getMonthlyReport } from '@/lib/queries/sessions'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 })
  }

  const report = await getMonthlyReport(year, month)
  return NextResponse.json(report)
}
