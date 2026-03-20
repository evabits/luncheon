import { db } from '../db'
import { participants, users } from '@/drizzle/schema'
import { eq, asc } from 'drizzle-orm'

export async function getActiveParticipants() {
  return db
    .select()
    .from(participants)
    .where(eq(participants.isActive, true))
    .orderBy(asc(participants.name))
}

export async function getAllParticipants() {
  return db.select().from(participants).orderBy(asc(participants.name))
}

export async function getParticipantById(id: string) {
  const [p] = await db.select().from(participants).where(eq(participants.id, id)).limit(1)
  return p ?? null
}
