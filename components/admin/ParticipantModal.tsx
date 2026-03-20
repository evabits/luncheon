'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { AvatarInitials } from '@/components/ui/avatar-initials'

interface Participant {
  id: string
  name: string
  avatarUrl: string | null
  isActive: boolean
}

interface Props {
  participant: Participant | null
  onClose: () => void
  onSaved: () => void
}

export function ParticipantModal({ participant, onClose, onSaved }: Props) {
  const [name, setName] = useState(participant?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(participant?.avatarUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/avatar', { method: 'POST', body: form })
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      setAvatarUrl(url)
    } catch {
      setError('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    setError('')

    try {
      const url = participant
        ? `/api/admin/participants/${participant.id}`
        : '/api/admin/participants'
      const method = participant ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), avatarUrl: avatarUrl || null }),
      })

      if (!res.ok) throw new Error()
      onSaved()
    } catch {
      setError('Failed to save participant')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl border border-transparent dark:border-gray-800">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {participant ? 'Edit Participant' : 'Add Participant'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="relative cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name || 'Avatar'}
                  width={72}
                  height={72}
                  className="rounded-full w-18 h-18 object-cover"
                />
              ) : (
                <AvatarInitials name={name || '?'} className="w-16 h-16 text-xl" />
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs">{uploading ? '...' : 'Change'}</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                placeholder="Full name"
                required
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading || !name.trim()}
              className="flex-1 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 text-sm font-medium"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
