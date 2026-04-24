'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { ThemeToggle } from './ThemeToggle'

interface UserMenuProps {
  email: string
  avatarUrl?: string | null
  isAdmin: boolean
}

function Initials({ email }: { email: string }) {
  const initial = email[0].toUpperCase()
  return (
    <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-semibold flex items-center justify-center select-none">
      {initial}
    </span>
  )
}

export function UserMenu({ email, avatarUrl, isAdmin }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        className="rounded-full ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-orange-400 dark:hover:ring-orange-400 transition-all focus:outline-none focus:ring-orange-400"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={email}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <Initials email={email} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
          <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 truncate border-b border-gray-100 dark:border-gray-800 mb-1">
            {email}
          </div>
          <Link
            href="/me/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
          {isAdmin && (
            <Link
              href="/admin/overview"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Admin
            </Link>
          )}
          <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1 px-1">
            <ThemeToggle />
          </div>
          <div className="px-1 pb-1">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg text-left transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
