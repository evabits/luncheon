import { NextRequest, NextResponse } from 'next/server'
import { fetchMolliePayment } from '@/lib/mollie'
import { getPaymentLinkByMollieId, markPaymentLinkPaid } from '@/lib/queries/payment-links'
import { recordPayment } from '@/lib/queries/payments'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const params = new URLSearchParams(body)
  const paymentId = params.get('id')

  if (!paymentId) return NextResponse.json({ ok: true })

  const payment = await fetchMolliePayment(paymentId)
  if (!payment || payment.status !== 'paid') return NextResponse.json({ ok: true })

  // Extract payment link ID from the payment's _links (e.g. ".../payment-links/pl_xxx")
  const paymentLinkHref = payment._links.paymentLink?.href
  if (!paymentLinkHref) return NextResponse.json({ ok: true })

  const mollieId = paymentLinkHref.split('/').pop()
  if (!mollieId) return NextResponse.json({ ok: true })

  const link = await getPaymentLinkByMollieId(mollieId)
  if (!link || link.paid) return NextResponse.json({ ok: true })

  await recordPayment(link.participantId, link.year, link.month, link.amount, 'Mollie')
  await markPaymentLinkPaid(mollieId)

  return NextResponse.json({ ok: true })
}
