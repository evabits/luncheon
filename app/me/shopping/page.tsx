import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getConfig } from '@/lib/queries/config'
import {
  getShoppingItems,
  getRequests,
  countMonthlyRequests,
  remainingRequests,
} from '@/lib/queries/shopping'
import { ShoppingList } from '@/components/me/ShoppingList'
import { ShoppingRequests } from '@/components/me/ShoppingRequests'

export const dynamic = 'force-dynamic'

export default async function ShoppingPage() {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) redirect('/me')

  const [items, requests, cfg, used] = await Promise.all([
    getShoppingItems(participantId),
    getRequests(participantId),
    getConfig(),
    countMonthlyRequests(participantId),
  ])
  const limit = cfg?.shoppingRequestsPerMonth ?? 1
  const remaining = remainingRequests(used, limit)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Shopping list</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Flag items that are running low or out so they get reordered.
        </p>
      </div>
      <ShoppingList items={items} />
      <ShoppingRequests requests={requests} remaining={remaining} limit={limit} />
    </div>
  )
}
