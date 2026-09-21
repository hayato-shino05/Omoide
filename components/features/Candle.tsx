'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface CandleProps {
  isBlown: boolean
  delay?: number
  onBlown?: () => void
}

// ろうそくコンポーネント
export function Candle({ isBlown, delay = 0 }: CandleProps) {
  return (
    <div className="relative w-2 h-8">
      {/* ろうそく本体 */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay, duration: 0.3 }}
        className="absolute bottom-0 w-full h-full bg-gradient-to-b from-yellow-200 to-yellow-400 rounded-t-sm"
        style={{
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* 炎 */}
      <AnimatePresence>
        {!isBlown && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute -top-4 left-1/2 -translate-x-1/2"
          >
            <Flame />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 煙エフェクト */}
      <AnimatePresence>
        {isBlown && (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0.7, y: 0 }}
                animate={{
                  scale: [0, 1, 2],
                  opacity: [0.7, 0.4, 0],
                  y: [0, -20, -40],
                  x: [(((i * 37) % 100) / 100 - 0.5) * 10, (((i * 61) % 100) / 100 - 0.5) * 20],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  ease: 'easeOut',
                }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-400 rounded-full blur-sm"
                style={{ willChange: 'transform, opacity' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function Flame() {
  return (
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        y: [0, -2, 0],
      }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="relative w-3 h-5"
      style={{ willChange: 'transform' }}
    >
      {/* 外側の炎 */}
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-t from-orange-500 via-yellow-400 to-yellow-200"
        style={{
          filter: 'blur(1px)',
          boxShadow: '0 0 15px rgba(255, 107, 107, 0.9)',
        }}
      />
      {/* 内側の炎 */}
      <motion.div
        animate={{
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-1 rounded-full bg-gradient-to-t from-yellow-300 to-white"
      />
    </motion.div>
  )
}
