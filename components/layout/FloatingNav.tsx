'use client'

import { useState } from 'react'

interface NavItem {
  id: string
  icon: React.ReactNode
  label: string
  onClick?: () => void
}

interface FloatingNavProps {
  items: NavItem[]
  position?: 'bottom' | 'right'
}

export default function FloatingNav({ items, position = 'bottom' }: FloatingNavProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const positionClasses = position === 'bottom'
    ? 'fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2'
    : 'fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 flex-col'

  return (
    <nav aria-label="Floating Navigation" className={`${positionClasses} z-40`}>
      <div className={`bg-[#FFF9F3]/90 dark:bg-stone-900/90 backdrop-blur-md rounded-full border-2 border-[#D4B08C] shadow-[4px_4px_0_#D4B08C] p-1.5 sm:p-2 flex ${position === 'right' ? 'flex-col' : ''} gap-1`}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveId(item.id)
              item.onClick?.()
            }}
            className={`relative w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all cursor-pointer group active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27] ${
              activeId === item.id
                ? 'bg-[#854D27] text-[#FFF9F3] shadow-xs'
                : 'text-[#854D27] dark:text-stone-200 hover:bg-[#FAF0E6] dark:hover:bg-stone-800'
            }`}
            aria-label={item.label}
          >
            {item.icon}

            {/* ツールチップ */}
            <span
              className={`absolute ${
                position === 'right' ? 'right-full mr-3' : 'bottom-full mb-3'
              } px-2.5 py-1 bg-stone-900 text-[#FFF9F3] text-xs font-semibold rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity pointer-events-none border border-[#D4B08C]/40`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
