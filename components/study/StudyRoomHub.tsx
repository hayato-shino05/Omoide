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
} from 'lucide-react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { fetchStudyRooms, createStudyRoom, joinStudyRoom } from '@/lib/study/client'
import { StudyRoomView } from './StudyRoomView'
import { ZenFocusModal } from './ZenFocusModal'
import SongPickerModal from '@/components/community/SongPickerModal'
import type { StudyRoom } from '@/types/study'

export function StudyRoomHub() {
  const { currentRoom, userIdentifier, displayName, setRoom, setUserProfile } =
    useStudyRoomStore()

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
    loadRooms()
  }, [loadRooms])

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
      {/* Hero Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-stone-900/90 via-stone-900/60 to-pink-950/30 border border-white/10 shadow-2xl backdrop-blur-xl mb-6">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-pink-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles size={14} />
            <span>Omoide Study & Zen Space / 勉強部屋</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-2">
            Tranquil Co-Working & Focus Room
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mb-6 leading-relaxed">
            Học tập và làm việc cùng bạn bè trong không gian tĩnh lặng Nhật Bản. Đồng bộ nhạc nền BGM, thư giãn với âm thanh mưa & quán cafe, duy trì nhịp tập trung với Pomodoro.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 active:scale-95 text-white text-xs font-medium transition-all shadow-lg shadow-pink-500/20"
            >
              <Plus size={16} />
              <span>Create Study Room / 部屋作成</span>
            </button>

            <button
              type="button"
              onClick={() => setIsZenSoloOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-stone-200 border border-white/10 text-xs font-medium backdrop-blur-md transition-all"
            >
              <Maximize2 size={16} className="text-pink-300" />
              <span>Solo Zen Focus / 一人で集中</span>
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
            placeholder="Search study rooms / 部屋を検索..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-stone-900/60 border border-white/10 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-pink-500/50 backdrop-blur-md"
          />
        </div>

        <button
          type="button"
          onClick={loadRooms}
          aria-label="Refresh Rooms"
          className="p-2.5 rounded-2xl bg-stone-900/60 hover:bg-stone-800/80 border border-white/10 text-stone-300 transition-all backdrop-blur-md"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Room Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-stone-400">Loading rooms / 読み込み中...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-16 text-center text-stone-400 p-8 rounded-3xl bg-stone-900/40 border border-white/5 backdrop-blur-md">
          <Coffee size={32} className="mx-auto mb-2 text-stone-500 opacity-60" />
          <p className="text-xs">No active study rooms found.</p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-3 px-3.5 py-1.5 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-medium hover:bg-pink-500/30 transition-all"
          >
            Create the first room!
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="flex flex-col justify-between p-4 rounded-3xl bg-stone-900/70 hover:bg-stone-900/90 border border-white/10 hover:border-pink-500/30 transition-all backdrop-blur-xl shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-stone-300">
                    Max {room.max_members} desks
                  </span>
                  {room.is_private && (
                    <span className="p-1 rounded-full bg-amber-500/10 text-amber-300">
                      <Lock size={12} />
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-medium text-white group-hover:text-pink-300 transition-colors mb-1 truncate">
                  {room.name}
                </h3>
                <p className="text-xs text-stone-400 line-clamp-2 mb-3 min-h-[32px]">
                  {room.description || 'Focus session with soothing Japanese BGM.'}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-stone-400">
                  <Music size={13} className="text-pink-400" />
                  <span className="truncate max-w-[120px]">Room BGM</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleJoinRoom(room)}
                  className="px-3.5 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 active:scale-95 text-pink-200 border border-pink-500/40 text-xs font-medium transition-all"
                >
                  Join / 入室
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className="w-full max-w-md p-6 rounded-3xl bg-stone-900 border border-white/10 text-stone-100 shadow-2xl backdrop-blur-xl">
            <h2 className="text-base font-medium mb-4">Create Study Room / 勉強部屋を作成</h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs text-stone-400 mb-1">Room Name / 部屋名 *</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Kyoto Night Study..."
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-800 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1">Description / 説明</label>
                <textarea
                  rows={2}
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="Goals, mood, or rules..."
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-800 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1">Initial BGM Track</label>
                <button
                  type="button"
                  onClick={() => setIsSongPickerOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-stone-800 border border-white/10 text-xs text-stone-300 hover:text-white"
                >
                  <span>{selectedTrackId ? `Track #${selectedTrackId}` : 'Select from 205 tracks...'}</span>
                  <Music size={14} className="text-pink-400" />
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrivateCheckbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded bg-stone-800 border-white/20 text-pink-500 focus:ring-0"
                />
                <label htmlFor="isPrivateCheckbox" className="text-xs text-stone-300 cursor-pointer">
                  Private Room (Passcode required)
                </label>
              </div>

              {isPrivate && (
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Passcode / パスコード</label>
                  <input
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter room passcode..."
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-800 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500/50"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-medium shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Room'}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm p-6 rounded-3xl bg-stone-900 border border-white/10 text-stone-100 shadow-2xl backdrop-blur-xl">
            <h3 className="text-sm font-medium mb-1">Private Room / 非公開部屋</h3>
            <p className="text-xs text-stone-400 mb-4">{joiningRoom.name}</p>

            <input
              type="password"
              autoFocus
              value={joinPasscode}
              onChange={(e) => {
                setJoinPasscode(e.target.value)
                setPasscodeError(false)
              }}
              placeholder="Enter passcode..."
              className="w-full px-3.5 py-2 rounded-xl bg-stone-800 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500/50 mb-2"
            />

            {passcodeError && (
              <p className="text-[11px] text-rose-400 mb-3">Incorrect passcode. Please try again.</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setJoiningRoom(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-stone-400 hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPrivateJoin}
                className="px-4 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-medium shadow-md transition-all"
              >
                Join
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
