# Kiosk Shopping List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Shopping tab to the kiosk so anyone at the shared iPad can flag an item running low/out, as a single anonymous signal per item, shown distinctly ("🏪 kiosk") on the admin and /me shopping surfaces.

**Architecture:** One nullable `kiosk_flag` column on the existing `shopping_items` table holds the shared signal. A kiosk-only API route (protected by the existing `kiosk_token` middleware, no participant) sets it. The kiosk page gains a client tab switcher wrapping the existing lunch view and a new shopping list. The /me and admin surfaces render the kiosk flag as a separate badge.

**Tech Stack:** Next.js 16 App Router, React 19, Drizzle ORM (Neon HTTP driver), Tailwind, Bun.

---

## File Structure

**Created:**
- `app/api/kiosk/shopping/flag/route.ts` — set/clear the shared kiosk flag on an item
- `components/kiosk/KioskTabs.tsx` — top-level Lunch/Shopping tab switcher (client)
- `components/kiosk/KioskShoppingList.tsx` — kiosk shopping panel with flag buttons (client)

**Modified:**
- `drizzle/schema.ts` — add `kiosk_flag` column to `shopping_items`
- `lib/queries/shopping.ts` — `getKioskShoppingItems`, `setKioskFlag`, extend `restockItem` + `ShoppingItemView`/`getShoppingItems`
- `app/kiosk/page.tsx` — fetch kiosk items, render `KioskTabs`
- `components/me/ShoppingList.tsx` — render the kiosk badge
- `app/admin/shopping/page.tsx` — include `kioskFlag` in `itemsView`
- `components/admin/ShoppingItemsManager.tsx` — extend `Item` type + render the kiosk badge

---

## Task 1: Schema + migration

**Files:**
- Modify: `drizzle/schema.ts`
- Create (generated): `drizzle/migrations/XXXX_*.sql`

- [ ] **Step 1: Add the column to `shopping_items`**

In `drizzle/schema.ts`, inside the existing `shoppingItems = pgTable('shopping_items', { ... })` definition, add this line immediately BEFORE the `createdAt` line:

```ts
  kioskFlag: text('kiosk_flag', { enum: ['low', 'out'] }),
```

(`text` is already imported.) The column is nullable — no `.notNull()`.

- [ ] **Step 2: Generate the migration**

Run: `bun run db:generate`
Expected: a new file `drizzle/migrations/XXXX_*.sql` containing `ALTER TABLE "shopping_items" ADD COLUMN "kiosk_flag" text;` (or with an enum check — either is fine).

- [ ] **Step 3: Apply the migration**

Run: `bun run db:migrate`
Expected: `Migrations applied.`

If it fails with SIGHUP / an "already exists" error on an older migration (a known pre-existing issue in this environment), apply the generated SQL directly with the existing helper:

Run: `bun scripts/apply-sql.ts drizzle/migrations/XXXX_*.sql` (use the real generated filename).
Expected: `Applied N statements ...`

If the database is unreachable entirely, that is acceptable — report DONE_WITH_CONCERNS, noting the SQL was generated/committed but not applied. Do not fabricate success.

- [ ] **Step 4: Type check**

Run: `bunx tsc --noEmit`
Expected: no NEW errors. There is ONE known pre-existing unrelated error in `app/api/auth/[...nextauth]/route.ts` (duplicate nested `next` under `next-auth`) — ignore only that one.

- [ ] **Step 5: Commit**

```bash
git add drizzle/schema.ts drizzle/migrations
git commit -m "feat: add kiosk_flag column to shopping_items"
```

---

## Task 2: Query layer

**Files:**
- Modify: `lib/queries/shopping.ts`

- [ ] **Step 1: Ensure `asc` is imported**

The file's drizzle import is currently:
```ts
import { and, eq, gte, lt, sql, inArray, desc } from 'drizzle-orm'
```
Change it to also import `asc`:
```ts
import { and, eq, gte, lt, sql, inArray, desc, asc } from 'drizzle-orm'
```

- [ ] **Step 2: Add `kioskFlag` to `ShoppingItemView`**

Find the `ShoppingItemView` type and add a `kioskFlag` field:
```ts
export type ShoppingItemView = {
  id: string
  name: string
  jumboUrl: string | null
  price: string | null
  low: number
  out: number
  myLevel: 'low' | 'out' | null
  kioskFlag: 'low' | 'out' | null
}
```

- [ ] **Step 3: Populate `kioskFlag` in `getShoppingItems`**

In `getShoppingItems`, the `.map(...)` returns an object per item. Add `kioskFlag` to that returned object (the `item` variable is the full row from `db.select().from(shoppingItems)`, so it has `.kioskFlag`):

