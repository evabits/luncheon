'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function KioskSetupPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/kiosk/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), label }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Invalid setup code')
        return
      }

      router.push('/kiosk')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 p-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2">Device Setup</h1>
        <p className="text-white/60 mb-8">
          Enter the setup code generated in the admin panel to activate this device as a kiosk.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Setup Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. A3F8C2B1"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-xl tracking-widest font-mono placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
              autoCapitalize="characters"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Device Label <span className="text-white/40">(optional)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Kitchen iPad"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Activating...' : 'Activate Device'}
          </button>
        </form>
      </div>
    </main>
  )
}
