import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { cookies } from 'next/headers'

export default async function RootPage() {
  // Check for kiosk cookie first
  const cookieStore = await cookies()
  const kioskToken = cookieStore.get('kiosk_token')
  if (kioskToken) {
    redirect('/kiosk')
  }

  // Check for user session
  const session = await auth()
  if (session) {
    const role = (session.user as any).role
    if (role === 'admin') redirect('/admin/overview')
    redirect('/me')
  }

  redirect('/login')
}
