import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { companies, participants } from '@/drizzle/schema'
import { eq, count } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const [updated] = await db
    .update(companies)
    .set({ name: name.trim() })
    .where(eq(companies.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [{ linkedCount }] = await db
    .select({ linkedCount: count() })
    .from(participants)
    .where(eq(participants.companyId, id))

  if (linkedCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${linkedCount} participant(s) are linked to this company` },
      { status: 409 }
    )
  }

  const [deleted] = await db.delete(companies).where(eq(companies.id, id)).returning()
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
