'use client'

import { ReactNode } from 'react'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { ThemeIndicator } from '@/components/ui/ThemeIndicator'
import { HeaderButtons } from '@/components/ui/HeaderButtons'
import { GameButtons } from '@/components/ui/GameButtons'
import { MusicPlayer } from '@/components/ui/MusicPlayer'
import { SocialButtons } from '@/components/ui/SocialButtons'
import { ModalManager } from '@/components/ui/ModalManager'
import { MobileBottomDock } from '@/components/ui/MobileBottomDock'
import { GlobalStudyRoomSession } from '@/components/study/GlobalStudyRoomSession'
import { MusicPlayerProvider } from '@/lib/hooks/useMusicPlayer'
import { useUIStore } from '@/lib/stores/uiStore'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { activeModal } = useUIStore()
  const isZenActive = activeModal === 'zenFocus'

  return (
    <MusicPlayerProvider>
      <div className="main-layout">
        {/* 左上 - 言語 & テーマ (禅・集中モード時は非表示) */}
        {!isZenActive && (
          <div className="fixed-top-left">
            <LanguageSelector />
            <ThemeIndicator />
          </div>
        )}

        {/* 上中央 - アルバムボタン (デスクトップ専用、禅・集中モード時は非表示) */}
        {!isZenActive && (
          <div className="fixed-top-center hidden md:block">
            <HeaderButtons position="center" />
          </div>
        )}

        {/* 右上 - メッセージ・勉強部屋・禅ボタン (デスクトップ専用、禅・集中モード時は非表示) */}
        {!isZenActive && (
          <div className="fixed-top-right hidden md:block">
            <HeaderButtons position="right" />
          </div>
        )}

        {/* メインコンテンツ */}
        <main className="main-content pb-24 md:pb-0">
          {children}
        </main>

        {/* 左下 - ゲームボタン (デスクトップ専用、禅・集中モード時は非表示) */}
        {!isZenActive && (
          <div className="fixed-bottom-left hidden md:block">
            <GameButtons />
          </div>
        )}

        {/* 下中央 - ミュージックプレイヤー (デスクトップ専用、禅・集中モード時も常時利用可能) */}
        <div
          className="fixed-bottom-center hidden md:block"
          style={isZenActive ? { zIndex: 1250 } : undefined}
        >
          <MusicPlayer />
        </div>

        {/* 右下 - ソーシャルボタン (デスクトップ専用、禅・集中モード時はチャットのみ表示) */}
        <div
          className="fixed-bottom-right hidden md:block"
          style={isZenActive ? { zIndex: 1250 } : undefined}
        >
          <SocialButtons isZenMode={isZenActive} />
        </div>

        {/* モバイル用ボトムナビゲーションDock (スマホ専用、禅・集中モード時は非表示) */}
        {!isZenActive && <MobileBottomDock />}

        {/* 勉強部屋グローバルセッション & ボイスバー */}
        <GlobalStudyRoomSession />

        {/* モーダル管理コンポーネント */}
        <ModalManager />
      </div>
    </MusicPlayerProvider>
  )
}
