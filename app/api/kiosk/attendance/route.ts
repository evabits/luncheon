import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { attendances } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { getOrCreateTodaySession } from '@/lib/queries/sessions'

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
    await db.delete(attendances).where(eq(attendances.id, existing.id))
    return NextResponse.json({ attending: false })
  }

  await db.insert(attendances).values({ sessionId: session.id, participantId })
  return NextResponse.json({ attending: true })
}
