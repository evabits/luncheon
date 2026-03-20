import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') return null
  return session
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const update: Record<string, unknown> = {}
  if (body.role !== undefined) update.role = body.role
  if (body.password !== undefined) {
    update.passwordHash = await bcrypt.hash(body.password, 12)
    update.mustChangePassword = true
  }

  const [updated] = await db.update(users).set(update).where(eq(users.id, id)).returning()
  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json({ id: updated.id, email: updated.email, role: updated.role })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!target) return Response.json({ error: 'Not found' }, { status: 404 })
  if (target.email === session.user?.email) {
    return Response.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  await db.delete(users).where(eq(users.id, id))
  return Response.json({ success: true })
}
