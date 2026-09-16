'use client'

import { useState } from 'react'
import { Volume2, Sliders, Headphones, Disc3 } from 'lucide-react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useAmbientSoundStore } from '@/lib/stores/ambientSoundStore'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { AmbientMixerModal } from './AmbientMixerModal'
import SongPickerModal from '@/components/community/SongPickerModal'

interface DualAudioControlsProps {
  onHostChangeTrack?: (trackId: string) => void
}

export function DualAudioControls({ onHostChangeTrack }: DualAudioControlsProps) {
  const { currentTrack, isSoloMode, roomVolume, isHost, setIsSoloMode, setRoomVolume } =
    useStudyRoomStore()

  const { volumes, isPlaying: isAmbientPlaying } = useAmbientSoundStore()
  const { t } = useLanguage()

  const [isMixerOpen, setIsMixerOpen] = useState(false)
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false)

  const activeAmbientCount = Object.values(volumes).filter((v) => v > 0).length

  const handleSongConfirm = (reference: string) => {
    const cleanId = reference.includes(':') ? reference.split(':')[1] : reference
    onHostChangeTrack?.(cleanId)
    setIsSongPickerOpen(false)
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border-2 border-[#D4B08C] text-[#854D27] shadow-xs">
        {/* Kênh 1: Room BGM */}
        <div className="flex items-center gap-3 min-w-[220px] flex-1">
          {/* Vinyl Disc Icon */}
          <div className="relative p-2.5 rounded-xl bg-[#FAF0E6] border border-[#D4B08C] text-[#D95D39] shadow-xs flex-shrink-0">
            <Disc3
              size={22}
              className={currentTrack && !isSoloMode ? 'animate-spin' : ''}
              style={{ animationDuration: '8s' }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#854D27] truncate font-heading">
                {currentTrack?.name || t('studyWaitingDj')}
              </span>
              {isHost && (
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#FAF0E6] text-[#D95D39] border border-[#D4B08C] font-semibold flex-shrink-0 font-body">
                  {t('studyDjBadge')}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#854D27]/70 truncate mt-0.5 font-body">
              {currentTrack?.artistName || t('studyRoomBgm')}
            </div>
          </div>

          {/* Volume slider & Solo Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsSoloMode(!isSoloMode)}
              title={isSoloMode ? t('studyRoomBgm') : t('studySoloMuteRoom')}
              aria-label={isSoloMode ? t('studyRoomBgm') : t('studySoloMuteRoom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-xs cursor-pointer font-body ${
                isSoloMode
                  ? 'bg-[#FAF0E6] text-[#D95D39] border border-[#D95D39]'
                  : 'bg-[#FFF9F3] text-[#854D27] hover:bg-[#FAF0E6] border border-[#D4B08C]'
              }`}
            >
              <Headphones size={14} />
              <span className="hidden sm:inline">
                {isSoloMode ? t('studySoloMuteRoom') : t('studyRoomBgm')}
              </span>
            </button>

            {/* Slider âm lượng BGM */}
            <div className="hidden md:flex items-center gap-2 w-24">
              <Volume2 size={14} className="text-[#854D27]/60" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={isSoloMode}
                value={isSoloMode ? 0 : roomVolume}
                onChange={(e) => setRoomVolume(parseFloat(e.target.value))}
                aria-label={t('studyRoomBgm')}
                className="w-full h-1.5 bg-[#D4B08C]/40 rounded-lg appearance-none cursor-pointer accent-[#D95D39] disabled:opacity-30"
              />
            </div>

            {isHost && (
              <button
                type="button"
                onClick={() => setIsSongPickerOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D95D39] hover:bg-[#c44e2b] text-white active:scale-95 transition-all shadow-xs cursor-pointer font-body"
              >
                {t('studyChangeSong')}
              </button>
            )}
          </div>
        </div>

        {/* Kênh 2: Ambient Sound Trigger */}
        <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-[#D4B08C]/40 pt-2 sm:pt-0 sm:pl-3.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsMixerOpen(true)}
            aria-label={t('studyAmbientSounds')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 shadow-xs cursor-pointer font-body ${
              activeAmbientCount > 0 && isAmbientPlaying
                ? 'bg-[#EBF7F2] text-[#2E7D6F] border-[#2E7D6F]'
                : 'bg-[#FFF9F3] text-[#854D27] hover:bg-[#FAF0E6] border-[#D4B08C]'
            }`}
          >
            <Sliders size={14} className={activeAmbientCount > 0 && isAmbientPlaying ? 'text-[#2E7D6F]' : ''} />
            <span>{t('studyAmbientSounds')}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#D4B08C]/20 font-mono font-bold">
              {activeAmbientCount}
            </span>
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

