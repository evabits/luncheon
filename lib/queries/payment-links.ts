import { db } from '../db'
import { paymentLinks } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'

export async function getUnpaidPaymentLinks() {
  return db
    .select()
    .from(paymentLinks)
    .where(eq(paymentLinks.paid, false))
}

export async function insertPaymentLink(
  mollieId: string,
  participantId: string,
  year: number,
  month: number,
  amount: string,
) {
  await db.insert(paymentLinks).values({ mollieId, participantId, year, month, amount }).onConflictDoNothing()
}

export async function getPaymentLinkByMollieId(mollieId: string) {
  const [row] = await db.select().from(paymentLinks).where(eq(paymentLinks.mollieId, mollieId))
  return row ?? null
}

export async function markPaymentLinkPaid(mollieId: string) {
  await db.update(paymentLinks).set({ paid: true }).where(eq(paymentLinks.mollieId, mollieId))
}
