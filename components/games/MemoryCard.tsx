'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface MemoryCardProps {
  emoji: string
  isFlipped: boolean
  isMatched: boolean
  index?: number
  onClick: () => void
}

export const MemoryCard = React.memo(function MemoryCard({
  emoji,
  isFlipped,
  isMatched,
  index = 0,
  onClick,
}: MemoryCardProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isFlipped || isMatched}
      whileHover={shouldReduceMotion || isFlipped ? undefined : { scale: 1.04 }}
      whileTap={shouldReduceMotion || isFlipped ? undefined : { scale: 0.96 }}
      aria-label={
        isFlipped
          ? `カード ${index + 1}: ${emoji}${isMatched ? '（一致）' : ''}`
          : `カード ${index + 1}: 裏面`
      }
      aria-pressed={isFlipped}
      className={`relative w-full aspect-square min-h-[44px] min-w-[44px] p-0 rounded-lg cursor-pointer select-none transition-all duration-200
        focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:ring-offset-2 focus-visible:outline-none
        ${isFlipped || isMatched ? 'cursor-default' : 'hover:shadow-md active:shadow-none'}
      `}
      style={{
        perspective: '1000px',
      }}
    >
      <motion.div
        animate={
          shouldReduceMotion
            ? { opacity: isFlipped ? 1 : 0.95 }
            : { rotateY: isFlipped ? 180 : 0 }
        }
        transition={{ duration: shouldReduceMotion ? 0.15 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full h-full relative"
        style={{
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        {/* カードの裏面（和紙・漆調の栗色背景） */}
        <div
          className={`absolute inset-0 rounded-lg flex items-center justify-center border-2 border-[#D4B08C] bg-[#854D27] text-[#FFF9F3] shadow-[2px_2px_0_#D4B08C] transition-opacity duration-200
            ${isFlipped && shouldReduceMotion ? 'hidden' : 'block'}
          `}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <div className="w-8 h-8 rounded-full border border-[#D4B08C]/40 flex items-center justify-center bg-[#854D27]/80 text-[#D4B08C] text-lg select-none">
            🎴
          </div>
        </div>

        {/* カードの表面（絵柄表示・和紙アイボリー背景） */}
        <div
          className={`absolute inset-0 rounded-lg flex items-center justify-center border-2 transition-all duration-200
            ${
              isMatched
                ? 'bg-[#E8F5E9] border-[#2E7D32] shadow-[0_0_12px_rgba(46,125,50,0.35)]'
                : 'bg-[#FFF9F3] border-[#D4B08C] shadow-[2px_2px_0_#D4B08C]'
            }
            ${!isFlipped && shouldReduceMotion ? 'hidden' : 'block'}
          `}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: shouldReduceMotion ? 'none' : 'rotateY(180deg)',
          }}
        >
          <span className="text-3xl sm:text-4xl filter drop-shadow-sm select-none" aria-hidden="true">
            {emoji}
          </span>
        </div>
      </motion.div>
    </motion.button>
  )
})
