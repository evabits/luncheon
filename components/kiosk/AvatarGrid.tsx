'use client'

import { useState, useEffect, useCallback } from 'react'
import { ParticipantCard } from './ParticipantCard'

interface Participant {
  id: string
  name: string
  avatarUrl: string | null
  attending: boolean
  fixedDay?: boolean
  companyId: string | null
  companyName: string | null
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
  const [activeTab, setActiveTab] = useState<string | null>(null) // null = All

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/kiosk/session')
      if (!res.ok) return
      const data = await res.json()
      setParticipants(data.participants)
      setSession(data.session)
    } catch {}
  }, [])

  useEffect(() => {
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [refresh])

  async function toggleAttendance(participantId: string) {
    setLoadingIds((prev) => new Set(prev).add(participantId))
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

  // Derive sorted unique companies
  const companies = Array.from(
    new Map(
      participants
        .filter((p) => p.companyId)
        .map((p) => [p.companyId!, p.companyName ?? p.companyId!])
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]))

  const showTabs = companies.length > 0

  const attending = participants.filter((p) => p.attending)

  // Participants to show based on active tab
  const visible =
    activeTab === null
      ? participants
      : participants.filter((p) => p.companyId === activeTab)

  // Groups for the grid: in "All" mode, group by company; in company tab, flat list
  const groups: { label: string | null; items: Participant[] }[] =
    activeTab !== null
      ? [{ label: null, items: visible }]
      : companies.length > 0
      ? [
          ...companies.map(([id, name]) => ({
            label: name,
            items: participants.filter((p) => p.companyId === id),
          })),
          ...(participants.some((p) => !p.companyId)
            ? [{ label: 'Other', items: participants.filter((p) => !p.companyId) }]
            : []),
        ]
      : [{ label: null, items: visible }]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-white/60 text-sm">
        <span>{attending.length} joining today</span>
        <span>€{Number(session.cost).toFixed(2)} per person</span>
      </div>

      {showTabs && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === null
                ? 'bg-white text-gray-950'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            All
          </button>
          {companies.map(([id, name]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-white text-gray-950'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {groups.map((group, i) => (
          <div key={i}>
            {group.label && (
              <div className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">
                {group.label}
              </div>
            )}
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              {group.items.map((p) => (
                <ParticipantCard
                  key={p.id}
                  {...p}
                  loading={loadingIds.has(p.id)}
                  onToggle={toggleAttendance}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
