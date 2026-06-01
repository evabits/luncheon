import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { fixedDayOptOuts } from '@/drizzle/schema'
import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date } = await params

  const today = new Date().toISOString().split('T')[0]
  if (date <= today) {
    return NextResponse.json({ error: 'Can only cancel future skips' }, { status: 400 })
  }

  await db
    .delete(fixedDayOptOuts)
    .where(and(
      eq(fixedDayOptOuts.participantId, participantId),
      eq(fixedDayOptOuts.date, date),
    ))

  return NextResponse.json({ ok: true })
}
