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
import { fetchStudyRooms, createStudyRoom, joinStudyRoom, getStudyRoom } from '@/lib/study/client'
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

  // Tự động kiểm tra URL query param ?studyRoom=... hoặc #studyRoom=...
  useEffect(() => {
    if (typeof window === 'undefined' || currentRoom) return
    const urlParams = new URLSearchParams(window.location.search)
    const roomIdParam = urlParams.get('studyRoom')
    if (roomIdParam) {
      getStudyRoom(roomIdParam).then((room) => {
        if (room && !room.is_private) {
          joinStudyRoom(room.id, {
            user_identifier: userIdentifier,
            display_name: displayName,
          }).then((m) => {
            if (m) setRoom(room)
          })
        }
      })
    }
  }, [currentRoom, userIdentifier, displayName, setRoom])

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
    <div className="w-full max-w-5xl mx-auto p-2 sm:p-4 text-[#854D27]">
      {/* Hero Banner - Wabi-sabi Modern Warm Paper */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#FFF9F3] via-[#FAF3EB] to-[#F5EBE1] border-2 border-[#D4B08C] shadow-sm mb-6">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-[#D95D39] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={16} />
            <span>{t('studyRoomTitle')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#854D27] mb-2 font-heading">
            {t('studyHeroTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-[#854D27]/80 mb-5 leading-relaxed font-body">
            {t('studyHeroDesc')}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D95D39] hover:bg-[#c44e2b] active:scale-95 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              <span>{t('studyCreateRoom')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsZenSoloOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#FFF9F3] active:scale-95 text-[#854D27] border border-[#D4B08C] text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Maximize2 size={16} className="text-[#D95D39]" />
              <span>{t('studySoloZen')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#854D27]/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('studySearchPlaceholder')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border-2 border-[#D4B08C] text-xs text-[#854D27] placeholder-[#854D27]/40 focus:outline-none focus:border-[#854D27] shadow-inner transition-colors font-body"
          />
        </div>

        <button
          type="button"
          onClick={loadRooms}
          title={t('studyRefreshRooms')}
          aria-label={t('studyRefreshRooms')}
          className="p-2.5 rounded-xl bg-white hover:bg-[#FFF9F3] border-2 border-[#D4B08C] text-[#854D27] transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Room Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#854D27]/60 font-body">{t('studyLoadingRooms')}</div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-14 text-center text-[#854D27] p-8 rounded-2xl bg-white/80 border-2 border-[#D4B08C] shadow-xs">
          <Coffee size={36} className="mx-auto mb-3 text-[#D4B08C]" />
          <p className="text-xs sm:text-sm font-semibold text-[#854D27] mb-1 font-body">{t('studyNoRoomsFound')}</p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-[#D95D39] text-white text-xs font-bold hover:bg-[#c44e2b] active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            {t('studyCreateFirstRoom')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="flex flex-col justify-between p-5 rounded-2xl bg-white border-2 border-[#D4B08C] hover:border-[#854D27] transition-all shadow-xs hover:shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-[#FAF0E6] border border-[#D4B08C]/60 text-[#854D27] font-semibold">
                    <Users size={12} className="text-[#D95D39]" />
                    {t('studyMaxDesks', { count: room.max_members })}
                  </span>
                  {room.is_private && (
                    <span className="p-1 rounded-full bg-[#FAF0E6] text-[#854D27] border border-[#D4B08C]" title={t('studyPrivateRoom')}>
                      <Lock size={12} />
                    </span>
                  )}
                </div>

                <h2 className="text-sm sm:text-base font-bold text-[#854D27] group-hover:text-[#D95D39] transition-colors mb-1 truncate font-heading">
                  {room.name}
                </h2>
                <p className="text-xs text-[#854D27]/70 line-clamp-2 mb-4 min-h-[34px] leading-relaxed font-body">
                  {room.description || t('studyRoomDesc')}
                </p>
              </div>

              <div className="pt-3 border-t border-[#D4B08C]/40 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#854D27]/70 min-w-0 font-body">
                  <Music size={14} className="text-[#D95D39] flex-shrink-0" />
                  <span className="truncate max-w-[110px] sm:max-w-[130px] font-medium">
                    {room.current_track_id ? t('studyTrackSelected', { id: room.current_track_id }) : t('studyRoomBgm')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleJoinRoom(room)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#D95D39] hover:bg-[#c44e2b] active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-md p-6 sm:p-7 rounded-2xl bg-[#FFF9F3] border-3 border-[#D4B08C] text-[#854D27] shadow-[8px_8px_0_#D4B08C]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#D4B08C] mb-4">
              <h2 id="create-room-title" className="text-base font-bold text-[#854D27] font-heading">
                {t('studyCreateRoom')}
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label={t('close')}
                className="p-1.5 rounded-lg text-[#854D27] hover:bg-[#FAF0E6] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#854D27] mb-1 font-body">
                  {t('studyRoomName')} *
                </label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder={t('studyRoomNamePlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D4B08C] text-xs text-[#854D27] placeholder-[#854D27]/40 focus:outline-none focus:border-[#854D27] font-body"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#854D27] mb-1 font-body">
                  {t('studyRoomDescLabel')}
                </label>
                <textarea
                  rows={2}
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder={t('studyRoomDescPlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D4B08C] text-xs text-[#854D27] placeholder-[#854D27]/40 focus:outline-none focus:border-[#854D27] resize-none font-body"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#854D27] mb-1 font-body">
                  {t('studyInitialBgm')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsSongPickerOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D4B08C] text-xs text-[#854D27] hover:border-[#854D27] transition-all cursor-pointer font-body"
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
                <label htmlFor="isPrivateCheckbox" className="text-xs text-[#854D27] font-medium cursor-pointer font-body">
                  {t('studyPrivateRoomOption')}
                </label>
              </div>

              {isPrivate && (
                <div>
                  <label className="block text-xs font-bold text-[#854D27] mb-1 font-body">
                    {t('roomPasscode')} *
                  </label>
                  <input
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder={t('studyEnterPasscode')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D4B08C] text-xs text-[#854D27] placeholder-[#854D27]/40 focus:outline-none focus:border-[#854D27] font-body"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t-2 border-[#D4B08C]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#854D27]/70 hover:text-[#854D27] active:scale-95 transition-all cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#D95D39] hover:bg-[#c44e2b] text-white text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
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
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#FFF9F3] border-3 border-[#D4B08C] text-[#854D27] shadow-[8px_8px_0_#D4B08C]">
            <h2 id="private-room-join-title" className="text-base font-bold text-[#854D27] mb-1 font-heading">
              {t('studyPrivateRoom')}
            </h2>
            <p className="text-xs text-[#854D27]/70 mb-4 truncate font-body">{joiningRoom.name}</p>

            <input
              type="password"
              autoFocus
              value={joinPasscode}
              onChange={(e) => {
                setJoinPasscode(e.target.value)
                setPasscodeError(false)
              }}
              placeholder={t('studyEnterPasscode')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D4B08C] text-xs text-[#854D27] focus:outline-none focus:border-[#854D27] mb-2 font-body"
            />

            {passcodeError && (
              <p className="text-[11px] text-rose-600 font-semibold mb-3 font-body">{t('studyIncorrectPasscode')}</p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setJoiningRoom(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#854D27]/70 hover:text-[#854D27] active:scale-95 cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmPrivateJoin}
                className="px-4 py-2 rounded-xl bg-[#D95D39] hover:bg-[#c44e2b] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
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