```ts
    return {
      id: item.id,
      name: item.name,
      jumboUrl: item.jumboUrl,
      price: item.price,
      low: summary.low,
      out: summary.out,
      myLevel: mine?.level ?? null,
      kioskFlag: item.kioskFlag,
    }
```

- [ ] **Step 4: Extend `restockItem` to clear the kiosk flag**

Replace the existing `restockItem` function with:
```ts
export async function restockItem(id: string): Promise<void> {
  await db.delete(shoppingItemFlags).where(eq(shoppingItemFlags.itemId, id))
  await db.update(shoppingItems).set({ kioskFlag: null }).where(eq(shoppingItems.id, id))
}
```

- [ ] **Step 5: Add the kiosk query + setter**

Add these near the other item functions (after `restockItem` is fine):

```ts
export type KioskShoppingItemView = {
  id: string
  name: string
  jumboUrl: string | null
  price: string | null
  kioskFlag: 'low' | 'out' | null
}

export async function getKioskShoppingItems(): Promise<KioskShoppingItemView[]> {
  return db
    .select({
      id: shoppingItems.id,
      name: shoppingItems.name,
      jumboUrl: shoppingItems.jumboUrl,
      price: shoppingItems.price,
      kioskFlag: shoppingItems.kioskFlag,
    })
    .from(shoppingItems)
    .where(eq(shoppingItems.isActive, true))
    .orderBy(asc(shoppingItems.name))
}

export async function setKioskFlag(
  itemId: string,
  level: 'low' | 'out' | null
): Promise<void> {
  await db.update(shoppingItems).set({ kioskFlag: level }).where(eq(shoppingItems.id, itemId))
}
```

- [ ] **Step 6: Type check**

Run: `bunx tsc --noEmit`
Expected: no NEW errors (only the known pre-existing NextAuth one).

Note: `getShoppingItems` gained a required field on its return type — the /me `ShoppingList` component consumes `ShoppingItemView` but Task 5 adds the render; TypeScript won't error on the extra field until then. If tsc flags any OTHER consumer of `ShoppingItemView` missing `kioskFlag`, that's expected only where an object literal of that type is constructed — search shows only `getShoppingItems` constructs it, so there should be none.

- [ ] **Step 7: Re-run existing tests (must still pass)**

Run: `DATABASE_URL="postgres://x:x@localhost/x" bun test lib/queries/shopping.test.ts`
Expected: PASS (5 pass). (The dummy URL is only needed because `lib/db.ts` reads `DATABASE_URL` at import; the pure-helper tests never connect.)

- [ ] **Step 8: Commit**

```bash
git add lib/queries/shopping.ts
git commit -m "feat: add kiosk shopping queries and kiosk flag on item view"
```

---

## Task 3: Kiosk API route

**Files:**
- Create: `app/api/kiosk/shopping/flag/route.ts`

- [ ] **Step 1: Create the route**

`app/api/kiosk/shopping/flag/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { itemExists, setKioskFlag } from '@/lib/queries/shopping'

// No auth code here: middleware.ts already requires a valid kiosk_token cookie for
// all /api/kiosk/* routes (except setup). The kiosk has no per-user identity, so the
// flag carries no participant — it's a single shared signal per item.
export async function POST(req: NextRequest) {
  const { itemId, level } = await req.json()
  if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 })
  if (level !== null && level !== 'low' && level !== 'out') {
    return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
  }
  if (!(await itemExists(itemId))) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }
  await setKioskFlag(itemId, level)
  return NextResponse.json({ success: true })
}
```

(`itemExists` already exists in `@/lib/queries/shopping` and returns true only for active items.)

- [ ] **Step 2: Type check**

Run: `bunx tsc --noEmit`
Expected: no NEW errors (only the known pre-existing NextAuth one). If a NEW validator error references `/api/kiosk/shopping/flag`, investigate it.

- [ ] **Step 3: Commit**

```bash
git add app/api/kiosk/shopping
git commit -m "feat: add kiosk shopping flag api route"
```

---

## Task 4: Kiosk UI (tabs + shopping list)

**Files:**
- Create: `components/kiosk/KioskTabs.tsx`
- Create: `components/kiosk/KioskShoppingList.tsx`
- Modify: `app/kiosk/page.tsx`

- [ ] **Step 1: Create `components/kiosk/KioskTabs.tsx`**

