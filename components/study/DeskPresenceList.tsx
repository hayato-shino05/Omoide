'use client'

import { Users, Flame } from 'lucide-react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import type { CheerType } from '@/types/study'

interface DeskPresenceListProps {
  onSendCheer: (cheerType: CheerType) => void
}

export function DeskPresenceList({ onSendCheer }: DeskPresenceListProps) {
  const { members, userIdentifier } = useStudyRoomStore()

  const cheerButtons: { type: CheerType; label: string; icon: string }[] = [
    { type: 'coffee', label: 'Coffee', icon: '☕' },
    { type: 'fire', label: 'Fire', icon: '🔥' },
    { type: 'sparkle', label: 'Sparkle', icon: '✨' },
    { type: 'book', label: 'Study', icon: '📖' },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'focusing':
        return <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
      case 'short_break':
      case 'long_break':
        return <span className="w-2 h-2 rounded-full bg-sky-400" />
      default:
        return <span className="w-2 h-2 rounded-full bg-stone-500" />
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-stone-900/70 border border-white/10 backdrop-blur-md text-stone-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-pink-400" />
          <span className="text-xs font-medium text-stone-200">
            Study Desks / 勉強机 ({members.length})
          </span>
        </div>

        {/* Silent Cheer Bar */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-stone-400 mr-1 hidden sm:inline">Cheer:</span>
          {cheerButtons.map((btn) => (
            <button
              key={btn.type}
              type="button"
              onClick={() => onSendCheer(btn.type)}
              title={`Send ${btn.label}`}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 border border-white/5 text-sm transition-all shadow-sm"
            >
              {btn.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách Desks */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
        {members.map((member) => {
          const isMe = member.user_identifier === userIdentifier
          return (
            <div
              key={member.user_identifier}
              className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                isMe
                  ? 'bg-pink-500/10 border-pink-500/30'
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              {/* Avatar + Status dot */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-stone-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-stone-200 uppercase overflow-hidden">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    member.display_name.substring(0, 2)
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5">
                  {getStatusBadge(member.focus_status)}
                </div>
              </div>

              {/* Tên & Streak */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-stone-200 truncate flex items-center gap-1">
                  <span>{member.display_name}</span>
                  {isMe && <span className="text-[10px] text-pink-400 font-normal">(You)</span>}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-stone-400">
                  <Flame size={10} className="text-amber-400" />
                  <span>{member.current_streak_minutes || 0}m streak</span>
                </div>
              </div>
            </div>
          )
        })}

        {members.length === 0 && (
          <div className="col-span-full py-6 text-center text-xs text-stone-500">
            No study partners yet. Share room code or invite friends!
          </div>
        )}
      </div>
    </div>
  )
}
