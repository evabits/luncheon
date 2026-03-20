import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants } from '@/drizzle/schema'
import { getAllParticipants } from '@/lib/queries/participants'

export async function GET() {
  const all = await getAllParticipants()
  return NextResponse.json(all)
}

export async function POST(req: NextRequest) {
  const { name, avatarUrl } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const [created] = await db
    .insert(participants)
    .values({ name, avatarUrl: avatarUrl || null })
    .returning()

  return NextResponse.json(created, { status: 201 })
}
