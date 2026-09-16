'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import type { SilentCheerPayload } from '@/types/study'

interface ActiveCheerItem extends SilentCheerPayload {
  xOffset: number
}

export function SilentCheerOverlay() {
  const { cheers, removeCheer } = useStudyRoomStore()
  const [activeItems, setActiveItems] = useState<ActiveCheerItem[]>([])

  const getIcon = (type: string) => {
    switch (type) {
      case 'coffee':
        return '☕'
      case 'fire':
        return '🔥'
      case 'sparkle':
        return '✨'
      case 'book':
        return '📖'
      default:
        return '✨'
    }
  }

  // Khi có cheer mới trong store, thêm vào danh sách animation
  useEffect(() => {
    if (cheers.length === 0) return

    const latest = cheers[cheers.length - 1]
    const exists = activeItems.some((item) => item.id === latest.id)

    if (!exists) {
      const newItem: ActiveCheerItem = {
        ...latest,
        xOffset: Math.random() * 60 - 30, // Random drift -30px to +30px
      }
      setActiveItems((prev) => [...prev.slice(-10), newItem])

      // Tự động dọn dẹp sau 3s
      setTimeout(() => {
        setActiveItems((prev) => prev.filter((item) => item.id !== latest.id))
        removeCheer(latest.id)
      }, 3000)
    }
  }, [cheers, removeCheer, activeItems])

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <AnimatePresence>
        {activeItems.map((cheer) => (
          <motion.div
            key={cheer.id}
            initial={{
              opacity: 0,
              y: '80vh',
              x: `calc(50% + ${cheer.xOffset}vw)`,
              scale: 0.6,
            }}
            animate={{
              opacity: [0, 1, 1, 0.8, 0],
              y: '25vh',
              x: `calc(50% + ${cheer.xOffset + (Math.random() * 10 - 5)}vw)`,
              scale: [0.6, 1.2, 1, 0.9],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2.8,
              ease: 'easeOut',
            }}
            className="absolute flex flex-col items-center"
          >
            <span className="text-3xl filter drop-shadow-md select-none">
              {getIcon(cheer.cheer_type)}
            </span>
            <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-stone-200 border border-white/10 backdrop-blur-sm shadow-sm select-none">
              {cheer.sender_name}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
