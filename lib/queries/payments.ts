import { db } from '../db'
import { payments, participants } from '@/drizzle/schema'
import { eq, desc, sql } from 'drizzle-orm'

export async function getMonthlyBilling(year: number, month: number) {
  const rows = await db.execute(sql`
    SELECT
      p.id,
      p.name,
      p.avatar_url,
      COUNT(a.id)::int AS lunch_count,
      COALESCE(SUM(ls.cost::numeric), 0)::numeric AS total_cost,
      COALESCE((
        SELECT SUM(pay.amount::numeric)
        FROM payments pay
        WHERE pay.participant_id = p.id
          AND pay.year = ${year}
          AND pay.month = ${month}
      ), 0)::numeric AS total_paid,
      (
        COALESCE(SUM(ls.cost::numeric), 0) -
        COALESCE((
          SELECT SUM(pay.amount::numeric)
          FROM payments pay
          WHERE pay.participant_id = p.id
            AND pay.year = ${year}
            AND pay.month = ${month}
        ), 0)
      )::numeric AS balance
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
    total_paid: string
    balance: string
  }>
}

export async function getMonthlyBillingWithEmails(year: number, month: number) {
  const rows = await db.execute(sql`
    SELECT
      p.id,
      p.name,
      p.email,
      COUNT(a.id)::int AS lunch_count,
      COALESCE(SUM(ls.cost::numeric), 0)::numeric AS total_cost,
      COALESCE((
        SELECT SUM(pay.amount::numeric)
        FROM payments pay
        WHERE pay.participant_id = p.id
          AND pay.year = ${year}
          AND pay.month = ${month}
      ), 0)::numeric AS total_paid,
      (
        COALESCE(SUM(ls.cost::numeric), 0) -
        COALESCE((
          SELECT SUM(pay.amount::numeric)
          FROM payments pay
          WHERE pay.participant_id = p.id
            AND pay.year = ${year}
            AND pay.month = ${month}
        ), 0)
      )::numeric AS balance,
      COALESCE(
        json_agg(
          json_build_object('date', ls.date::text, 'cost', ls.cost::text)
          ORDER BY ls.date
        ) FILTER (WHERE ls.id IS NOT NULL),
        '[]'::json
      ) AS sessions
    FROM participants p
    LEFT JOIN attendances a ON a.participant_id = p.id
    LEFT JOIN lunch_sessions ls
      ON ls.id = a.session_id
      AND EXTRACT(YEAR FROM ls.date::date) = ${year}
      AND EXTRACT(MONTH FROM ls.date::date) = ${month}
    WHERE p.is_active = true
    GROUP BY p.id, p.name, p.email
    ORDER BY p.name
  `)

  return rows.rows as unknown as Array<{
    id: string
    name: string
    email: string | null
    lunch_count: number
    total_cost: string
    total_paid: string
    balance: string
    sessions: Array<{ date: string; cost: string }>
  }>
}

export async function recordPayment(
  participantId: string,
  year: number,
  month: number,
  amount: string,
  note?: string
) {
  const [created] = await db
    .insert(payments)
    .values({ participantId, year, month, amount, note: note ?? null })
    .returning()
  return created
}

export async function getParticipantPaymentHistory(participantId: string) {
  return db
    .select({
      id: payments.id,
      year: payments.year,
      month: payments.month,
      amount: payments.amount,
      note: payments.note,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.participantId, participantId))
    .orderBy(desc(payments.createdAt))
}

export async function getRecentPayments(limit: number) {
  const rows = await db
    .select({
      id: payments.id,
      year: payments.year,
      month: payments.month,
      amount: payments.amount,
      note: payments.note,
      createdAt: payments.createdAt,
      participantName: participants.name,
    })
    .from(payments)
    .innerJoin(participants, eq(payments.participantId, participants.id))
    .orderBy(desc(payments.createdAt))
    .limit(limit)
  return rows
}
