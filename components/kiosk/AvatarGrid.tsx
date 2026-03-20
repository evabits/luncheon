'use client'

import { useState, useEffect, useCallback } from 'react'
import { ParticipantCard } from './ParticipantCard'

interface Participant {
  id: string
  name: string
  avatarUrl: string | null
  attending: boolean
}

interface Session {
  id: string
  date: string
  cost: string
}

interface Props {
  initialSession: Session
  initialParticipants: Participant[]
}

export function AvatarGrid({ initialSession, initialParticipants }: Props) {
  const [participants, setParticipants] = useState(initialParticipants)
  const [session, setSession] = useState(initialSession)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/kiosk/session')
      if (!res.ok) return
      const data = await res.json()
      setParticipants(data.participants)
      setSession(data.session)
    } catch {}
  }, [])

  // Poll every 30 seconds to stay in sync with other devices
  useEffect(() => {
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [refresh])

  async function toggleAttendance(participantId: string) {
    setLoadingIds((prev) => new Set(prev).add(participantId))

    // Optimistic update
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, attending: !p.attending } : p))
    )

    try {
      const res = await fetch('/api/kiosk/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId }),
      })
      if (!res.ok) throw new Error()
      const { attending } = await res.json()
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, attending } : p))
      )
    } catch {
      // Revert on failure
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, attending: !p.attending } : p))
      )
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(participantId)
        return next
      })
    }
  }

  const attending = participants.filter((p) => p.attending)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-white/60 text-sm">
        <span>{attending.length} joining today</span>
        <span>€{Number(session.cost).toFixed(2)} per person</span>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        {participants.map((p) => (
          <ParticipantCard
            key={p.id}
            {...p}
            loading={loadingIds.has(p.id)}
            onToggle={toggleAttendance}
          />
        ))}
      </div>
    </div>
  )
}
