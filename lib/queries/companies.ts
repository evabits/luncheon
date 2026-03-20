import { db } from '../db'
import { companies } from '@/drizzle/schema'
import { eq, asc } from 'drizzle-orm'

export async function getCompanies() {
  return db.select().from(companies).orderBy(asc(companies.name))
}

export async function getCompanyById(id: string) {
  const [c] = await db.select().from(companies).where(eq(companies.id, id)).limit(1)
  return c ?? null
}
