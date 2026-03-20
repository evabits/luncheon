import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { participants, users } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { name, avatarUrl, isActive } = body

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
  if (isActive !== undefined) updateData.isActive = isActive

  const [updated] = await db
    .update(participants)
    .set(updateData)
    .where(eq(participants.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Soft delete
  const [updated] = await db
    .update(participants)
    .set({ isActive: false })
    .where(eq(participants.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

// POST to create a linked user account for a participant
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      role: 'user',
      participantId: id,
      mustChangePassword: true,
    })
    .returning()

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}
