import { DateHeader } from '@/components/kiosk/DateHeader'
import { AvatarGrid } from '@/components/kiosk/AvatarGrid'
import { getOrCreateTodaySession, getSessionWithAttendance } from '@/lib/queries/sessions'
import { getActiveParticipants } from '@/lib/queries/participants'

export const dynamic = 'force-dynamic'

export default async function KioskPage() {
  const [session, allParticipants] = await Promise.all([
    getOrCreateTodaySession(),
    getActiveParticipants(),
  ])

  const attending = await getSessionWithAttendance(session.id)

  const participants = allParticipants.map((p) => ({
    id: p.id,
    name: p.name,
    avatarUrl: p.avatarUrl,
    attending: attending.has(p.id),
  }))

  return (
    <main className="min-h-screen flex flex-col gap-8 p-8">
      <DateHeader />
      <AvatarGrid
        initialSession={{ id: session.id, date: session.date, cost: session.cost }}
        initialParticipants={participants}
      />
    </main>
  )
}
