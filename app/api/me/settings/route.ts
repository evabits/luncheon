import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { participants } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const participantId = user.participantId
  if (!participantId) return NextResponse.json({ error: 'No participant linked' }, { status: 400 })

  const { companyId } = await req.json()

  const [updated] = await db
    .update(participants)
    .set({ companyId: companyId || null })
    .where(eq(participants.id, participantId))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
