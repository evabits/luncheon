import { db } from '@/lib/db'
import { shoppingItems, shoppingItemFlags, shoppingRequests } from '@/drizzle/schema'
import { eq, inArray, desc, sql } from 'drizzle-orm'
import { ShoppingItemsManager } from '@/components/admin/ShoppingItemsManager'
import { ShoppingRequestsQueue } from '@/components/admin/ShoppingRequestsQueue'

export const dynamic = 'force-dynamic'

export default async function AdminShoppingPage() {
  const items = await db
    .select()
    .from(shoppingItems)
    .where(eq(shoppingItems.isActive, true))
    .orderBy(desc(shoppingItems.createdAt))

  const ids = items.map((i) => i.id)
  const flags =
    ids.length > 0
      ? await db
          .select({ itemId: shoppingItemFlags.itemId, level: shoppingItemFlags.level })
          .from(shoppingItemFlags)
          .where(inArray(shoppingItemFlags.itemId, ids))
      : []

  const itemsView = items.map((i) => ({
    id: i.id,
    name: i.name,
    jumboUrl: i.jumboUrl,
    price: i.price,
    kioskFlag: i.kioskFlag,
    low: flags.filter((f) => f.itemId === i.id && f.level === 'low').length,
    out: flags.filter((f) => f.itemId === i.id && f.level === 'out').length,
  }))

  const pending = await db
    .select({
      id: shoppingRequests.id,
      name: shoppingRequests.name,
      jumboUrl: shoppingRequests.jumboUrl,
      price: shoppingRequests.price,
      requestedBy: shoppingRequests.requestedBy,
      votes: sql<number>`(select count(*)::int from shopping_request_votes v where v.request_id = ${shoppingRequests.id})`,
    })
    .from(shoppingRequests)
    .where(eq(shoppingRequests.status, 'pending'))
    .orderBy(desc(shoppingRequests.createdAt))

  const sortedPending = [...pending].sort((a, b) => b.votes - a.votes)

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shopping list</h2>
      <ShoppingRequestsQueue requests={sortedPending} />
      <ShoppingItemsManager items={itemsView} />
    </div>
  )
}
