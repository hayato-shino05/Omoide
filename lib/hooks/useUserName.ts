'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'birthday_user_name'

const listeners = new Set<() => void>()

let inMemoryFallback: string | null = null

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  listeners.add(callback)
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      inMemoryFallback = null
      callback()
    }
  }
  window.addEventListener('storage', handleStorage)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', handleStorage)
  }
}

function getSnapshot() {
  if (typeof window === 'undefined') return ''
  try {
    const item = localStorage.getItem(STORAGE_KEY)
    if (item !== null) {
      inMemoryFallback = null
      return item
    }
  } catch {
    if (inMemoryFallback !== null) return inMemoryFallback
    return ''
  }
  return inMemoryFallback ?? ''
}

function getServerSnapshot() {
  return ''
}

export function useUserName() {
  const userName = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // localStorageに保存（例外発生時はメモリ内フォールバックを維持）
  const setUserName = useCallback((name: string) => {
    const trimmed = name.trim()
    if (trimmed) {
      try {
        localStorage.setItem(STORAGE_KEY, trimmed)
        inMemoryFallback = null
      } catch {
        inMemoryFallback = trimmed
      }
      emitChange()
    }
  }, [])

  // 保存された名前をクリア
  const clearUserName = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      inMemoryFallback = null
    } catch {
      inMemoryFallback = ''
    }
    emitChange()
  }, [])

  return {
    userName,
    setUserName,
    clearUserName,
    isLoaded: mounted,
    hasUserName: !!userName,
  }
}
