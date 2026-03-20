import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getMissedSessions } from '@/lib/queries/sessions'

export async function GET() {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) {
    return NextResponse.json({ error: 'No participant linked to account' }, { status: 400 })
  }

  const missed = await getMissedSessions(participantId, 30)
  return NextResponse.json(missed)
}
