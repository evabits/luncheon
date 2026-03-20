'use client'

import { useState } from 'react'

interface Token {
  id: string
  label: string | null
  createdAt: Date
  lastUsed: Date | null
}

function formatDate(d: Date | null) {
  if (!d) return 'Never'
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function KioskTokensClient({ initialTokens }: { initialTokens: Token[] }) {
  const [tokens, setTokens] = useState(initialTokens)
  const [label, setLabel] = useState('')
  const [generating, setGenerating] = useState(false)
  const [setupCode, setSetupCode] = useState<{ code: string; expiresAt: string } | null>(null)

  async function generateCode(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    setSetupCode(null)

    try {
      const res = await fetch('/api/admin/kiosk-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      const data = await res.json()
      setSetupCode({ code: data.setupCode, expiresAt: data.expiresAt })
      setLabel('')
    } finally {
      setGenerating(false)
    }
  }

  async function revokeToken(id: string) {
    if (!confirm('Revoke this device? It will no longer be able to access the kiosk.')) return
    await fetch(`/api/admin/kiosk-tokens/${id}`, { method: 'DELETE' })
    setTokens((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4">Generate Setup Code</h3>
        <form onSubmit={generateCode} className="flex gap-3">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Device label (e.g. Kitchen iPad)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
          />
          <button
            type="submit"
            disabled={generating}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {setupCode && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 font-medium mb-2">Setup code (valid for 15 minutes):</p>
            <div className="font-mono text-3xl font-bold text-amber-900 tracking-widest">
              {setupCode.code}
            </div>
            <p className="text-xs text-amber-700 mt-2">
              Enter this code at <strong>/kiosk/setup</strong> on the device.
            </p>
          </div>
        )}
      </div>

      {tokens.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Device</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Registered</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Last seen</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tokens.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.label || 'Unnamed device'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(t.lastUsed)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => revokeToken(t.id)}
                      className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
