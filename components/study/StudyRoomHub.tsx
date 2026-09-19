'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Lock,
  Music,
  Maximize2,
  RefreshCw,
  Search,
  Coffee,
  Users,
  X,
  Radio,
} from 'lucide-react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { fetchStudyRooms, createStudyRoom, joinStudyRoom, getStudyRoom } from '@/lib/study/client'
import { StudyRoomView } from './StudyRoomView'
import { ZenFocusModal } from './ZenFocusModal'
import SongPickerModal from '@/components/community/SongPickerModal'
import type { StudyRoom } from '@/types/study'

// 匿名ユーザーIDおよび表示名のフォールバック解決ヘルパー
function resolveUserCredentials(userIdentifier: string, displayName: string) {
  if (typeof window === 'undefined') {
    return {
      effectiveId: userIdentifier || 'guest',
      effectiveName: displayName || 'Student',
    }
  }
  const storedId = localStorage.getItem('omoide_study_uid')
  const storedName = localStorage.getItem('omoide_study_name')
  return {
    effectiveId: userIdentifier || storedId || 'guest',
    effectiveName: displayName || storedName || 'Student',
  }
}

export function StudyRoomHub() {
  const { currentRoom, userIdentifier, displayName, setRoom, setUserProfile } =
    useStudyRoomStore()
  const { t } = useLanguage()

  const [rooms, setRooms] = useState<StudyRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isZenSoloOpen, setIsZenSoloOpen] = useState(false)

  // Form states for creating a room
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDesc, setNewRoomDesc] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Passcode modal state when joining private room
  const [joiningRoom, setJoiningRoom] = useState<StudyRoom | null>(null)
  const [joinPasscode, setJoinPasscode] = useState('')
  const [passcodeError, setPasscodeError] = useState(false)

  // 未設定時のゲストユーザー情報初期化
  useEffect(() => {
    if (typeof window === 'undefined') return
    let storedId = localStorage.getItem('omoide_study_uid')
    let storedName = localStorage.getItem('omoide_study_name')

    if (!storedId) {
      storedId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      localStorage.setItem('omoide_study_uid', storedId)
    }
    if (!storedName) {
      storedName = `Student #${storedId.slice(-4)}`
      localStorage.setItem('omoide_study_name', storedName)
    }

    setUserProfile(storedId, storedName)
  }, [setUserProfile])

  // 部屋一覧の取得
  const loadRooms = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchStudyRooms()
      setRooms(data)
    } catch {
      // エラー時はフォールバックとして空配列をセット
      setRooms([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  // URLクエリパラメータ (?studyRoom=...) による自動入室処理
  useEffect(() => {
    if (typeof window === 'undefined') return
    const urlParams = new URLSearchParams(window.location.search)
    const queryRoomId = urlParams.get('studyRoom')
    if (queryRoomId && !currentRoom && userIdentifier) {
      // 退室時の再入室ループを防ぐため、URLクエリパラメータを即座に消去
      window.history.replaceState({}, '', window.location.pathname)

      getStudyRoom(queryRoomId).then(async (room) => {
        if (room) {
          if (room.is_private) {
            setJoiningRoom(room)
          } else {
            const creds = resolveUserCredentials(userIdentifier, displayName)
            const joined = await joinStudyRoom(room.id, {
              user_identifier: creds.effectiveId,
              display_name: creds.effectiveName,
            })
            if (joined) {
              setRoom(room)
            }
          }
        }
      })
    }
  }, [currentRoom, userIdentifier, displayName, setRoom])

  // 部屋への入室処理
  const handleJoinRoom = async (room: StudyRoom) => {
    if (room.is_private) {
      setJoiningRoom(room)
      setJoinPasscode('')
      setPasscodeError(false)
      return
    }

    const creds = resolveUserCredentials(userIdentifier, displayName)
    const joined = await joinStudyRoom(room.id, {
      user_identifier: creds.effectiveId,
      display_name: creds.effectiveName,
    })
    if (joined) {
      setRoom(room)
    }
  }

  // 非公開部屋のパスコード確認および入室
  const handleConfirmPrivateJoin = async () => {
    if (!joiningRoom) return

    if (joiningRoom.passcode && joiningRoom.passcode !== joinPasscode) {
      setPasscodeError(true)
      return
    }

    const creds = resolveUserCredentials(userIdentifier, displayName)
    const targetRoom = joiningRoom
    const joined = await joinStudyRoom(targetRoom.id, {
      user_identifier: creds.effectiveId,
      display_name: creds.effectiveName,
    })
    if (joined) {
      setRoom(targetRoom)
      setJoiningRoom(null)
    }
  }

  // 新規部屋作成処理
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    setIsSubmitting(true)
    const creds = resolveUserCredentials(userIdentifier, displayName)

    const created = await createStudyRoom({
      name: newRoomName.trim(),
      description: newRoomDesc.trim() || undefined,
      host_id: creds.effectiveId,
      is_private: isPrivate,
      passcode: isPrivate ? passcode.trim() : undefined,
      current_track_id: selectedTrackId || undefined,
    })

    if (created) {
      setRoom(created)
      await joinStudyRoom(created.id, {
        user_identifier: creds.effectiveId,
        display_name: creds.effectiveName,
      })
      setIsCreateModalOpen(false)
      setNewRoomName('')
      setNewRoomDesc('')
      setIsPrivate(false)
      setPasscode('')
      setSelectedTrackId(null)
    }
    setIsSubmitting(false)
  }

  // 部屋に入室中の場合は StudyRoomView を表示
  if (currentRoom) {
    return <StudyRoomView roomId={currentRoom.id} onLeave={() => loadRooms()} />
  }

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="w-full max-w-5xl mx-auto p-2 sm:p-4 text-[#3D2314]">
      {/* ヘッダー・アクションバナー（和紙の温もりとDiscord風の軽快さを両立） */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#FFFDF9] via-[#FAF3EB] to-[#F5EBE1] border-2 border-[#D4B08C] shadow-xs mb-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-[#D95D39] text-xs font-bold uppercase tracking-wider mb-1.5 font-body">
            <Radio size={15} className="animate-pulse" />
            <span>{t('studyRoomTitle')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#3D2314] font-heading tracking-tight">
            {t('studyHeroTitle')}
          </h1>
          <p className="text-xs text-[#5C3A21] mt-1 font-body font-medium leading-relaxed">
            {t('studyHeroDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D95D39] hover:bg-[#C24E2B] active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[44px]"
          >
            <Plus size={16} />
            <span>{t('studyCreateRoom')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsZenSoloOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF0E6] active:scale-95 text-[#3D2314] border border-[#D4B08C] text-xs font-bold transition-all shadow-2xs cursor-pointer min-h-[44px]"
          >
            <Maximize2 size={15} className="text-[#D95D39]" />
            <span>{t('studySoloZen')}</span>
          </button>
        </div>
      </div>

      {/* 検索・更新コントロールバー */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C3A21]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('studySearchPlaceholder')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border-2 border-[#D4B08C] text-xs text-[#3D2314] placeholder-[#854D27]/40 focus:outline-none focus:border-[#3D2314] shadow-inner transition-colors font-body min-h-[44px]"
          />
        </div>

        <button
          type="button"
          onClick={loadRooms}
          title={t('studyRefreshRooms')}
          aria-label={t('studyRefreshRooms')}
          className="p-2.5 rounded-xl bg-white hover:bg-[#FAF0E6] border-2 border-[#D4B08C] text-[#3D2314] transition-all shadow-xs active:scale-95 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 勉強部屋グリッド一覧（Discordスタイルのアバタースタックとライブプレゼンスを表示） */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#5C3A21] font-body font-medium">{t('studyLoadingRooms')}</div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-14 text-center text-[#3D2314] p-8 rounded-2xl bg-[#FFFDF9] border-2 border-[#D4B08C] shadow-xs">
          <Coffee size={36} className="mx-auto mb-3 text-[#D4B08C]" />
          <p className="text-xs sm:text-sm font-semibold text-[#3D2314] mb-1 font-body">{t('studyNoRoomsFound')}</p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-[#D95D39] text-white text-xs font-bold hover:bg-[#c44e2b] active:scale-95 transition-all shadow-xs cursor-pointer min-h-[44px]"
          >
            {t('studyCreateFirstRoom')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredRooms.map((room) => {
            const roomMembers = room.study_room_members || []
            const isPlaying = room.playback_state === 'playing'

            return (
              <div
                key={room.id}
                className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border-2 border-[#D4B08C] hover:border-[#D95D39] transition-all shadow-[0_2px_12px_-3px_rgba(133,77,39,0.06)] hover:shadow-md group"
              >
                <div>
                  {/* 上部バッジ（席数および非公開ロック表示） */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-[#FAF0E6] border border-[#D4B08C]/60 text-[#3D2314] font-bold font-body">
                      <Users size={12} className="text-[#D95D39]" />
                      {t('studyDesksOccupied', {
                        current: String(roomMembers.length),
                        max: String(room.max_members || 20),
                      })}
                    </span>
                    {room.is_private && (
                      <span
                        className="p-1 rounded-full bg-[#FAF0E6] text-[#3D2314] border border-[#D4B08C]"
                        title={t('studyPrivateRoom')}
                      >
                        <Lock size={12} />
                      </span>
                    )}
                  </div>

                  {/* 部屋タイトル・説明文 */}
                  <h2 className="text-base font-bold text-[#3D2314] group-hover:text-[#D95D39] transition-colors mb-1 truncate font-heading">
                    {room.name}
                  </h2>
                  <p className="text-xs text-[#5C3A21] font-medium line-clamp-2 min-h-[34px] leading-relaxed font-body">
                    {room.description || t('studyRoomDesc')}
                  </p>

                  {/* Discordスタイルの参加者アバタースタック（入室中のメンバーを表示） */}
                  <div className="flex items-center justify-between gap-2 my-3 p-2 rounded-xl bg-[#FAF0E6]/80 border border-[#D4B08C]/60">
                    <div className="flex items-center -space-x-2 overflow-hidden py-0.5 min-h-[28px]">
                      {roomMembers.length > 0 ? (
                        <>
                          {roomMembers.slice(0, 3).map((m, idx) => (
                            <div
                              key={m.id || idx}
                              title={m.display_name}
                              className="relative inline-flex items-center justify-center w-7 h-7 rounded-full border-2 border-[#FFFDF9] bg-[#FAF3EB] text-[#3D2314] text-[10px] font-bold shadow-2xs overflow-hidden flex-shrink-0"
                            >
                              {m.avatar_url ? (
                                <img
                                  src={m.avatar_url}
                                  alt={m.display_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>
                                  {m.display_name ? m.display_name.substring(0, 2).toUpperCase() : 'ST'}
                                </span>
                              )}
                            </div>
                          ))}
                          {roomMembers.length > 3 && (
                            <div
                              title={`${roomMembers.length - 3} more members`}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-full border-2 border-[#FFFDF9] bg-[#D95D39] text-white text-[10px] font-bold shadow-2xs flex-shrink-0"
                            >
                              +{roomMembers.length - 3}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-[#854D27]/80 font-body font-medium">
                          <Coffee size={13} className="text-[#D95D39]" />
                          <span>{t('studyEmptyMembers')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-bold font-body">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          roomMembers.length > 0 ? 'bg-[#2E7D6F] animate-pulse' : 'bg-stone-300'
                        }`}
                      />
                      <span className={roomMembers.length > 0 ? 'text-[#2E7D6F]' : 'text-[#854D27]/80'}>
                        {roomMembers.length > 0
                          ? t('studyActiveMembers', { count: String(roomMembers.length) })
                          : t('studyEmptyMembers')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BGM情報および入室ボタン */}
                <div className="pt-3 border-t border-[#D4B08C]/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#5C3A21] font-medium min-w-0 font-body">
                    <Music size={14} className="text-[#D95D39] flex-shrink-0" />
                    <span className="truncate max-w-[100px] sm:max-w-[120px]">
                      {room.current_track_id ? t('studyTrackSelected', { id: room.current_track_id }) : t('studyRoomBgm')}
                    </span>
                    {isPlaying && (
                      <span className="inline-flex items-end gap-0.5 h-3 ml-0.5" aria-hidden="true">
                        <span className="w-0.5 h-2 bg-[#D95D39] rounded-full animate-pulse" />
                        <span className="w-0.5 h-3 bg-[#D95D39] rounded-full animate-pulse delay-75" />
                        <span className="w-0.5 h-1.5 bg-[#D95D39] rounded-full animate-pulse delay-150" />
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleJoinRoom(room)}
                    className="px-4 py-2 rounded-xl bg-[#D95D39] hover:bg-[#C24E2B] active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[44px] flex items-center justify-center font-body"
                  >
                    {t('studyJoinRoom')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-room-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-md p-6 sm:p-7 rounded-2xl bg-[#FFFDF9] border-3 border-[#D4B08C] text-[#3D2314] shadow-[8px_8px_0_#D4B08C]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#D4B08C] mb-4">
              <h2 id="create-room-title" className="text-base font-bold text-[#3D2314] font-heading">
                {t('studyCreateRoom')}
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label={t('close')}
                className="p-1.5 rounded-lg text-[#3D2314] hover:bg-[#FAF0E6] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3D2314] mb-1 font-body">
                  {t('studyRoomName')} *
                </label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder={t('studyRoomNamePlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D4B08C] text-xs text-[#3D2314] placeholder-[#854D27]/40 focus:outline-none focus:border-[#3D2314] font-body"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3D2314] mb-1 font-body">
                  {t('studyRoomDescLabel')}
                </label>
                <textarea
                  rows={2}
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder={t('studyRoomDescPlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D4B08C] text-xs text-[#3D2314] placeholder-[#854D27]/40 focus:outline-none focus:border-[#3D2314] resize-none font-body"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3D2314] mb-1 font-body">
                  {t('studyInitialBgm')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsSongPickerOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D4B08C] text-xs text-[#3D2314] hover:border-[#3D2314] transition-all cursor-pointer font-body min-h-[44px]"
                >
                  <span className="truncate">
                    {selectedTrackId ? t('studyTrackSelected', { id: selectedTrackId }) : t('studySelectTrack')}
                  </span>
                  <Music size={14} className="text-[#D95D39] flex-shrink-0 ml-2" />
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrivateCheckbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-[#D4B08C] text-[#D95D39] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="isPrivateCheckbox" className="text-xs text-[#3D2314] font-medium cursor-pointer font-body">
                  {t('studyPrivateRoomOption')}
                </label>
              </div>

              {isPrivate && (
                <div>
                  <label className="block text-xs font-bold text-[#3D2314] mb-1 font-body">
                    {t('roomPasscode')} *
                  </label>
                  <input
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder={t('studyEnterPasscode')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D4B08C] text-xs text-[#3D2314] placeholder-[#854D27]/40 focus:outline-none focus:border-[#3D2314] font-body"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t-2 border-[#D4B08C]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5C3A21] hover:text-[#3D2314] active:scale-95 transition-all cursor-pointer min-h-[44px]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#D95D39] hover:bg-[#c44e2b] text-white text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
                >
                  {isSubmitting ? t('studyCreatingRoom') : t('createRoom')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Private Room Passcode Dialog */}
      {joiningRoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="private-room-join-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#FFFDF9] border-3 border-[#D4B08C] text-[#3D2314] shadow-[8px_8px_0_#D4B08C]">
            <h2 id="private-room-join-title" className="text-base font-bold text-[#3D2314] mb-1 font-heading">
              {t('studyPrivateRoom')}
            </h2>
            <p className="text-xs text-[#5C3A21] font-medium mb-4 truncate font-body">{joiningRoom.name}</p>

            <input
              type="password"
              autoFocus
              value={joinPasscode}
              onChange={(e) => {
                setJoinPasscode(e.target.value)
                setPasscodeError(false)
              }}
              placeholder={t('studyEnterPasscode')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D4B08C] text-xs text-[#3D2314] focus:outline-none focus:border-[#3D2314] mb-2 font-body"
            />

            {passcodeError && (
              <p className="text-[11px] text-rose-600 font-semibold mb-3 font-body">{t('studyIncorrectPasscode')}</p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setJoiningRoom(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5C3A21] hover:text-[#3D2314] active:scale-95 cursor-pointer min-h-[44px]"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmPrivateJoin}
                className="px-4 py-2 rounded-xl bg-[#D95D39] hover:bg-[#c44e2b] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer min-h-[44px]"
              >
                {t('studyJoinRoom')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Solo Zen Focus Modal */}
      <ZenFocusModal isOpen={isZenSoloOpen} onClose={() => setIsZenSoloOpen(false)} />

      {/* Song Picker Modal when creating room */}
      <SongPickerModal
        isOpen={isSongPickerOpen}
        onClose={() => setIsSongPickerOpen(false)}
        onConfirm={(ref) => {
          setSelectedTrackId(ref)
          setIsSongPickerOpen(false)
        }}
        initialValue={selectedTrackId || undefined}
      />
    </div>
  )
}
