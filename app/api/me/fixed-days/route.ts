import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { participantFixedDays } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db
    .select({ dayOfWeek: participantFixedDays.dayOfWeek })
    .from(participantFixedDays)
    .where(eq(participantFixedDays.participantId, participantId))

  return NextResponse.json(rows.map(r => r.dayOfWeek))
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days: number[] = await req.json()
  if (!Array.isArray(days) || days.some(d => typeof d !== 'number' || d < 0 || d > 6)) {
    return NextResponse.json({ error: 'Invalid days' }, { status: 400 })
  }

  await db.delete(participantFixedDays).where(eq(participantFixedDays.participantId, participantId))
  if (days.length > 0) {
    await db.insert(participantFixedDays).values(days.map(dow => ({ participantId, dayOfWeek: dow })))
  }

  return NextResponse.json({ ok: true })
}
