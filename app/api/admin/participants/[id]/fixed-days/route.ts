import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participantFixedDays } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await db
    .select({ dayOfWeek: participantFixedDays.dayOfWeek })
    .from(participantFixedDays)
    .where(eq(participantFixedDays.participantId, id))
  return NextResponse.json(rows.map(r => r.dayOfWeek))
}
