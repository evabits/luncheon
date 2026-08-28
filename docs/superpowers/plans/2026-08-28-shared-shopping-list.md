# Shared Shopping List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared shopping list where everyone can flag items as running low/out, request new items (with a Jumbo link + price) subject to a monthly quota, and vote on requests — while admins manage the list and approve/deny requests.

**Architecture:** Four new Drizzle tables (`shopping_items`, `shopping_item_flags`, `shopping_requests`, `shopping_request_votes`) plus one `config` column. Reusable DB logic in `lib/queries/shopping.ts`. Route handlers under `app/api/me/shopping/*` (user actions) and `app/api/admin/shopping/*` (admin actions), matching existing conventions. Server-Component pages at `/me/shopping` and `/admin/shopping` with focused client components for interactivity.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM (Neon HTTP driver), NextAuth (role in JWT), Tailwind, Bun (runtime + test runner), Mailtrap via `lib/mailer.ts`.

---

## File Structure

**Created:**
- `lib/queries/shopping.ts` — all shopping DB queries + pure helpers
- `lib/queries/shopping.test.ts` — Bun tests for the pure helpers
- `app/api/me/shopping/flag/route.ts` — set/clear a user's flag on an item
- `app/api/me/shopping/request/route.ts` — create a request (quota-checked) + email admins
- `app/api/me/shopping/vote/route.ts` — toggle a vote on a request
- `app/api/admin/shopping/items/route.ts` — create/update/remove items
- `app/api/admin/shopping/items/restock/route.ts` — clear an item's flags
- `app/api/admin/shopping/requests/route.ts` — approve/deny a request
- `app/me/shopping/page.tsx` — user shopping surface (Server Component)
- `components/me/ShoppingList.tsx` — item list + per-item flag control (client)
- `components/me/ShoppingRequests.tsx` — requests, voting, request form (client)
- `app/admin/shopping/page.tsx` — admin shopping surface (Server Component)
- `components/admin/ShoppingItemsManager.tsx` — item CRUD + restock (client)
- `components/admin/ShoppingRequestsQueue.tsx` — approve/deny queue (client)

**Modified:**
- `drizzle/schema.ts` — add 4 tables + `config.shoppingRequestsPerMonth`
- `lib/queries/config.ts` — nothing needed (returns full row already); confirm only
- `app/api/admin/settings/route.ts` — accept/persist `shoppingRequestsPerMonth`
- `components/admin/SettingsForm.tsx` — add quota input
- `app/admin/settings/page.tsx` — pass quota to the form
- `components/MeNav.tsx` — add a "Shopping" link
- `components/AdminNav.tsx` — add a "Shopping" nav item with pending-count badge
- `app/admin/layout.tsx` — fetch pending count, pass to `AdminNav`

---

## Task 1: Schema + migration

**Files:**
- Modify: `drizzle/schema.ts`
- Create (generated): `drizzle/migrations/XXXX_*.sql`

- [ ] **Step 1: Add the four tables to `drizzle/schema.ts`**

Append at the end of the file (after `kioskSetupCodes`). `integer` and the other imports already exist at the top:

```ts
export const shoppingItems = pgTable('shopping_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  jumboUrl: text('jumbo_url'),
  price: numeric('price', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  // provenance only — plain uuid (no FK) to avoid a circular reference with shopping_requests
  createdFromRequestId: uuid('created_from_request_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const shoppingRequests = pgTable('shopping_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  jumboUrl: text('jumbo_url'),
  price: numeric('price', { precision: 10, scale: 2 }),
  requestedBy: uuid('requested_by')
    .notNull()
    .references(() => participants.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'approved', 'denied'] })
    .notNull()
    .default('pending'),
  denyReason: text('deny_reason'),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  approvedItemId: uuid('approved_item_id').references(() => shoppingItems.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const shoppingItemFlags = pgTable(
  'shopping_item_flags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id')
      .notNull()
      .references(() => shoppingItems.id, { onDelete: 'cascade' }),
    participantId: uuid('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    level: text('level', { enum: ['low', 'out'] }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.itemId, t.participantId)]
)

export const shoppingRequestVotes = pgTable(
  'shopping_request_votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('request_id')
      .notNull()
      .references(() => shoppingRequests.id, { onDelete: 'cascade' }),
    participantId: uuid('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.requestId, t.participantId)]
)
```

