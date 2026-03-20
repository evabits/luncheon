'use client'

import { useState } from 'react'

interface HistoryRow {
  session_id: string
  date: string
  cost: string
  attended: boolean
  signed_in_at: string | null
}

const today = new Date()
today.setHours(0, 0, 0, 0)
const cutoff = new Date(today)
cutoff.setDate(cutoff.getDate() - 30)

function isRemovable(date: string) {
  const d = new Date(date + 'T12:00:00')
  return d < today && d >= cutoff
}

export function HistoryClient({ history: initialHistory }: { history: HistoryRow[] }) {
  const [history, setHistory] = useState(initialHistory)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  async function handleRemove(sessionId: string) {
    setRemovingIds(prev => new Set(prev).add(sessionId))
    try {
      const res = await fetch(`/api/me/attendance/${sessionId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setHistory(prev => prev.map(r => r.session_id === sessionId ? { ...r, attended: false } : r))
    } catch {
      // keep state as-is on failure
    } finally {
      setRemovingIds(prev => { const n = new Set(prev); n.delete(sessionId); return n })
    }
  }

  // Group by month
  const months = new Map<string, HistoryRow[]>()
  for (const h of history) {
    const d = new Date(h.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!months.has(key)) months.set(key, [])
    months.get(key)!.push(h)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lunch History</h2>

      {months.size === 0 && (
        <p className="text-gray-500 dark:text-gray-400">No lunch sessions found.</p>
      )}

      {Array.from(months.entries()).map(([key, rows]) => {
        const [y, m] = key.split('-').map(Number)
        const attended = rows.filter((r) => r.attended)
        const totalCost = attended.reduce((s, r) => s + Number(r.cost), 0)
        const monthLabel = new Date(y, m - 1).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })

        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">{monthLabel}</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {attended.length} lunches · €{totalCost.toFixed(2)}
              </span>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((row) => (
                <div key={row.session_id} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(row.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center gap-3">
                    {row.attended ? (
                      <>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">€{Number(row.cost).toFixed(2)}</span>
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">Attended</span>
                        {isRemovable(row.date) && (
                          <button
                            onClick={() => handleRemove(row.session_id)}
                            disabled={removingIds.has(row.session_id)}
                            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-50"
                          >
                            {removingIds.has(row.session_id) ? 'Removing...' : 'Remove'}
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600 text-sm">Not attended</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
