'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'

// Tailwind CSS のブレークポイントに対応した値
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQuery = window.matchMedia(query)
      mediaQuery.addEventListener('change', onStoreChange)
      return () => mediaQuery.removeEventListener('change', onStoreChange)
    },
    [query]
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

// よく使うブレークポイント用の補助フック
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${breakpoints.md - 1}px)`)
}

export function useIsTablet(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`)
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.lg}px)`)
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.xl}px)`)
}

// タッチデバイスかどうかを判定
export function useIsTouchDevice(): boolean {
  const subscribe = useCallback(() => () => {}, [])
  const getSnapshot = useCallback(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0, [])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

// 動きの軽減設定（reduced motion）の有無を判定
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

// ダークモードの好みを判定
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

// 現在のブレークポイントを取得
export function useBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm}px)`)
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md}px)`)
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg}px)`)
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl}px)`)
  const is2xl = useMediaQuery(`(min-width: ${breakpoints['2xl']}px)`)

  if (is2xl) return '2xl'
  if (isXl) return 'xl'
  if (isLg) return 'lg'
  if (isMd) return 'md'
  if (isSm) return 'sm'
  return 'xs'
}

// ウィンドウサイズ取得用フック
export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}
