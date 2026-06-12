import { db } from '../db'
import { payments, participants, startingBalanceChanges } from '@/drizzle/schema'
import { eq, desc, inArray, sql } from 'drizzle-orm'

export async function getMonthlyBilling(year: number, month: number) {
  const rows = await db.execute(sql`
    SELECT
      p.id,
      p.name,
      p.avatar_url,
      p.starting_balance::numeric AS starting_balance,
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
      (
        p.starting_balance::numeric +
        COALESCE((
          SELECT SUM(ls2.cost::numeric)
          FROM attendances a2
          JOIN lunch_sessions ls2 ON ls2.id = a2.session_id
          WHERE a2.participant_id = p.id
        ), 0) -
        COALESCE((
          SELECT SUM(pay.amount::numeric)
          FROM payments pay
          WHERE pay.participant_id = p.id
        ), 0)
      )::numeric AS cumulative_balance,
      (
        p.starting_balance::numeric +
        COALESCE((
          SELECT SUM(ls2.cost::numeric)
          FROM attendances a2
          JOIN lunch_sessions ls2 ON ls2.id = a2.session_id
          WHERE a2.participant_id = p.id
            AND (
              EXTRACT(YEAR FROM ls2.date::date) < ${year} OR
              (EXTRACT(YEAR FROM ls2.date::date) = ${year} AND EXTRACT(MONTH FROM ls2.date::date) < ${month})
            )
        ), 0) -
        COALESCE((
          SELECT SUM(pay.amount::numeric)
          FROM payments pay
          WHERE pay.participant_id = p.id
            AND (pay.year < ${year} OR (pay.year = ${year} AND pay.month < ${month}))
        ), 0)
      )::numeric AS previous_balance
    FROM participants p
    LEFT JOIN attendances a ON a.participant_id = p.id
    LEFT JOIN lunch_sessions ls
      ON ls.id = a.session_id
      AND EXTRACT(YEAR FROM ls.date::date) = ${year}
      AND EXTRACT(MONTH FROM ls.date::date) = ${month}
    WHERE p.is_active = true
    GROUP BY p.id, p.name, p.avatar_url, p.starting_balance
    ORDER BY p.name
  `)

  return rows.rows as unknown as Array<{
    id: string
    name: string
    avatar_url: string | null
    starting_balance: string
    lunch_count: number
    total_cost: string
    total_paid: string
    balance: string
    cumulative_balance: string
    previous_balance: string
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
      (
        p.starting_balance::numeric +
        COALESCE((
          SELECT SUM(ls2.cost::numeric)
          FROM attendances a2
          JOIN lunch_sessions ls2 ON ls2.id = a2.session_id
          WHERE a2.participant_id = p.id
        ), 0) -
        COALESCE((
          SELECT SUM(pay.amount::numeric)
          FROM payments pay
          WHERE pay.participant_id = p.id
        ), 0)
      )::numeric AS cumulative_balance,
      (
        p.starting_balance::numeric +
        COALESCE((
          SELECT SUM(ls2.cost::numeric)
          FROM attendances a2
          JOIN lunch_sessions ls2 ON ls2.id = a2.session_id
          WHERE a2.participant_id = p.id
            AND (
              EXTRACT(YEAR FROM ls2.date::date) < ${year} OR
              (EXTRACT(YEAR FROM ls2.date::date) = ${year} AND EXTRACT(MONTH FROM ls2.date::date) < ${month})
            )
        ), 0) -
        COALESCE((
          SELECT SUM(pay.amount::numeric)
          FROM payments pay
          WHERE pay.participant_id = p.id
            AND (pay.year < ${year} OR (pay.year = ${year} AND pay.month < ${month}))
        ), 0)
      )::numeric AS previous_balance,
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
    GROUP BY p.id, p.name, p.email, p.starting_balance
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
    cumulative_balance: string
    previous_balance: string
    sessions: Array<{ date: string; cost: string }>
  }>
}

export async function recordPayment(
  participantId: string,
  year: number,
  month: number,
  amount: string,
  note?: string,
  molliePaymentId?: string,
) {
  const [created] = await db
    .insert(payments)
    .values({ participantId, year, month, amount, note: note ?? null, molliePaymentId: molliePaymentId ?? null })
    .onConflictDoNothing()
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

export async function getParticipantOverallBalance(participantId: string) {
  const rows = await db.execute(sql`
    SELECT
      p.starting_balance::numeric AS starting_balance,
      (
        p.starting_balance::numeric +
        COALESCE((
          SELECT SUM(ls.cost::numeric)
          FROM attendances a
          JOIN lunch_sessions ls ON ls.id = a.session_id
          WHERE a.participant_id = p.id
        ), 0) -
        COALESCE((
          SELECT SUM(pay.amount::numeric)
          FROM payments pay
          WHERE pay.participant_id = p.id
        ), 0)
      )::numeric AS cumulative_balance
    FROM participants p
    WHERE p.id = ${participantId}
  `)
  const row = rows.rows[0] as { starting_balance: string; cumulative_balance: string } | undefined
  return row ?? { starting_balance: '0', cumulative_balance: '0' }
}

export async function setStartingBalances(
  entries: Array<{ id: string; oldAmount: string; newAmount: string }>
) {
  for (const entry of entries) {
    if (entry.oldAmount === entry.newAmount) continue
    await db.update(participants).set({ startingBalance: entry.newAmount }).where(eq(participants.id, entry.id))
    await db.insert(startingBalanceChanges).values({
      participantId: entry.id,
      oldAmount: entry.oldAmount,
      newAmount: entry.newAmount,
    })
  }
}

export async function getRecentStartingBalanceChanges(limit: number) {
  return db
    .select({
      id: startingBalanceChanges.id,
      changedAt: startingBalanceChanges.changedAt,
      oldAmount: startingBalanceChanges.oldAmount,
      newAmount: startingBalanceChanges.newAmount,
      participantName: participants.name,
    })
    .from(startingBalanceChanges)
    .innerJoin(participants, eq(startingBalanceChanges.participantId, participants.id))
    .orderBy(desc(startingBalanceChanges.changedAt))
    .limit(limit)
}

export async function getParticipantsByNames(names: string[]) {
  if (names.length === 0) return []
  return db
    .select({
      id: participants.id,
      name: participants.name,
      startingBalance: participants.startingBalance,
    })
    .from(participants)
    .where(inArray(participants.name, names))
}

export async function getAllActiveParticipantsForImport() {
  const rows = await db.execute(sql`
    SELECT
      p.id,
      p.name,
      p.starting_balance::numeric AS starting_balance,
      (
        p.starting_balance::numeric +
        COALESCE((
          SELECT SUM(ls.cost::numeric)
          FROM attendances a
          JOIN lunch_sessions ls ON ls.id = a.session_id
          WHERE a.participant_id = p.id
        ), 0) -
        COALESCE((
          SELECT SUM(pay.amount::numeric)
          FROM payments pay
          WHERE pay.participant_id = p.id
        ), 0)
      )::numeric AS cumulative_balance
    FROM participants p
    WHERE p.is_active = true
    ORDER BY p.name
  `)
  return rows.rows as unknown as Array<{
    id: string
    name: string
    starting_balance: string
    cumulative_balance: string
  }>
}
