import { db } from '../db'
import {
  shoppingItems,
  shoppingItemFlags,
  shoppingRequests,
  shoppingRequestVotes,
  users,
  participants,
} from '@/drizzle/schema'
import { and, eq, gte, lt, sql, inArray, desc } from 'drizzle-orm'

// ---- Pure helpers (unit-tested) ----

export function currentMonthRange(now: Date): { start: string; end: string } {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth() // 0-11
  const start = `${y}-${String(m + 1).padStart(2, '0')}-01`
  const end =
    m === 11 ? `${y + 1}-01-01` : `${y}-${String(m + 2).padStart(2, '0')}-01`
  return { start, end }
}

export function remainingRequests(used: number, limit: number): number {
  return Math.max(0, limit - used)
}

export function summarizeFlags(levels: ('low' | 'out')[]): {
  low: number
  out: number
} {
  return {
    low: levels.filter((l) => l === 'low').length,
    out: levels.filter((l) => l === 'out').length,
  }
}

// ---- Types ----

export type ShoppingItemView = {
  id: string
  name: string
  jumboUrl: string | null
  price: string | null
  low: number
  out: number
  myLevel: 'low' | 'out' | null
}

export type ShoppingRequestView = {
  id: string
  name: string
  jumboUrl: string | null
  price: string | null
  status: 'pending' | 'approved' | 'denied'
  denyReason: string | null
  requestedBy: string
  requesterName: string
  votes: number
  hasVoted: boolean
  createdAt: Date
}

// ---- Items ----

export async function getShoppingItems(
  participantId: string
): Promise<ShoppingItemView[]> {
  const items = await db
    .select()
    .from(shoppingItems)
    .where(eq(shoppingItems.isActive, true))
    .orderBy(desc(shoppingItems.createdAt))

  if (items.length === 0) return []

  const ids = items.map((i) => i.id)
  const flags = await db
    .select({
      itemId: shoppingItemFlags.itemId,
      participantId: shoppingItemFlags.participantId,
      level: shoppingItemFlags.level,
    })
    .from(shoppingItemFlags)
    .where(inArray(shoppingItemFlags.itemId, ids))

  return items.map((item) => {
    const itemFlags = flags.filter((f) => f.itemId === item.id)
    const summary = summarizeFlags(itemFlags.map((f) => f.level))
    const mine = itemFlags.find((f) => f.participantId === participantId)
    return {
      id: item.id,
      name: item.name,
      jumboUrl: item.jumboUrl,
      price: item.price,
      low: summary.low,
      out: summary.out,
      myLevel: mine?.level ?? null,
    }
  })
}

export async function setFlag(
  itemId: string,
  participantId: string,
  level: 'low' | 'out' | null
): Promise<void> {
  if (level === null) {
    await db
      .delete(shoppingItemFlags)
      .where(
        and(
          eq(shoppingItemFlags.itemId, itemId),
          eq(shoppingItemFlags.participantId, participantId)
        )
      )
    return
  }
  await db
    .insert(shoppingItemFlags)
    .values({ itemId, participantId, level })
    .onConflictDoUpdate({
      target: [shoppingItemFlags.itemId, shoppingItemFlags.participantId],
      set: { level },
    })
}

export async function itemExists(itemId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: shoppingItems.id })
    .from(shoppingItems)
    .where(and(eq(shoppingItems.id, itemId), eq(shoppingItems.isActive, true)))
    .limit(1)
  return !!row
}

export async function createItem(input: {
  name: string
  jumboUrl: string | null
  price: string | null
}): Promise<void> {
  await db.insert(shoppingItems).values(input)
}

export async function updateItem(
  id: string,
  input: { name: string; jumboUrl: string | null; price: string | null }
): Promise<void> {
  await db.update(shoppingItems).set(input).where(eq(shoppingItems.id, id))
}

export async function removeItem(id: string): Promise<void> {
  await db
    .update(shoppingItems)
    .set({ isActive: false })
    .where(eq(shoppingItems.id, id))
}

export async function restockItem(id: string): Promise<void> {
  await db.delete(shoppingItemFlags).where(eq(shoppingItemFlags.itemId, id))
}

// ---- Requests ----

export async function countMonthlyRequests(participantId: string): Promise<number> {
  // currentMonthRange yields UTC month boundaries; the ::date comparison below assumes
  // the Postgres session is UTC (Neon's default), consistent with the rest of the app.
  const { start, end } = currentMonthRange(new Date())
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(shoppingRequests)
    .where(
      and(
        eq(shoppingRequests.requestedBy, participantId),
        inArray(shoppingRequests.status, ['pending', 'approved']),
        gte(shoppingRequests.createdAt, sql`${start}::date`),
        lt(shoppingRequests.createdAt, sql`${end}::date`)
      )
    )
  return row?.n ?? 0
}

