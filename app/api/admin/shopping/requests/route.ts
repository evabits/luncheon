import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { approveRequest, denyRequest } from '@/lib/queries/shopping'

export async function POST(req: NextRequest) {
  const session = await auth()
  const user = session?.user as any
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { requestId, action, reason } = await req.json()
  if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })

  if (action === 'approve') {
    await approveRequest(requestId, user.id)
  } else if (action === 'deny') {
    await denyRequest(requestId, user.id, reason ? String(reason).trim() : null)
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
