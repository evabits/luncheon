'use client'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface HistoryRow {
  session_id: string
  date: string
  cost: string
  attended: boolean
  signed_in_at: string | null
}

interface PaymentRow {
  id: string
  year: number
  month: number
  amount: string
  note: string | null
  createdAt: Date
}

export function BillingClient({
  history,
  payments,
  startingBalance,
  cumulativeBalance,
}: {
  history: HistoryRow[]
  payments: PaymentRow[]
  startingBalance: string
  cumulativeBalance: string
}) {
  // Group attended sessions by year-month
  const attended = history.filter((r) => r.attended)

  const sessionsByMonth = new Map<string, HistoryRow[]>()
  for (const row of attended) {
    const d = new Date(row.date + 'T12:00:00')
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!sessionsByMonth.has(key)) sessionsByMonth.set(key, [])
    sessionsByMonth.get(key)!.push(row)
  }

  const paymentsByMonth = new Map<string, PaymentRow[]>()
  for (const p of payments) {
    const key = `${p.year}-${String(p.month).padStart(2, '0')}`
    if (!paymentsByMonth.has(key)) paymentsByMonth.set(key, [])
    paymentsByMonth.get(key)!.push(p)
  }

  // All months that have either sessions or payments
  const allKeys = new Set([...sessionsByMonth.keys(), ...paymentsByMonth.keys()])
  const sortedKeys = Array.from(allKeys).sort((a, b) => b.localeCompare(a))

  const cumulative = Number(cumulativeBalance)
  const hasStartingBalance = Number(startingBalance) !== 0

  return (
    <div className="space-y-6">
      {hasStartingBalance && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Historical balance from before the app:{' '}
            <strong className="tabular-nums">€{Number(startingBalance).toFixed(2)}</strong>
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-5 py-4 flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">Overall outstanding balance</span>
        <span className={`text-xl font-bold tabular-nums ${cumulative > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
          €{cumulative.toFixed(2)}
        </span>
      </div>

      {sortedKeys.length === 0 && !hasStartingBalance && (
        <p className="text-gray-500 dark:text-gray-400">No billing history yet.</p>
      )}

    <div className="space-y-8">
      {sortedKeys.map((key) => {
        const [yearStr, monthStr] = key.split('-')
        const year = parseInt(yearStr)
        const month = parseInt(monthStr)
        const monthSessions = sessionsByMonth.get(key) ?? []
        const monthPayments = paymentsByMonth.get(key) ?? []

        const totalCost = monthSessions.reduce((s, r) => s + Number(r.cost), 0)
        const totalPaid = monthPayments.reduce((s, p) => s + Number(p.amount), 0)
        const balance = totalCost - totalPaid

        return (
          <div key={key} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {MONTHS[month - 1]} {year}
              </h2>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {monthSessions.length > 0 && (
                <div className="px-6 py-4">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Lunches</h3>
                  <div className="space-y-1">
                    {monthSessions
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((s) => (
                        <div key={s.session_id} className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            {new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="tabular-nums text-gray-600 dark:text-gray-400">€{Number(s.cost).toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {monthPayments.length > 0 && (
                <div className="px-6 py-4">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Payments</h3>
                  <div className="space-y-1">
                    {monthPayments.map((p) => (
                      <div key={p.id} className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {new Date(p.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                          {p.note && <span className="text-gray-500 dark:text-gray-400 ml-1">— {p.note}</span>}
                        </span>
                        <span className="tabular-nums text-green-600 dark:text-green-400">€{Number(p.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {monthSessions.length} lunch{monthSessions.length !== 1 ? 'es' : ''} · €{totalCost.toFixed(2)} owed · €{totalPaid.toFixed(2)} paid
                  </span>
                  <span className={`font-semibold tabular-nums ${balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                    Balance: €{balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
    </div>
  )
}
