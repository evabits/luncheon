'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { SignOutButton } from './admin/SignOutButton'

const navItems = [
  {
    href: '/admin/overview', label: 'Overview',
    icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  },
  {
    href: '/admin/payments', label: 'Payments',
    icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  },
  {
    href: '/admin/participants', label: 'Participants',
    icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    href: '/admin/companies', label: 'Companies',
    icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    href: '/admin/users', label: 'Users',
    icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
  {
    href: '/admin/settings', label: 'Settings',
    icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    href: '/admin/kiosk-tokens', label: 'Kiosk Devices',
    icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  },
  {
    href: '/admin/removals', label: 'Activity Log',
    icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
]

export function AdminNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const linkClass = (href: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
      pathname === href
        ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 font-medium'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
    }`

  const sidebarContent = (
    <>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={linkClass(item.href)}>
            {item.icon}{item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
        <Link
          href="/me"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          User Portal
        </Link>
        <ThemeToggle />
        <SignOutButton />
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <img src="/lunch-website-logo.svg" alt="Luncheon" className="h-10 w-auto" />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 px-1">Admin</p>
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 py-3 gap-3">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <img src="/lunch-website-logo.svg" alt="Luncheon" className="h-7 w-auto" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Admin</span>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <img src="/lunch-website-logo.svg" alt="Luncheon" className="h-8 w-auto" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">Admin</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
