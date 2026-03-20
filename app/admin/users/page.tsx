import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, participants, oauthAccounts } from '@/drizzle/schema'
import { eq, sql } from 'drizzle-orm'
import { UsersClient } from '@/components/admin/UsersClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await auth()
  const currentEmail = session?.user?.email ?? ''

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
      participantId: users.participantId,
      participantName: participants.name,
      hasGoogleAccount: sql<boolean>`EXISTS (SELECT 1 FROM ${oauthAccounts} WHERE ${oauthAccounts.userId} = ${users.id} AND ${oauthAccounts.provider} = 'google')`,
    })
    .from(users)
    .leftJoin(participants, eq(users.participantId, participants.id))
    .orderBy(users.createdAt)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Users</h2>
      <UsersClient initialUsers={rows as any} currentEmail={currentEmail} />
    </div>
  )
}
