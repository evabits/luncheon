import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { attendances, lunchSessions } from '@/drizzle/schema'
import { eq, and, lt } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) {
    return NextResponse.json({ error: 'No participant linked to account' }, { status: 400 })
  }

  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  // Verify session exists and is in the past
  const [lunchSession] = await db
    .select()
    .from(lunchSessions)
    .where(and(eq(lunchSessions.id, sessionId), lt(lunchSessions.date, new Date().toISOString().split('T')[0])))
    .limit(1)

  if (!lunchSession) {
    return NextResponse.json({ error: 'Session not found or not in the past' }, { status: 404 })
  }

  // Check not already attending
  const [existing] = await db
    .select()
    .from(attendances)
    .where(and(eq(attendances.sessionId, sessionId), eq(attendances.participantId, participantId)))
    .limit(1)

  if (existing) {
    return NextResponse.json({ error: 'Already marked as attending' }, { status: 409 })
  }

  await db.insert(attendances).values({ sessionId, participantId })
  return NextResponse.json({ success: true })
}
