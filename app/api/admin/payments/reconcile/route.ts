import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUnpaidPaymentLinks, markPaymentLinkPaid } from '@/lib/queries/payment-links'
import { recordPayment } from '@/lib/queries/payments'
import { fetchMolliePaymentLinkPayments } from '@/lib/mollie'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!process.env.MOLLIE_API_KEY) {
    return NextResponse.json({ error: 'Mollie not configured' }, { status: 400 })
  }

  const unpaidLinks = await getUnpaidPaymentLinks()

  let synced = 0
  let alreadyPaid = 0
  const errors: string[] = []

  for (const link of unpaidLinks) {
    try {
      const molliePayments = await fetchMolliePaymentLinkPayments(link.mollieId)
      const paidPayment = molliePayments.find((p) => p.status === 'paid')

      if (!paidPayment) continue

      const recorded = await recordPayment(
        link.participantId,
        link.year,
        link.month,
        paidPayment.amount.value,
        'Mollie',
        paidPayment.id,
      )

      if (recorded) {
        synced++
      } else {
        // recordPayment returned undefined — conflict, already recorded
        alreadyPaid++
      }

      await markPaymentLinkPaid(link.mollieId)
    } catch (err) {
      errors.push(`${link.mollieId}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({ synced, alreadyPaid, errors }, { status: errors.length > 0 ? 207 : 200 })
}
