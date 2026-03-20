import { db } from '@/lib/db'
import { attendanceRemovals, participants, lunchSessions } from '@/drizzle/schema'
import { eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function RemovalsPage() {
  const rows = await db
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
    .limit(200)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Log</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">Attendance removals (most recent first, up to 200)</p>

      {rows.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">No removals recorded yet.</p>
      )}

      {rows.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Session Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Participant</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Removed At</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {new Date(row.sessionDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.participantName}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(row.removedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {row.wasFixedDay ? (
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
