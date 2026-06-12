import { NextRequest, NextResponse } from 'next/server'
import { fetchMolliePaymentLinkPayments } from '@/lib/mollie'
import { getPaymentLinkByMollieId, markPaymentLinkPaid } from '@/lib/queries/payment-links'
import { recordPayment } from '@/lib/queries/payments'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const params = new URLSearchParams(body)
  const id = params.get('id')

  console.log('[mollie-webhook] received id:', id)

  if (!id || !id.startsWith('pl_')) {
    console.log('[mollie-webhook] not a payment link id, skipping')
    return NextResponse.json({ ok: true })
  }

  const link = await getPaymentLinkByMollieId(id)
  console.log('[mollie-webhook] db link:', link ? `found (paid=${link.paid})` : 'not found')

  if (!link || link.paid) return NextResponse.json({ ok: true })

  const molliePayments = await fetchMolliePaymentLinkPayments(id)
  const paidPayment = molliePayments.find((p) => p.status === 'paid')
  console.log('[mollie-webhook] mollie payments count:', molliePayments.length, '| paid:', paidPayment?.id ?? 'none')

  if (!paidPayment) return NextResponse.json({ ok: true })

  await recordPayment(link.participantId, link.year, link.month, paidPayment.amount.value, 'Mollie', paidPayment.id)
  await markPaymentLinkPaid(id)
  console.log('[mollie-webhook] recorded payment', paidPayment.id, 'amount:', paidPayment.amount.value)

  return NextResponse.json({ ok: true })
}
