# Shared Shopping List — Design

**Date:** 2026-08-28
**Status:** Approved, ready for implementation plan

## Summary

A shared shopping list for the lunch group. Everyone can see the list and signal
when an item is running low or out. Users can request new items (with a Jumbo
link and price so people can judge whether it's worth adding) and vote on each
other's requests. Admins manage the canonical list and approve or deny requests.

## Decisions (locked)

- **Jumbo price:** manual entry — the requester pastes a Jumbo product URL and
  types the current price. No scraping, no auto-fetch.
- **Roles:** no new role. Admins manage the list via `/admin`. All other users
  view, flag, request, and vote via `/me`.
- **Flagging:** per-user, two levels (`low` / `out`). Aggregated badges shown on
  each item. Admin "restock" clears an item's flags.
- **Quota:** users may create N requests per calendar month (default 1,
  configurable by admins). Only `pending` + `approved` requests count — a
  **denied request refunds the slot** automatically.
- **Notifications:** email admins when a new request is created. Everything else
  is in-app. No approve/deny emails to requesters.
- **Data shape:** separate `shopping_requests` and `shopping_items` tables
  (option B), not one table with a `requested` status.

## Data model

Four new tables plus one `config` column. All foreign keys `onDelete: cascade`,
matching existing tables. Flags/votes/requests reference `participants` (not
`users`), consistent with `attendances` — only regular users, who always have a
participant, perform these actions.

### `shopping_items` — the canonical list (admin-managed)

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| name | text notNull | |
| jumbo_url | text | nullable |
| price | numeric(10,2) | nullable |
| is_active | boolean notNull default true | soft-remove from list |
| created_from_request_id | uuid → shopping_requests | nullable, provenance |
| created_at | timestamptz notNull default now | |

### `shopping_item_flags` — per-user "running low / out"

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| item_id | uuid → shopping_items | cascade |
| participant_id | uuid → participants | cascade |
| level | text enum('low','out') notNull | |
| created_at | timestamptz notNull default now | |

`unique(item_id, participant_id)` — one flag per person per item. Re-flagging
updates the level; unflagging deletes the row. Admin restock deletes all flags
for an item.

### `shopping_requests` — requested new items

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| name | text notNull | |
| jumbo_url | text | nullable |
| price | numeric(10,2) | nullable |
| requested_by | uuid → participants | cascade |
| status | text enum('pending','approved','denied') notNull default 'pending' | |
| deny_reason | text | nullable |
| resolved_by | uuid → users | nullable, admin who acted |
| resolved_at | timestamptz | nullable |
| approved_item_id | uuid → shopping_items | nullable, set on approve |
| created_at | timestamptz notNull default now | |

### `shopping_request_votes` — popularity of a request

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| request_id | uuid → shopping_requests | cascade |
| participant_id | uuid → participants | cascade |
| created_at | timestamptz notNull default now | |

`unique(request_id, participant_id)` — vote is a toggle.

### `config` addition

Add `shopping_requests_per_month integer notNull default 1`.

## Permissions

| Action | Who |
|---|---|
| View list, flag summaries, requests, vote counts | any logged-in user |
| Flag / unflag an item (low/out) | any user |
| Create a request (quota-limited) | any user |
| Vote / unvote a request | any user |
| Add/edit/remove items, mark restocked, approve/deny, set quota | admin only |

## Flows

### Flag
`POST /api/me/shopping/flag { itemId, level: 'low' | 'out' | null }`
Upsert the `(item_id, participant_id)` row, or delete it when `level` is null.

### Request
`POST /api/me/shopping/request { name, jumboUrl, price }`
Reject if the user's `pending + approved` request count for the current calendar
month is already ≥ quota. On success, email admins via `lib/mailer.ts`.

### Vote
`POST /api/me/shopping/vote { requestId }` — toggle the user's vote row.

### Approve (admin)
Insert a `shopping_items` row copying `name / jumbo_url / price`, set the
request's `status = approved`, `approved_item_id`, `resolved_by`, `resolved_at`.

### Deny (admin)
Set `status = denied`, optional `deny_reason`, `resolved_by`, `resolved_at`.
Because only `pending + approved` count toward quota, denial frees the user's
monthly slot with no extra logic.

### Quota calculation
```
count(shopping_requests
      where requested_by = me
        and status in ('pending','approved')
        and created_at within current calendar month)
```
The `/me` request form shows remaining slots (e.g. "1 request left this month").

## UI surfaces

### `/me/shopping` (all users)
- **List:** each item with name, price/link, flag-summary badges
  (e.g. `🟡 low ×3  🔴 out ×1`), and a per-item control `None · Running low · Out`.
- **Requests:** pending requests with a vote button + count, price/link, and the
  user's own request status (including deny reason). A "Request an item" form
  (name, Jumbo URL, price) gated by remaining quota.

### `/admin/shopping` (admin)
- **Items:** table with add / edit / remove, flag detail, **Mark restocked**
  (clears flags).
- **Requests queue:** pending sorted by votes, **Approve** / **Deny (optional
  reason)**, plus resolved history.
- Pending-request count badge in the `/admin` nav.

### `/admin/settings`
Add the `shopping_requests_per_month` field next to `cost_per_lunch`.

## Code structure

Follow existing conventions:
- `lib/queries/shopping.ts` — reusable query functions (like the other query modules).
- Route handlers under `app/api/me/shopping/*` and `app/api/admin/shopping/*`.
- Server Components for `/me/shopping` and `/admin/shopping` pages.
- Schema additions in `drizzle/schema.ts`.

## Testing

One focused assert-based check (no framework) for the non-trivial logic:
- **Quota counting:** pending + approved count toward the limit; denied does not
  (refund); month boundary is respected.
- **Toggle idempotency:** flag upsert/delete and vote toggle behave correctly on
  repeat calls.

## Migration

Generate with `bun run db:generate`. Apply using the Neon-HTTP-direct workaround
(`bun run db:migrate` exits SIGHUP in this environment; run the generated SQL via
the Neon HTTP driver instead).

## Explicitly out of scope

- Jumbo price auto-fetch / scraping (manual link + price instead).
- Quantity / order tracking (flags cover "needs reordering").
- Item categories.
- Approve/deny emails to requesters (in-app status only).
- Activity-log integration for shopping events.
- A dedicated shopper role (admins only for now).
