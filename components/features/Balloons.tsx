'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery'

interface BalloonsProps {
  active: boolean
  count?: number
}

interface Balloon {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  size: number
}

// 風船コンポーネント
export function Balloons({ active, count = 15 }: BalloonsProps) {
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!active || prefersReducedMotion) {
      const raf = requestAnimationFrame(() => setBalloons([]))
      return () => cancelAnimationFrame(raf)
    }

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8']
    let timer: NodeJS.Timeout | null = null

    const spawnRaf = requestAnimationFrame(() => {
      const newBalloons = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 90 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
        duration: 4 + Math.random() * 3,
        size: 40 + Math.random() * 30,
      }))
      setBalloons(newBalloons)

      // RAF 実行後にタイマーを開始し、遅延生成との順序逆転を防ぐ
      timer = setTimeout(() => {
        setBalloons([])
      }, 8000)
    })

    return () => {
      cancelAnimationFrame(spawnRaf)
      if (timer) clearTimeout(timer)
    }
  }, [active, count, prefersReducedMotion])

  if (!active || prefersReducedMotion) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden" style={{ contain: 'layout style paint' }}>
      <AnimatePresence>
        {balloons.map((balloon) => (
          <motion.div
            key={balloon.id}
            initial={{
              x: `${balloon.x}vw`,
              y: '110vh',
              rotate: 0,
            }}
            animate={{
              y: '-20vh',
              x: `${balloon.x + (((balloon.id * 37) % 100) / 100 - 0.5) * 20}vw`,
              rotate: (((balloon.id * 53) % 100) / 100 - 0.5) * 30,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: balloon.duration,
              delay: balloon.delay,
              ease: 'easeOut',
            }}
            className="absolute"
            style={{ willChange: 'transform' }}
          >
            <div
              className="relative rounded-full"
              style={{
                width: balloon.size,
                height: balloon.size * 1.2,
                backgroundColor: balloon.color,
                boxShadow: `inset -10px -10px 20px rgba(0, 0, 0, 0.2), 0 5px 15px rgba(0, 0, 0, 0.3)`,
              }}
            >
              {/* ハイライト */}
              <div
                className="absolute top-2 left-2 w-3 h-3 bg-white rounded-full opacity-60"
                style={{ filter: 'blur(2px)' }}
              />
              {/* 風船の紐 */}
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gray-400"
                style={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)',
                }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
