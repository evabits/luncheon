import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/admin/SignOutButton'
import { ThemeToggle } from '@/components/ThemeToggle'

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const user = session.user as any

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src="/lunch-website-logo.svg" alt="Luncheon" className="h-8 w-auto" />
            <nav className="flex gap-4 text-sm">
              <Link href="/me" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
              <Link href="/me/history" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">History</Link>
              <Link href="/me/add-lunch" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Add Lunch</Link>
              <Link href="/me/schedule" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Schedule</Link>
              <Link href="/me/billing" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Billing</Link>
              <Link href="/me/settings" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Settings</Link>
            </nav>
          </div>
          <div className="flex items-center gap-1">
            {user.role === 'admin' && (
              <Link href="/admin/overview" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Admin ↗
              </Link>
            )}
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
