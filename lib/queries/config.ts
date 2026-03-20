import { db } from '../db'
import { config } from '@/drizzle/schema'

export async function getConfig() {
  const [row] = await db.select().from(config).limit(1)
  return row ?? null
}
