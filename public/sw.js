/**
 * 想い出箱（Omoide Bako）PWA サービスワーカー
 * オフライン動作、フォント・画像・音声キャッシュ、ネットワークファーストナビゲーションを提供
 */

const CACHE_NAME = 'omoide-pwa-v1'

// インストール時に事前キャッシュする必須コアアセット
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
]

// サービスワーカーのインストール処理
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => {
        // 新しいサービスワーカーを直ちにアクティブ化
        return self.skipWaiting()
      })
      .catch((err) => {
        // オフラインキャッシュ初期化エラー（必要最小限のフォールバック）
        console.warn('[SW] Precache failed:', err)
      })
  )
})

// サービスワーカーのアクティベート処理（古いキャッシュの削除）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      })
      .then(() => {
        // 全てのクライアントを直ちに制御下に置く
        return self.clients.claim()
      })
  )
})

// リクエストのインターセプトとキャッシュ戦略
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // GET リクエスト以外、または Supabase / 外部 API / WebSocket はバイパス
  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) return

  // 1. ナビゲーション（HTML ページ）: Network-First (オフライン時はキャッシュへフォールバック)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request)
          if (cachedResponse) return cachedResponse
          const rootCached = await caches.match('/')
          if (rootCached) return rootCached
          return new Response('オフラインです。ネットワーク接続をご確認ください。', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        })
    )
    return
  }

  // 2. フォントアセット: Cache-First
  const isFont =
    request.destination === 'font' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.pathname.match(/\.(woff2?|ttf|otf|eot)$/i)

  if (isFont) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse
        return fetch(request).then((response) => {
          if (response && (response.status === 200 || response.type === 'opaque')) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // 3. 音声ファイル（BGM / アンビエント音源）: Cache-First
  const isAudio =
    request.destination === 'audio' ||
    url.pathname.startsWith('/audio/') ||
    url.pathname.match(/\.(mp3|wav|ogg|m4a|aac)$/i)

  if (isAudio) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse
        return fetch(request).then((response) => {
          if (response && (response.status === 200 || response.type === 'opaque')) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // 4. 静的画像・アイコン: Cache-First
  const isImage =
    request.destination === 'image' ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i)

  if (isImage) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse
        return fetch(request).then((response) => {
          if (response && (response.status === 200 || response.type === 'opaque')) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // 5. Next.js 静的バンドル・スクリプト: Stale-While-Revalidate
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            }
            return networkResponse
          })
          .catch(() => null)

        return cachedResponse || fetchPromise
      })
    )
  }
})
