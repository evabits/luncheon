import { db } from '@/lib/db'
import { attendanceRemovals, participants, lunchSessions } from '@/drizzle/schema'
import { eq, desc } from 'drizzle-orm'
import { getRecentPayments, getRecentStartingBalanceChanges } from '@/lib/queries/payments'
import { ActivityLogClient, type Event } from '@/components/admin/ActivityLogClient'

export const dynamic = 'force-dynamic'

export default async function ActivityLogPage() {
  const [removals, recentPayments, balanceChanges] = await Promise.all([
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
    getRecentStartingBalanceChanges(200),
  ])

  const removalEvents: Event[] = removals.map((r) => ({
    kind: 'removal',
    id: r.id,
    timestamp: new Date(r.removedAt),
    participantName: r.participantName,
    sessionDate: r.sessionDate,
    wasFixedDay: r.wasFixedDay,
  }))

  const paymentEvents: Event[] = recentPayments.map((p) => ({
    kind: 'payment',
    id: p.id,
    timestamp: new Date(p.createdAt),
    participantName: p.participantName,
    year: p.year,
    month: p.month,
    amount: p.amount,
    note: p.note,
  }))

  const balanceChangeEvents: Event[] = balanceChanges.map((b) => ({
    kind: 'balance_change',
    id: b.id,
    timestamp: new Date(b.changedAt),
    participantName: b.participantName,
    oldAmount: b.oldAmount,
    newAmount: b.newAmount,
  }))

  const events: Event[] = [...removalEvents, ...paymentEvents, ...balanceChangeEvents]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 200)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">Attendance removals and payments (most recent first, up to 200)</p>

      {events.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
      ) : (
        <ActivityLogClient events={events} />
      )}
    </div>
  )
}
