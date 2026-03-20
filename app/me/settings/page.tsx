import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getParticipantById } from '@/lib/queries/participants'
import { getCompanies } from '@/lib/queries/companies'
import { SettingsClient } from '@/app/me/settings/SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const user = session.user as any
  const participantId = user.participantId

  const [participant, companies] = await Promise.all([
    participantId ? getParticipantById(participantId) : null,
    getCompanies(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
      <SettingsClient
        currentCompanyId={participant?.companyId ?? null}
        companies={companies}
      />
    </div>
  )
}
