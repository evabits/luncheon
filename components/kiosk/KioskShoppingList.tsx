'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { KioskShoppingItemView } from '@/lib/queries/shopping'

export function KioskShoppingList({ initialItems }: { initialItems: KioskShoppingItemView[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function setFlag(itemId: string, level: 'low' | 'out' | null) {
    setBusy(itemId)
    await fetch('/api/kiosk/shopping/flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, level }),
    })
    setBusy(null)
    router.refresh()
  }

  if (initialItems.length === 0) {
    return <p className="text-2xl text-gray-400">The shopping list is empty.</p>
  }

  const btn = (active: boolean) =>
    `px-6 py-4 rounded-xl text-xl font-semibold transition-colors ${
      active
        ? 'bg-white text-gray-950'
        : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
    }`

  return (
    <div className="flex flex-col gap-3">
      {initialItems.map((item) => (
        <div
          key={item.id}
          className="bg-gray-900 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <div className="text-2xl font-semibold">{item.name}</div>
            <div className="text-lg text-gray-400 flex gap-3 items-center">
              {item.price && <span>€{item.price}</span>}
              {item.jumboUrl && (
                <a href={item.jumboUrl} target="_blank" rel="noreferrer" className="underline">
                  Jumbo
                </a>
              )}
              {item.kioskFlag === 'low' && <span>🟡 running low</span>}
              {item.kioskFlag === 'out' && <span>🔴 out</span>}
            </div>
          </div>
          <div className="flex gap-3">
            <button disabled={busy === item.id} onClick={() => setFlag(item.id, null)} className={btn(item.kioskFlag === null)}>
              OK
            </button>
            <button disabled={busy === item.id} onClick={() => setFlag(item.id, 'low')} className={btn(item.kioskFlag === 'low')}>
              Running low
            </button>
            <button disabled={busy === item.id} onClick={() => setFlag(item.id, 'out')} className={btn(item.kioskFlag === 'out')}>
              Out
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
