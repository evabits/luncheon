import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kioskTokens } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.delete(kioskTokens).where(eq(kioskTokens.id, id))
  return NextResponse.json({ success: true })
}
