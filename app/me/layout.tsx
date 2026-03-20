import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/admin/SignOutButton'

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const user = session.user as any

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-bold text-gray-900">Luncheon</h1>
            <nav className="flex gap-4 text-sm">
              <Link href="/me" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/me/history" className="text-gray-600 hover:text-gray-900">History</Link>
              <Link href="/me/add-lunch" className="text-gray-600 hover:text-gray-900">Add Lunch</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