- [ ] **Step 2: Add the quota column to the `config` table**

In `drizzle/schema.ts`, inside the existing `config` table definition, add after `paymentInstructions`:

```ts
  shoppingRequestsPerMonth: integer('shopping_requests_per_month').notNull().default(1),
```

- [ ] **Step 3: Generate the migration**

Run: `bun run db:generate`
Expected: a new file `drizzle/migrations/XXXX_*.sql` is created containing `CREATE TABLE "shopping_items"`, the three other tables, and `ALTER TABLE "config" ADD COLUMN "shopping_requests_per_month"`.

- [ ] **Step 4: Apply the migration**

Run: `bun run db:migrate`
Expected: `Migrations applied.`

If it exits with SIGHUP (known issue in this environment — see the memory note), apply the generated SQL directly instead. Create `scripts/apply-sql.ts`:

```ts
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const url = process.env.DATABASE_URL_UNPOOLED
if (!url) throw new Error('DATABASE_URL_UNPOOLED is not set')
const sql = neon(url)

const file = process.argv[2]
if (!file) throw new Error('Usage: bun scripts/apply-sql.ts <path-to-sql>')

const statements = readFileSync(file, 'utf8')
  .split('--> statement-breakpoint')
  .map((s) => s.trim())
  .filter(Boolean)

for (const stmt of statements) {
  await sql.query(stmt)
}
console.log(`Applied ${statements.length} statements from ${file}.`)
process.exit(0)
```

Run: `bun scripts/apply-sql.ts drizzle/migrations/XXXX_*.sql` (use the real filename).
Expected: `Applied N statements ...`

- [ ] **Step 5: Type check**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add drizzle/schema.ts drizzle/migrations scripts/apply-sql.ts
git commit -m "feat: add shopping list schema and migration"
```

---

## Task 2: Pure helpers + tests (TDD)

**Files:**
- Create: `lib/queries/shopping.ts`
- Test: `lib/queries/shopping.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/queries/shopping.test.ts`:

```ts
import { test, expect } from 'bun:test'
import { currentMonthRange, remainingRequests, summarizeFlags } from './shopping'

test('currentMonthRange returns first-of-month to first-of-next-month (UTC)', () => {
  expect(currentMonthRange(new Date('2026-08-28T10:00:00Z'))).toEqual({
    start: '2026-08-01',
    end: '2026-09-01',
  })
})

test('currentMonthRange rolls the year over in December', () => {
  expect(currentMonthRange(new Date('2026-12-15T00:00:00Z'))).toEqual({
    start: '2026-12-01',
    end: '2027-01-01',
  })
})

test('remainingRequests never goes negative', () => {
  expect(remainingRequests(0, 1)).toBe(1)
  expect(remainingRequests(1, 1)).toBe(0)
  expect(remainingRequests(3, 1)).toBe(0)
  expect(remainingRequests(2, 5)).toBe(3)
})

