/**
 * 想い出箱（Omoide Bako）PWA サービスワーカー
 * オフライン動作、フォント・画像・音声キャッシュ、多言語ネットワークファーストナビゲーションを提供
 */

const CACHE_NAME = 'omoide-pwa-v2'

// インストール時に事前キャッシュする必須コアアセット
const PRECACHE_ASSETS = [
  '/',
  '/?locale=ja',
  '/?locale=en',
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

  // 1. ナビゲーション（HTML ページ）: Network-First (オフライン時は言語別キャッシュへフォールバック)
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
          // 1) 要求されたURLに完全一致するキャッシュ
          const cachedResponse = await caches.match(request)
          if (cachedResponse) return cachedResponse

          // 2) 言語パラメータに対応するシェルキャッシュの検索
          const requestedLocale = url.searchParams.get('locale')

          if (requestedLocale === 'en') {
            const enCached = await caches.match('/?locale=en')
            if (enCached) return enCached
          } else if (requestedLocale === 'ja') {
            const jaCached = await caches.match('/?locale=ja')
            if (jaCached) return jaCached
          }

          // 3) ルートパスのキャッシュ
          const rootCached = await caches.match('/')
          if (rootCached) return rootCached

          // 4) 構造化オフライン HTML フォールバック（和モダン・多言語対応）
          const isEn = requestedLocale === 'en'
          const offlineHtml = `<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'ja'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${isEn ? 'Offline - Omoide' : 'オフライン - 想い出箱'}</title>
  <style>
    body {
      margin: 0;
      padding: 24px;
      font-family: system-ui, -apple-system, sans-serif;
      background: #FFFDF9;
      color: #854D27;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: #FFF9F3;
      border: 3px solid #D4B08C;
      border-radius: 16px;
      box-shadow: 6px 6px 0 #D4B08C;
      padding: 32px 24px;
      max-width: 420px;
      width: 100%;
    }
    h1 {
      font-size: 1.4rem;
      margin: 0 0 12px;
      color: #854D27;
    }
    p {
      font-size: 0.95rem;
      line-height: 1.6;
      color: #5A3215;
      margin: 0 0 24px;
    }
    button {
      background: #854D27;
      color: #FFFDF9;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      min-height: 44px;
      min-width: 120px;
    }
    button:active {
      transform: scale(0.96);
    }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 40px; margin-bottom: 16px;">🏮</div>
    <h1>${isEn ? 'Offline Mode' : 'オフラインモード'}</h1>
    <p>${
      isEn
        ? 'Network connection is currently unavailable. Offline cached features (omikuji, quizzes, soundscape) remain accessible.'
        : '現在インターネットに接続されていません。キャッシュ済みのおみくじやクイズ、環境音などのオフライン機能は引き続きご利用いただけます。'
    }</p>
    <button onclick="window.location.reload()">${isEn ? 'Retry Connection' : '再接続を試す'}</button>
  </div>
</body>
</html>`

          return new Response(offlineHtml, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
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
