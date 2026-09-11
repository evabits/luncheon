import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { itemExists, setFlag } from '@/lib/queries/shopping'

export async function POST(req: NextRequest) {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) {
    return NextResponse.json({ error: 'No participant linked to account' }, { status: 400 })
  }

  const { itemId, level } = await req.json()
  if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 })
  if (level !== null && level !== 'low' && level !== 'out') {
    return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
  }
  if (!(await itemExists(itemId))) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  await setFlag(itemId, participantId, level)
  return NextResponse.json({ success: true })
}
