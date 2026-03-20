import { NextRequest, NextResponse } from 'next/server'
import { auth } from './lib/auth'
import { validateKioskToken } from './lib/kiosk-auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Kiosk routes — cookie-based device auth
  if (
    (pathname.startsWith('/kiosk') && !pathname.startsWith('/kiosk/setup')) ||
    (pathname.startsWith('/api/kiosk') && !pathname.startsWith('/api/kiosk/setup'))
  ) {
    const raw = req.cookies.get('kiosk_token')?.value
    if (!raw || !(await validateKioskToken(raw))) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/kiosk/setup', req.url))
    }
    return NextResponse.next()
  }

  // Admin routes — NextAuth session with admin role
  if (
    (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) ||
    pathname.startsWith('/api/admin')
  ) {
    const session = await auth()
    if (!session || (session.user as any).role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  // User /me routes — NextAuth session with any role (admin or user)
  if (pathname.startsWith('/me') || pathname.startsWith('/api/me')) {
    const session = await auth()
    if (!session) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/kiosk/:path*',
    '/admin/:path*',
    '/me/:path*',
    '/api/kiosk/:path*',
    '/api/admin/:path*',
    '/api/me/:path*',
  ],
}
