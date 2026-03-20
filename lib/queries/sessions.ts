import { db } from '../db'
import { lunchSessions, attendances, participants, config } from '@/drizzle/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function getOrCreateTodaySession() {
  const today = new Date().toISOString().split('T')[0]

  const [existing] = await db
    .select()
    .from(lunchSessions)
    .where(eq(lunchSessions.date, today))
    .limit(1)

  if (existing) return existing

  const [cfg] = await db.select().from(config).limit(1)
  const cost = cfg?.costPerLunch ?? '85.00'

  const [created] = await db
    .insert(lunchSessions)
    .values({ date: today, cost })
    .returning()

  return created
}

export async function getSessionWithAttendance(sessionId: string) {
  const attendanceRows = await db
    .select({ participantId: attendances.participantId })
    .from(attendances)
    .where(eq(attendances.sessionId, sessionId))

  return new Set(attendanceRows.map((r) => r.participantId))
}

export async function getMonthlyReport(year: number, month: number) {
  const rows = await db.execute(sql`
    SELECT
      p.id,
      p.name,
      p.avatar_url,
      COUNT(a.id)::int AS lunch_count,
      COALESCE(SUM(ls.cost::numeric), 0)::numeric AS total_cost
    FROM participants p
    LEFT JOIN attendances a ON a.participant_id = p.id
    LEFT JOIN lunch_sessions ls
      ON ls.id = a.session_id
      AND EXTRACT(YEAR FROM ls.date::date) = ${year}
      AND EXTRACT(MONTH FROM ls.date::date) = ${month}
    WHERE p.is_active = true
    GROUP BY p.id, p.name, p.avatar_url
    ORDER BY p.name
  `)

  return rows.rows as unknown as Array<{
    id: string
    name: string
    avatar_url: string | null
    lunch_count: number
    total_cost: string
  }>
}

export async function getParticipantHistory(participantId: string) {
  const rows = await db.execute(sql`
    SELECT
      ls.id AS session_id,
      ls.date,
      ls.cost::numeric AS cost,
      (a.id IS NOT NULL) AS attended,
      a.signed_in_at
    FROM lunch_sessions ls
    LEFT JOIN attendances a
      ON a.session_id = ls.id AND a.participant_id = ${participantId}
    ORDER BY ls.date DESC
  `)

  return rows.rows as unknown as Array<{
    session_id: string
    date: string
    cost: string
    attended: boolean
    signed_in_at: string | null
  }>
}

export async function getMissedSessions(participantId: string, limitDays = 30) {
  const rows = await db.execute(sql`
    SELECT ls.id, ls.date, ls.cost::numeric AS cost
    FROM lunch_sessions ls
    WHERE ls.date::date < CURRENT_DATE
      AND ls.date::date >= CURRENT_DATE - INTERVAL '${sql.raw(String(limitDays))} days'
      AND ls.id NOT IN (
        SELECT session_id FROM attendances WHERE participant_id = ${participantId}
      )
    ORDER BY ls.date DESC
  `)

  return rows.rows as unknown as Array<{ id: string; date: string; cost: string }>
}
