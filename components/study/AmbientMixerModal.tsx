'use client'

import { useEffect } from 'react'
import { CloudRain, Coffee, Wind, Flame, Volume2, VolumeX, RotateCcw, X, Sliders } from 'lucide-react'
import { useAmbientSoundStore } from '@/lib/stores/ambientSoundStore'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { AMBIENT_SOUNDS, AMBIENT_PRESETS } from '@/lib/audio/ambientSources'
import type { AmbientSoundType } from '@/types/study'

interface AmbientMixerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AmbientMixerModal({ isOpen, onClose }: AmbientMixerModalProps) {
  const {
    volumes,
    masterVolume,
    isPlaying,
    setVolume,
    setMasterVolume,
    togglePlaying,
    applyPreset,
    muteAll,
  } = useAmbientSoundStore()
  const { t } = useLanguage()

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getIcon = (id: AmbientSoundType) => {
    switch (id) {
      case 'rain':
        return <CloudRain className="text-sky-400" size={18} />
      case 'cafe':
        return <Coffee className="text-amber-400" size={18} />
      case 'wind_chime':
        return <Wind className="text-emerald-400" size={18} />
      case 'fireplace':
        return <Flame className="text-rose-400" size={18} />
    }
  }

  const getSoundName = (sound: typeof AMBIENT_SOUNDS[number]) => {
    return t(sound.nameKey) || sound.defaultName
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ambient-mixer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all duration-200"
    >
      <div className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-stone-900/95 border border-white/15 text-stone-100 shadow-[0_16px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <Sliders size={18} />
            </div>
            <h2 id="ambient-mixer-title" className="text-sm sm:text-base font-medium text-white">
              {t('studyAmbientMixerTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-white/10 active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Presets */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-stone-300 mb-2">
            {t('studyPresetMoods')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {AMBIENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-amber-500/30 text-xs text-stone-200 hover:text-white transition-all text-center truncate font-medium"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Master Volume Slider */}
        <div className="mb-5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between text-xs text-stone-200 mb-2">
            <span className="font-medium flex items-center gap-1.5">
              <Volume2 size={14} className="text-amber-400" />
              {t('studyMasterVolume')}
            </span>
            <span className="font-mono tabular-nums text-stone-300 font-medium">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            aria-label={t('studyMasterVolume')}
            className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* 4 Channels Sliders */}
        <div className="space-y-3.5 mb-6">
          {AMBIENT_SOUNDS.map((sound) => {
            const vol = volumes[sound.id] ?? 0
            const soundName = getSoundName(sound)
            return (
              <div key={sound.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex-shrink-0">
                  {getIcon(sound.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-stone-200 font-medium truncate">{soundName}</span>
                    <span className="font-mono tabular-nums text-stone-400 text-[11px] ml-2">
                      {Math.round(vol * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={vol}
                    onChange={(e) => setVolume(sound.id, parseFloat(e.target.value))}
                    aria-label={soundName}
                    className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-stone-300 hover:accent-amber-400 transition-colors"
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={muteAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs text-stone-400 hover:text-stone-200 hover:bg-white/10 active:scale-95 transition-all font-medium"
          >
            <RotateCcw size={14} />
            <span>{t('studyMuteAll')}</span>
          </button>

          <button
            type="button"
            onClick={togglePlaying}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium active:scale-95 transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40 hover:bg-amber-500/35'
                : 'bg-white/10 text-stone-300 hover:bg-white/15 border border-white/15'
            }`}
          >
            {isPlaying ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{isPlaying ? t('studyPlaying') : t('studyPaused')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

