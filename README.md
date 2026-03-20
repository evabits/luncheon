# Luncheon

A lunch tracking app for small teams. Participants sign in on a shared kiosk (iPad), and admins can view monthly attendance reports and costs.

## Features

- **Kiosk** — shared device in the lunch area; participants tap their avatar to sign in/out
- **Admin panel** — monthly overview, participant management, kiosk device setup
- **User portal** — individuals can view their own history and retroactively add missed lunches
- **Cost tracking** — configurable cost per lunch; snapshotted at session creation for accurate historical reports

## Tech stack

- [Next.js](https://nextjs.org) (App Router)
- [Drizzle ORM](https://orm.drizzle.team) + [Neon](https://neon.tech) (PostgreSQL)
- [NextAuth.js](https://authjs.dev) (Credentials provider)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (avatar images)
- [Tailwind CSS](https://tailwindcss.com)

## Getting started

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DATABASE_URL_UNPOOLED` | Neon direct connection (used for migrations) |
| `AUTH_SECRET` | Random 32+ byte string (`openssl rand -base64 32`) |
| `BLOB_READ_WRITE_TOKEN` | From Vercel Blob dashboard |

### 3. Run migrations and seed

```bash
bun run db:migrate   # Apply schema migrations
bun run seed         # Create initial admin user + config row
```

### 4. Start the dev server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
bun dev              # Start dev server
bun run build        # Production build
bun run db:generate  # Generate migrations from schema changes
bun run db:migrate   # Apply migrations
bun run db:studio    # Open Drizzle Studio (DB browser)
bun run seed         # Create initial admin user + config row
bunx tsc --noEmit    # Type check
```

## User surfaces

| Surface | URL | Auth |
|---|---|---|
| Kiosk | `/kiosk` | Long-lived device token (set up via Admin → Kiosk Devices) |
| Admin | `/admin` | Email/password, role `admin` |
| User portal | `/me` | Email/password, role `user` |

## Deployment

The app is designed to deploy on [Vercel](https://vercel.com) with a Neon database and Vercel Blob storage. Run migrations against the production database before deploying:

```bash
DATABASE_URL_UNPOOLED=<prod-url> bun run db:migrate
```
