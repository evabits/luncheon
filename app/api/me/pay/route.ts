import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getParticipantOverallBalance } from '@/lib/queries/payments'
import { createMolliePaymentLink } from '@/lib/mollie'
import { insertPaymentLink } from '@/lib/queries/payment-links'

export const dynamic = 'force-dynamic'

// Lets a logged-in user pay their outstanding balance on demand from /me/billing.
export async function POST(req: NextRequest) {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.MOLLIE_API_KEY) return NextResponse.json({ error: 'Online payment is not configured' }, { status: 503 })

  const { cumulative_balance } = await getParticipantOverallBalance(participantId)
  const totalDue = Number(cumulative_balance)
  if (totalDue <= 0) return NextResponse.json({ error: 'You have no outstanding balance' }, { status: 400 })

  const now = new Date()
  const appUrl = process.env.APP_URL ?? `https://${req.headers.get('host') ?? ''}`
  const webhookUrl = `${appUrl}/api/webhooks/mollie`

  // ponytail: a fresh link per click. Harmless if a user makes a few — only one
  // can be paid and the webhook settles the balance. Add reuse if link spam matters.
  const { url, id } = await createMolliePaymentLink(totalDue, 'Lunch balance settlement', webhookUrl)
  await insertPaymentLink(id, participantId, now.getFullYear(), now.getMonth() + 1, cumulative_balance)

  return NextResponse.json({ url })
}
