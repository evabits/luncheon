import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { fixedDayOptOuts, participantFixedDays } from '@/drizzle/schema'
import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) return NextResponse.json({ error: 'No participant linked' }, { status: 400 })

  const { date } = await req.json()
  if (!date || typeof date !== 'string') {
    return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  if (date <= today) {
    return NextResponse.json({ error: 'Date must be in the future' }, { status: 400 })
  }

  const dow = new Date(date + 'T12:00:00').getDay()
  const [fixedDay] = await db
    .select()
    .from(participantFixedDays)
    .where(and(
      eq(participantFixedDays.participantId, participantId),
      eq(participantFixedDays.dayOfWeek, dow),
    ))
    .limit(1)

  if (!fixedDay) {
    return NextResponse.json({ error: 'Not a fixed lunch day' }, { status: 400 })
  }

  try {
    await db.insert(fixedDayOptOuts).values({ participantId, date })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Already skipped' }, { status: 409 })
  }
}
