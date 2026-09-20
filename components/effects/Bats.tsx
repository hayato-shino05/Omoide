'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery'

interface BatsProps {
  active: boolean
  count?: number
}

interface Bat {
  id: number
  startX: number
  startY: number
  endX: number
  endY: number
  size: number
  duration: number
  direction: 'left' | 'right'
}

export function Bats({ active, count = 8 }: BatsProps) {
  const [bats, setBats] = useState<Bat[]>([])
  const prefersReducedMotion = usePrefersReducedMotion()

  const createBat = useCallback((): Bat => {
    const direction = Math.random() > 0.5 ? 'left' : 'right'
    const startY = 10 + Math.random() * 40

    return {
      id: Date.now() + Math.random() * 10000,
      startX: direction === 'right' ? -10 : 110,
      startY,
      endX: direction === 'right' ? 110 : -10,
      endY: startY + (Math.random() - 0.5) * 30,
      size: 30 + Math.random() * 25,
      duration: 4 + Math.random() * 3,
      direction,
    }
  }, [])

  useEffect(() => {
    if (!active || prefersReducedMotion) {
      const raf = requestAnimationFrame(() => setBats([]))
      return () => cancelAnimationFrame(raf)
    }

    const spawnBat = () => {
      setBats(prev => {
        if (prev.length >= count) return prev
        return [...prev, createBat()]
      })
    }

    const initialTimers: NodeJS.Timeout[] = []
    for (let i = 0; i < Math.min(3, count); i++) {
      const timer = setTimeout(() => spawnBat(), i * 800)
      initialTimers.push(timer)
    }

    const interval = setInterval(spawnBat, 2000 + Math.random() * 2000)

    const cleanup = setInterval(() => {
      setBats(prev => prev.filter(bat => Date.now() - bat.id < bat.duration * 1000 + 1000))
    }, 3000)

    return () => {
      initialTimers.forEach((t) => clearTimeout(t))
      clearInterval(interval)
      clearInterval(cleanup)
    }
  }, [active, count, createBat, prefersReducedMotion])

  // reduced-motion 時は描画もループも停止
  if (prefersReducedMotion) return null

  if (!active) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-35 overflow-hidden" style={{ contain: 'layout style paint' }}>
      <AnimatePresence>
        {bats.map(bat => (
          <motion.div
            key={bat.id}
            initial={{
              x: `${bat.startX}vw`,
              y: `${bat.startY}vh`,
              opacity: 0,
            }}
            animate={{
              x: `${bat.endX}vw`,
              y: [
                `${bat.startY}vh`,
                `${bat.startY - 8}vh`,
                `${bat.startY + 5}vh`,
                `${bat.startY - 5}vh`,
                `${bat.endY}vh`,
              ],
              opacity: [0, 1, 1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: bat.duration,
              ease: 'linear',
              y: {
                duration: bat.duration,
                times: [0, 0.25, 0.5, 0.75, 1],
              },
            }}
            className="absolute top-0 left-0"
            style={{
              transform: bat.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
              willChange: 'transform, opacity',
            }}
          >
            <svg
              width={bat.size}
              height={bat.size * 0.6}
              viewBox="0 0 100 60"
              fill="#1a1a1a"
            >
              <ellipse cx="50" cy="35" rx="12" ry="18" />
              <circle cx="50" cy="15" r="10" />
              <polygon points="42,8 38,0 44,10" />
              <polygon points="58,8 62,0 56,10" />
              <circle cx="46" cy="14" r="2" fill="#FF0000" />
              <circle cx="54" cy="14" r="2" fill="#FF0000" />
              <motion.path
                d="M38,30 Q20,15 5,25 Q15,35 25,32 Q30,38 38,35 Z"
                animate={{
                  d: [
                    'M38,30 Q20,15 5,25 Q15,35 25,32 Q30,38 38,35 Z',
                    'M38,30 Q25,40 10,45 Q20,38 28,35 Q32,33 38,32 Z',
                    'M38,30 Q20,15 5,25 Q15,35 25,32 Q30,38 38,35 Z',
                  ],
                }}
                transition={{
                  duration: 0.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.path
                d="M62,30 Q80,15 95,25 Q85,35 75,32 Q70,38 62,35 Z"
                animate={{
                  d: [
                    'M62,30 Q80,15 95,25 Q85,35 75,32 Q70,38 62,35 Z',
                    'M62,30 Q75,40 90,45 Q80,38 72,35 Q68,33 62,32 Z',
                    'M62,30 Q80,15 95,25 Q85,35 75,32 Q70,38 62,35 Z',
                  ],
                }}
                transition={{
                  duration: 0.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}