'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SkipLunchClientProps {
  upcoming: string[]
  scheduled: string[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function SkipLunchClient({ upcoming, scheduled }: SkipLunchClientProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleSkip() {
    if (!selectedDate) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/me/skip-lunch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to schedule skip')
        return
      }

      setSelectedDate(null)
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(date: string) {
    setCancelling(date)
    setError('')

    try {
      const res = await fetch(`/api/me/skip-lunch/${date}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to cancel skip')
        return
      }

      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setCancelling(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Scheduled Skips</h3>
        {scheduled.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
            No skips scheduled.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            {scheduled.map((d) => (
              <div key={d} className="flex items-center justify-between px-4 py-3">
                <span className="text-gray-700 dark:text-gray-300">{formatDate(d)}</span>
                <button
                  onClick={() => handleCancel(d)}
                  disabled={cancelling === d}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                >
                  {cancelling === d ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Skip a Day</h3>
        {upcoming.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
            No upcoming fixed lunch days in the next 4 weeks.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
              {upcoming.map((d) => (
                <label key={d} className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <input
                    type="radio"
                    name="skip-date"
                    value={d}
                    checked={selectedDate === d}
                    onChange={() => setSelectedDate(d)}
                    className="accent-gray-900 dark:accent-white"
                  />
                  <span className="flex-1 text-gray-700 dark:text-gray-300">{formatDate(d)}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleSkip}
              disabled={!selectedDate || submitting}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
            >
              {submitting ? 'Scheduling...' : 'Skip This Day'}
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
