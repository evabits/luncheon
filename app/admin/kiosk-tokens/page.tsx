import { db } from '@/lib/db'
import { kioskTokens } from '@/drizzle/schema'
import { desc } from 'drizzle-orm'
import { KioskTokensClient } from '@/components/admin/KioskTokensClient'

export const dynamic = 'force-dynamic'

export default async function KioskTokensPage() {
  const tokens = await db
    .select({
      id: kioskTokens.id,
      label: kioskTokens.label,
      createdAt: kioskTokens.createdAt,
      lastUsed: kioskTokens.lastUsed,
    })
    .from(kioskTokens)
    .orderBy(desc(kioskTokens.createdAt))

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Kiosk Devices</h2>
      <KioskTokensClient initialTokens={tokens} />
    </div>
  )
}
