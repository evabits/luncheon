'use client'

import { useState } from 'react'

const DAYS = [
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
  { label: 'Sunday', value: 0 },
]

export function ScheduleClient({ initialDays }: { initialDays: number[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set(initialDays))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function toggle(day: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/me/fixed-days', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Array.from(selected)),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Schedule</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Choose the days you regularly have lunch. You will be automatically signed in on these days.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        {DAYS.map(({ label, value }) => {
          const checked = selected.has(value)
          return (
            <label
              key={value}
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <span className="text-gray-800 dark:text-gray-200 font-medium">{label}</span>
              <div
                onClick={() => toggle(value)}
                className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
                />
              </div>
            </label>
          )
        })}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {saved && <span className="text-green-600 dark:text-green-400 text-sm">Saved!</span>}
        {error && <span className="text-red-500 text-sm">{error}</span>}
      </div>
    </div>
  )
}
