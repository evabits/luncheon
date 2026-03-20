import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { attendances, attendanceRemovals } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { getOrCreateTodaySession, getFixedDayParticipantIds } from '@/lib/queries/sessions'

export async function POST(req: NextRequest) {
  const { participantId } = await req.json()
  if (!participantId) return NextResponse.json({ error: 'Missing participantId' }, { status: 400 })

  const session = await getOrCreateTodaySession()

  const [existing] = await db
    .select()
    .from(attendances)
    .where(
      and(eq(attendances.sessionId, session.id), eq(attendances.participantId, participantId))
    )
    .limit(1)

  if (existing) {
    const fixedIds = await getFixedDayParticipantIds(session.date)
    const wasFixedDay = fixedIds.has(participantId)
    await db.delete(attendances).where(eq(attendances.id, existing.id))
    await db.insert(attendanceRemovals).values({ sessionId: session.id, participantId, wasFixedDay })
    return NextResponse.json({ attending: false })
  }

  await db.insert(attendances).values({ sessionId: session.id, participantId })
  return NextResponse.json({ attending: true })
}
