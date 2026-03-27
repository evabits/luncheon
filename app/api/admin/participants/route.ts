import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants } from '@/drizzle/schema'
import { getAllParticipants } from '@/lib/queries/participants'

export async function GET() {
  const all = await getAllParticipants()
  return NextResponse.json(all)
}

export async function POST(req: NextRequest) {
  const { name, avatarUrl, email, companyId } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const [created] = await db
    .insert(participants)
    .values({ name, email: email || null, avatarUrl: avatarUrl || null, companyId: companyId || null })
    .returning()

  return NextResponse.json(created, { status: 201 })
}
