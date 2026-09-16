'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sparkles,
  Plus,
  Lock,
  Music,
  Maximize2,
  RefreshCw,
  Search,
  Coffee,
  Users,
  X,
} from 'lucide-react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { fetchStudyRooms, createStudyRoom, joinStudyRoom } from '@/lib/study/client'
import { StudyRoomView } from './StudyRoomView'
import { ZenFocusModal } from './ZenFocusModal'
import SongPickerModal from '@/components/community/SongPickerModal'
import type { StudyRoom } from '@/types/study'

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

  // Khởi tạo anonymous user profile nếu chưa có
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

  const loadRooms = useCallback(async () => {
    setIsLoading(true)
    const data = await fetchStudyRooms()
    setRooms(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true
    fetchStudyRooms().then((data) => {
      if (isMounted) {
        setRooms(data)
        setIsLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const handleJoinRoom = async (room: StudyRoom) => {
    if (room.is_private) {
      setJoiningRoom(room)
      setJoinPasscode('')
      setPasscodeError(false)
      return
    }

    const member = await joinStudyRoom(room.id, {
      user_identifier: userIdentifier,
      display_name: displayName,
    })

    if (member) {
      setRoom(room)
    }
  }

  const handleConfirmPrivateJoin = async () => {
    if (!joiningRoom) return
    if (joiningRoom.passcode && joiningRoom.passcode !== joinPasscode) {
      setPasscodeError(true)
      return
    }

    const member = await joinStudyRoom(joiningRoom.id, {
      user_identifier: userIdentifier,
      display_name: displayName,
    })

    if (member) {
      setRoom(joiningRoom)
      setJoiningRoom(null)
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim() || isSubmitting) return

    setIsSubmitting(true)
    const created = await createStudyRoom({
      name: newRoomName.trim(),
      description: newRoomDesc.trim(),
      host_id: userIdentifier,
      current_track_id: selectedTrackId || undefined,
      is_private: isPrivate,
      passcode: isPrivate ? passcode.trim() : undefined,
    })

    if (created) {
      await joinStudyRoom(created.id, {
        user_identifier: userIdentifier,
        display_name: displayName,
      })
      setRoom(created)
      setIsCreateModalOpen(false)
      setNewRoomName('')
      setNewRoomDesc('')
      setIsPrivate(false)
      setPasscode('')
      setSelectedTrackId(null)
    }
    setIsSubmitting(false)
  }

  // Nếu đang ở trong một phòng, hiển thị StudyRoomView
  if (currentRoom) {
    return <StudyRoomView roomId={currentRoom.id} onLeave={() => loadRooms()} />
  }

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 text-stone-100">
      {/* Hero Banner - Wabi-sabi Modern */}
      <div className="relative overflow-hidden p-6 sm:p-9 rounded-3xl bg-stone-900/90 border border-white/10 shadow-2xl backdrop-blur-2xl mb-7">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Sparkles size={15} />
            <span>{t('studyRoomTitle')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-2.5">
            {t('studyHeroTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mb-6 leading-relaxed">
            {t('studyHeroDesc')}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#D95D39] hover:bg-[#c44e2b] active:scale-95 text-white text-xs font-medium transition-all shadow-[0_4px_20px_rgba(217,93,57,0.35)]"
            >
              <Plus size={16} />
              <span>{t('studyCreateRoom')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsZenSoloOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-stone-200 hover:text-white border border-white/15 text-xs font-medium backdrop-blur-md transition-all shadow-sm"
            >
              <Maximize2 size={16} className="text-amber-300" />
              <span>{t('studySoloZen')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('studySearchPlaceholder')}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-stone-900/70 border border-white/10 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/60 backdrop-blur-xl shadow-inner transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={loadRooms}
          title={t('studyRefreshRooms')}
          aria-label={t('studyRefreshRooms')}
          className="p-2.5 rounded-2xl bg-stone-900/70 hover:bg-stone-800/80 border border-white/10 text-stone-300 hover:text-white transition-all backdrop-blur-md shadow-sm active:scale-95"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Room Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-stone-400">{t('studyLoadingRooms')}</div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-16 text-center text-stone-400 p-8 rounded-3xl bg-stone-900/50 border border-white/10 backdrop-blur-xl">
          <Coffee size={36} className="mx-auto mb-3 text-stone-500 opacity-60" />
          <p className="text-xs sm:text-sm font-medium text-stone-300 mb-1">{t('studyNoRoomsFound')}</p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-[#D95D39]/20 text-amber-200 border border-[#D95D39]/40 text-xs font-medium hover:bg-[#D95D39]/30 active:scale-95 transition-all shadow-sm"
          >
            {t('studyCreateFirstRoom')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="flex flex-col justify-between p-5 rounded-3xl bg-stone-900/75 hover:bg-stone-900/90 border border-white/10 hover:border-amber-500/40 transition-all backdrop-blur-xl shadow-xl hover:shadow-2xl group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-stone-300 font-medium">
                    <Users size={12} className="text-amber-400" />
                    {t('studyMaxDesks', { count: room.max_members })}
                  </span>
                  {room.is_private && (
                    <span className="p-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30" title={t('studyPrivateRoom')}>
                      <Lock size={12} />
                    </span>
                  )}
                </div>

                <h2 className="text-sm sm:text-base font-medium text-white group-hover:text-amber-200 transition-colors mb-1.5 truncate">
                  {room.name}
                </h2>
                <p className="text-xs text-stone-400 line-clamp-2 mb-4 min-h-[34px] leading-relaxed">
                  {room.description || t('studyRoomDesc')}
                </p>
              </div>

              <div className="pt-3.5 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-stone-400 min-w-0">
                  <Music size={14} className="text-amber-400 flex-shrink-0" />
                  <span className="truncate max-w-[110px] sm:max-w-[130px] font-medium">
                    {room.current_track_id ? t('studyTrackSelected', { id: room.current_track_id }) : t('studyRoomBgm')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleJoinRoom(room)}
                  className="px-4 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-200 border border-amber-500/40 text-xs font-medium transition-all shadow-sm"
                >
                  {t('studyJoinRoom')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-room-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        >
          <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-stone-900 border border-white/15 text-stone-100 shadow-[0_16px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h2 id="create-room-title" className="text-sm sm:text-base font-medium text-white">
                {t('studyCreateRoom')}
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  {t('studyRoomName')} *
                </label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder={t('studyRoomNamePlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800/80 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  {t('studyRoomDescLabel')}
                </label>
                <textarea
                  rows={2}
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder={t('studyRoomDescPlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800/80 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500/60 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  {t('studyInitialBgm')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsSongPickerOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-stone-800/80 border border-white/10 text-xs text-stone-300 hover:text-white hover:border-amber-500/30 transition-all"
                >
                  <span className="truncate">
                    {selectedTrackId ? t('studyTrackSelected', { id: selectedTrackId }) : t('studySelectTrack')}
                  </span>
                  <Music size={14} className="text-amber-400 flex-shrink-0 ml-2" />
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrivateCheckbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded bg-stone-800 border-white/20 text-[#D95D39] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="isPrivateCheckbox" className="text-xs text-stone-300 cursor-pointer">
                  {t('studyPrivateRoomOption')}
                </label>
              </div>

              {isPrivate && (
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    {t('roomPasscode')} *
                  </label>
                  <input
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder={t('studyEnterPasscode')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800/80 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-stone-200 active:scale-95 transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#D95D39] hover:bg-[#c44e2b] text-white text-xs font-medium shadow-md active:scale-95 transition-all disabled:opacity-50"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        >
          <div className="w-full max-w-sm p-6 rounded-3xl bg-stone-900 border border-white/15 text-stone-100 shadow-2xl backdrop-blur-2xl">
            <h2 id="private-room-join-title" className="text-sm sm:text-base font-medium text-white mb-1">
              {t('studyPrivateRoom')}
            </h2>
            <p className="text-xs text-stone-400 mb-4 truncate">{joiningRoom.name}</p>

            <input
              type="password"
              autoFocus
              value={joinPasscode}
              onChange={(e) => {
                setJoinPasscode(e.target.value)
                setPasscodeError(false)
              }}
              placeholder={t('studyEnterPasscode')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800/80 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500/60 mb-2"
            />

            {passcodeError && (
              <p className="text-[11px] text-rose-400 mb-3">{t('studyIncorrectPasscode')}</p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setJoiningRoom(null)}
                className="px-3.5 py-2 rounded-xl text-xs text-stone-400 hover:text-stone-200 active:scale-95"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmPrivateJoin}
                className="px-4 py-2 rounded-xl bg-[#D95D39] hover:bg-[#c44e2b] text-white text-xs font-medium shadow-md active:scale-95 transition-all"
              >
                {t('studyJoinRoom')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Song Picker for Room Creation */}
      <SongPickerModal
        isOpen={isSongPickerOpen}
        onClose={() => setIsSongPickerOpen(false)}
        onConfirm={(ref) => {
          const cleanId = ref.includes(':') ? ref.split(':')[1] : ref
          setSelectedTrackId(cleanId)
          setIsSongPickerOpen(false)
        }}
        initialValue={selectedTrackId || undefined}
      />

      {/* Solo Zen Focus Modal */}
      <ZenFocusModal isOpen={isZenSoloOpen} onClose={() => setIsZenSoloOpen(false)} />
    </div>
  )
}

