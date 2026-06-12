/**
 * Adds mollie_payment_id column to payments table.
 * Run with: bun scripts/migrate-mollie-payment-id.ts
 */

import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

async function run() {
  await db.execute(sql`
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS mollie_payment_id text;
  `)
  await db.execute(sql`
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_mollie_payment_id_unique;
  `)
  await db.execute(sql`
    ALTER TABLE payments ADD CONSTRAINT payments_mollie_payment_id_unique UNIQUE (mollie_payment_id);
  `)
  console.log('✓ mollie_payment_id column added to payments')
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
