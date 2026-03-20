'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AvatarInitials } from '@/components/ui/avatar-initials'
import { ParticipantModal } from './ParticipantModal'
import { CreateUserModal } from './CreateUserModal'

interface Participant {
  id: string
  name: string
  avatarUrl: string | null
  isActive: boolean
  createdAt: Date
}

export function ParticipantsClient({ initialParticipants }: { initialParticipants: Participant[] }) {
  const [participants, setParticipants] = useState(initialParticipants)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [creatingUserFor, setCreatingUserFor] = useState<Participant | null>(null)

  async function refresh() {
    const res = await fetch('/api/admin/participants')
    const data = await res.json()
    setParticipants(data)
  }

  async function toggleActive(p: Participant) {
    await fetch(`/api/admin/participants/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    })
    await refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          + Add Participant
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Participant</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {participants.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.avatarUrl ? (
                      <Image
                        src={p.avatarUrl}
                        alt={p.name}
                        width={36}
                        height={36}
                        className="rounded-full w-9 h-9 object-cover"
                      />
                    ) : (
                      <AvatarInitials name={p.name} className="w-9 h-9 text-sm" />
                    )}
                    <span className={`font-medium ${p.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                      {p.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingParticipant(p)}
                      className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setCreatingUserFor(p)}
                      className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                    >
                      Create login
                    </button>
                    <button
                      onClick={() => toggleActive(p)}
                      className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
                    >
                      {p.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showAddModal || editingParticipant) && (
        <ParticipantModal
          participant={editingParticipant}
          onClose={() => {
            setShowAddModal(false)
            setEditingParticipant(null)
          }}
          onSaved={() => {
            setShowAddModal(false)
            setEditingParticipant(null)
            refresh()
          }}
        />
      )}

      {creatingUserFor && (
        <CreateUserModal
          participant={creatingUserFor}
          onClose={() => setCreatingUserFor(null)}
        />
      )}
    </>
  )
}
