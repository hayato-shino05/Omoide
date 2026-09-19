'use client'

import dynamic from 'next/dynamic'
import { useUIStore } from '@/lib/stores/uiStore'
import Modal from './Modal'
import { useLanguage } from '@/lib/i18n/LanguageContext'

// モーダル読み込み中のローディングスピナー
function ModalLoadingSpinner() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div
        className="w-10 h-10 border-3 border-[#D4B08C]/30 border-t-[#854D27] rounded-full animate-spin"
        style={{ animationDuration: '0.8s' }}
      />
      <span className="text-sm font-medium text-[#854D27]/80 tracking-wider">
        {t('loading')}
      </span>
    </div>
  )
}

// 各モーダルコンポーネントを next/dynamic でコード分割し、初期バンドルサイズを大幅に削減
const PhotoGallery = dynamic(
  () => import('@/components/features/PhotoGallery').then((mod) => mod.PhotoGallery),
  { ssr: false, loading: () => <ModalLoadingSpinner /> }
)

const PhotoFrame = dynamic(
  () => import('@/components/features/PhotoFrame'),
  { ssr: false, loading: () => <ModalLoadingSpinner /> }
)

const MessageForm = dynamic(
  () => import('@/components/community/MessageForm').then((mod) => mod.MessageForm),
  { ssr: false, loading: () => <ModalLoadingSpinner /> }
)

const BulletinBoard = dynamic(
  () => import('@/components/community/BulletinBoard'),
  { ssr: false, loading: () => <ModalLoadingSpinner /> }
)

const MemoryGame = dynamic(
  () => import('@/components/games/MemoryGame').then((mod) => mod.MemoryGame),
  { ssr: false, loading: () => <ModalLoadingSpinner /> }
)

const PuzzleGame = dynamic(
  () => import('@/components/games/PuzzleGame').then((mod) => mod.PuzzleGame),
  { ssr: false, loading: () => <ModalLoadingSpinner /> }
)

const BirthdayCalendar = dynamic(
  () => import('@/components/games/BirthdayCalendar').then((mod) => mod.BirthdayCalendar),
  { ssr: false, loading: () => <ModalLoadingSpinner /> }
)

const BirthdayQuiz = dynamic(
  () => import('@/components/games/BirthdayQuiz').then((mod) => mod.BirthdayQuiz),
  { ssr: false, loading: () => <ModalLoadingSpinner /> }
)

const ChatRoom = dynamic(
  () => import('@/components/community/ChatRoom').then((mod) => mod.ChatRoom),
  { ssr: false, loading: () => <ModalLoadingSpinner /> }
)

const OnThisDayFlashback = dynamic(
  () => import('@/components/features/OnThisDayFlashback').then((mod) => mod.OnThisDayFlashback),
  { ssr: false, loading: () => <ModalLoadingSpinner /> }
)

import type { ZenFocusModalProps } from '@/components/study/ZenFocusModal'

const DailyOmikuji = dynamic(
  () => import('@/components/features/DailyOmikuji').then((mod) => mod.DailyOmikuji),
  { ssr: false, loading: () => <ModalLoadingSpinner /> }
)

const TimeCapsule = dynamic(
  () => import('@/components/community/TimeCapsule').then((mod) => mod.TimeCapsule),
  { ssr: false, loading: () => <ModalLoadingSpinner /> }
)

const StudyRoomHub = dynamic(
  () => import('@/components/study/StudyRoomHub').then((mod) => mod.StudyRoomHub),
  { ssr: false, loading: () => <ModalLoadingSpinner /> }
)

const ZenFocusModal = dynamic<ZenFocusModalProps>(
  () => import('@/components/study/ZenFocusModal').then((mod) => mod.ZenFocusModal),
  { ssr: false, loading: () => <ModalLoadingSpinner /> }
)

export function ModalManager() {
  const { activeModal, isChatOpen, messageModalPayload, closeModal, closeChat } = useUIStore()
  const { t } = useLanguage()

  const modalConfig: Record<string, { title: string; content: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'widescreen' }> = {
    album: {
      title: t('viewAlbum'),
      content: <PhotoGallery />,
      size: 'widescreen' as const,
    },
    photoFrame: {
      title: t('photoFrame'),
      content: <PhotoFrame />,
      size: 'widescreen' as const,
    },
    message: {
      title: t('sendMessage'),
      content: (
        <MessageForm
          birthdayPerson={messageModalPayload?.birthdayPerson}
          initialThreadId={messageModalPayload?.threadId}
          onSuccess={closeModal}
        />
      ),
    },
    bulletin: {
      title: t('bulletinBoard'),
      content: <BulletinBoard />,
      size: 'full' as const,
    },
    memoryGame: {
      title: t('memoryGame'),
      content: <MemoryGame onClose={closeModal} />,
    },
    puzzleGame: {
      title: t('puzzleGame'),
      content: <PuzzleGame onClose={closeModal} />,
    },
    calendar: {
      title: t('birthdayCalendar'),
      content: <BirthdayCalendar onClose={closeModal} />,
    },
    quiz: {
      title: t('birthdayQuiz'),
      content: <BirthdayQuiz onClose={closeModal} />,
    },
    flashback: {
      title: t('flashbackTitle'),
      content: <OnThisDayFlashback onClose={closeModal} />,
      size: 'md' as const,
    },
    omikuji: {
      title: t('omikujiTitle'),
      content: <DailyOmikuji onClose={closeModal} />,
      size: 'md' as const,
    },
    timeCapsule: {
      title: t('timeCapsuleTitle'),
      content: <TimeCapsule />,
      size: 'md' as const,
    },
    studyRoom: {
      title: t('studyRoomTitle'),
      content: <StudyRoomHub />,
      size: 'full' as const,
    },
  }

  const renderActiveModal = () => {
    if (!activeModal) return null

    // 禅・集中モードは全画面の没入型キャンバスとして表示
    if (activeModal === 'zenFocus') {
      return <ZenFocusModal isOpen={true} onClose={closeModal} />
    }

    const config = modalConfig[activeModal]
    if (!config) return null

    const size = config.size || 'lg'

    return (
      <Modal isOpen={true} onClose={closeModal} title={config.title} size={size}>
        {config.content}
      </Modal>
    )
  }

  return (
    <>
      {/* グループチャット（独立したフローティングモーダルとして最前面に常駐可能） */}
      {isChatOpen && <ChatRoom onClose={closeChat} />}

      {/* メインモーダル群 */}
      {renderActiveModal()}
    </>
  )
}
