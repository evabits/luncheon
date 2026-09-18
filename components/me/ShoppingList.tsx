'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ShoppingItemView } from '@/lib/queries/shopping'

export function ShoppingList({ items }: { items: ShoppingItemView[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function setFlag(itemId: string, level: 'low' | 'out' | null) {
    setBusy(itemId)
    await fetch('/api/me/shopping/flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, level }),
    })
    setBusy(null)
    router.refresh()
  }

  if (items.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">The list is empty.</p>
  }

  const btn = (active: boolean) =>
    `px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
      active
        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
    }`

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2 items-center">
              {item.price && <span>€{item.price}</span>}
              {item.jumboUrl && (
                <a href={item.jumboUrl} target="_blank" rel="noreferrer" className="underline">
                  Jumbo
                </a>
              )}
              {item.low > 0 && <span>🟡 low ×{item.low}</span>}
              {item.out > 0 && <span>🔴 out ×{item.out}</span>}
              {item.kioskFlag && <span>🏪 kiosk: {item.kioskFlag}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button disabled={busy === item.id} onClick={() => setFlag(item.id, null)} className={btn(item.myLevel === null)}>
              OK
            </button>
            <button disabled={busy === item.id} onClick={() => setFlag(item.id, 'low')} className={btn(item.myLevel === 'low')}>
              Running low
            </button>
            <button disabled={busy === item.id} onClick={() => setFlag(item.id, 'out')} className={btn(item.myLevel === 'out')}>
              Out
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
