'use client'

import { useRouter } from 'next/navigation'
import { AvatarInitials } from '@/components/ui/avatar-initials'
import Image from 'next/image'

interface Row {
  id: string
  name: string
  avatar_url: string | null
  lunch_count: number
  total_cost: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function Navigator({ year, month, basePath = '/admin/overview' }: { year: number; month: number; basePath?: string }) {
  const router = useRouter()

  function go(y: number, m: number) {
    router.push(`${basePath}?year=${y}&month=${m}`)
  }

  function prev() {
    if (month === 1) go(year - 1, 12)
    else go(year, month - 1)
  }

  function next() {
    if (month === 12) go(year + 1, 1)
    else go(year, month + 1)
  }

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const isCurrentMonth = year === currentYear && month === currentMonth

  return (
    <div className="flex items-center gap-2">
      <button onClick={prev} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
        ← Prev
      </button>
      {!isCurrentMonth && (
        <button
          onClick={() => go(currentYear, currentMonth)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Today
        </button>
      )}
      <button onClick={next} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
        Next →
      </button>
    </div>
  )
}

function Table({ rows }: { rows: Row[] }) {
  const totalLunches = rows.reduce((s, r) => s + r.lunch_count, 0)
  const totalCost = rows.reduce((s, r) => s + Number(r.total_cost), 0)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Participant</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Lunches</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row) => (
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
              <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">{row.lunch_count}</td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                €{Number(row.total_cost).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <tr>
            <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Total</td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900 dark:text-white">{totalLunches}</td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900 dark:text-white">
              €{totalCost.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export { Navigator as MonthlyTableNavigator }
export const MonthlyTable = Table
