import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateTodaySession, autoAddFixedDayAttendances } from '@/lib/queries/sessions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = await getOrCreateTodaySession()
  await autoAddFixedDayAttendances(session.id, session.date)

  return NextResponse.json({ ok: true, date: session.date })
}
