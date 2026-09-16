'use client'

import { useState } from 'react'
import {
  Sparkles,
  LogOut,
  Share2,
  Check,
  Maximize2,
} from 'lucide-react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useRoomBgmSync } from '@/lib/hooks/useRoomBgmSync'
import { DualAudioControls } from './DualAudioControls'
import { DeskPresenceList } from './DeskPresenceList'
import { SilentCheerOverlay } from './SilentCheerOverlay'
import { ZenFocusModal } from './ZenFocusModal'
import { leaveStudyRoom, updateMemberStatus } from '@/lib/study/client'

interface StudyRoomViewProps {
  roomId: string
  onLeave: () => void
}

export function StudyRoomView({ roomId, onLeave }: StudyRoomViewProps) {
  const { currentRoom, userIdentifier, resetRoom } = useStudyRoomStore()
  const { changeRoomTrack, sendSilentCheer } = useRoomBgmSync(roomId)

  const [isZenOpen, setIsZenOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleLeave = async () => {
    if (confirm('Leave study room? / 勉強部屋から退出しますか？')) {
      await leaveStudyRoom(roomId, userIdentifier)
      resetRoom()
      onLeave()
    }
  }

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  const handleCycleComplete = async (mode: string, streakMinutes: number) => {
    await updateMemberStatus(roomId, userIdentifier, mode === 'focus' ? 'focusing' : 'short_break', streakMinutes)
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col gap-5 p-4 sm:p-6 text-stone-100">
      {/* Floating Silent Cheer Layer */}
      <SilentCheerOverlay />

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-stone-900/80 border border-white/10 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-300">
            <Sparkles size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-medium text-white truncate max-w-[200px] sm:max-w-md">
                {currentRoom?.name || 'Study Room'}
              </h1>
              {currentRoom?.is_private && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Private
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 truncate max-w-[250px] sm:max-w-md">
              {currentRoom?.description || 'Deep focus & tranquil atmosphere with friends'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Zen Mode Button */}
          <button
            type="button"
            onClick={() => setIsZenOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-pink-500/20 hover:bg-pink-500/30 active:scale-95 text-pink-200 border border-pink-500/40 backdrop-blur-md transition-all shadow-md"
          >
            <Maximize2 size={14} />
            <span>Zen Mode / 禅モード</span>
          </button>

          {/* Copy Share Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy Invite Link"
            aria-label="Copy Room Invite Link"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-stone-300 border border-white/10 transition-all"
          >
            {isCopied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
          </button>

          {/* Leave Button */}
          <button
            type="button"
            onClick={handleLeave}
            title="Leave Room"
            aria-label="Leave Study Room"
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 active:scale-95 text-stone-300 hover:text-rose-200 border border-white/10 hover:border-rose-500/30 transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Dual Audio Sovereignty Controls */}
      <DualAudioControls onHostChangeTrack={changeRoomTrack} />

      {/* Desk Presence & Silent Cheer */}
      <DeskPresenceList onSendCheer={sendSilentCheer} />

      {/* Zen Focus Fullscreen Modal */}
      <ZenFocusModal
        isOpen={isZenOpen}
        onClose={() => setIsZenOpen(false)}
        onCycleComplete={handleCycleComplete}
      />
    </div>
  )
}