test('summarizeFlags counts each level', () => {
  expect(summarizeFlags(['low', 'low', 'out', 'low'])).toEqual({ low: 3, out: 1 })
  expect(summarizeFlags([])).toEqual({ low: 0, out: 0 })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test lib/queries/shopping.test.ts`
Expected: FAIL — `Cannot find module './shopping'` (file not created yet).

- [ ] **Step 3: Create `lib/queries/shopping.ts` with the pure helpers**

```ts
import { db } from '../db'
import {
  shoppingItems,
  shoppingItemFlags,
  shoppingRequests,
  shoppingRequestVotes,
  users,
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test lib/queries/shopping.test.ts`
Expected: PASS — 4 pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add lib/queries/shopping.ts lib/queries/shopping.test.ts
git commit -m "feat: add shopping pure helpers with tests"
```

---

## Task 3: DB query functions

**Files:**
- Modify: `lib/queries/shopping.ts`

- [ ] **Step 1: Append the DB query functions to `lib/queries/shopping.ts`**

```ts
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
      requesterName: sql<string>`coalesce(${sql.identifier('p')}.name, '')`,
      createdAt: shoppingRequests.createdAt,
    })
    .from(shoppingRequests)
    .leftJoin(
      sql`participants ${sql.identifier('p')}`,
      sql`${sql.identifier('p')}.id = ${shoppingRequests.requestedBy}`
    )
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
      ...r,
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
  const [existing] = await db
    .select({ id: shoppingRequestVotes.id })
    .from(shoppingRequestVotes)
    .where(
      and(
        eq(shoppingRequestVotes.requestId, requestId),
        eq(shoppingRequestVotes.participantId, participantId)
      )
    )
    .limit(1)

  if (existing) {
    await db
      .delete(shoppingRequestVotes)
      .where(eq(shoppingRequestVotes.id, existing.id))
    return { voted: false }
  }
  await db.insert(shoppingRequestVotes).values({ requestId, participantId })
  return { voted: true }
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
```

- [ ] **Step 2: Type check**

Run: `bunx tsc --noEmit`
Expected: no errors. (If the `getRequests` join helper errors, replace the `.leftJoin(sql\`participants ...\`)` with a plain join importing `participants` and `eq(participants.id, shoppingRequests.requestedBy)`, selecting `participants.name` as `requesterName`.)

- [ ] **Step 3: Re-run helper tests (unchanged, must still pass)**

Run: `bun test lib/queries/shopping.test.ts`
Expected: PASS — 4 pass.

- [ ] **Step 4: Commit**

```bash
git add lib/queries/shopping.ts
git commit -m "feat: add shopping list db queries"
```

---

## Task 4: User API routes (flag, request, vote)

**Files:**
- Create: `app/api/me/shopping/flag/route.ts`
- Create: `app/api/me/shopping/request/route.ts`
- Create: `app/api/me/shopping/vote/route.ts`

- [ ] **Step 1: Create the flag route**

`app/api/me/shopping/flag/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { itemExists, setFlag } from '@/lib/queries/shopping'

export async function POST(req: NextRequest) {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) {
    return NextResponse.json({ error: 'No participant linked to account' }, { status: 400 })
  }

  const { itemId, level } = await req.json()
  if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 })
  if (level !== null && level !== 'low' && level !== 'out') {
    return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
  }
  if (!(await itemExists(itemId))) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  await setFlag(itemId, participantId, level)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Create the request route (quota + email admins)**

`app/api/me/shopping/request/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getConfig } from '@/lib/queries/config'
import {
  countMonthlyRequests,
  createRequest,
  getAdminEmails,
  remainingRequests,
} from '@/lib/queries/shopping'
import { sendEmail } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) {
    return NextResponse.json({ error: 'No participant linked to account' }, { status: 400 })
  }

  const body = await req.json()
  const name = String(body.name ?? '').trim()
  const jumboUrl = body.jumboUrl ? String(body.jumboUrl).trim() : null
  const price =
    body.price === '' || body.price === undefined || body.price === null
      ? null
      : String(body.price)

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (price !== null && isNaN(Number(price))) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }

  const cfg = await getConfig()
  const limit = cfg?.shoppingRequestsPerMonth ?? 1
  const used = await countMonthlyRequests(participantId)
  if (remainingRequests(used, limit) <= 0) {
    return NextResponse.json({ error: 'Monthly request limit reached' }, { status: 429 })
  }

  await createRequest({ name, jumboUrl, price, requestedBy: participantId })

  // Email admins (best-effort — don't fail the request if mail is down)
  try {
    const admins = await getAdminEmails()
    const html = `<p>A new shopping list item was requested: <strong>${name}</strong></p>` +
      (price ? `<p>Price: €${price}</p>` : '') +
      (jumboUrl ? `<p><a href="${jumboUrl}">Jumbo link</a></p>` : '') +
      `<p>Review it in the admin shopping list.</p>`
    await Promise.all(
      admins.map((email) => sendEmail(email, 'New shopping list request', html))
    )
  } catch (e) {
    console.error('Failed to email admins about shopping request:', e)
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Create the vote route**

`app/api/me/shopping/vote/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requestIsPending, toggleVote } from '@/lib/queries/shopping'

export async function POST(req: NextRequest) {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) {
    return NextResponse.json({ error: 'No participant linked to account' }, { status: 400 })
  }

  const { requestId } = await req.json()
  if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })
  if (!(await requestIsPending(requestId))) {
    return NextResponse.json({ error: 'Request is not open for voting' }, { status: 400 })
  }

  const result = await toggleVote(requestId, participantId)
  return NextResponse.json(result)
}
```

- [ ] **Step 4: Type check**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/me/shopping
git commit -m "feat: add user shopping api routes"
```

---

## Task 5: Admin API routes (items, restock, requests)

**Files:**
- Create: `app/api/admin/shopping/items/route.ts`
- Create: `app/api/admin/shopping/items/restock/route.ts`
- Create: `app/api/admin/shopping/requests/route.ts`

- [ ] **Step 1: Create the items route (create / update / remove)**

`app/api/admin/shopping/items/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createItem, updateItem, removeItem } from '@/lib/queries/shopping'

