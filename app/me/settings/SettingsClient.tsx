'use client'

import { useState } from 'react'

interface Company {
  id: string
  name: string
}

interface Props {
  currentCompanyId: string | null
  companies: Company[]
}

export function SettingsClient({ currentCompanyId, companies }: Props) {
  const [companyId, setCompanyId] = useState(currentCompanyId ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/me/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: companyId || null }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setMessage('Settings saved.')
    } catch {
      setError('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="font-medium text-gray-900 dark:text-white mb-4">Your Company</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 text-sm"
            >
              <option value="">None</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  )
}
