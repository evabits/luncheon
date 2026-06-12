import { NextRequest, NextResponse } from 'next/server'
import { fetchMolliePayment } from '@/lib/mollie'
import { getPaymentLinkByMollieId, markPaymentLinkPaid } from '@/lib/queries/payment-links'
import { recordPayment } from '@/lib/queries/payments'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const params = new URLSearchParams(body)
  const paymentId = params.get('id')

  console.log('[mollie-webhook] received id:', paymentId)

  if (!paymentId) {
    console.log('[mollie-webhook] no id in body, skipping')
    return NextResponse.json({ ok: true })
  }

  const payment = await fetchMolliePayment(paymentId)
  console.log('[mollie-webhook] payment status:', payment?.status, '| _links:', JSON.stringify(payment?._links))

  if (!payment || payment.status !== 'paid') {
    console.log('[mollie-webhook] not paid yet, skipping')
    return NextResponse.json({ ok: true })
  }

  const paymentLinkHref = payment._links.paymentLink?.href
  console.log('[mollie-webhook] paymentLinkHref:', paymentLinkHref)

  if (!paymentLinkHref) {
    console.log('[mollie-webhook] no paymentLink in _links, skipping')
    return NextResponse.json({ ok: true })
  }

  const mollieId = paymentLinkHref.split('/').pop()
  console.log('[mollie-webhook] mollieId:', mollieId)

  if (!mollieId) return NextResponse.json({ ok: true })

  const link = await getPaymentLinkByMollieId(mollieId)
  console.log('[mollie-webhook] db link:', link ? `found (paid=${link.paid})` : 'not found')

  if (!link || link.paid) return NextResponse.json({ ok: true })

  await recordPayment(link.participantId, link.year, link.month, payment.amount.value, 'Mollie', paymentId)
  await markPaymentLinkPaid(mollieId)
  console.log('[mollie-webhook] recorded payment and marked link paid')

  return NextResponse.json({ ok: true })
}
