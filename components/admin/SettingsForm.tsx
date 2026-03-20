'use client'

import { useState } from 'react'

export function SettingsForm({ initialCost }: { initialCost: number }) {
  const [cost, setCost] = useState(String(initialCost))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ costPerLunch: Number(cost) }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost per lunch (€)</label>
        <input
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          required
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          This cost will be applied to new lunch sessions. Existing sessions are not affected.
        </p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 text-sm font-medium"
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
      </button>
    </form>
  )
}
