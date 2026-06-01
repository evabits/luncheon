import { auth } from '@/lib/auth'
import { getSkipLunchData } from '@/lib/queries/sessions'
import { redirect } from 'next/navigation'
import { SkipLunchClient } from '@/components/SkipLunchClient'

export const dynamic = 'force-dynamic'

export default async function SkipLunchPage() {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) redirect('/me')

  const { upcoming, scheduled } = await getSkipLunchData(participantId)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Skip a Lunch Day</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Opt out of automatic sign-in for a specific upcoming day.
      </p>
      <SkipLunchClient upcoming={upcoming} scheduled={scheduled} />
    </div>
  )
}
