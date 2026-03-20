import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getParticipantHistory } from '@/lib/queries/sessions'
import { getParticipantPaymentHistory } from '@/lib/queries/payments'
import { BillingClient } from './BillingClient'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) redirect('/me')

  const [history, payments] = await Promise.all([
    getParticipantHistory(participantId),
    getParticipantPaymentHistory(participantId),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing</h1>
      <BillingClient history={history} payments={payments} />
    </div>
  )
}
