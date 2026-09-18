'use client'

import { useState, useEffect } from 'react'
import { X, Check, RotateCcw, Sliders, Sparkles, BookOpen, Coffee } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import {
  type PomodoroDurations,
  DEFAULT_POMODORO_DURATIONS,
  POMODORO_PRESETS,
} from '@/types/study'

interface PomodoroSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentDurations: PomodoroDurations
  onSave: (newDurations: PomodoroDurations) => void
  onResetDefaults: () => void
}

export function PomodoroSettingsModal({
  isOpen,
  onClose,
  currentDurations,
  onSave,
  onResetDefaults,
}: PomodoroSettingsModalProps) {
  if (!isOpen) return null

  return (
    <PomodoroSettingsDialog
      isOpen={isOpen}
      onClose={onClose}
      currentDurations={currentDurations}
      onSave={onSave}
      onResetDefaults={onResetDefaults}
    />
  )
}

function PomodoroSettingsDialog({
  onClose,
  currentDurations,
  onSave,
  onResetDefaults,
}: PomodoroSettingsModalProps) {
  const { t } = useLanguage()

  const [focusMin, setFocusMin] = useState(currentDurations.focus)
  const [shortBreakMin, setShortBreakMin] = useState(currentDurations.short_break)
  const [longBreakMin, setLongBreakMin] = useState(currentDurations.long_break)

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleApplyPreset = (presetFocus: number, presetShort: number, presetLong: number) => {
    setFocusMin(presetFocus)
    setShortBreakMin(presetShort)
    setLongBreakMin(presetLong)
  }

  const handleSave = () => {
    onSave({
      focus: Math.max(1, Math.min(180, focusMin)),
      short_break: Math.max(1, Math.min(60, shortBreakMin)),
      long_break: Math.max(1, Math.min(90, longBreakMin)),
    })
    onClose()
  }

  const handleReset = () => {
    onResetDefaults()
    setFocusMin(DEFAULT_POMODORO_DURATIONS.focus)
    setShortBreakMin(DEFAULT_POMODORO_DURATIONS.short_break)
    setLongBreakMin(DEFAULT_POMODORO_DURATIONS.long_break)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pomodoro-settings-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm transition-all duration-200"
    >
      <div className="relative w-full max-w-md p-5 sm:p-7 rounded-2xl bg-[#FFF9F3] border-3 border-[#D4B08C] text-[#854D27] shadow-[8px_8px_0_#D4B08C] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#D4B08C]/40 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FAF0E6] border border-[#D4B08C] text-[#D95D39] shadow-xs">
              <Sliders size={18} />
            </div>
            <div>
              <h2 id="pomodoro-settings-title" className="text-base sm:text-lg font-bold font-heading">
                {t('studyPomodoroSettings')}
              </h2>
              <p className="text-xs text-[#854D27]/70 font-body">
                {t('studyPomodoroCustom')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-white hover:bg-[#FAF3EB] border border-[#D4B08C] text-[#854D27] transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section 1: Presets */}
        <div className="mb-5">
          <div className="text-xs font-bold text-[#854D27]/80 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#D95D39]" />
            <span>{t('studyPomodoroPresets')}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {POMODORO_PRESETS.map((preset) => {
              const isSelected =
                focusMin === preset.focus &&
                shortBreakMin === preset.short_break &&
                longBreakMin === preset.long_break

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.focus, preset.short_break, preset.long_break)}
                  className={`p-2.5 sm:p-3 rounded-xl text-left border-2 transition-all cursor-pointer text-xs font-body min-h-[44px] ${
                    isSelected
                      ? 'bg-[#D95D39] text-white border-[#854D27] shadow-[2px_2px_0_#854D27]'
                      : 'bg-white text-[#854D27] border-[#D4B08C] hover:bg-[#FAF3EB] shadow-xs'
                  }`}
                >
                  <div className="font-bold truncate">{t(preset.nameKey)}</div>
                  <div className={`text-[11px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#854D27]/70'}`}>
                    {preset.focus}/{preset.short_break}/{preset.long_break}m
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Section 2: Custom Durations Steppers */}
        <div className="space-y-3.5 mb-6">
          <div className="text-xs font-bold text-[#854D27]/80 uppercase tracking-wider">
            {t('studyPomodoroCustom')}
          </div>

          {/* Focus Duration */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D4B08C] shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-[#FAF0E6] text-[#D95D39]">
                <BookOpen size={16} />
              </div>
              <span className="text-xs font-bold text-[#854D27] truncate">
                {t('studyPomodoroFocusMinutes')}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setFocusMin((prev) => Math.max(1, prev - 5))}
                disabled={focusMin <= 1}
                aria-label="Decrease focus minutes"
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#FAF3EB] hover:bg-[#F3E7D8] text-[#854D27] font-bold text-sm border border-[#D4B08C] disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
              >
                -5
              </button>
              <input
                type="number"
                min={1}
                max={180}
                value={focusMin}
                onChange={(e) => setFocusMin(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
                aria-label={t('studyPomodoroFocusMinutes')}
                className="w-12 text-center text-sm font-bold font-mono text-[#854D27] bg-[#FAF0E6] border border-[#D4B08C] rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-[#D95D39]"
              />
              <button
                type="button"
                onClick={() => setFocusMin((prev) => Math.min(180, prev + 5))}
                disabled={focusMin >= 180}
                aria-label="Increase focus minutes"
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#FAF3EB] hover:bg-[#F3E7D8] text-[#854D27] font-bold text-sm border border-[#D4B08C] disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
              >
                +5
              </button>
            </div>
          </div>

          {/* Short Break Duration */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D4B08C] shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-[#FAF0E6] text-[#2E7D6F]">
                <Coffee size={16} />
              </div>
              <span className="text-xs font-bold text-[#854D27] truncate">
                {t('studyPomodoroShortBreakMinutes')}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShortBreakMin((prev) => Math.max(1, prev - 1))}
                disabled={shortBreakMin <= 1}
                aria-label="Decrease short break minutes"
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#FAF3EB] hover:bg-[#F3E7D8] text-[#854D27] font-bold text-sm border border-[#D4B08C] disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
              >
                -1
              </button>
              <input
                type="number"
                min={1}
                max={60}
                value={shortBreakMin}
                onChange={(e) => setShortBreakMin(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
                aria-label={t('studyPomodoroShortBreakMinutes')}
                className="w-12 text-center text-sm font-bold font-mono text-[#854D27] bg-[#FAF0E6] border border-[#D4B08C] rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-[#2E7D6F]"
              />
              <button
                type="button"
                onClick={() => setShortBreakMin((prev) => Math.min(60, prev + 1))}
                disabled={shortBreakMin >= 60}
                aria-label="Increase short break minutes"
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#FAF3EB] hover:bg-[#F3E7D8] text-[#854D27] font-bold text-sm border border-[#D4B08C] disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
              >
                +1
              </button>
            </div>
          </div>

          {/* Long Break Duration */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D4B08C] shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-[#FAF0E6] text-[#4A6572]">
                <Sparkles size={16} />
              </div>
              <span className="text-xs font-bold text-[#854D27] truncate">
                {t('studyPomodoroLongBreakMinutes')}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setLongBreakMin((prev) => Math.max(1, prev - 5))}
                disabled={longBreakMin <= 1}
                aria-label="Decrease long break minutes"
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#FAF3EB] hover:bg-[#F3E7D8] text-[#854D27] font-bold text-sm border border-[#D4B08C] disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
              >
                -5
              </button>
              <input
                type="number"
                min={1}
                max={90}
                value={longBreakMin}
                onChange={(e) => setLongBreakMin(Math.max(1, Math.min(90, Number(e.target.value) || 1)))}
                aria-label={t('studyPomodoroLongBreakMinutes')}
                className="w-12 text-center text-sm font-bold font-mono text-[#854D27] bg-[#FAF0E6] border border-[#D4B08C] rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-[#4A6572]"
              />
              <button
                type="button"
                onClick={() => setLongBreakMin((prev) => Math.min(90, prev + 5))}
                disabled={longBreakMin >= 90}
                aria-label="Increase long break minutes"
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#FAF3EB] hover:bg-[#F3E7D8] text-[#854D27] font-bold text-sm border border-[#D4B08C] disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
              >
                +5
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#D4B08C]/30">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#854D27]/75 hover:text-[#854D27] hover:bg-[#FAF3EB] border border-[#D4B08C]/50 transition-all cursor-pointer min-h-[44px]"
          >
            <RotateCcw size={14} />
            <span>{t('studyPomodoroResetDefault')}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#D95D39] hover:bg-[#C24E2B] text-white border-2 border-[#854D27] shadow-[2px_2px_0_#854D27] active:scale-95 transition-all cursor-pointer min-h-[44px]"
          >
            <Check size={16} />
            <span>{t('studyPomodoroSave')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
