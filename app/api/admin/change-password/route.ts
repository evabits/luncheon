import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user!.email!))
    .limit(1)

  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) return Response.json({ error: 'Current password is incorrect' }, { status: 400 })

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id))

  return Response.json({ ok: true })
}
