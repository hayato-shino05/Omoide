'use client'

import { motion } from 'framer-motion'

interface MoonGlowProps {
  active: boolean
}

export function MoonGlow({ active }: MoonGlowProps) {
  if (!active) return null

  return (
    <div className="fixed top-8 right-12 pointer-events-none z-25" style={{ contain: 'layout style paint' }}>
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(255,255,200,0.3) 0%, rgba(255,255,200,0.1) 40%, transparent 70%)',
          top: -50,
          left: -50,
          willChange: 'transform, opacity',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="relative rounded-full overflow-hidden"
        style={{
          width: 100,
          height: 100,
          background: 'linear-gradient(135deg, #FFFACD 0%, #FFE4B5 50%, #F5DEB3 100%)',
          boxShadow: `
            0 0 30px rgba(255,255,200,0.8),
            0 0 60px rgba(255,255,200,0.5),
            0 0 100px rgba(255,255,200,0.3),
            inset -10px -10px 30px rgba(0,0,0,0.1)
          `,
        }}
        animate={{
          boxShadow: [
            '0 0 30px rgba(255,255,200,0.8), 0 0 60px rgba(255,255,200,0.5), 0 0 100px rgba(255,255,200,0.3), inset -10px -10px 30px rgba(0,0,0,0.1)',
            '0 0 40px rgba(255,255,200,0.9), 0 0 80px rgba(255,255,200,0.6), 0 0 120px rgba(255,255,200,0.4), inset -10px -10px 30px rgba(0,0,0,0.1)',
            '0 0 30px rgba(255,255,200,0.8), 0 0 60px rgba(255,255,200,0.5), 0 0 100px rgba(255,255,200,0.3), inset -10px -10px 30px rgba(0,0,0,0.1)',
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="absolute rounded-full bg-gray-300/20" style={{ width: 20, height: 20, top: 15, left: 25 }} />
        <div className="absolute rounded-full bg-gray-300/15" style={{ width: 15, height: 15, top: 40, left: 15 }} />
        <div className="absolute rounded-full bg-gray-300/20" style={{ width: 25, height: 25, top: 50, left: 50 }} />
        <div className="absolute rounded-full bg-gray-300/10" style={{ width: 12, height: 12, top: 25, left: 60 }} />

        <svg className="absolute" style={{ top: 30, left: 30, opacity: 0.15 }} width="40" height="40" viewBox="0 0 40 40" fill="#666">
          <ellipse cx="12" cy="8" rx="4" ry="10" />
          <ellipse cx="28" cy="8" rx="4" ry="10" />
          <circle cx="20" cy="22" r="12" />
          <ellipse cx="20" cy="35" rx="8" ry="6" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute"
        style={{
          width: 150,
          height: 40,
          top: 30,
          left: -80,
          willChange: 'transform, opacity',
        }}
        animate={{
          x: [0, 250, 0],
          opacity: [0, 0.3, 0.3, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
          times: [0, 0.4, 0.6, 1],
        }}
      >
        <div className="flex gap-[-10px]">
          <div className="w-12 h-8 bg-white/30 rounded-full blur-sm" />
          <div className="w-16 h-10 bg-white/40 rounded-full blur-sm -ml-4" />
          <div className="w-14 h-8 bg-white/30 rounded-full blur-sm -ml-4" />
        </div>
      </motion.div>
    </div>
  )
}
