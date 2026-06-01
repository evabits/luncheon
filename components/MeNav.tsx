'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const lunchLinks = [
  { href: '/me/history', label: 'History' },
  { href: '/me/add-lunch', label: 'Add Lunch' },
  { href: '/me/skip-lunch', label: 'Skip a Day' },
  { href: '/me/schedule', label: 'Schedule' },
]

export function MeNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lunchOpen, setLunchOpen] = useState(false)
  const pathname = usePathname()
  const lunchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (lunchRef.current && !lunchRef.current.contains(e.target as Node)) {
        setLunchOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const linkClass = (href: string) =>
    `transition-colors text-sm flex items-center gap-1.5 ${
      pathname === href
        ? 'text-gray-900 dark:text-white font-medium'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
    }`

  const lunchActive = lunchLinks.some((l) => pathname === l.href)

  return (
    <>
      {/* Desktop */}
      <nav className="hidden md:flex gap-4 items-center">
        <Link href="/me" className={linkClass('/me')}>
          Dashboard
        </Link>

        <div ref={lunchRef} className="relative">
          <button
            onClick={() => setLunchOpen((v) => !v)}
            className={`transition-colors text-sm flex items-center gap-1 ${
              lunchActive
                ? 'text-gray-900 dark:text-white font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Lunch
            <svg
              className={`w-3.5 h-3.5 transition-transform ${lunchOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {lunchOpen && (
            <div className="absolute left-0 top-full mt-1 w-36 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
              {lunchLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setLunchOpen(false)}
                  className={`flex items-center px-4 py-2 text-sm transition-colors ${
                    pathname === href
                      ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/me/billing" className={linkClass('/me/billing')}>
          Billing
        </Link>
      </nav>

      {/* Mobile hamburger */}
      <div className="md:hidden relative">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          className="p-2 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {mobileOpen && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
            {[{ href: '/me', label: 'Dashboard' }].concat(lunchLinks).concat([{ href: '/me/billing', label: 'Billing' }]).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  pathname === href
                    ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
