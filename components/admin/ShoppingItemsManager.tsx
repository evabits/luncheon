'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Item = {
  id: string
  name: string
  jumboUrl: string | null
  price: string | null
  kioskFlag: 'low' | 'out' | null
  low: number
  out: number
}

export function ShoppingItemsManager({ items }: { items: Item[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [jumboUrl, setJumboUrl] = useState('')
  const [price, setPrice] = useState('')

  async function add(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/shopping/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, jumboUrl, price }),
    })
    setName('')
    setJumboUrl('')
    setPrice('')
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Remove this item from the list?')) return
    await fetch('/api/admin/shopping/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  async function restock(id: string) {
    await fetch('/api/admin/shopping/items/restock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Items</h3>

      <form onSubmit={add} className="flex flex-wrap gap-2 items-end">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
        <input value={jumboUrl} onChange={(e) => setJumboUrl(e.target.value)} placeholder="Jumbo link"
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price €" inputMode="decimal"
          className="w-24 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
        <button type="submit"
          className="px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-medium">
          Add
        </button>
      </form>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2 items-center">
                {item.price && <span>€{item.price}</span>}
                {item.jumboUrl && <a href={item.jumboUrl} target="_blank" rel="noreferrer" className="underline">Jumbo</a>}
                {item.low > 0 && <span>🟡 low ×{item.low}</span>}
                {item.out > 0 && <span>🔴 out ×{item.out}</span>}
                {item.kioskFlag && <span>🏪 kiosk: {item.kioskFlag}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {(item.low > 0 || item.out > 0) && (
                <button onClick={() => restock(item.id)}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200">
                  Mark restocked
                </button>
              )}
              <button onClick={() => remove(item.id)}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
