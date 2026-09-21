'use client'

import { useEffect, useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery'

interface FloatingLanternsProps {
  count?: number
  active?: boolean
}

interface LanternColorScheme {
  paper: string
  glow: string
  frame: string
  accent: string
}

interface Lantern {
  id: number
  createdAt: number
  x: number
  size: number
  delay: number
  duration: number
  swayAmount: number
  rotateAmount: number
  colorScheme: LanternColorScheme
  style: 'chochin' | 'bonbori' | 'andon'
}

const LANTERN_COLORS: LanternColorScheme[] = [
  { paper: '#DC2626', glow: '#FCA5A5', frame: '#1C1917', accent: '#991B1B' },
  { paper: '#FEF3C7', glow: '#FDE68A', frame: '#292524', accent: '#D97706' },
  { paper: '#FB923C', glow: '#FDBA74', frame: '#1C1917', accent: '#C2410C' },
  { paper: '#FDA4AF', glow: '#FECDD3', frame: '#292524', accent: '#E11D48' },
  { paper: '#FCD34D', glow: '#FEF08A', frame: '#1C1917', accent: '#B45309' },
]

const LANTERN_STYLES: Lantern['style'][] = ['chochin', 'bonbori', 'andon']
let nextLanternId = 0

function createLantern(): Lantern {
  return {
    id: nextLanternId++,
    createdAt: Date.now(),
    x: Math.random() * 90 + 5,
    size: 40 + Math.random() * 20,
    delay: 0,
    duration: 20 + Math.random() * 10,
    swayAmount: 10 + Math.random() * 15,
    rotateAmount: 3 + Math.random() * 5,
    colorScheme: LANTERN_COLORS[Math.floor(Math.random() * LANTERN_COLORS.length)],
    style: LANTERN_STYLES[Math.floor(Math.random() * LANTERN_STYLES.length)],
  }
}

export function FloatingLanterns({ count = 15, active = true }: FloatingLanternsProps) {
  const [lanterns, setLanterns] = useState<Lantern[]>([])
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!active || prefersReducedMotion) return

    const initialTimeout = setTimeout(() => {
      setLanterns(
        Array.from({ length: Math.floor(count * 0.4) }, () => ({
          ...createLantern(),
          delay: Math.random() * 5,
        }))
      )
    }, 0)

    const spawnInterval = setInterval(() => {
      setLanterns((previous) => {
        if (previous.length >= count * 1.3) return previous
        return [...previous, createLantern()]
      })
    }, 2000 + Math.random() * 2000)

    const cleanupInterval = setInterval(() => {
      setLanterns((previous) => {
        const now = Date.now()
        return previous.filter(
          (lantern) => now - lantern.createdAt < (lantern.duration + lantern.delay) * 1000 + 3000
        )
      })
    }, 5000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(spawnInterval)
      clearInterval(cleanupInterval)
    }
  }, [active, count, prefersReducedMotion])

  if (!active || prefersReducedMotion) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden" style={{ opacity: 0.7, contain: 'layout style paint' }}>
      <AnimatePresence>
        {lanterns.map((lantern) => (
          <LanternElement key={lantern.id} lantern={lantern} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function LanternElement({ lantern }: { lantern: Lantern }) {
  const id = useId().replaceAll(':', '')
  const { colorScheme } = lantern

  return (
    <motion.div
      initial={{ x: `${lantern.x}vw`, y: '110vh', opacity: 0, rotate: 0 }}
      animate={{
        y: '-15vh',
        opacity: [0, 0.95, 0.95, 0.9, 0],
        x: [
          `${lantern.x}vw`,
          `${lantern.x + lantern.swayAmount * 0.3}vw`,
          `${lantern.x - lantern.swayAmount * 0.2}vw`,
          `${lantern.x + lantern.swayAmount * 0.15}vw`,
          `${lantern.x - lantern.swayAmount * 0.1}vw`,
        ],
        rotate: [0, lantern.rotateAmount, -lantern.rotateAmount * 0.5, lantern.rotateAmount * 0.3, 0],
      }}
      transition={{
        duration: lantern.duration,
        delay: lantern.delay,
        ease: 'easeOut',
        x: { duration: lantern.duration, ease: 'easeInOut' },
        rotate: { duration: lantern.duration * 0.8, ease: 'easeInOut' },
      }}
      className="absolute"
      style={{ filter: `drop-shadow(0 0 ${lantern.size * 0.5}px ${colorScheme.glow}60)`, willChange: 'transform, opacity' }}
    >
      {lantern.style === 'chochin' && <ChochinLantern size={lantern.size} colors={colorScheme} id={id} />}
      {lantern.style === 'bonbori' && <BonboriLantern size={lantern.size} colors={colorScheme} id={id} />}
      {lantern.style === 'andon' && <AndonLantern size={lantern.size} colors={colorScheme} id={id} />}
    </motion.div>
  )
}

interface LanternShapeProps {
  size: number
  colors: LanternColorScheme
  id: string
}

function ChochinLantern({ size, colors, id }: LanternShapeProps) {
  return (
    <svg width={size} height={size * 1.8} viewBox="0 0 100 180" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={`chochin-glow-${id}`} cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor={colors.glow} stopOpacity="0.9" />
          <stop offset="60%" stopColor={colors.paper} stopOpacity="0.6" />
          <stop offset="100%" stopColor={colors.paper} stopOpacity="0.3" />
        </radialGradient>
        <linearGradient id={`chochin-paper-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.accent} />
          <stop offset="25%" stopColor={colors.paper} />
          <stop offset="75%" stopColor={colors.paper} />
          <stop offset="100%" stopColor={colors.accent} />
        </linearGradient>
      </defs>
      <path d="M50 0 L50 12" stroke={colors.frame} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="50" cy="18" rx="18" ry="6" fill={colors.frame} />
      <ellipse cx="50" cy="18" rx="14" ry="4" fill="#44403C" />
      <ellipse cx="50" cy="85" rx="38" ry="55" fill={`url(#chochin-paper-${id})`} />
      <ellipse cx="50" cy="80" rx="30" ry="45" fill={`url(#chochin-glow-${id})`} />
      <path d="M50 30 Q50 85 50 140" stroke={colors.frame} strokeWidth="1.5" opacity="0.7" />
      <path d="M25 45 Q22 85 25 125 M75 45 Q78 85 75 125" stroke={colors.frame} opacity="0.5" />
      <path d="M35 35 Q32 85 35 135 M65 35 Q68 85 65 135" stroke={colors.frame} opacity="0.6" />
      <ellipse cx="50" cy="55" rx="35" ry="12" fill="none" stroke={colors.frame} opacity="0.4" />
      <ellipse cx="50" cy="85" rx="38" ry="14" fill="none" stroke={colors.frame} strokeWidth="1.5" opacity="0.5" />
      <ellipse cx="50" cy="115" rx="35" ry="12" fill="none" stroke={colors.frame} opacity="0.4" />
      <ellipse cx="35" cy="70" rx="8" ry="18" fill="white" opacity="0.12" />
      <ellipse cx="50" cy="140" rx="18" ry="6" fill={colors.frame} />
      <motion.ellipse
        cx="50"
        cy="85"
        rx="20"
        ry="28"
        fill={colors.glow}
        animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.95, 1.02, 0.95] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}

function BonboriLantern({ size, colors, id }: LanternShapeProps) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 100 160" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={`bonbori-glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.glow} stopOpacity="0.85" />
          <stop offset="70%" stopColor={colors.paper} stopOpacity="0.5" />
          <stop offset="100%" stopColor={colors.paper} stopOpacity="0.2" />
        </radialGradient>
      </defs>
      <path d="M50 0 L50 15" stroke={colors.frame} strokeWidth="2" strokeLinecap="round" />
      <polygon points="50,15 70,25 70,30 30,30 30,25" fill={colors.frame} />
      <polygon points="30,30 70,30 80,75 70,120 30,120 20,75" fill={colors.paper} />
      <polygon points="35,35 65,35 73,75 65,115 35,115 27,75" fill={`url(#bonbori-glow-${id})`} />
      <polygon points="30,30 70,30 80,75 70,120 30,120 20,75" fill="none" stroke={colors.frame} strokeWidth="2" />
      <line x1="50" y1="30" x2="50" y2="120" stroke={colors.frame} opacity="0.6" />
      <line x1="30" y1="75" x2="70" y2="75" stroke={colors.frame} opacity="0.5" />
      <polygon points="32,35 45,35 42,70 28,70" fill="white" opacity="0.1" />
      <polygon points="30,120 70,120 65,128 35,128" fill={colors.frame} />
      <motion.ellipse
        cx="50"
        cy="75"
        rx="18"
        ry="30"
        fill={colors.glow}
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}

function AndonLantern({ size, colors, id }: LanternShapeProps) {
  return (
    <svg width={size * 0.8} height={size * 1.5} viewBox="0 0 80 150" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`andon-glow-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.accent} stopOpacity="0.4" />
          <stop offset="50%" stopColor={colors.glow} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colors.accent} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path d="M40 0 L40 10" stroke={colors.frame} strokeWidth="2" strokeLinecap="round" />
      <rect x="15" y="10" width="50" height="8" rx="2" fill={colors.frame} />
      <rect x="18" y="18" width="44" height="100" rx="3" fill={colors.paper} />
      <rect x="22" y="22" width="36" height="92" rx="2" fill={`url(#andon-glow-${id})`} />
      <rect x="18" y="18" width="44" height="100" rx="3" fill="none" stroke={colors.frame} strokeWidth="2" />
      <line x1="40" y1="18" x2="40" y2="118" stroke={colors.frame} opacity="0.5" />
      <line x1="29" y1="18" x2="29" y2="118" stroke={colors.frame} opacity="0.4" />
      <line x1="51" y1="18" x2="51" y2="118" stroke={colors.frame} opacity="0.4" />
      <line x1="18" y1="50" x2="62" y2="50" stroke={colors.frame} opacity="0.4" />
      <line x1="18" y1="85" x2="62" y2="85" stroke={colors.frame} opacity="0.4" />
      <rect x="22" y="25" width="10" height="85" rx="1" fill="white" opacity="0.08" />
      <rect x="15" y="118" width="50" height="8" rx="2" fill={colors.frame} />
      <motion.rect
        x="28"
        y="40"
        width="24"
        height="55"
        rx="2"
        fill={colors.glow}
        animate={{ opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}
