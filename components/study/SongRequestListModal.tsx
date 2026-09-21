'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { X, Check, Music2, Clock, User } from 'lucide-react'

export const SongRequestListModal = React.memo(function SongRequestListModal() {
  const {
    songRequests,
    isSongRequestModalOpen,
    setSongRequestModalOpen,
    respondSongRequestAction,
    isHost,
  } = useStudyRoomStore(
    useShallow((state) => ({
      songRequests: state.songRequests,
      isSongRequestModalOpen: state.isSongRequestModalOpen,
      setSongRequestModalOpen: state.setSongRequestModalOpen,
      respondSongRequestAction: state.respondSongRequestAction,
      isHost: state.isHost,
    }))
  )

  const modalRef = useRef<HTMLDivElement>(null)

  // Escapeキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSongRequestModalOpen) {
        setSongRequestModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSongRequestModalOpen, setSongRequestModalOpen])

  const handleApprove = useCallback(async (requestId: string) => {
    if (respondSongRequestAction) {
      await respondSongRequestAction(requestId, 'approve')
    }
  }, [respondSongRequestAction])

  const handleReject = useCallback(async (requestId: string) => {
    if (respondSongRequestAction) {
      await respondSongRequestAction(requestId, 'reject')
    }
  }, [respondSongRequestAction])

  const handleClose = useCallback(() => {
    setSongRequestModalOpen(false)
  }, [setSongRequestModalOpen])

  if (!isSongRequestModalOpen) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="song-requests-title"
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className="relative w-full max-w-lg rounded-2xl border border-stone-800 bg-stone-900/95 p-6 text-stone-200 shadow-2xl backdrop-blur-md"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Music2 className="h-5 w-5" />
              </div>
              <div>
                <h2 id="song-requests-title" className="text-lg font-serif font-medium text-stone-100">
                  楽曲リクエスト
                </h2>
                <p className="text-xs text-stone-400">
                  {isHost ? 'メンバーから届いたBGMの提案を審査・追加できます' : '待機中のリクエスト一覧'}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-800/60 hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-[0.96] transition-all motion-safe:duration-150"
              aria-label="閉じる"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* リクエスト一覧 */}
          <div className="mt-4 max-h-80 overflow-y-auto pr-1 space-y-2.5">
            {songRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-800/50 text-stone-500 mb-3">
                  <Clock className="h-6 w-6" />
                </div>
                <p className="text-sm text-stone-300 font-medium">現在、待機中のリクエストはありません</p>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  メンバーが楽曲検索からリクエストを送信すると、ここに表示されます。
                </p>
              </div>
            ) : (
              songRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-stone-800/80 bg-stone-950/40 hover:border-stone-700/80 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {req.album_image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={req.album_image}
                        alt={req.track_name}
                        className="h-11 w-11 rounded-lg object-cover border border-stone-700/50 flex-shrink-0"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-stone-800 text-stone-400 border border-stone-700/50 flex-shrink-0">
                        <Music2 className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-200 truncate">{req.track_name}</p>
                      <p className="text-xs text-stone-400 truncate">{req.artist_name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-stone-500">
                        <User className="h-3 w-3" />
                        <span className="truncate">{req.requested_by_name}</span>
                      </div>
                    </div>
                  </div>

                  {isHost && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.96] transition-all motion-safe:duration-150"
                        title="承認してキューに追加"
                        aria-label={`${req.track_name} を承認`}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-[0.96] transition-all motion-safe:duration-150"
                        title="リクエストを却下"
                        aria-label={`${req.track_name} を却下`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* フッター */}
          <div className="mt-5 border-t border-stone-800/80 pt-4 flex justify-between items-center text-xs text-stone-500">
            <span>リクエスト数: {songRequests.length} / 10</span>
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 active:scale-[0.96] transition-all font-medium motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              閉じる
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
})