```tsx
'use client'

import { useState } from 'react'

export function KioskTabs({
  lunch,
  shopping,
}: {
  lunch: React.ReactNode
  shopping: React.ReactNode
}) {
  const [tab, setTab] = useState<'lunch' | 'shopping'>('lunch')

  const tabClass = (active: boolean) =>
    `px-6 py-3 rounded-xl text-xl font-semibold transition-colors ${
      active
        ? 'bg-white text-gray-950'
        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
    }`

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-3">
        <button onClick={() => setTab('lunch')} className={tabClass(tab === 'lunch')}>
          Lunch
        </button>
        <button onClick={() => setTab('shopping')} className={tabClass(tab === 'shopping')}>
          Shopping
        </button>
      </div>
      {/* Keep both mounted (hidden, not unmounted) so AvatarGrid keeps polling/state across tab switches */}
      <div hidden={tab !== 'lunch'}>{lunch}</div>
      <div hidden={tab !== 'shopping'}>{shopping}</div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/kiosk/KioskShoppingList.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { KioskShoppingItemView } from '@/lib/queries/shopping'

export function KioskShoppingList({ initialItems }: { initialItems: KioskShoppingItemView[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function setFlag(itemId: string, level: 'low' | 'out' | null) {
    setBusy(itemId)
    await fetch('/api/kiosk/shopping/flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, level }),
    })
    setBusy(null)
    router.refresh()
  }

  if (initialItems.length === 0) {
    return <p className="text-2xl text-gray-400">The shopping list is empty.</p>
  }

  const btn = (active: boolean) =>
    `px-6 py-4 rounded-xl text-xl font-semibold transition-colors ${
      active
        ? 'bg-white text-gray-950'
        : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
    }`

  return (
    <div className="flex flex-col gap-3">
      {initialItems.map((item) => (
        <div
          key={item.id}
          className="bg-gray-900 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <div className="text-2xl font-semibold">{item.name}</div>
            <div className="text-lg text-gray-400 flex gap-3 items-center">
              {item.price && <span>€{item.price}</span>}
              {item.jumboUrl && (
                <a href={item.jumboUrl} target="_blank" rel="noreferrer" className="underline">
                  Jumbo
                </a>
              )}
              {item.kioskFlag === 'low' && <span>🟡 running low</span>}
              {item.kioskFlag === 'out' && <span>🔴 out</span>}
            </div>
          </div>
          <div className="flex gap-3">
            <button disabled={busy === item.id} onClick={() => setFlag(item.id, null)} className={btn(item.kioskFlag === null)}>
              OK
            </button>
            <button disabled={busy === item.id} onClick={() => setFlag(item.id, 'low')} className={btn(item.kioskFlag === 'low')}>
              Running low
            </button>
            <button disabled={busy === item.id} onClick={() => setFlag(item.id, 'out')} className={btn(item.kioskFlag === 'out')}>
              Out
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

(Renders directly from the `initialItems` prop — after each tap, `router.refresh()` re-runs the Server Component and passes a fresh prop, so no local copy can go stale.)

- [ ] **Step 3: Update `app/kiosk/page.tsx`**

Replace the entire file with:

```tsx
import { DateHeader } from '@/components/kiosk/DateHeader'
import { AvatarGrid } from '@/components/kiosk/AvatarGrid'
import { KioskTabs } from '@/components/kiosk/KioskTabs'
import { KioskShoppingList } from '@/components/kiosk/KioskShoppingList'
import { getOrCreateTodaySession, getSessionWithAttendance, getFixedDayParticipantIds } from '@/lib/queries/sessions'
import { getActiveParticipants } from '@/lib/queries/participants'
import { getKioskShoppingItems } from '@/lib/queries/shopping'

export const dynamic = 'force-dynamic'

export default async function KioskPage() {
  const [session, allParticipants, shoppingItems] = await Promise.all([
    getOrCreateTodaySession(),
    getActiveParticipants(),
    getKioskShoppingItems(),
  ])

  const [attending, fixedDayIds] = await Promise.all([
    getSessionWithAttendance(session.id),
    getFixedDayParticipantIds(session.date),
  ])

  const participants = allParticipants.map((p) => ({
    id: p.id,
    name: p.name,
    avatarUrl: p.avatarUrl,
    attending: attending.has(p.id),
    fixedDay: fixedDayIds.has(p.id),
    companyId: p.companyId ?? null,
    companyName: p.companyName ?? null,
  }))

  return (
    <main className="min-h-screen flex flex-col gap-8 p-8">
      <KioskTabs
        lunch={
          <div className="flex flex-col gap-8">
            <DateHeader />
            <AvatarGrid
              initialSession={{ id: session.id, date: session.date, cost: session.cost }}
              initialParticipants={participants}
            />
          </div>
        }
        shopping={<KioskShoppingList initialItems={shoppingItems} />}
      />
    </main>
  )
}
```

- [ ] **Step 4: Type check**

Run: `bunx tsc --noEmit`
Expected: no NEW errors (only the known pre-existing NextAuth one).

- [ ] **Step 5: Manual verification (best-effort)**

If a dev server + kiosk token are available: open `/kiosk`, confirm two tabs (Lunch/Shopping); Lunch shows the avatar grid as before; Shopping lists items with OK/Running low/Out buttons; tapping Out shows "🔴 out" and the button highlights after refresh. If you cannot run it (no kiosk cookie/DB), say so — do not fabricate.

- [ ] **Step 6: Commit**

```bash
git add app/kiosk/page.tsx components/kiosk/KioskTabs.tsx components/kiosk/KioskShoppingList.tsx
git commit -m "feat: add shopping tab to kiosk view"
```

---

## Task 5: Kiosk badge on /me and admin surfaces

**Files:**
- Modify: `components/me/ShoppingList.tsx`
- Modify: `app/admin/shopping/page.tsx`
- Modify: `components/admin/ShoppingItemsManager.tsx`

- [ ] **Step 1: Render the kiosk badge on the /me list**

In `components/me/ShoppingList.tsx`, find the badges block:
```tsx
              {item.low > 0 && <span>🟡 low ×{item.low}</span>}
              {item.out > 0 && <span>🔴 out ×{item.out}</span>}
