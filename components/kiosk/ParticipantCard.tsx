'use client'

import Image from 'next/image'
import { AvatarInitials } from '@/components/ui/avatar-initials'

interface Props {
  id: string
  name: string
  avatarUrl: string | null
  attending: boolean
  loading: boolean
  onToggle: (id: string) => void
}

export function ParticipantCard({ id, name, avatarUrl, attending, loading, onToggle }: Props) {
  return (
    <button
      onClick={() => onToggle(id)}
      disabled={loading}
      className={`
        relative flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-200
        select-none touch-manipulation active:scale-95
        ${attending
          ? 'bg-green-500/20 ring-4 ring-green-400 shadow-lg shadow-green-500/20'
          : 'bg-white/5 ring-2 ring-white/10 hover:ring-white/30'
        }
        ${loading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}
      `}
    >
      <div className="relative">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={96}
            height={96}
            className="rounded-full object-cover w-24 h-24"
          />
        ) : (
          <AvatarInitials name={name} className="w-24 h-24 text-3xl" />
        )}

        {attending && (
          <div className="absolute -bottom-1 -right-1 bg-green-400 rounded-full w-7 h-7 flex items-center justify-center shadow">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      <span className={`text-sm font-medium text-center leading-tight ${attending ? 'text-green-300' : 'text-white/80'}`}>
        {name}
      </span>
    </button>
  )
}
