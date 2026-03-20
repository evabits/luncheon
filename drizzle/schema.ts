import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  numeric,
  unique,
} from 'drizzle-orm/pg-core'

export const participants = pgTable('participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash'),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  participantId: uuid('participant_id').references(() => participants.id),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const lunchSessions = pgTable('lunch_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull().unique(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
})

export const attendances = pgTable(
  'attendances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => lunchSessions.id, { onDelete: 'cascade' }),
    participantId: uuid('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    signedInAt: timestamp('signed_in_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.sessionId, t.participantId)]
)

export const config = pgTable('config', {
  id: uuid('id').primaryKey().defaultRandom(),
  costPerLunch: numeric('cost_per_lunch', { precision: 10, scale: 2 }).notNull().default('85.00'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const kioskTokens = pgTable('kiosk_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: text('token_hash').notNull().unique(),
  label: text('label'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsed: timestamp('last_used', { withTimezone: true }),
})

export const oauthAccounts = pgTable('oauth_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.provider, t.providerAccountId)])

// Temporary setup codes for kiosk device activation (short-lived)
export const kioskSetupCodes = pgTable('kiosk_setup_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  label: text('label'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
})