```
Add the kiosk badge immediately after them:
```tsx
              {item.low > 0 && <span>🟡 low ×{item.low}</span>}
              {item.out > 0 && <span>🔴 out ×{item.out}</span>}
              {item.kioskFlag && <span>🏪 kiosk: {item.kioskFlag}</span>}
```
(`item` is a `ShoppingItemView`, which now has `kioskFlag` from Task 2.)

- [ ] **Step 2: Include `kioskFlag` in the admin `itemsView`**

In `app/admin/shopping/page.tsx`, the `itemsView` map builds each item object. Add `kioskFlag`:
```tsx
  const itemsView = items.map((i) => ({
    id: i.id,
    name: i.name,
    jumboUrl: i.jumboUrl,
    price: i.price,
    kioskFlag: i.kioskFlag,
    low: flags.filter((f) => f.itemId === i.id && f.level === 'low').length,
    out: flags.filter((f) => f.itemId === i.id && f.level === 'out').length,
  }))
```
(`items` comes from `db.select().from(shoppingItems)`, so each `i` has `.kioskFlag`.)

- [ ] **Step 3: Extend the admin `Item` type and render the badge**

In `components/admin/ShoppingItemsManager.tsx`, extend the `Item` type:
```tsx
type Item = {
  id: string
  name: string
  jumboUrl: string | null
  price: string | null
  kioskFlag: 'low' | 'out' | null
  low: number
  out: number
}
```
Then find the badges block:
```tsx
                {item.low > 0 && <span>🟡 low ×{item.low}</span>}
                {item.out > 0 && <span>🔴 out ×{item.out}</span>}
```
Add the kiosk badge after them:
```tsx
                {item.low > 0 && <span>🟡 low ×{item.low}</span>}
                {item.out > 0 && <span>🔴 out ×{item.out}</span>}
                {item.kioskFlag && <span>🏪 kiosk: {item.kioskFlag}</span>}
```

- [ ] **Step 4: Type check**

Run: `bunx tsc --noEmit`
Expected: no NEW errors (only the known pre-existing NextAuth one).

- [ ] **Step 5: Commit**

```bash
git add components/me/ShoppingList.tsx app/admin/shopping/page.tsx components/admin/ShoppingItemsManager.tsx
git commit -m "feat: show kiosk flag as a separate badge on me and admin surfaces"
```

---

## Final verification

- [ ] **Step 1: Full type check**

Run: `bunx tsc --noEmit`
Expected: only the known pre-existing NextAuth `[...nextauth]/route` error; nothing from the feature files.

- [ ] **Step 2: Unit tests**

Run: `DATABASE_URL="postgres://x:x@localhost/x" bun test lib/queries/shopping.test.ts`
Expected: PASS (5 pass).

- [ ] **Step 3: Production build**

Run with Node ≥20 (the default shell node is 19.9.0 which Next 16 rejects):
`PATH="/usr/bin:$PATH" bun run build`
Expected: `✓ Compiled successfully`. The build's TypeScript step will fail ONLY on the pre-existing `app/api/auth/[...nextauth]/route.ts` error (duplicate nested `next` under `next-auth`); confirm that is the only failure and it is unrelated to this feature. (A clean `bun install` deduping `next` clears it — out of scope here.)

- [ ] **Step 4: End-to-end smoke (manual)**

On the kiosk Shopping tab, flag an item Out → it shows `🏪 kiosk: out` on `/admin/shopping` and `/me/shopping`. Admin "Mark restocked" clears the kiosk flag (and per-person flags). The Lunch tab still signs people in as before.
