# Kiosk Shopping List — Design

**Date:** 2026-09-18
**Status:** Approved, ready for implementation plan
**Builds on:** the shared shopping list feature (branch `feat/shared-shopping-list` / PR #2). Requires the `shopping_items` table and existing `/me` + `/admin` shopping surfaces.

## Summary

Add a **Shopping** tab to the kiosk (the shared iPad in the lunch area) so anyone
can flag an item as running low or out without logging in. The kiosk has no
per-user identity, so its flag is a single **shared, anonymous** signal per item —
distinct from the per-person flags on `/me`. Requesting and voting on items stay
off the kiosk.

## Decisions (locked)

- **Anonymous flag model:** a single shared `kiosk_flag` column on `shopping_items`
  (`'low' | 'out' | null`). One identity-less signal per item; idempotent — tapping
  a level sets it, tapping OK clears it, re-tapping overwrites. Not the per-person
  `shopping_item_flags` table (which requires a `participant_id`).
- **Display:** the kiosk flag shows as a **separate indicator** (e.g. `🏪 kiosk: out`)
  on the `/me` list and the admin page, next to the per-person `🟡 low ×N 🔴 out ×M`
  counts. Provenance stays visible.
- **Levels:** OK / Running low / Out — same three as `/me`, so an accidental tap can
  be cleared at the kiosk.
- **Restock:** admin "Mark restocked" clears the kiosk flag too (alongside per-person flags).
- **Kiosk shopping tab is minimal:** each active item shows name (+ €price / Jumbo link
  if present) and its current shared kiosk flag with three buttons. No per-person counts.
- **No background polling** on the shopping tab (unlike the 30s avatar-grid poll). The
  list refreshes after each tap and on tab open; item content only changes when an admin
  edits the list.
- **Out of scope:** requesting items, voting, or any per-person identity on the kiosk.

## Schema

Add one nullable column to the existing `shopping_items` table in `drizzle/schema.ts`:

```ts
kioskFlag: text('kiosk_flag', { enum: ['low', 'out'] }),
```

Generate a migration (`bun run db:generate`) and apply it. `bun run db:migrate` is known
to fail in this environment on an older drifted migration; apply the generated SQL directly
via `bun scripts/apply-sql.ts drizzle/migrations/XXXX_*.sql` (the Neon-HTTP workaround added
in the previous feature).

## Query layer (`lib/queries/shopping.ts`)

- `getKioskShoppingItems()` → active items ordered by name, each `{ id, name, jumboUrl, price, kioskFlag }`.
- `setKioskFlag(itemId: string, level: 'low' | 'out' | null)` → sets `shopping_items.kiosk_flag`
  (a plain column update; `null` clears it).
- `restockItem(id)` → extend the existing function to also set `kioskFlag: null` in the same update.
- `ShoppingItemView` (used by `/me`) gains a `kioskFlag: 'low' | 'out' | null` field, populated by
  `getShoppingItems` (select the column and pass it through).

## API

- `POST /api/kiosk/shopping/flag` — body `{ itemId, level: 'low' | 'out' | null }`.
  Validates `itemId` exists (active) and `level` is one of the three, then calls `setKioskFlag`.
  No `participantId`. Protected by the existing `kiosk_token` middleware (all `/api/kiosk/*`
  except setup already require the cookie). Returns `{ success: true }`.

## Kiosk UI

The kiosk page (`app/kiosk/page.tsx`) currently renders `DateHeader` + `AvatarGrid` directly
inside a single full-screen `<main>`. Introduce tabs:

- New client component `components/kiosk/KioskTabs.tsx`: a top tab bar with two tabs —
  **Lunch** and **Shopping** — holding the active tab in local state. Styled for the dark
  kiosk theme (`bg-gray-950 text-white`), large touch targets.
  - **Lunch tab:** renders the existing `DateHeader` + `AvatarGrid` (moved into this tab,
    unchanged in behavior). `AvatarGrid` keeps its own polling.
  - **Shopping tab:** renders a new `components/kiosk/KioskShoppingList.tsx` client component.
- `app/kiosk/page.tsx` fetches both the lunch data (as today) and `getKioskShoppingItems()`,
  and passes each to `KioskTabs`.

`KioskShoppingList` (client):
- Props: the initial item list.
- Renders each item as a large row: name (+ €price and a Jumbo link if set), the current
  kiosk flag state, and three large buttons `OK · Running low · Out`.
- On tap: `POST /api/kiosk/shopping/flag`, then `router.refresh()` to re-pull the list.
- Empty state when there are no items.

## Existing surfaces (separate indicator)

- `components/me/ShoppingList.tsx`: render `🏪 kiosk: {kioskFlag}` when `item.kioskFlag` is set,
  next to the existing per-person badges. `ShoppingItemView` now carries `kioskFlag`.
- `app/admin/shopping/page.tsx`: the item query already selects all columns via
  `db.select().from(shoppingItems)`, so `kioskFlag` is available; add it to `itemsView` and
  render the same `🏪 kiosk` badge in `components/admin/ShoppingItemsManager.tsx` (extend its
  `Item` type with `kioskFlag`).

## Testing

No new pure logic to unit-test (the flag is a direct column write). Verify with:
- `bunx tsc --noEmit` (feature files clean; the pre-existing NextAuth `[...nextauth]/route`
  type error is unrelated — see project memory).
- `bun run build` (with Node ≥20, e.g. `/usr/bin/node`).
- Manual: on the kiosk Shopping tab, flag an item Out → it shows `🏪 kiosk: out` on `/admin/shopping`
  and `/me/shopping`; admin "Mark restocked" clears it; the Lunch tab still signs people in as before.

## Explicitly out of scope

- Requesting new items or voting from the kiosk.
- Any per-person attribution of kiosk flags.
- Background polling of the kiosk shopping list.
- Merging the kiosk flag into the per-person low/out counts (it stays a separate indicator).
