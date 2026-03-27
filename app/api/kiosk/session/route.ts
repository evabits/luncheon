import { NextResponse } from 'next/server'
import { getOrCreateTodaySession, getSessionWithAttendance, getFixedDayParticipantIds } from '@/lib/queries/sessions'
import { getActiveParticipants } from '@/lib/queries/participants'

export async function GET() {
  const [session, allParticipants] = await Promise.all([
    getOrCreateTodaySession(),
    getActiveParticipants(),
  ])

  const [attending, fixedDayIds] = await Promise.all([
    getSessionWithAttendance(session.id),
    getFixedDayParticipantIds(session.date),
  ])

  const participantsWithStatus = allParticipants.map((p) => ({
    id: p.id,
    name: p.name,
    avatarUrl: p.avatarUrl,
    attending: attending.has(p.id),
    fixedDay: fixedDayIds.has(p.id),
  }))

  return NextResponse.json({ session, participants: participantsWithStatus })
}
