'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery'

interface GhostsProps {
  active: boolean
  count?: number
}

interface Ghost {
  id: number
  x: number
  y: number
  size: number
  duration: number
  opacity: number
}

export function Ghosts({ active, count = 5 }: GhostsProps) {
  const [ghosts, setGhosts] = useState<Ghost[]>([])
  const prefersReducedMotion = usePrefersReducedMotion()

  const createGhost = useCallback((): Ghost => {
    return {
      id: Date.now() + Math.random() * 10000,
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 50,
      size: 50 + Math.random() * 40,
      duration: 8 + Math.random() * 6,
      opacity: 0.3 + Math.random() * 0.4,
    }
  }, [])

  useEffect(() => {
    if (!active || prefersReducedMotion) {
      const raf = requestAnimationFrame(() => setGhosts([]))
      return () => cancelAnimationFrame(raf)
    }

    const initialRaf = requestAnimationFrame(() => {
      setGhosts(Array.from({ length: count }, createGhost))
    })

    const interval = setInterval(() => {
      setGhosts(prev => {
        const filtered = prev.filter(() => Math.random() > 0.15)
        if (filtered.length < count) {
          return [...filtered, createGhost()]
        }
        return filtered
      })
    }, 3000)

    return () => {
      cancelAnimationFrame(initialRaf)
      clearInterval(interval)
    }
  }, [active, count, createGhost, prefersReducedMotion])

  // reduced-motion 時は描画もループも停止
  if (prefersReducedMotion) return null

  if (!active) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-35 overflow-hidden" style={{ contain: 'layout style paint' }}>
      <AnimatePresence>
        {ghosts.map(ghost => (
          <motion.div
            key={ghost.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, ghost.opacity, ghost.opacity, 0],
              scale: [0.5, 1, 1, 0.8],
              x: [0, 30, -20, 40, 0],
              y: [0, -20, 10, -30, 0],
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              duration: ghost.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute"
            style={{
              left: `${ghost.x}%`,
              top: `${ghost.y}%`,
              willChange: 'transform, opacity',
            }}
          >
            <svg
              width={ghost.size}
              height={ghost.size * 1.3}
              viewBox="0 0 80 100"
              fill="white"
              style={{
                filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.5))',
              }}
            >
              <path
                d="M40,5
                   C60,5 75,25 75,50
                   L75,85
                   Q70,75 65,85
                   Q60,75 55,85
                   Q50,75 45,85
                   Q40,75 35,85
                   Q30,75 25,85
                   Q20,75 15,85
                   L15,85
                   Q10,75 5,85
                   L5,50
                   C5,25 20,5 40,5 Z"
                fill="white"
                opacity="0.9"
              />
              <ellipse cx="28" cy="40" rx="8" ry="10" fill="#1a1a1a" />
              <ellipse cx="52" cy="40" rx="8" ry="10" fill="#1a1a1a" />
              <motion.circle
                cx="28"
                cy="42"
                r="3"
                fill="#333"
                animate={{ cx: [26, 30, 26] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.circle
                cx="52"
                cy="42"
                r="3"
                fill="#333"
                animate={{ cx: [50, 54, 50] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <ellipse cx="40" cy="60" rx="10" ry="6" fill="#1a1a1a" opacity="0.7" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}