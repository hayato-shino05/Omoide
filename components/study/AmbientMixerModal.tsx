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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-200"
    >
      <div className="relative w-full max-w-md p-6 sm:p-7 rounded-2xl bg-[#FFF9F3] border-3 border-[#D4B08C] text-[#854D27] shadow-[8px_8px_0_#D4B08C]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#D4B08C] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FAF0E6] border border-[#D4B08C] text-[#D95D39]">
              <Sliders size={18} />
            </div>
            <h2 id="ambient-mixer-title" className="text-base font-bold text-[#854D27] font-heading">
              {t('studyAmbientMixerTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="p-2 rounded-xl text-[#854D27] hover:bg-[#FAF0E6] active:scale-95 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Presets */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-[#854D27] mb-2 font-body">
            {t('studyPresetMoods')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {AMBIENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-[#FAF0E6] active:scale-95 border-2 border-[#D4B08C] hover:border-[#854D27] text-xs text-[#854D27] transition-all text-center truncate font-semibold cursor-pointer shadow-2xs font-body"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Master Volume Slider */}
        <div className="mb-4 p-3.5 rounded-xl bg-white border-2 border-[#D4B08C] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#854D27] mb-2 font-body">
            <span className="font-bold flex items-center gap-1.5">
              <Volume2 size={14} className="text-[#D95D39]" />
              {t('studyMasterVolume')}
            </span>
            <span className="font-mono tabular-nums text-[#854D27] font-bold">
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
            className="w-full h-1.5 bg-[#D4B08C]/40 rounded-lg appearance-none cursor-pointer accent-[#D95D39]"
          />
        </div>

        {/* 4 Channels Sliders */}
        <div className="space-y-2.5 mb-5">
          {AMBIENT_SOUNDS.map((sound) => {
            const vol = volumes[sound.id] ?? 0
            const soundName = getSoundName(sound)
            return (
              <div key={sound.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/80 border border-[#D4B08C]/60 shadow-2xs">
                <div className="p-2 rounded-xl bg-[#FAF0E6] border border-[#D4B08C] flex-shrink-0">
                  {getIcon(sound.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1 font-body">
                    <span className="text-[#854D27] font-bold truncate">{soundName}</span>
                    <span className="font-mono tabular-nums text-[#854D27]/70 text-[11px] ml-2 font-semibold">
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
                    className="w-full h-1.5 bg-[#D4B08C]/40 rounded-lg appearance-none cursor-pointer accent-[#D95D39]"
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-[#D4B08C]">
          <button
            type="button"
            onClick={muteAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs text-[#854D27]/70 hover:text-[#854D27] hover:bg-[#FAF0E6] active:scale-95 transition-all font-semibold cursor-pointer font-body"
          >
            <RotateCcw size={14} />
            <span>{t('studyMuteAll')}</span>
          </button>

          <button
            type="button"
            onClick={togglePlaying}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer font-body ${
              isPlaying
                ? 'bg-[#D95D39] hover:bg-[#c44e2b] text-white'
                : 'bg-[#FFF9F3] text-[#854D27] hover:bg-[#FAF0E6] border border-[#D4B08C]'
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

