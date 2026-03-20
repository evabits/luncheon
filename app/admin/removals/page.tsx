import { db } from '@/lib/db'
import { attendanceRemovals, participants, lunchSessions } from '@/drizzle/schema'
import { eq, desc } from 'drizzle-orm'
import { getRecentPayments } from '@/lib/queries/payments'

export const dynamic = 'force-dynamic'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default async function ActivityLogPage() {
  const [removals, recentPayments] = await Promise.all([
    db
      .select({
        id: attendanceRemovals.id,
        removedAt: attendanceRemovals.removedAt,
        wasFixedDay: attendanceRemovals.wasFixedDay,
        participantName: participants.name,
        sessionDate: lunchSessions.date,
      })
      .from(attendanceRemovals)
      .innerJoin(participants, eq(attendanceRemovals.participantId, participants.id))
      .innerJoin(lunchSessions, eq(attendanceRemovals.sessionId, lunchSessions.id))
      .orderBy(desc(attendanceRemovals.removedAt))
      .limit(200),
    getRecentPayments(200),
  ])

  type RemovalEvent = {
    kind: 'removal'
    id: string
    timestamp: Date
    participantName: string
    sessionDate: string
    wasFixedDay: boolean
  }
  type PaymentEvent = {
    kind: 'payment'
    id: string
    timestamp: Date
    participantName: string
    year: number
    month: number
    amount: string
    note: string | null
  }
  type Event = RemovalEvent | PaymentEvent

  const removalEvents: RemovalEvent[] = removals.map((r) => ({
    kind: 'removal',
    id: r.id,
    timestamp: new Date(r.removedAt),
    participantName: r.participantName,
    sessionDate: r.sessionDate,
    wasFixedDay: r.wasFixedDay,
  }))

  const paymentEvents: PaymentEvent[] = recentPayments.map((p) => ({
    kind: 'payment',
    id: p.id,
    timestamp: new Date(p.createdAt),
    participantName: p.participantName,
    year: p.year,
    month: p.month,
    amount: p.amount,
    note: p.note,
  }))

  const events: Event[] = [...removalEvents, ...paymentEvents]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 200)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">Attendance removals and payments (most recent first, up to 200)</p>

      {events.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
      )}

      {events.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Time</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Participant</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Description</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {events.map((event) => (
                <tr key={`${event.kind}-${event.id}`}>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {event.timestamp.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{event.participantName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {event.kind === 'removal' ? (
                      new Date(event.sessionDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    ) : (
                      `€${Number(event.amount).toFixed(2)} — ${MONTHS[event.month - 1]} ${event.year}${event.note ? ` (${event.note})` : ''}`
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {event.kind === 'payment' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                        Payment
                      </span>
                    ) : event.wasFixedDay ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        Fixed day override
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600 text-xs">Manual</span>
                    )}
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
