import { getAllParticipants } from '@/lib/queries/participants'
import { ParticipantsClient } from '@/components/admin/ParticipantsClient'

export const dynamic = 'force-dynamic'

export default async function ParticipantsPage() {
  const participants = await getAllParticipants()
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Participants</h2>
      <ParticipantsClient initialParticipants={participants} />
    </div>
  )
}