export async function createRequest(input: {
  name: string
  jumboUrl: string | null
  price: string | null
  requestedBy: string
}): Promise<void> {
  await db.insert(shoppingRequests).values(input)
}

export async function getRequests(
  participantId: string
): Promise<ShoppingRequestView[]> {
  const rows = await db
    .select({
      id: shoppingRequests.id,
      name: shoppingRequests.name,
      jumboUrl: shoppingRequests.jumboUrl,
      price: shoppingRequests.price,
      status: shoppingRequests.status,
      denyReason: shoppingRequests.denyReason,
      requestedBy: shoppingRequests.requestedBy,
      requesterName: participants.name,
      createdAt: shoppingRequests.createdAt,
    })
    .from(shoppingRequests)
    .leftJoin(participants, eq(participants.id, shoppingRequests.requestedBy))
    .orderBy(desc(shoppingRequests.createdAt))

  if (rows.length === 0) return []

  const ids = rows.map((r) => r.id)
  const votes = await db
    .select({
      requestId: shoppingRequestVotes.requestId,
      participantId: shoppingRequestVotes.participantId,
    })
    .from(shoppingRequestVotes)
    .where(inArray(shoppingRequestVotes.requestId, ids))

  return rows.map((r) => {
    const rv = votes.filter((v) => v.requestId === r.id)
    return {
      id: r.id,
      name: r.name,
      jumboUrl: r.jumboUrl,
      price: r.price,
      status: r.status,
      denyReason: r.denyReason,
      requestedBy: r.requestedBy,
      requesterName: r.requesterName ?? '',
      createdAt: r.createdAt,
      votes: rv.length,
      hasVoted: rv.some((v) => v.participantId === participantId),
    }
  })
}

export async function requestIsPending(requestId: string): Promise<boolean> {
  const [row] = await db
    .select({ status: shoppingRequests.status })
    .from(shoppingRequests)
    .where(eq(shoppingRequests.id, requestId))
    .limit(1)
  return row?.status === 'pending'
}

export async function toggleVote(
  requestId: string,
  participantId: string
): Promise<{ voted: boolean }> {
  // Idempotent toggle: try to insert first. onConflictDoNothing means a concurrent
  // double-tap can't 500 on the (request_id, participant_id) unique constraint — the
  // losing insert returns no rows and falls through to the delete branch instead.
  const inserted = await db
    .insert(shoppingRequestVotes)
    .values({ requestId, participantId })
    .onConflictDoNothing()
    .returning({ id: shoppingRequestVotes.id })

  if (inserted.length > 0) return { voted: true }

  await db
    .delete(shoppingRequestVotes)
    .where(
      and(
        eq(shoppingRequestVotes.requestId, requestId),
        eq(shoppingRequestVotes.participantId, participantId)
      )
    )
  return { voted: false }
}

export async function approveRequest(
  requestId: string,
  adminUserId: string
): Promise<void> {
  const [req] = await db
    .select()
    .from(shoppingRequests)
    .where(eq(shoppingRequests.id, requestId))
    .limit(1)
  if (!req || req.status !== 'pending') return

  const [item] = await db
    .insert(shoppingItems)
    .values({
      name: req.name,
      jumboUrl: req.jumboUrl,
      price: req.price,
      createdFromRequestId: req.id,
    })
    .returning({ id: shoppingItems.id })

  await db
    .update(shoppingRequests)
    .set({
      status: 'approved',
      approvedItemId: item.id,
      resolvedBy: adminUserId,
      resolvedAt: new Date(),
    })
    .where(eq(shoppingRequests.id, requestId))
}

export async function denyRequest(
  requestId: string,
  adminUserId: string,
  reason: string | null
): Promise<void> {
  await db
    .update(shoppingRequests)
    .set({
      status: 'denied',
      denyReason: reason,
      resolvedBy: adminUserId,
      resolvedAt: new Date(),
    })
    .where(and(eq(shoppingRequests.id, requestId), eq(shoppingRequests.status, 'pending')))
}

export async function getPendingRequestCount(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(shoppingRequests)
    .where(eq(shoppingRequests.status, 'pending'))
  return row?.n ?? 0
}

export async function getAdminEmails(): Promise<string[]> {
  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.role, 'admin'))
  return rows.map((r) => r.email)
}
