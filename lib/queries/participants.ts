import { db } from '../db'
import { participants, companies } from '@/drizzle/schema'
import { eq, asc } from 'drizzle-orm'

export async function getActiveParticipants() {
  return db
    .select({
      id: participants.id,
      name: participants.name,
      avatarUrl: participants.avatarUrl,
      isActive: participants.isActive,
      companyId: participants.companyId,
      companyName: companies.name,
      createdAt: participants.createdAt,
    })
    .from(participants)
    .leftJoin(companies, eq(participants.companyId, companies.id))
    .where(eq(participants.isActive, true))
    .orderBy(asc(participants.name))
}

export async function getAllParticipants() {
  return db
    .select({
      id: participants.id,
      name: participants.name,
      avatarUrl: participants.avatarUrl,
      isActive: participants.isActive,
      companyId: participants.companyId,
      companyName: companies.name,
      createdAt: participants.createdAt,
    })
    .from(participants)
    .leftJoin(companies, eq(participants.companyId, companies.id))
    .orderBy(asc(participants.name))
}

export async function getParticipantById(id: string) {
  const [p] = await db.select().from(participants).where(eq(participants.id, id)).limit(1)
  return p ?? null
}