async function requireAdmin() {
  const session = await auth()
  return (session?.user as any)?.role === 'admin'
}

function parsePrice(v: unknown): string | null {
  if (v === '' || v === undefined || v === null) return null
  return String(v)
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const name = String(body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const price = parsePrice(body.price)
  if (price !== null && isNaN(Number(price))) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }
  await createItem({ name, jumboUrl: body.jumboUrl ? String(body.jumboUrl).trim() : null, price })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const id = String(body.id ?? '')
  const name = String(body.name ?? '').trim()
  if (!id || !name) return NextResponse.json({ error: 'Missing id or name' }, { status: 400 })
  const price = parsePrice(body.price)
  if (price !== null && isNaN(Number(price))) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }
  await updateItem(id, { name, jumboUrl: body.jumboUrl ? String(body.jumboUrl).trim() : null, price })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await removeItem(id)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Create the restock route**

`app/api/admin/shopping/items/restock/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { restockItem } from '@/lib/queries/shopping'

export async function POST(req: NextRequest) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await restockItem(id)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Create the requests resolve route**

`app/api/admin/shopping/requests/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { approveRequest, denyRequest } from '@/lib/queries/shopping'

export async function POST(req: NextRequest) {
  const session = await auth()
  const user = session?.user as any
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { requestId, action, reason } = await req.json()
  if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })

  if (action === 'approve') {
    await approveRequest(requestId, user.id)
  } else if (action === 'deny') {
    await denyRequest(requestId, user.id, reason ? String(reason).trim() : null)
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
```

Note: `user.id` must be present on the session. Confirm in the next step; if the JWT does not expose the user id, add it in `lib/auth.ts` (session callback: `session.user.id = token.sub`) or pass `null` for `resolvedBy` — the column is nullable.

- [ ] **Step 4: Confirm the admin user id is on the session**

Run: `grep -n "id\|sub\|participantId\|role" lib/auth.ts`
Expected: a `session` callback that sets user fields. If `id` is not set there, add `;(session.user as any).id = token.sub` alongside the existing role assignment. If you cannot resolve a stable id, change both admin routes to pass `null` as `adminUserId` (the `resolved_by` column is nullable) and drop the `resolvedBy` value in `approveRequest`/`denyRequest` accordingly.

- [ ] **Step 5: Type check**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/shopping lib/auth.ts
git commit -m "feat: add admin shopping api routes"
```

---

## Task 6: User page + components

**Files:**
- Create: `app/me/shopping/page.tsx`
- Create: `components/me/ShoppingList.tsx`
- Create: `components/me/ShoppingRequests.tsx`

- [ ] **Step 1: Create the user page (Server Component)**

`app/me/shopping/page.tsx`:

```tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getConfig } from '@/lib/queries/config'
import {
  getShoppingItems,
  getRequests,
  countMonthlyRequests,
  remainingRequests,
} from '@/lib/queries/shopping'
import { ShoppingList } from '@/components/me/ShoppingList'
import { ShoppingRequests } from '@/components/me/ShoppingRequests'

export const dynamic = 'force-dynamic'

export default async function ShoppingPage() {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) redirect('/me')

  const [items, requests, cfg, used] = await Promise.all([
    getShoppingItems(participantId),
    getRequests(participantId),
    getConfig(),
    countMonthlyRequests(participantId),
  ])
  const limit = cfg?.shoppingRequestsPerMonth ?? 1
  const remaining = remainingRequests(used, limit)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Shopping list</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Flag items that are running low or out so they get reordered.
        </p>
      </div>
      <ShoppingList items={items} />
      <ShoppingRequests requests={requests} remaining={remaining} limit={limit} />
    </div>
  )
}
```

- [ ] **Step 2: Create the ShoppingList client component**

`components/me/ShoppingList.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ShoppingItemView } from '@/lib/queries/shopping'

export function ShoppingList({ items }: { items: ShoppingItemView[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function setFlag(itemId: string, level: 'low' | 'out' | null) {
    setBusy(itemId)
    await fetch('/api/me/shopping/flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, level }),
    })
    setBusy(null)
    router.refresh()
  }

  if (items.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">The list is empty.</p>
  }

  const btn = (active: boolean) =>
    `px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
      active
        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
    }`

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2 items-center">
              {item.price && <span>€{item.price}</span>}
              {item.jumboUrl && (
                <a href={item.jumboUrl} target="_blank" rel="noreferrer" className="underline">
                  Jumbo
                </a>
              )}
              {item.low > 0 && <span>🟡 low ×{item.low}</span>}
              {item.out > 0 && <span>🔴 out ×{item.out}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button disabled={busy === item.id} onClick={() => setFlag(item.id, null)} className={btn(item.myLevel === null)}>
              OK
            </button>
            <button disabled={busy === item.id} onClick={() => setFlag(item.id, 'low')} className={btn(item.myLevel === 'low')}>
              Running low
            </button>
            <button disabled={busy === item.id} onClick={() => setFlag(item.id, 'out')} className={btn(item.myLevel === 'out')}>
              Out
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create the ShoppingRequests client component**

`components/me/ShoppingRequests.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ShoppingRequestView } from '@/lib/queries/shopping'

