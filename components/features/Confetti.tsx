'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiProps {
  active: boolean
  count?: number
}

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  rotation: number
  size: number
}

// 紙吹雪コンポーネント
export function Confetti({ active, count = 50 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (active) {
      const colors = [
        '#f94144',
        '#f3722c',
        '#f8961e',
        '#f9c74f',
        '#90be6d',
        '#43aa8b',
        '#577590',
        '#ff99c8',
        '#9b5de5',
        '#00bbf9',
      ]

      const spawnRaf = requestAnimationFrame(() => {
        const newPieces = Array.from({ length: count }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
          rotation: Math.random() * 720,
          size: 8 + Math.random() * 8,
        }))
        setPieces(newPieces)
      })

      // 一定時間後にクリア
      const timer = setTimeout(() => {
        setPieces([])
      }, 5000)

      return () => {
        cancelAnimationFrame(spawnRaf)
        clearTimeout(timer)
      }
    }
  }, [active, count])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" style={{ contain: 'layout style paint' }}>
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{
              x: `${piece.x}vw`,
              y: '-10vh',
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              y: '110vh',
              rotate: piece.rotation,
              opacity: [1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.id % 2 === 0 ? '50%' : '0',
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
