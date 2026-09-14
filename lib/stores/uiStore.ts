import { create } from 'zustand'

export type ModalType =
  | 'album'
  | 'message'
  | 'bulletin'
  | 'memoryGame'
  | 'puzzleGame'
  | 'calendar'
  | 'quiz'
  | 'chat'
  | 'photoFrame'
  | 'flashback'
  | 'omikuji'
  | 'timeCapsule'
  | null

export interface MessageModalPayload {
  birthdayPerson?: string
  threadId?: string | number
}

interface UIState {
  activeModal: ModalType
  messageModalPayload: MessageModalPayload | null
  openModal: (modal: ModalType, payload?: MessageModalPayload) => void
  closeModal: () => void
}

// モーダルを開く直前にフォーカスされていた要素（閉じた際の復元先）
let lastModalTrigger: HTMLElement | null = null
let restoreRafId: number | null = null

function isVisible(el: HTMLElement): boolean {
  if (!el.isConnected || el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') {
    return false
  }
  if (el.style.display === 'none' || el.style.visibility === 'hidden') {
    return false
  }
  return true
}

function findVisibleFallback(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  const candidates = document.querySelectorAll<HTMLElement>(
    'header button:not([disabled]), nav button:not([disabled]), .mobile-game-toggle:not([disabled]), main button:not([disabled])'
  )
  for (let i = 0; i < candidates.length; i++) {
    const el = candidates[i]
    if (isVisible(el)) return el
  }
  return null
}

// モーダル unmount 後にトリガーへフォーカスを返す共有ライフサイクル。
// 個別モーダル側の restore が unmount 順序で失敗しても、ここで最終保証する。
function restoreTriggerFocus(): void {
  if (typeof window === 'undefined') return
  if (restoreRafId !== null) {
    cancelAnimationFrame(restoreRafId)
  }
  restoreRafId = requestAnimationFrame(() => {
    restoreRafId = null
    const active = document.activeElement
    if (active === document.body || active === null) {
      if (lastModalTrigger && isVisible(lastModalTrigger)) {
        lastModalTrigger.focus()
      } else {
        // トリガー要素が unmount/非表示化された場合（モバイルメニュー等）、永続的かつ可視なナビゲーションボタンへ安全にフォールバック
        const fallback = findVisibleFallback()
        fallback?.focus()
      }
    }
  })
}

export const useUIStore = create<UIState>((set, get) => ({
  activeModal: null,
  messageModalPayload: null,
  openModal: (modal, payload) => {
    if (restoreRafId !== null) {
      cancelAnimationFrame(restoreRafId)
      restoreRafId = null
    }
    // 最初のモーダル展開時のみページ上の起動元トリガーを記録（モーダル間直接遷移時は元のトリガーを維持）
    if (typeof document !== 'undefined' && get().activeModal === null) {
      lastModalTrigger =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
    }
    set({
      activeModal: modal,
      messageModalPayload:
        modal === 'message' && payload !== undefined
          ? payload
          : modal === 'message'
            ? get().messageModalPayload
            : null,
    })
  },
  closeModal: () => {
    set({ activeModal: null, messageModalPayload: null })
    // lastModalTrigger は次回 open で上書きするため、ここではクリアしない
    restoreTriggerFocus()
  },
}))
