'use client'

import { useRouter } from 'next/navigation'

type Req = {
  id: string
  name: string
  jumboUrl: string | null
  price: string | null
  votes: number
}

export function ShoppingRequestsQueue({ requests }: { requests: Req[] }) {
  const router = useRouter()

  async function resolve(requestId: string, action: 'approve' | 'deny') {
    let reason: string | null = null
    if (action === 'deny') {
      reason = prompt('Reason for denial (optional):') ?? null
    }
    await fetch('/api/admin/shopping/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action, reason }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Pending requests {requests.length > 0 && <span className="text-gray-500">({requests.length})</span>}
      </h3>
      {requests.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No pending requests.</p>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <div key={r.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {r.name} <span className="text-xs text-gray-500">👍 {r.votes}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2 items-center">
                  {r.price && <span>€{r.price}</span>}
                  {r.jumboUrl && <a href={r.jumboUrl} target="_blank" rel="noreferrer" className="underline">Jumbo</a>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => resolve(r.id, 'approve')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200">
                  Approve
                </button>
                <button onClick={() => resolve(r.id, 'deny')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200">
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
