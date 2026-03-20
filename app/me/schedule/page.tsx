import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { participantFixedDays } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import { ScheduleClient } from './ScheduleClient'

export const dynamic = 'force-dynamic'

export default async function SchedulePage() {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) redirect('/me')

  const rows = await db
    .select({ dayOfWeek: participantFixedDays.dayOfWeek })
    .from(participantFixedDays)
    .where(eq(participantFixedDays.participantId, participantId))

  return <ScheduleClient initialDays={rows.map(r => r.dayOfWeek)} />
}
