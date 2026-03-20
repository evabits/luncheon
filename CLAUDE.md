# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev              # Start dev server (Next.js)
bun run build        # Production build
bun run db:generate  # Generate Drizzle migrations from schema changes
bun run db:migrate   # Apply migrations (requires DATABASE_URL_UNPOOLED)
bun run db:studio    # Open Drizzle Studio (DB browser)
bun run seed         # Create initial admin user + config row
bunx tsc --noEmit    # Type check
```

## Environment Variables

Copy `.env.local` and fill in:
- `DATABASE_URL` — Neon pooled connection string
- `DATABASE_URL_UNPOOLED` — Neon direct connection (migrations only)
- `AUTH_SECRET` — random 32+ byte string (`openssl rand -base64 32`)
- `BLOB_READ_WRITE_TOKEN` — from Vercel Blob dashboard

## Architecture

### Three user surfaces, three auth paths

1. **Kiosk** (`/kiosk`) — iPad in the lunch area. No per-user login. The device authenticates once via a setup code (generated in Admin → Kiosk Devices), which issues a long-lived `HttpOnly` cookie (`kiosk_token`). The middleware validates this by hashing the cookie and looking it up in `kiosk_tokens`. Kiosk routes never touch NextAuth.

2. **Admin** (`/admin`) — NextAuth Credentials session with `role: "admin"` in the JWT. Redirected to after login.

3. **User portal** (`/me`) — NextAuth Credentials session with `role: "user"`. Each user is linked to a `participant` via `users.participant_id`. Admins create user accounts from the Participants page.

### Database schema (`drizzle/schema.ts`)

- `participants` — people who eat lunch. Soft-deleted (`is_active`), never hard-deleted (preserves attendance history).
- `lunch_sessions` — one row per calendar day, unique on `date`. Cost is **snapshotted at session creation** from config (not read at report time), so historical reports stay accurate after price changes.
- `attendances` — many-to-many between sessions and participants. Unique constraint prevents duplicates.
- `config` — single-row table with `cost_per_lunch`.
- `users` — admin and user accounts. `participant_id` links a user to their participant record.
- `kiosk_tokens` — SHA-256 hashed long-lived device tokens (1 year cookie).
- `kiosk_setup_codes` — short-lived (15 min) one-time codes for kiosk device activation.

### Key behaviors

- **Auto-create session**: `getOrCreateTodaySession()` is called on every kiosk page load and attendance toggle. The first person to tap creates today's session with the current config cost.
- **Toggle attendance**: Tapping an avatar on the kiosk toggles sign-in (tap again = sign out). POST `/api/kiosk/attendance` returns `{ attending: boolean }`.
- **Kiosk polling**: `AvatarGrid` polls `GET /api/kiosk/session` every 30 seconds to stay in sync across multiple devices.
- **Add forgotten lunch**: Users can retroactively add themselves to past sessions (last 30 days only) via `/me/add-lunch`. Validates the session is in the past before inserting.

### Data flow

```
middleware.ts
  → /kiosk/*   validates kiosk_token cookie via lib/kiosk-auth.ts
  → /admin/*   validates NextAuth session (role=admin)
  → /me/*      validates any NextAuth session

lib/auth.ts     NextAuth config — embeds role + participantId into JWT/session
lib/db.ts       Neon HTTP driver singleton (works on Edge runtime)
lib/queries/    Reusable DB query functions used by both Server Components and API routes
```

### Image uploads

Avatars are uploaded to Vercel Blob via `POST /api/admin/avatar`. The returned URL is stored in `participants.avatar_url`. The `next.config.ts` allows `*.public.blob.vercel-storage.com` as a remote image source for `next/image`.
