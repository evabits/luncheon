'use client'

import { useState } from 'react'

export function KioskTabs({
  lunch,
  shopping,
}: {
  lunch: React.ReactNode
  shopping: React.ReactNode
}) {
  const [tab, setTab] = useState<'lunch' | 'shopping'>('lunch')

  const tabClass = (active: boolean) =>
    `px-6 py-3 rounded-xl text-xl font-semibold transition-colors ${
      active
        ? 'bg-white text-gray-950'
        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
    }`

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-3">
        <button onClick={() => setTab('lunch')} className={tabClass(tab === 'lunch')}>
          Lunch
        </button>
        <button onClick={() => setTab('shopping')} className={tabClass(tab === 'shopping')}>
          Shopping
        </button>
      </div>
      {/* Keep both mounted (hidden, not unmounted) so AvatarGrid keeps polling/state across tab switches */}
      <div hidden={tab !== 'lunch'}>{lunch}</div>
      <div hidden={tab !== 'shopping'}>{shopping}</div>
    </div>
  )
}
