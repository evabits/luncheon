import { auth } from '@/lib/auth'
import { getParticipantHistory } from '@/lib/queries/sessions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MePage() {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId

  if (!participantId) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400">Your account is not linked to a participant yet.</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Ask an admin to link your account.</p>
      </div>
    )
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const allHistory = await getParticipantHistory(participantId)
  const thisMonthHistory = allHistory.filter((h) => {
    const d = new Date(h.date)
    return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth
  })
  const attended = thisMonthHistory.filter((h) => h.attended)
  const totalCost = attended.reduce((s, h) => s + Number(h.cost), 0)

  const monthName = now.toLocaleDateString('en-US', { month: 'long' })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Lunch Summary</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="text-sm text-gray-500 dark:text-gray-400">{monthName} lunches</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mt-1">{attended.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="text-sm text-gray-500 dark:text-gray-400">{monthName} cost</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mt-1">€{totalCost.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/me/history"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          View full history
        </Link>
        <Link
          href="/me/add-lunch"
          className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
        >
          Add forgotten lunch
        </Link>
      </div>

      {attended.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">This month</h3>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            {attended.map((h) => (
              <div key={h.session_id} className="px-4 py-3 flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  {new Date(h.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">€{Number(h.cost).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
