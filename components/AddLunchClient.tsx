'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Session {
  id: string
  date: string
  cost: string
}

export function AddLunchClient({ missedSessions }: { missedSessions: Session[] }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (missedSessions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        No missed lunch sessions found in the last 30 days.
      </div>
    )
  }

  async function handleAdd() {
    if (!selectedId) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/me/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedId }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to add lunch')
        return
      }

      router.push('/me')
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {missedSessions.map((s) => (
          <label key={s.id} className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="session"
              value={s.id}
              checked={selectedId === s.id}
              onChange={() => setSelectedId(s.id)}
              className="accent-gray-900"
            />
            <span className="flex-1 text-gray-700">
              {new Date(s.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="text-gray-500 text-sm">€{Number(s.cost).toFixed(2)}</span>
          </label>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/me')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={!selectedId || submitting}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? 'Adding...' : 'Add Lunch'}
        </button>
      </div>
    </div>
  )
}
