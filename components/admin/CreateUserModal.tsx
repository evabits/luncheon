'use client'

import { useState } from 'react'

interface Participant {
  id: string
  name: string
}

interface Props {
  participant: Participant
  onClose: () => void
}

export function CreateUserModal({ participant, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/participants/${participant.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create account')
        return
      }

      setDone(true)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl border border-transparent dark:border-gray-800">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Create Login for {participant.name}</h3>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <div className="text-green-600 dark:text-green-400 text-lg font-medium mb-2">Account created!</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {participant.name} can now sign in with the provided credentials. They will be prompted to change their password on first login.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temporary Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 font-mono"
                placeholder="e.g. Lunch2026!"
                required
                minLength={8}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
