import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminNav } from '@/components/AdminNav'
import { getPendingRequestCount } from '@/lib/queries/shopping'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') redirect('/login')

  const pendingRequests = await getPendingRequestCount()

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      <AdminNav pendingRequests={pendingRequests} />
      <main className="flex-1 p-8 overflow-auto md:mt-0 mt-14">{children}</main>
    </div>
  )
}
