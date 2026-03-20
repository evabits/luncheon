import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { attendances, lunchSessions, attendanceRemovals } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { getFixedDayParticipantIds } from '@/lib/queries/sessions'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId } = await params

  const [lunchSession] = await db
    .select()
    .from(lunchSessions)
    .where(eq(lunchSessions.id, sessionId))
    .limit(1)

  if (!lunchSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // Validate within last 30 days and not future
  const sessionDate = new Date(lunchSession.date + 'T12:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - 30)

  if (sessionDate >= today || sessionDate < cutoff) {
    return NextResponse.json({ error: 'Session out of allowed range' }, { status: 400 })
  }

  const [existing] = await db
    .select()
    .from(attendances)
    .where(and(eq(attendances.sessionId, sessionId), eq(attendances.participantId, participantId)))
    .limit(1)

  if (!existing) return NextResponse.json({ error: 'Not attending' }, { status: 404 })

  const fixedIds = await getFixedDayParticipantIds(lunchSession.date)
  const wasFixedDay = fixedIds.has(participantId)

  await db.delete(attendances).where(eq(attendances.id, existing.id))
  await db.insert(attendanceRemovals).values({ sessionId, participantId, wasFixedDay })

  return NextResponse.json({ ok: true })
}
