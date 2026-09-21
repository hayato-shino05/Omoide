'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery'

interface FirefliesProps {
  active: boolean
  count?: number
}

interface Firefly {
  id: number
  x: number
  y: number
  size: number
  duration: number
  glowDuration: number
}

export function Fireflies({ active, count = 25 }: FirefliesProps) {
  const [fireflies, setFireflies] = useState<Firefly[]>([])
  const prefersReducedMotion = usePrefersReducedMotion()

  const createFirefly = useCallback((): Firefly => {
    return {
      id: Date.now() + Math.random() * 10000,
      x: Math.random() * 100,
      y: 30 + Math.random() * 60,
      size: 4 + Math.random() * 4,
      duration: 10 + Math.random() * 10,
      glowDuration: 1.5 + Math.random() * 2,
    }
  }, [])

  useEffect(() => {
    if (!active || prefersReducedMotion) {
      const raf = requestAnimationFrame(() => setFireflies([]))
      return () => cancelAnimationFrame(raf)
    }

    const initialRaf = requestAnimationFrame(() => {
      setFireflies(Array.from({ length: count }, createFirefly))
    })

    const interval = setInterval(() => {
      setFireflies(prev => {
        const filtered = prev.filter(() => Math.random() > 0.08)
        const newCount = count - filtered.length
        const newFireflies = Array.from({ length: newCount }, createFirefly)
        return [...filtered, ...newFireflies]
      })
    }, 1000)

    return () => {
      cancelAnimationFrame(initialRaf)
      clearInterval(interval)
    }
  }, [active, count, createFirefly, prefersReducedMotion])

  // reduced-motion 時は描画もループも停止
  if (prefersReducedMotion) return null

  if (!active) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden" style={{ contain: 'layout style paint' }}>
      <AnimatePresence>
        {fireflies.map(firefly => (
          <motion.div
            key={firefly.id}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              x: [0, 30, -20, 40, -30, 20, 0],
              y: [0, -20, 10, -30, 20, -10, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: firefly.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute"
            style={{
              left: `${firefly.x}%`,
              top: `${firefly.y}%`,
              willChange: 'transform, opacity',
            }}
          >
            <motion.div
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: firefly.glowDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="rounded-full"
              style={{
                width: firefly.size,
                height: firefly.size,
                backgroundColor: '#FFFF00',
                boxShadow: `
                  0 0 ${firefly.size * 2}px #FFFF00,
                  0 0 ${firefly.size * 4}px #FFD700,
                  0 0 ${firefly.size * 6}px #FFA500
                `,
                willChange: 'transform, opacity',
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
