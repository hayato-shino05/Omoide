'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'

interface BlowButtonProps {
  onClick: () => void
  disabled?: boolean
  allCandlesBlown?: boolean
}

// ろうそくを吹くボタンコンポーネント
export function BlowButton({ onClick, disabled, allCandlesBlown }: BlowButtonProps) {
  const { t } = useLanguage()

  if (allCandlesBlown) {
    return null
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.5 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className="relative min-h-12 px-8 py-3.5 bg-gradient-to-r from-[#D95D39] via-[#C64C28] to-[#854D27] hover:brightness-110 text-lg sm:text-xl font-bold rounded-full shadow-xl border-2 border-[#D4B08C]/80 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
    >
      {/* 和紙の風をイメージした光沢エフェクト */}
      <motion.div
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          repeatDelay: 1.2,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
      />

      <span
        className="relative z-10 inline-flex items-center gap-2 font-black tracking-wide"
        style={{ color: '#FFFDF9', WebkitTextFillColor: '#FFFDF9' }}
      >
        <Icon name="Wind" size={20} />
        {t('blowCandles')}
      </span>
    </motion.button>
  )
}
