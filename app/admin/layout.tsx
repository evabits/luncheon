import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/admin/SignOutButton'

const navItems = [
  { href: '/admin/overview', label: 'Overview' },
  { href: '/admin/participants', label: 'Participants' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/kiosk-tokens', label: 'Kiosk Devices' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') redirect('/login')

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="font-bold text-gray-900">Luncheon</h1>
          <p className="text-xs text-gray-500 mt-0.5">Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
