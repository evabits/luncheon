import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MeNav } from '@/components/MeNav'
import { UserMenu } from '@/components/UserMenu'
import { getParticipantById } from '@/lib/queries/participants'

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const user = session.user as any
  const participant = user.participantId ? await getParticipantById(user.participantId) : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/me">
              <img src="/lunch-website-logo.svg" alt="Luncheon" className="h-8 w-auto dark:hidden" />
              <img src="/lunch-website-logo-dark.svg" alt="Luncheon" className="h-8 w-auto hidden dark:block" />
            </Link>
            <MeNav />
          </div>
          <UserMenu
            email={user.email ?? ''}
            avatarUrl={participant?.avatarUrl}
            isAdmin={user.role === 'admin'}
          />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
