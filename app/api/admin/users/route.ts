import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, participants } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
      participantId: users.participantId,
      participantName: participants.name,
    })
    .from(users)
    .leftJoin(participants, eq(users.participantId, participants.id))
    .orderBy(users.createdAt)

  return Response.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, password, role } = await req.json()
  if (!email || !password) return Response.json({ error: 'Email and password required' }, { status: 400 })
  if (role !== 'admin' && role !== 'user') return Response.json({ error: 'Invalid role' }, { status: 400 })

  const passwordHash = await bcrypt.hash(password, 12)

  try {
    const [user] = await db.insert(users).values({ email, passwordHash, role, mustChangePassword: true }).returning()
    return Response.json({ id: user.id, email: user.email }, { status: 201 })
  } catch {
    return Response.json({ error: 'Email already in use' }, { status: 409 })
  }
}
