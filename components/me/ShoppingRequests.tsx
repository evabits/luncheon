'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ShoppingRequestView } from '@/lib/queries/shopping'

export function ShoppingRequests({
  requests,
  remaining,
  limit,
}: {
  requests: ShoppingRequestView[]
  remaining: number
  limit: number
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [jumboUrl, setJumboUrl] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const pending = requests.filter((r) => r.status === 'pending')
  const resolved = requests.filter((r) => r.status !== 'pending')

  async function vote(requestId: string) {
    await fetch('/api/me/shopping/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId }),
    })
    router.refresh()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const res = await fetch('/api/me/shopping/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, jumboUrl, price }),
    })
    setBusy(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Something went wrong')
      return
    }
    setName('')
    setJumboUrl('')
    setPrice('')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Requests</h3>

      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{r.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2 items-center">
                  <span>by {r.requesterName}</span>
                  {r.price && <span>€{r.price}</span>}
                  {r.jumboUrl && (
                    <a href={r.jumboUrl} target="_blank" rel="noreferrer" className="underline">
                      Jumbo
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => vote(r.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  r.hasVoted
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                👍 {r.votes}
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={submit}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3"
      >
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          Request an item{' '}
          <span className="text-gray-500 dark:text-gray-400 font-normal">
            ({remaining} of {limit} left this month)
          </span>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
          required
          disabled={remaining <= 0}
        />
        <input
          value={jumboUrl}
          onChange={(e) => setJumboUrl(e.target.value)}
          placeholder="Jumbo product link (optional)"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
          disabled={remaining <= 0}
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price € (optional)"
          inputMode="decimal"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
          disabled={remaining <= 0}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || remaining <= 0}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-medium disabled:opacity-50"
        >
          {remaining <= 0 ? 'Monthly limit reached' : 'Submit request'}
        </button>
      </form>

      {resolved.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">History</h4>
          {resolved.map((r) => (
            <div key={r.id} className="text-sm text-gray-600 dark:text-gray-400">
              {r.name} — <span className={r.status === 'approved' ? 'text-green-600' : 'text-red-600'}>{r.status}</span>
              {r.status === 'denied' && r.denyReason && <span> ({r.denyReason})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
