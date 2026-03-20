import { auth } from '@/lib/auth'
import { getParticipantHistory } from '@/lib/queries/sessions'
import { redirect } from 'next/navigation'
import { HistoryClient } from './HistoryClient'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) redirect('/me')

  const history = await getParticipantHistory(participantId)

  return <HistoryClient history={history} />
}
