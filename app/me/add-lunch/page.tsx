import { auth } from '@/lib/auth'
import { getMissedSessions } from '@/lib/queries/sessions'
import { redirect } from 'next/navigation'
import { AddLunchClient } from '@/components/AddLunchClient'

export const dynamic = 'force-dynamic'

export default async function AddLunchPage() {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) redirect('/me')

  const missedSessions = await getMissedSessions(participantId, 30)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Forgotten Lunch</h2>
      <p className="text-gray-500 mb-6">
        Select a lunch session from the past 30 days that you forgot to sign in for.
      </p>
      <AddLunchClient missedSessions={missedSessions} />
    </div>
  )
}
