import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getParticipantHistory } from '@/lib/queries/sessions'

export async function GET() {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) {
    return NextResponse.json({ error: 'No participant linked to account' }, { status: 400 })
  }

  const history = await getParticipantHistory(participantId)
  return NextResponse.json(history)
}
