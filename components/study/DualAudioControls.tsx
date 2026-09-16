'use client'

import { useState } from 'react'
import { Volume2, Sliders, Headphones, Disc3 } from 'lucide-react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useAmbientSoundStore } from '@/lib/stores/ambientSoundStore'
import { AmbientMixerModal } from './AmbientMixerModal'
import SongPickerModal from '@/components/community/SongPickerModal'

interface DualAudioControlsProps {
  onHostChangeTrack?: (trackId: string) => void
}

export function DualAudioControls({ onHostChangeTrack }: DualAudioControlsProps) {
  const { currentTrack, isSoloMode, roomVolume, isHost, setIsSoloMode, setRoomVolume } =
    useStudyRoomStore()

  const { volumes, isPlaying: isAmbientPlaying } = useAmbientSoundStore()

  const [isMixerOpen, setIsMixerOpen] = useState(false)
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false)

  const activeAmbientCount = Object.values(volumes).filter((v) => v > 0).length

  const handleSongConfirm = (reference: string) => {
    // Reference format có thể là 'omoide:track_id' hoặc 'jamendo:track_id' hoặc track_id thuần
    const cleanId = reference.includes(':') ? reference.split(':')[1] : reference
    onHostChangeTrack?.(cleanId)
    setIsSongPickerOpen(false)
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-stone-900/80 border border-white/10 backdrop-blur-md text-stone-100">
        {/* Kênh 1: Room BGM */}
        <div className="flex items-center gap-3 min-w-[200px] flex-1">
          <div className="relative p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300">
            <Disc3 size={20} className={currentTrack && !isSoloMode ? 'animate-spin' : ''} style={{ animationDuration: '8s' }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-stone-200 truncate">
                {currentTrack?.name || 'Waiting for DJ / 待機中...'}
              </span>
              {isHost && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  DJ / Host
                </span>
              )}
            </div>
            <div className="text-[11px] text-stone-400 truncate">
              {currentTrack?.artistName || 'Room BGM'}
            </div>
          </div>

          {/* Volume slider & Solo Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSoloMode(!isSoloMode)}
              title={isSoloMode ? 'Bật lại BGM phòng' : 'Listen Solo (Tắt BGM phòng)'}
              aria-label={isSoloMode ? 'Unmute Room BGM' : 'Listen Solo (Mute Room BGM)'}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isSoloMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/5 text-stone-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              <Headphones size={13} />
              <span className="hidden sm:inline">{isSoloMode ? 'Solo Mode' : 'Room BGM'}</span>
            </button>

            <div className="hidden md:flex items-center gap-1.5 w-20">
              <Volume2 size={13} className="text-stone-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={isSoloMode}
                value={isSoloMode ? 0 : roomVolume}
                onChange={(e) => setRoomVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-pink-500 disabled:opacity-30"
              />
            </div>

            {isHost && (
              <button
                type="button"
                onClick={() => setIsSongPickerOpen(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 transition-all"
              >
                Change Song
              </button>
            )}
          </div>
        </div>

        {/* Kênh 2: Ambient Sound Trigger */}
        <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3">
          <button
            type="button"
            onClick={() => setIsMixerOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              activeAmbientCount > 0 && isAmbientPlaying
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm'
                : 'bg-white/5 text-stone-300 hover:bg-white/10 border-white/10'
            }`}
          >
            <Sliders size={14} />
            <span>Ambient Sounds ({activeAmbientCount})</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <AmbientMixerModal isOpen={isMixerOpen} onClose={() => setIsMixerOpen(false)} />

      {isHost && (
        <SongPickerModal
          isOpen={isSongPickerOpen}
          onClose={() => setIsSongPickerOpen(false)}
          onConfirm={handleSongConfirm}
          initialValue={currentTrack?.id}
        />
      )}
    </>
  )
}
