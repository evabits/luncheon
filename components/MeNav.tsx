'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  {
    href: '/me',
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/me/history',
    label: 'History',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/me/add-lunch',
    label: 'Add Lunch',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    href: '/me/schedule',
    label: 'Schedule',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/me/billing',
    label: 'Billing',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
]

export function MeNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const linkClass = (href: string) =>
    `transition-colors text-sm flex items-center gap-1.5 ${
      pathname === href
        ? 'text-gray-900 dark:text-white font-medium'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
    }`

  return (
    <>
      {/* Desktop */}
      <nav className="hidden md:flex gap-4">
        {links.map(({ href, label, icon }) => (
          <Link key={href} href={href} className={linkClass(href)}>
            {icon}{label}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger */}
      <div className="md:hidden relative">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="p-2 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
            {links.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  pathname === href
                    ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {icon}{label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
