import { NextRequest, NextResponse } from 'next/server'
import { getPaymentLinkByMollieId } from '@/lib/queries/payment-links'
import { fetchMolliePaymentLink } from '@/lib/mollie'

export const dynamic = 'force-dynamic'

// Bounces an email recipient to the Mollie checkout via our own domain, so the
// email links to a domain people recognise instead of straight to mollie.com.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const appUrl = process.env.APP_URL ?? `https://${req.headers.get('host') ?? ''}`
  const fallback = `${appUrl}/me/billing`

  // Only redirect to links we actually issued — avoids being an open redirector.
  if (!id?.startsWith('pl_')) return NextResponse.redirect(fallback)
  const link = await getPaymentLinkByMollieId(id)
  if (!link) return NextResponse.redirect(fallback)

  const mollie = await fetchMolliePaymentLink(id)
  return NextResponse.redirect(mollie?.url ?? fallback)
}
