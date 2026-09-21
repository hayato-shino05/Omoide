'use client'

import { useEffect } from 'react'

/**
 * PWA サービスワーカー登録用コンポーネント
 * クライアントサイドでのみ実行され、オフラインキャッシュと PWA 機能を有効化
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        // 新しいサービスワーカーの検出時のハンドリング
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // 新規バージョン準備完了（次回リロードまたはバックグラウンドで更新）
              }
            })
          }
        })
      } catch (error) {
        // 開発環境またはプライベートブラウズでの登録失敗時はサイレントに処理
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[ServiceWorker] Registration skipped or failed:', error)
        }
      }
    }

    // ページの初期読み込み負荷に影響を与えないよう load イベント後に登録
    if (document.readyState === 'complete') {
      registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker, { once: true })
    }
  }, [])

  return null
}

export default ServiceWorkerRegister
