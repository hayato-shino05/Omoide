'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from './Icon'

export interface Track {
  reference: string
  name: string
  artistName?: string
  duration?: number
  provider?: string
}

interface TrackSelectorProps {
  tracks: Track[]
  currentTrackId?: string
  onSelect: (trackReference: string) => void
  isPlaying?: boolean
}

export default function TrackSelector({
  tracks,
  currentTrackId,
  onSelect,
  isPlaying = false,
}: TrackSelectorProps) {
  const { t } = useLanguage()
  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds < 0) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
      <h4 className="text-sm font-medium text-white/70 mb-3">{t('chooseSong')}</h4>

      <ul role="listbox" aria-label={t('chooseSong')} className="space-y-1 max-h-60 overflow-y-auto">
        {tracks.map((track) => {
          const isActive = track.reference === currentTrackId

          return (
            <li key={track.reference}>
              <button
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => onSelect(track.reference)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 border border-white/20'
                    : 'hover:bg-white/10 border border-transparent'
                }`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-white/20' : 'bg-white/10'
                }`} aria-hidden="true">
                  {isActive && isPlaying ? (
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className="w-0.5 bg-white rounded-full animate-pulse"
                          style={{
                            height: `${[9, 14, 11][i - 1]}px`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </span>
                  ) : (
                    <Icon name="Music" size={14} />
                  )}
                </span>

                <span className="flex-1 text-left min-w-0">
                  <span className={`block text-sm truncate ${isActive ? 'text-white font-medium' : 'text-white/80'}`}>
                    {track.name}
                  </span>
                  {track.artistName && (
                    <span className="block text-xs text-white/55 truncate">{track.artistName}</span>
                  )}
                </span>

                {track.provider && (
                  <span className="text-[0.6rem] uppercase tracking-wide text-white/40 flex-shrink-0" aria-hidden="true">
                    {track.provider}
                  </span>
                )}

                <span className="text-xs text-white/50 flex-shrink-0 tabular-nums">
                  {formatDuration(track.duration)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {tracks.length === 0 && (
        <p className="text-white/50 text-sm text-center py-4">
          {t('noTracks')}
        </p>
      )}
    </div>
  )
}