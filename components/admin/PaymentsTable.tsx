'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AvatarInitials } from '@/components/ui/avatar-initials'

interface BillingRow {
  id: string
  name: string
  avatar_url: string | null
  lunch_count: number
  total_cost: string
  total_paid: string
  balance: string
}

export function PaymentsTable({
  rows,
  year,
  month,
}: {
  rows: BillingRow[]
  year: number
  month: number
}) {
  const router = useRouter()
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      rows.map((r) => [r.id, Math.max(0, Number(r.balance)).toFixed(2)])
    )
  )
  const [loading, setLoading] = useState(false)

  async function pay(participantId: string) {
    const amount = Number(amounts[participantId])
    if (isNaN(amount) || amount <= 0) return
    setLoading(true)
    await fetch('/api/admin/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, year, month, amount: amount.toFixed(2) }),
    })
    setLoading(false)
    router.refresh()
  }

  async function payAll() {
    const entries = rows
      .filter((r) => Number(r.balance) > 0)
      .map((r) => ({
        participantId: r.id,
        year,
        month,
        amount: Number(amounts[r.id]) > 0 ? Number(amounts[r.id]).toFixed(2) : Number(r.balance).toFixed(2),
      }))
      .filter((e) => Number(e.amount) > 0)

    if (entries.length === 0) return
    setLoading(true)
    await fetch('/api/admin/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payments: entries }),
    })
    setLoading(false)
    router.refresh()
  }

  const anyBalance = rows.some((r) => Number(r.balance) > 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={payAll}
          disabled={loading || !anyBalance}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Pay All
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Participant</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Lunches</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Total Cost</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Paid</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Balance</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Amount</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => {
              const balance = Number(row.balance)
              return (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {row.avatar_url ? (
                        <Image
                          src={row.avatar_url}
                          alt={row.name}
                          width={32}
                          height={32}
                          className="rounded-full w-8 h-8 object-cover"
                        />
                      ) : (
                        <AvatarInitials name={row.name} className="w-8 h-8 text-sm" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {row.lunch_count}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    €{Number(row.total_cost).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    €{Number(row.total_paid).toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    €{balance.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amounts[row.id] ?? '0.00'}
                      onChange={(e) => setAmounts((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      className="w-24 text-right border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => pay(row.id)}
                      disabled={loading || Number(amounts[row.id]) <= 0}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Pay
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
