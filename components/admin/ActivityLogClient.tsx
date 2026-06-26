'use client'

import { useState } from 'react'
import { Pagination, PAGE_SIZE } from './Pagination'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export type Event =
  | { kind: 'removal'; id: string; timestamp: Date; participantName: string; sessionDate: string; wasFixedDay: boolean }
  | { kind: 'payment'; id: string; timestamp: Date; participantName: string; year: number; month: number; amount: string; note: string | null }
  | { kind: 'balance_change'; id: string; timestamp: Date; participantName: string; oldAmount: string; newAmount: string }

function typeLabel(e: Event): string {
  if (e.kind === 'payment') return 'Payment'
  if (e.kind === 'balance_change') return 'Balance import'
  return e.wasFixedDay ? 'Fixed day override' : 'Manual'
}

export function ActivityLogClient({ events }: { events: Event[] }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const q = search.trim().toLowerCase()
  const filtered = q
    ? events.filter((e) => e.participantName.toLowerCase().includes(q) || typeLabel(e).toLowerCase().includes(q))
    : events
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1))
  const paged = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  return (
    <>
      <input
        type="search"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0) }}
        placeholder="Search by participant or type…"
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
      />

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Time</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Participant</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Description</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paged.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-600">
                  No activity matches your search.
                </td>
              </tr>
            )}
            {paged.map((event) => (
              <tr key={`${event.kind}-${event.id}`}>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {new Date(event.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{event.participantName}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {event.kind === 'removal' ? (
                    new Date(event.sessionDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  ) : event.kind === 'balance_change' ? (
                    `Starting balance: €${Number(event.oldAmount).toFixed(2)} → €${Number(event.newAmount).toFixed(2)}`
                  ) : (
                    `€${Number(event.amount).toFixed(2)} — ${MONTHS[event.month - 1]} ${event.year}${event.note ? ` (${event.note})` : ''}`
                  )}
                </td>
                <td className="px-4 py-3">
                  {event.kind === 'payment' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                      Payment
                    </span>
                  ) : event.kind === 'balance_change' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                      Balance import
                    </span>
                  ) : event.wasFixedDay ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      Fixed day override
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600 text-xs">Manual</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={currentPage} total={filtered.length} onPage={setPage} />
      </div>
    </>
  )
}
