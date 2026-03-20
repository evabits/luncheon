import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/ThemeProvider'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Luncheon',
  description: 'Lunch sign-in tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
