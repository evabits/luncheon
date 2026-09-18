import { DateHeader } from '@/components/kiosk/DateHeader'
import { AvatarGrid } from '@/components/kiosk/AvatarGrid'
import { KioskTabs } from '@/components/kiosk/KioskTabs'
import { KioskShoppingList } from '@/components/kiosk/KioskShoppingList'
import { getOrCreateTodaySession, getSessionWithAttendance, getFixedDayParticipantIds } from '@/lib/queries/sessions'
import { getActiveParticipants } from '@/lib/queries/participants'
import { getKioskShoppingItems } from '@/lib/queries/shopping'

export const dynamic = 'force-dynamic'

export default async function KioskPage() {
  const [session, allParticipants, shoppingItems] = await Promise.all([
    getOrCreateTodaySession(),
    getActiveParticipants(),
    getKioskShoppingItems(),
  ])

  const [attending, fixedDayIds] = await Promise.all([
    getSessionWithAttendance(session.id),
    getFixedDayParticipantIds(session.date),
  ])

  const participants = allParticipants.map((p) => ({
    id: p.id,
    name: p.name,
    avatarUrl: p.avatarUrl,
    attending: attending.has(p.id),
    fixedDay: fixedDayIds.has(p.id),
    companyId: p.companyId ?? null,
    companyName: p.companyName ?? null,
  }))

  return (
    <main className="min-h-screen flex flex-col gap-8 p-8">
      <KioskTabs
        lunch={
          <div className="flex flex-col gap-8">
            <DateHeader />
            <AvatarGrid
              initialSession={{ id: session.id, date: session.date, cost: session.cost }}
              initialParticipants={participants}
            />
          </div>
        }
        shopping={<KioskShoppingList initialItems={shoppingItems} />}
      />
    </main>
  )
}