export function ShoppingRequests({
  requests,
  remaining,
  limit,
}: {
  requests: ShoppingRequestView[]
  remaining: number
  limit: number
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [jumboUrl, setJumboUrl] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const pending = requests.filter((r) => r.status === 'pending')
  const resolved = requests.filter((r) => r.status !== 'pending')

  async function vote(requestId: string) {
    await fetch('/api/me/shopping/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId }),
    })
    router.refresh()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const res = await fetch('/api/me/shopping/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, jumboUrl, price }),
    })
    setBusy(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Something went wrong')
      return
    }
    setName('')
    setJumboUrl('')
    setPrice('')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Requests</h3>

      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{r.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2 items-center">
                  <span>by {r.requesterName}</span>
                  {r.price && <span>€{r.price}</span>}
                  {r.jumboUrl && (
                    <a href={r.jumboUrl} target="_blank" rel="noreferrer" className="underline">
                      Jumbo
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => vote(r.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  r.hasVoted
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                👍 {r.votes}
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={submit}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3"
      >
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          Request an item{' '}
          <span className="text-gray-500 dark:text-gray-400 font-normal">
            ({remaining} of {limit} left this month)
          </span>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
          required
          disabled={remaining <= 0}
        />
        <input
          value={jumboUrl}
          onChange={(e) => setJumboUrl(e.target.value)}
          placeholder="Jumbo product link (optional)"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
          disabled={remaining <= 0}
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price € (optional)"
          inputMode="decimal"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
          disabled={remaining <= 0}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || remaining <= 0}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-medium disabled:opacity-50"
        >
          {remaining <= 0 ? 'Monthly limit reached' : 'Submit request'}
        </button>
      </form>

      {resolved.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">History</h4>
          {resolved.map((r) => (
            <div key={r.id} className="text-sm text-gray-600 dark:text-gray-400">
              {r.name} — <span className={r.status === 'approved' ? 'text-green-600' : 'text-red-600'}>{r.status}</span>
              {r.status === 'denied' && r.denyReason && <span> ({r.denyReason})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Type check**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification**

Run: `bun dev`, log in as a regular user, visit `/me/shopping`. Verify: the list renders; clicking OK/Running low/Out updates the badge counts after refresh; submitting a request shows it under pending and decrements the "left this month" counter; a second submit past the limit shows "Monthly limit reached".

- [ ] **Step 6: Commit**

```bash
git add app/me/shopping components/me/ShoppingList.tsx components/me/ShoppingRequests.tsx
git commit -m "feat: add user shopping page"
```

---

## Task 7: Admin page + components

**Files:**
- Create: `app/admin/shopping/page.tsx`
- Create: `components/admin/ShoppingItemsManager.tsx`
- Create: `components/admin/ShoppingRequestsQueue.tsx`

- [ ] **Step 1: Create the admin page (Server Component)**

`app/admin/shopping/page.tsx`:

```tsx
import { db } from '@/lib/db'
import { shoppingItems, shoppingItemFlags, shoppingRequests } from '@/drizzle/schema'
import { eq, inArray, desc, sql } from 'drizzle-orm'
import { ShoppingItemsManager } from '@/components/admin/ShoppingItemsManager'
import { ShoppingRequestsQueue } from '@/components/admin/ShoppingRequestsQueue'

export const dynamic = 'force-dynamic'

export default async function AdminShoppingPage() {
  const items = await db
    .select()
    .from(shoppingItems)
    .where(eq(shoppingItems.isActive, true))
    .orderBy(desc(shoppingItems.createdAt))

  const ids = items.map((i) => i.id)
  const flags =
    ids.length > 0
      ? await db
          .select({ itemId: shoppingItemFlags.itemId, level: shoppingItemFlags.level })
          .from(shoppingItemFlags)
          .where(inArray(shoppingItemFlags.itemId, ids))
      : []

  const itemsView = items.map((i) => ({
    id: i.id,
    name: i.name,
    jumboUrl: i.jumboUrl,
    price: i.price,
    low: flags.filter((f) => f.itemId === i.id && f.level === 'low').length,
    out: flags.filter((f) => f.itemId === i.id && f.level === 'out').length,
  }))

  const pending = await db
    .select({
      id: shoppingRequests.id,
      name: shoppingRequests.name,
      jumboUrl: shoppingRequests.jumboUrl,
      price: shoppingRequests.price,
      requestedBy: shoppingRequests.requestedBy,
      votes: sql<number>`(select count(*)::int from shopping_request_votes v where v.request_id = ${shoppingRequests.id})`,
    })
    .from(shoppingRequests)
    .where(eq(shoppingRequests.status, 'pending'))
    .orderBy(desc(shoppingRequests.createdAt))

  const sortedPending = [...pending].sort((a, b) => b.votes - a.votes)

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shopping list</h2>
      <ShoppingRequestsQueue requests={sortedPending} />
      <ShoppingItemsManager items={itemsView} />
    </div>
  )
}
```

- [ ] **Step 2: Create the ShoppingItemsManager client component**

`components/admin/ShoppingItemsManager.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Item = {
  id: string
  name: string
  jumboUrl: string | null
  price: string | null
  low: number
  out: number
}

export function ShoppingItemsManager({ items }: { items: Item[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [jumboUrl, setJumboUrl] = useState('')
  const [price, setPrice] = useState('')

  async function add(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/shopping/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, jumboUrl, price }),
    })
    setName('')
    setJumboUrl('')
    setPrice('')
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Remove this item from the list?')) return
    await fetch('/api/admin/shopping/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  async function restock(id: string) {
    await fetch('/api/admin/shopping/items/restock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Items</h3>

      <form onSubmit={add} className="flex flex-wrap gap-2 items-end">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
        <input value={jumboUrl} onChange={(e) => setJumboUrl(e.target.value)} placeholder="Jumbo link"
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price €" inputMode="decimal"
          className="w-24 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
        <button type="submit"
          className="px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-medium">
          Add
        </button>
      </form>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2 items-center">
                {item.price && <span>€{item.price}</span>}
                {item.jumboUrl && <a href={item.jumboUrl} target="_blank" rel="noreferrer" className="underline">Jumbo</a>}
                {item.low > 0 && <span>🟡 low ×{item.low}</span>}
                {item.out > 0 && <span>🔴 out ×{item.out}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {(item.low > 0 || item.out > 0) && (
                <button onClick={() => restock(item.id)}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200">
                  Mark restocked
                </button>
              )}
              <button onClick={() => remove(item.id)}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create the ShoppingRequestsQueue client component**

`components/admin/ShoppingRequestsQueue.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'

type Req = {
  id: string
  name: string
  jumboUrl: string | null
  price: string | null
  votes: number
}

export function ShoppingRequestsQueue({ requests }: { requests: Req[] }) {
  const router = useRouter()

  async function resolve(requestId: string, action: 'approve' | 'deny') {
    let reason: string | null = null
    if (action === 'deny') {
      reason = prompt('Reason for denial (optional):') ?? null
    }
    await fetch('/api/admin/shopping/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action, reason }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Pending requests {requests.length > 0 && <span className="text-gray-500">({requests.length})</span>}
      </h3>
      {requests.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No pending requests.</p>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <div key={r.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {r.name} <span className="text-xs text-gray-500">👍 {r.votes}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2 items-center">
                  {r.price && <span>€{r.price}</span>}
                  {r.jumboUrl && <a href={r.jumboUrl} target="_blank" rel="noreferrer" className="underline">Jumbo</a>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => resolve(r.id, 'approve')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200">
                  Approve
                </button>
                <button onClick={() => resolve(r.id, 'deny')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200">
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Type check**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification**

Run `bun dev`, log in as admin, visit `/admin/shopping`. Verify: adding an item shows it in the list; approving a pending request removes it from the queue and it appears as an item; denying with a reason removes it; "Mark restocked" appears only when flags exist and clears the badges.

- [ ] **Step 6: Commit**

```bash
git add app/admin/shopping components/admin/ShoppingItemsManager.tsx components/admin/ShoppingRequestsQueue.tsx
git commit -m "feat: add admin shopping page"
```

---

## Task 8: Quota setting in admin settings

**Files:**
- Modify: `app/api/admin/settings/route.ts`
- Modify: `components/admin/SettingsForm.tsx`
- Modify: `app/admin/settings/page.tsx`

- [ ] **Step 1: Persist the quota in the settings PATCH route**

In `app/api/admin/settings/route.ts`, change the `PATCH` handler to also read and store `shoppingRequestsPerMonth`:

```ts
export async function PATCH(req: NextRequest) {
  const { costPerLunch, paymentInstructions, shoppingRequestsPerMonth } = await req.json()

  if (costPerLunch === undefined || isNaN(Number(costPerLunch))) {
    return NextResponse.json({ error: 'Invalid cost' }, { status: 400 })
  }
  const quota = Number(shoppingRequestsPerMonth)
  if (shoppingRequestsPerMonth !== undefined && (!Number.isInteger(quota) || quota < 0)) {
    return NextResponse.json({ error: 'Invalid request quota' }, { status: 400 })
  }

  const existing = await getConfig()

  const values = {
    costPerLunch: String(costPerLunch),
    paymentInstructions: paymentInstructions ?? null,
    shoppingRequestsPerMonth:
      shoppingRequestsPerMonth === undefined ? (existing?.shoppingRequestsPerMonth ?? 1) : quota,
    updatedAt: new Date(),
  }

  if (existing) {
    const [updated] = await db.update(config).set(values).returning()
    return NextResponse.json(updated)
  }

  const [created] = await db.insert(config).values(values).returning()
  return NextResponse.json(created)
}
```

- [ ] **Step 2: Read the current `SettingsForm` to match its shape**

Run: `cat components/admin/SettingsForm.tsx`
This is a `'use client'` form posting to `/api/admin/settings` via PATCH. Note its state variables and the fetch body so the next edit matches.

- [ ] **Step 3: Add a quota input to `SettingsForm`**

Add a prop `initialRequestsPerMonth: number`, a state field `const [requestsPerMonth, setRequestsPerMonth] = useState(initialRequestsPerMonth)`, an input bound to it (label "Shopping requests per person per month", `type="number"`, `min={0}`), and include `shoppingRequestsPerMonth: requestsPerMonth` in the PATCH request body alongside the existing `costPerLunch` / `paymentInstructions` fields. Follow the existing input markup in the file for styling.

- [ ] **Step 4: Pass the current value from the settings page**

In `app/admin/settings/page.tsx`, add to the `<SettingsForm ... />` props:

```tsx
initialRequestsPerMonth={cfg?.shoppingRequestsPerMonth ?? 1}
```

- [ ] **Step 5: Type check**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verification**

Run `bun dev`, go to `/admin/settings`, change "Shopping requests per person per month" to 2, save. Reload — it persists. As a user, the request form should now show "2 ... left this month".

- [ ] **Step 7: Commit**

```bash
git add app/api/admin/settings/route.ts components/admin/SettingsForm.tsx app/admin/settings/page.tsx
git commit -m "feat: make monthly shopping request quota configurable"
```

---

## Task 9: Navigation links + pending badge

**Files:**
- Modify: `components/MeNav.tsx`
- Modify: `components/AdminNav.tsx`
- Modify: `app/admin/layout.tsx`

- [ ] **Step 1: Add a "Shopping" link to the user nav**

In `components/MeNav.tsx`, add a top-level link next to the existing `Billing` link (desktop `<nav>`), and include it in the mobile menu array. Desktop, after the Billing `<Link>`:

```tsx
<Link href="/me/shopping" className={linkClass('/me/shopping')}>
  Shopping
</Link>
```

Mobile: in the array passed to `.map(...)`, append `{ href: '/me/shopping', label: 'Shopping' }` after the billing entry:

```tsx
{[{ href: '/me', label: 'Dashboard' }]
  .concat(lunchLinks)
  .concat([{ href: '/me/billing', label: 'Billing' }, { href: '/me/shopping', label: 'Shopping' }])
  .map(({ href, label }) => (
```

- [ ] **Step 2: Make `AdminNav` accept a pending count and render a badge**

In `components/AdminNav.tsx`:

Add a `Shopping` entry to `navItems` (before `Kiosk Devices`), reusing an existing SVG icon shape:

```tsx
{
  href: '/admin/shopping', label: 'Shopping',
  icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
},
```

Change the component signature to accept the count and render a badge on the Shopping link:

```tsx
export function AdminNav({ pendingRequests = 0 }: { pendingRequests?: number }) {
```

In the `navItems.map(...)` render, append the badge when the item is Shopping and there are pending requests:

```tsx
<Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={linkClass(item.href)}>
  {item.icon}{item.label}
  {item.href === '/admin/shopping' && pendingRequests > 0 && (
    <span className="ml-auto text-xs font-semibold bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-full px-2 py-0.5">
      {pendingRequests}
    </span>
  )}
</Link>
```

- [ ] **Step 3: Fetch the count in the admin layout and pass it down**

In `app/admin/layout.tsx`:

```tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminNav } from '@/components/AdminNav'
import { getPendingRequestCount } from '@/lib/queries/shopping'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') redirect('/login')

  const pendingRequests = await getPendingRequestCount()

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      <AdminNav pendingRequests={pendingRequests} />
      <main className="flex-1 p-8 overflow-auto md:mt-0 mt-14">{children}</main>
    </div>
  )
}
```

- [ ] **Step 4: Type check**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification**

Run `bun dev`. As a user, "Shopping" appears in the top nav and links to `/me/shopping`. As admin, "Shopping" appears in the sidebar; when there is a pending request, a count badge shows next to it and disappears once all are resolved.

- [ ] **Step 6: Commit**

```bash
git add components/MeNav.tsx components/AdminNav.tsx app/admin/layout.tsx
git commit -m "feat: add shopping nav links and pending-request badge"
```

---

## Final verification

- [ ] **Step 1: Full type check**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Unit tests**

Run: `bun test lib/queries/shopping.test.ts`
Expected: PASS — 4 pass.

- [ ] **Step 3: Production build**

Run: `bun run build`
Expected: build succeeds with no type/lint errors.

- [ ] **Step 4: End-to-end smoke (manual)**

With `bun dev`: as a user flag an item out → as admin see the 🔴 badge and "Mark restocked" → restock clears it. As a user submit a request → admin receives it in the queue (and the nav badge increments) → approve it → it appears as an item and the user's history shows "approved". Deny another request → user can immediately submit again (quota refunded).
