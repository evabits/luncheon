import { auth } from '@/lib/auth'
import { getParticipantHistory } from '@/lib/queries/sessions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) redirect('/me')

  const history = await getParticipantHistory(participantId)

  // Group by month
  const months = new Map<string, typeof history>()
  for (const h of history) {
    const d = new Date(h.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!months.has(key)) months.set(key, [])
    months.get(key)!.push(h)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Lunch History</h2>

      {months.size === 0 && (
        <p className="text-gray-500">No lunch sessions found.</p>
      )}

      {Array.from(months.entries()).map(([key, rows]) => {
        const [y, m] = key.split('-').map(Number)
        const attended = rows.filter((r) => r.attended)
        const totalCost = attended.reduce((s, r) => s + Number(r.cost), 0)
        const monthLabel = new Date(y, m - 1).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })

        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{monthLabel}</h3>
              <span className="text-sm text-gray-500">
                {attended.length} lunches · €{totalCost.toFixed(2)}
              </span>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {rows.map((row) => (
                <div key={row.session_id} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-gray-700">
                    {new Date(row.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center gap-3">
                    {row.attended ? (
                      <>
                        <span className="text-gray-500 text-sm">€{Number(row.cost).toFixed(2)}</span>
                        <span className="text-green-600 text-sm font-medium">Attended</span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">Not attended</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
