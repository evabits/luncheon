import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requestIsPending, toggleVote } from '@/lib/queries/shopping'

export async function POST(req: NextRequest) {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) {
    return NextResponse.json({ error: 'No participant linked to account' }, { status: 400 })
  }

  const { requestId } = await req.json()
  if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })
  if (!(await requestIsPending(requestId))) {
    return NextResponse.json({ error: 'Request is not open for voting' }, { status: 400 })
  }

  const result = await toggleVote(requestId, participantId)
  return NextResponse.json(result)
}
