'use client'

import { useState, useCallback } from 'react'
import { detectSeasonAndFestival, getThemeConfig } from '@/lib/utils/theme'
import type { ThemeName } from '@/types'
import type { ThemeConfig } from '@/config/themes'

interface UseThemeReturn {
  theme: ThemeName
  themeConfig: ThemeConfig
  setTheme: (theme: ThemeName) => void
  isAutoDetect: boolean
  setAutoDetect: (auto: boolean) => void
}

// サーバー（SSR）およびクライアント（CSR）の双方で現在日付に基づく初期テーマを検出
function getInitialTheme(): ThemeName {
  return detectSeasonAndFestival()
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme)
  const [isAutoDetect, setIsAutoDetect] = useState(true)

  // 手動でテーマを設定
  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme)
    setIsAutoDetect(false)
  }, [])

  // 自動検出モードを設定
  const setAutoDetect = useCallback((auto: boolean) => {
    setIsAutoDetect(auto)
    if (auto) {
      const detectedTheme = detectSeasonAndFestival()
      setThemeState(detectedTheme)
    }
  }, [])

  const themeConfig = getThemeConfig(theme)

  return {
    theme,
    themeConfig,
    setTheme,
    isAutoDetect,
    setAutoDetect,
  }
}
