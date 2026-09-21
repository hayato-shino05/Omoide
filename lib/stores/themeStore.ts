'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ThemeName } from '@/types'
import { detectSeasonAndFestival } from '@/lib/utils/theme'

interface ThemeState {
  currentTheme: ThemeName
  isAutoTheme: boolean
  prefersDark: boolean
  
  // アクション
  setTheme: (theme: ThemeName) => void
  setAutoTheme: (auto: boolean) => void
  setPrefersDark: (dark: boolean) => void
  detectTheme: () => ThemeName
  toggleAutoTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: 'spring',
      isAutoTheme: true,
      prefersDark: false,

      setTheme: (theme) => set({ currentTheme: theme, isAutoTheme: false }),
      setAutoTheme: (auto) => set({ isAutoTheme: auto }),
      setPrefersDark: (dark) => set({ prefersDark: dark }),

      detectTheme: () => detectSeasonAndFestival(),

      toggleAutoTheme: () => {
        const { isAutoTheme, detectTheme } = get()
        if (!isAutoTheme) {
          const detectedTheme = detectTheme()
          set({ isAutoTheme: true, currentTheme: detectedTheme })
        } else {
          set({ isAutoTheme: false })
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        isAutoTheme: state.isAutoTheme,
        prefersDark: state.prefersDark,
      }),
    }
  )
)
