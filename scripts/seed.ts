/**
 * Run with: bun scripts/seed.ts
 * Creates the initial admin user and default config.
 */

import { db } from '../lib/db'
import { users, config } from '../drizzle/schema'
import bcrypt from 'bcryptjs'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123'

async function seed() {
  console.log('Seeding database...')

  // Create default config
  await db.insert(config).values({ costPerLunch: '85.00' }).onConflictDoNothing()
  console.log('✓ Config created (€85.00 per lunch)')

  // Create admin user
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
  await db
    .insert(users)
    .values({ email: ADMIN_EMAIL, passwordHash, role: 'admin' })
    .onConflictDoNothing()
  console.log(`✓ Admin user created: ${ADMIN_EMAIL}`)

  console.log('\nDone! You can now log in at /login')
}

seed().catch(console.error)
