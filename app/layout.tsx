import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { locales } from '@/data/generated/locales'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import { LANGUAGE_COOKIE_NAME } from '@/lib/i18n/cookie'
import { DEFAULT_LOCALE, resolveLocale } from '@/lib/i18n/resolveLocale'
import { ThemeProvider } from '@/lib/providers/ThemeProvider'
import { QueryProvider } from '@/lib/providers/QueryProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { MotionConfig } from 'framer-motion'
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister'

export const metadata: Metadata = {
  metadataBase: new URL('https://happy-birthday.vercel.app'),
  title: 'Omoide | 想い出箱 — 大切な記念日と思い出を分かち合う空間',
  description: '大切な人の誕生日とみんなの思い出をひとつの場所に。「想い出箱（Omoide Bako）」— カウントダウン、フォトブース、メッセージボード、ミニゲーム、13の四季・祝祭日テーマを搭載。',
  keywords: ['Omoide', '想い出箱', 'birthday', '誕生日', 'お祝い', '記念日', 'celebration', 'フォトブース'],
  authors: [{ name: 'hayato-shino05', url: 'https://github.com/hayato-shino05' }],
  creator: 'hayato-shino05',
  publisher: 'hayato-shino05',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    alternateLocale: ['en_US'],
    url: 'https://happy-birthday.vercel.app',
    siteName: 'Omoide (想い出箱)',
    title: 'Omoide | 想い出箱 — 大切な記念日と思い出を分かち合う空間',
    description: '大切な人の誕生日とみんなの思い出をひとつの場所に。「想い出箱（Omoide Bako）」',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Omoide (想い出箱)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Omoide | 想い出箱 — 大切な記念日と思い出を分かち合う空間',
    description: '大切な人の誕生日とみんなの思い出をひとつの場所に。「想い出箱（Omoide Bako）」',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/images/logo.png', type: 'image/png' },
      { url: '/favicon.ico' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Omoide',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3E5D8' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
  ],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const requestedLocale = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value ?? DEFAULT_LOCALE
  const locale = resolveLocale(requestedLocale, locales, DEFAULT_LOCALE).locale
  const language = locale.startsWith('ja') ? 'ja' : 'en'

  return (
    <html lang={language} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            <LanguageProvider initialLocale={locale}>
              <ToastProvider position="top-right">
                {/* prefers-reduced-motion を framer-motion 全体で尊重 */}
                <MotionConfig reducedMotion="user">
                  {children}
                </MotionConfig>
              </ToastProvider>
            </LanguageProvider>
          </ThemeProvider>
        </QueryProvider>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  )
}
