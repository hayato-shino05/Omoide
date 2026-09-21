'use client'

import { useEffect } from 'react'
import { BirthdayChecker } from '@/components/features/BirthdayChecker'
import { MainLayout } from '@/components/layout/MainLayout'
import { ThemeEffects } from '@/components/effects/ThemeEffects'
import { VideoBackground } from '@/components/effects/VideoBackground'
import { useThemeContext } from '@/lib/providers/ThemeProvider'

export default function Home() {
  const { themeConfig, currentTheme } = useThemeContext()

  useEffect(() => {
    document.body.className = `theme-${currentTheme}`
  }, [currentTheme])

  return (
    <div
      suppressHydrationWarning
      className={`min-h-screen bg-gradient-to-br ${themeConfig.gradient}`}
      style={{ backgroundColor: themeConfig.colors.background }}
    >
      <VideoBackground
        videoUrl={themeConfig.videoUrl}
        youtubeId={themeConfig.youtubeId}
        videoDuration={themeConfig.videoDuration}
        opacity={0.9}
      />
      <ThemeEffects effects={themeConfig.effects} />

      <MainLayout>
        <BirthdayChecker />
      </MainLayout>
    </div>
  )
}
