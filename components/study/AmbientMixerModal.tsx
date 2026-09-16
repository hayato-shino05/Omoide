'use client'

import { CloudRain, Coffee, Wind, Flame, Volume2, VolumeX, RotateCcw, X } from 'lucide-react'
import { useAmbientSoundStore } from '@/lib/stores/ambientSoundStore'
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ambient-mixer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-stone-900/95 border border-white/10 text-stone-100 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Volume2 className="text-pink-400" size={20} />
            <h2 id="ambient-mixer-title" className="text-base font-medium">
              Ambient Sounds / 環境音
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close ambient mixer"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Presets */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-stone-400 mb-2">Preset Moods / プリセット</label>
          <div className="grid grid-cols-3 gap-2">
            {AMBIENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-stone-300 hover:text-white transition-all text-center truncate"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Master Volume Slider */}
        <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center justify-between text-xs text-stone-300 mb-1.5">
            <span className="font-medium">Master Volume / マスター音量</span>
            <span className="font-mono text-stone-400">{Math.round(masterVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
          />
        </div>

        {/* 4 Channels Sliders */}
        <div className="space-y-4 mb-6">
          {AMBIENT_SOUNDS.map((sound) => {
            const vol = volumes[sound.id] ?? 0
            return (
              <div key={sound.id} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  {getIcon(sound.id)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-stone-200">{sound.defaultName}</span>
                    <span className="font-mono text-stone-400">{Math.round(vol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={vol}
                    onChange={(e) => setVolume(sound.id, parseFloat(e.target.value))}
                    className="w-full h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-stone-300"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-stone-400 hover:text-stone-200 hover:bg-white/5 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Mute All / リセット</span>
          </button>

          <button
            type="button"
            onClick={togglePlaying}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isPlaying
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                : 'bg-white/10 text-stone-300 hover:bg-white/20 border border-white/10'
            }`}
          >
            {isPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{isPlaying ? 'Playing / 再生中' : 'Paused / 停止中'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
