'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { createTimeCapsule, listTimeCapsules, redeemTimeCapsuleByCode, uploadTimeCapsulePhoto } from '@/lib/time-capsule-client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'

export interface CapsuleItem {
  id: string | number
  sender: string
  recipient?: string
  message: string
  photoUrl?: string
  unlockDate: string
  createdAt: string
  isUnlocked: boolean
}

type PendingCapsule = CapsuleItem & { pendingKey?: string; photoObjectPath?: string }
type InviteAccess = { accessCode: string }

const LOCAL_CAPSULES_KEY = 'local_time_capsules'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidDateValue(value: string): boolean {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  }

  return !Number.isNaN(new Date(value).getTime())
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeAccessCode(value: string): string {
  return value.replace(/[\s-]/g, '')
}

function createIdempotencyKey(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `capsule-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// ローカル日付文字列（YYYY-MM-DD）をローカル時間 00:00:00 の Date オブジェクトに変換
function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number)
  if (parts.length === 3 && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0)
  }
  return new Date(dateStr)
}

function parseCapsuleItem(
  value: unknown,
  now: Date,
  format: 'remote' | 'local'
): CapsuleItem | null {
  if (!isRecord(value)) return null

  const id = value.id
  const sender = value.sender
  const message = value.message
  const unlockDate = format === 'remote' ? value.unlock_date : value.unlockDate
  const createdAt = format === 'remote' ? value.created_at : value.createdAt
  const recipient = value.recipient
  const photoUrl = format === 'remote' ? value.photo_url : value.photoUrl

  if (
    !(typeof id === 'string' || typeof id === 'number') ||
    typeof sender !== 'string' ||
    (typeof message !== 'string' && message !== null && message !== undefined) ||
    typeof unlockDate !== 'string' ||
    typeof createdAt !== 'string' ||
    !isValidDateValue(unlockDate) ||
    Number.isNaN(new Date(createdAt).getTime()) ||
    (recipient !== undefined && recipient !== null && typeof recipient !== 'string') ||
    (photoUrl !== undefined && photoUrl !== null && typeof photoUrl !== 'string')
  ) {
    return null
  }

  const isUnlocked = parseLocalDate(unlockDate) <= now
  if (
    (format === 'local' && typeof message !== 'string') ||
    (format === 'remote' && isUnlocked && typeof message !== 'string')
  ) {
    return null
  }

  return {
    id,
    sender,
    recipient: recipient || undefined,
    message: isUnlocked && typeof message === 'string' ? message : '',
    photoUrl: isUnlocked && typeof photoUrl === 'string' ? photoUrl : undefined,
    unlockDate,
    createdAt,
    isUnlocked,
  }
}

export function parseRemoteCapsule(value: unknown, now = new Date()): CapsuleItem | null {
  return parseCapsuleItem(value, now, 'remote')
}

export function parseLocalCapsules(value: unknown, now = new Date()): CapsuleItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => parseCapsuleItem(item, now, 'local'))
    .filter((item): item is CapsuleItem => item !== null)
}

export function populateKeepsakePrintDocument(document: Document, capsule: CapsuleItem, title: string, eventDate: string): void {
  document.title = title
  const style = document.createElement('style')
  style.textContent = 'body{margin:0;padding:24px;background:#fff9f3;color:#542f17;font-family:Georgia,serif}.card{max-width:640px;margin:0 auto;border:2px solid #d4b08c;border-radius:24px;padding:32px}.brand{font:700 12px system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#854d27}.date{font:600 14px system-ui,sans-serif;color:#854d27}.sender{font-size:24px;margin:24px 0 8px}.message{font-size:18px;line-height:1.7;white-space:pre-wrap}.photo{width:100%;max-height:360px;object-fit:cover;border-radius:16px;margin:24px 0 0}@media print{body{padding:0}.card{border:0}}'
  document.head.append(style)

  const card = document.createElement('main')
  card.className = 'card'
  const appendText = (tag: string, className: string, value: string) => {
    const element = document.createElement(tag)
    element.className = className
    element.textContent = value
    card.append(element)
  }

  appendText('p', 'brand', title)
  appendText('p', 'date', eventDate)
  appendText('h1', 'sender', capsule.sender)
  appendText('p', 'message', capsule.message)
  if (capsule.photoUrl) {
    const photo = document.createElement('img')
    photo.className = 'photo'
    photo.src = capsule.photoUrl
    photo.alt = ''
    card.append(photo)
  }
  document.body.replaceChildren(card)
}

export async function waitForKeepsakePhoto(document: Document, timeoutMs = 1500): Promise<boolean> {
  const photo = document.querySelector('img')
  if (!photo) return true
  if (typeof photo.decode !== 'function') throw new Error('photo decode is unavailable')

  if (!photo.complete) {
    const loaded = await new Promise<boolean>((resolve, reject) => {
      let settled = false
      const onLoad = () => finish(true)
      const onError = () => finish(false, new Error('photo load failed'))
      const finish = (success: boolean, error?: Error) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        photo.removeEventListener('load', onLoad)
        photo.removeEventListener('error', onError)
        if (error) reject(error)
        else resolve(success)
      }
      const timeout = setTimeout(() => finish(false), timeoutMs)
      photo.addEventListener('load', onLoad, { once: true })
      photo.addEventListener('error', onError, { once: true })
    })
    if (!loaded) return false
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      photo.decode().then(() => true),
      new Promise<boolean>((resolve) => {
        timeoutId = setTimeout(() => resolve(false), timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export function TimeCapsule() {
  const { t, language } = useLanguage()
  const [capsules, setCapsules] = useState<CapsuleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view')

  // 作成フォームの状態
  const [sender, setSender] = useState('')
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [unlockDate, setUnlockDate] = useState(() => {
    const nextYear = new Date()
    nextYear.setFullYear(nextYear.getFullYear() + 1)
    const y = nextYear.getFullYear()
    const m = String(nextYear.getMonth() + 1).padStart(2, '0')
    const d = String(nextYear.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pendingRetryKey, setPendingRetryKey] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [inviteAccesses, setInviteAccesses] = useState<InviteAccess[]>([])
  const [copiedAccessCode, setCopiedAccessCode] = useState<string | null>(null)
  const [accessCodeInput, setAccessCodeInput] = useState('')
  const [accessError, setAccessError] = useState<string | null>(null)
  const [accessedCapsule, setAccessedCapsule] = useState<CapsuleItem | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [isAccessing, setIsAccessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMountedRef = useRef(true)
  const hasLoadedCapsulesRef = useRef(false)
  const refreshInFlightRef = useRef(false)
  const refreshQueuedRef = useRef(false)
  const isSealingRef = useRef(false)

  // タイムカプセル一覧の取得およびローカル保存データの統合
  const fetchCapsules = useCallback(async () => {
    if (!isMountedRef.current) return
    if (refreshInFlightRef.current) {
      refreshQueuedRef.current = true
      return
    }
    refreshInFlightRef.current = true
    if (!hasLoadedCapsulesRef.current) setLoading(true)
    setLoadError(false)
    try {
      const now = new Date()
      let localRaw: unknown[] = []
      try {
        const localSaved = localStorage.getItem(LOCAL_CAPSULES_KEY)
        const parsed = localSaved ? JSON.parse(localSaved) : []
        if (Array.isArray(parsed)) localRaw = parsed
      } catch {
        localRaw = []
      }

      const initialLocalCapsules = parseLocalCapsules(localRaw, now)
      if (!hasLoadedCapsulesRef.current && initialLocalCapsules.length > 0) {
        setCapsules(initialLocalCapsules)
        hasLoadedCapsulesRef.current = true
        setLoading(false)
      }

      const pendingRaw = localRaw.filter((item): item is PendingCapsule => (
        isRecord(item) && typeof item.pendingKey === 'string'
      ))
      const syncedIds = new Set<string>()
      const syncedInviteAccesses: InviteAccess[] = []
      await Promise.all(pendingRaw.map(async (pending) => {
        try {
          const created = await createTimeCapsule({
            sender: pending.sender,
            recipient: pending.recipient,
            message: pending.message,
            unlockDate: pending.unlockDate,
            ...(typeof pending.photoObjectPath === 'string' ? { photoObjectPath: pending.photoObjectPath } : {}),
          }, pending.pendingKey as string)
          syncedIds.add(String(pending.id))
          if (created.accessCode) {
            syncedInviteAccesses.push({ accessCode: created.accessCode })
          }
        } catch {
          // Keep pending entries for the next refresh.
        }
      }))
      if (pendingRaw.length > 0) {
        setPendingRetryKey(pendingRaw[0].pendingKey ?? null)
      }
      const result = await listTimeCapsules()
      if (syncedIds.size > 0) {
        try {
          const latestSaved = localStorage.getItem(LOCAL_CAPSULES_KEY)
          const latestParsed = latestSaved ? JSON.parse(latestSaved) : []
          const latestRaw = Array.isArray(latestParsed) ? latestParsed : localRaw
          localRaw = latestRaw.filter((item) => !isRecord(item) || !syncedIds.has(String(item.id)))
          localStorage.setItem(LOCAL_CAPSULES_KEY, JSON.stringify(localRaw))
          const remainingPending = localRaw.find((item): item is PendingCapsule => (
            isRecord(item) && typeof item.pendingKey === 'string'
          ))
          const remainingPendingKey = remainingPending?.pendingKey ?? null
          setPendingRetryKey(remainingPendingKey)
          if (!remainingPendingKey) setSubmitError(null)
        } catch {
          // ストレージを再読込できない場合は、取得開始時のデータを維持する。
        }
      }

      const remoteCapsules = result.data
        .map((capsule) => parseRemoteCapsule(capsule, now))
        .filter((capsule): capsule is CapsuleItem => capsule !== null)
      const queryError = null
      const localCapsules = parseLocalCapsules(localRaw, now)

      // リモートとローカルの統合（ID重複を排除）
      const remoteIds = new Set(remoteCapsules.map((c) => String(c.id)))
      const unmergedLocal = localCapsules.filter((c) => !remoteIds.has(String(c.id)))

      const combined = [...remoteCapsules, ...unmergedLocal].sort(
        (a, b) => parseLocalDate(a.unlockDate).getTime() - parseLocalDate(b.unlockDate).getTime()
      )

      if (!isMountedRef.current) return
      if (syncedInviteAccesses.length > 0) {
        setInviteAccesses((current) => [...current, ...syncedInviteAccesses])
        setActiveTab('create')
      }
      setLoadError(Boolean(queryError))
      setCapsules(combined)
      hasLoadedCapsulesRef.current = true
    } catch {
      if (!isMountedRef.current) return
      let localCapsules: CapsuleItem[] = []
      try {
        const localSaved = localStorage.getItem(LOCAL_CAPSULES_KEY)
        localCapsules = parseLocalCapsules(localSaved ? JSON.parse(localSaved) : [], new Date())
      } catch {
        localCapsules = []
      }
      setLoadError(true)
      if (!hasLoadedCapsulesRef.current) {
        setCapsules(localCapsules)
        hasLoadedCapsulesRef.current = true
      }
    } finally {
      refreshInFlightRef.current = false
      if (!isMountedRef.current) return
      setLoading(false)
      if (refreshQueuedRef.current) {
        refreshQueuedRef.current = false
        void fetchCapsules()
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    void fetchCapsules()
    const interval = setInterval(() => {
      void fetchCapsules()
    }, 30000)

    return () => {
      isMountedRef.current = false
      clearInterval(interval)
    }
  }, [fetchCapsules])

  // タイムカプセルの封印処理
  const handleSeal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSealingRef.current || isSubmitting || submitSuccess || !sender.trim() || !message.trim() || !unlockDate) return
    isSealingRef.current = true
    setIsSubmitting(true)
    setSubmitError(null)
    const idempotencyKey = createIdempotencyKey()
    let photoObjectPath: string | undefined
    try {
      const newCapsule: CapsuleItem = {
        id: `capsule-${Date.now()}`,
        sender: sender.trim(),
        recipient: recipient.trim() || undefined,
        message: message.trim(),
        unlockDate,
        createdAt: new Date().toISOString(),
        isUnlocked: parseLocalDate(unlockDate) <= new Date(),
      }
      if (photoFile) photoObjectPath = await uploadTimeCapsulePhoto(photoFile)
      const created = await createTimeCapsule({
        sender: newCapsule.sender,
        recipient: newCapsule.recipient,
        message: newCapsule.message,
        unlockDate: newCapsule.unlockDate,
        photoObjectPath,
      }, idempotencyKey)

      const accessCode = created.accessCode
      if (accessCode) {
        setInviteAccesses((current) => [...current, { accessCode }])
      }
      setSubmitSuccess(true)
      const hasInviteAccess = Boolean(created.accessCode)
      setTimeout(() => {
        setSubmitSuccess(false)
        setSender('')
        setRecipient('')
        setMessage('')
        setPhotoFile(null)
        if (!hasInviteAccess) setActiveTab('view')
        fetchCapsules()
      }, 1200)
    } catch (err) {
      console.error('Failed to seal time capsule:', err)
      if (photoFile && !photoObjectPath) {
        setSubmitError(t('genericError'))
        return
      }
      const pendingCapsule: PendingCapsule = {
        id: `capsule-${Date.now()}`,
        sender: sender.trim(),
        recipient: recipient.trim() || undefined,
        message: message.trim(),
        unlockDate,
        createdAt: new Date().toISOString(),
        isUnlocked: parseLocalDate(unlockDate) <= new Date(),
        pendingKey: idempotencyKey,
        photoObjectPath,
      }
      let pendingSaved = false
      try {
        const saved = localStorage.getItem(LOCAL_CAPSULES_KEY)
        const currentList = saved ? JSON.parse(saved) : []
        const nextList = Array.isArray(currentList) ? currentList : []
        localStorage.setItem(LOCAL_CAPSULES_KEY, JSON.stringify([pendingCapsule, ...nextList]))
        pendingSaved = true
      } catch {
        pendingSaved = false
      }
      if (pendingSaved) setPendingRetryKey(idempotencyKey)
      setSubmitError(t('genericError'))
    } finally {
      isSealingRef.current = false
      setIsSubmitting(false)
    }
  }

  const handleCopyAccessCode = async (accessCode: string) => {
    try {
      await navigator.clipboard.writeText(accessCode)
      setCopiedAccessCode(accessCode)
    } catch (error) {
      console.error('Failed to copy time capsule access code:', error)
    }
  }

  const handleRedeem = async (event: React.FormEvent) => {
    event.preventDefault()
    const normalizedCode = normalizeAccessCode(accessCodeInput.trim())
    const hasValidAccessCode = /^\d{6}$/.test(normalizedCode)
    if (!hasValidAccessCode) return

    setIsAccessing(true)
    setAccessError(null)
    setAccessedCapsule(null)
    try {
      const result = await redeemTimeCapsuleByCode(normalizedCode)
      const capsule = parseRemoteCapsule(result.data)
      if (!capsule) throw new Error('invalid capsule response')
      setAccessedCapsule(capsule)
    } catch {
      setAccessError(t('timeCapsuleRedeemError'))
    } finally {
      setIsAccessing(false)
    }
  }

  const handleExport = async (capsule: CapsuleItem) => {
    setExportError(null)
    let printWindow: Window | null = null
    try {
      printWindow = window.open('', '_blank')
      if (!printWindow) throw new Error('print window blocked')
      printWindow.opener = null
      const eventDate = parseLocalDate(capsule.unlockDate).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US')
      populateKeepsakePrintDocument(printWindow.document, capsule, t('timeCapsuleExportTitle'), eventDate)
      await waitForKeepsakePhoto(printWindow.document)
      printWindow.focus()
      printWindow.print()
    } catch {
      if (printWindow && !printWindow.closed) printWindow.close()
      setExportError(t('timeCapsuleExportError'))
    }
  }

  return (
    <div className="flex flex-col p-2 max-w-lg mx-auto">
      {/* タブ切り替え */}
      <div className="flex rounded-xl bg-[#854D27]/10 p-1 mb-5 border border-[#D4B08C]">
        <button
          onClick={() => setActiveTab('view')}
          className={`flex-1 min-h-[44px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'view'
              ? 'bg-[#854D27] text-[#FFF9F3] shadow-md'
              : 'text-[#854D27] hover:bg-[#854D27]/5'
          }`}
        >
          {t('viewCapsules')}
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 min-h-[44px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'create'
              ? 'bg-[#854D27] text-[#FFF9F3] shadow-md'
              : 'text-[#854D27] hover:bg-[#854D27]/5'
          }`}
        >
          {t('sealNewCapsule')}
        </button>
      </div>

      {activeTab === 'view' ? (
        /* カプセル一覧 */
        <div>
          <form onSubmit={handleRedeem} className="mb-4 space-y-3 rounded-2xl border border-[#D4B08C] bg-[#FFF9F3] p-4">
            <p className="text-xs font-bold text-[#854D27]">{t('timeCapsuleRedeemTitle')}</p>
            <label className="block text-xs font-bold text-[#854D27]">
              {t('timeCapsuleAccessCodeLabel')}
              <input
                id="time-capsule-access-code"
                name="accessCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                value={accessCodeInput}
                onChange={(event) => setAccessCodeInput(event.target.value)}
                placeholder="123 456"
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#D4B08C] bg-white px-3 py-2 font-mono text-xs text-[#854D27]"
              />
            </label>
            <p className="text-[10px] text-[#854D27]/70">{t('timeCapsuleAccessCodeHint')}</p>
            {accessError && <p className="text-xs text-red-600">{accessError}</p>}
            <button type="submit" disabled={isAccessing} className="w-full min-h-[44px] rounded-xl bg-[#854D27] hover:bg-[#6D3D1E] py-2 text-xs font-bold text-[#FFF9F3] disabled:opacity-50 cursor-pointer shadow-[2px_2px_0_#D4B08C] focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none transition-colors">
              {t('timeCapsuleRedeemAction')}
            </button>
            {accessedCapsule && (
              <div className="rounded-xl border border-[#D4B08C] p-3 text-xs text-[#854D27]">
                <p className="font-bold">{accessedCapsule.sender}</p>
                {accessedCapsule.isUnlocked
                  ? <p className="mt-2">{accessedCapsule.message}</p>
                  : <p className="mt-2">{t('timeCapsuleLockedNotice', { date: parseLocalDate(accessedCapsule.unlockDate).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US') })}</p>}
              </div>
            )}
          </form>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-3 border-[#D4B08C]/30 border-t-[#854D27] rounded-full animate-spin" />
              <span className="text-xs text-[#854D27]/80">{t('loading')}</span>
            </div>
          ) : loadError && capsules.length === 0 ? (
            <div className="text-center py-12 bg-[#FFF9F3] border-2 border-dashed border-red-200 rounded-2xl p-6">
              <p className="text-xs text-red-600 mb-4">{t('genericError')}</p>
              <button
                type="button"
                onClick={fetchCapsules}
                className="px-4 py-2 rounded-xl bg-[#854D27] text-[#FFF9F3] text-xs font-bold hover:brightness-110 transition-all cursor-pointer"
              >
                {t('retry')}
              </button>
            </div>
          ) : capsules.length > 0 ? (
            <div>
              {(loadError || exportError) && (
                <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {loadError && <><span>{t('genericError')}</span>{' '}<button type="button" onClick={fetchCapsules} className="font-bold underline cursor-pointer">{t('retry')}</button></>}
                  {loadError && exportError && ' '}
                  {exportError && <span>{exportError}</span>}
                </div>
              )}
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {capsules.map((capsule) => (
                <div
                  key={capsule.id}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    capsule.isUnlocked
                      ? 'bg-[#FFF9F3] border-[#D4B08C] shadow-md'
                      : 'bg-[#854D27]/5 border-dashed border-[#854D27]/40 opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#854D27] flex items-center gap-1.5">
                      <Icon name={capsule.isUnlocked ? 'Folder' : 'Clock'} size={15} /> {capsule.sender}
                      {capsule.recipient ? ` ➔ ${capsule.recipient}` : ''}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#854D27] text-[#FFF9F3]">
                      {capsule.isUnlocked
                        ? t('capsuleUnlocked')
                        : t('timeCapsuleSealed', { date: parseLocalDate(capsule.unlockDate).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US') })}
                    </span>
                  </div>

                  {capsule.isUnlocked ? (
                    <div>
                      {capsule.photoUrl && (
                        <div className="w-full h-44 rounded-xl overflow-hidden mb-3 border border-[#D4B08C]/50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={capsule.photoUrl}
                            alt={t('timeCapsulePhotoAlt')}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <p className="text-xs text-[#854D27] font-serif leading-relaxed italic px-1">
                        &ldquo;{capsule.message}&rdquo;
                      </p>
                      <button
                        type="button"
                        onClick={() => handleExport(capsule)}
                        className="mt-3 min-h-[44px] rounded-xl border border-[#D4B08C] px-3 text-xs font-bold text-[#854D27] hover:bg-[#854D27]/5 focus:outline-none focus:ring-2 focus:ring-[#854D27]"
                      >
                        {t('timeCapsuleExportAction')}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-[#854D27]/70 italic mt-2">
                      {t('timeCapsuleLockedNotice', {
                        date: parseLocalDate(capsule.unlockDate).toLocaleDateString(
                          language === 'ja' ? 'ja-JP' : 'en-US',
                          { year: 'numeric', month: 'short', day: 'numeric' }
                        ),
                      })}
                    </p>
                  )}
                </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-[#FFF9F3] border-2 border-dashed border-[#D4B08C] rounded-2xl p-6">
              <div className="w-12 h-12 rounded-full bg-[#854D27]/10 flex items-center justify-center mx-auto mb-3 text-[#854D27]">
                <Icon name="Archive" size={24} />
              </div>
              <p className="text-xs text-[#854D27]/80 mb-4">
                {t('timeCapsuleEmptyDesc')}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#854D27] text-[#FFF9F3] text-xs font-bold hover:brightness-110 transition-all cursor-pointer"
              >
                {t('timeCapsuleSeal')}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 新規封印フォーム */
        <form onSubmit={handleSeal} className="bg-[#FFF9F3] border-2 border-[#D4B08C] rounded-2xl p-5 shadow-lg space-y-4">
          {(submitError || pendingRetryKey) && (
            <div aria-live="polite" className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              <p>{submitError ?? t('genericError')}</p>
              {pendingRetryKey && (
                <button
                  type="button"
                  onClick={() => void fetchCapsules()}
                  className="mt-2 font-bold underline cursor-pointer"
                >
                  {t('retry')}
                </button>
              )}
            </div>
          )}

          {inviteAccesses.map((inviteAccess) => (
            <div key={inviteAccess.accessCode} className="p-3 rounded-xl bg-[#854D27]/10 border border-[#D4B08C] text-[#854D27] text-xs space-y-2">
              <p className="font-bold">{t('timeCapsuleInviteTitle')}</p>
              <p>{t('timeCapsuleInviteDescription')}</p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 rounded-lg bg-white px-2 py-1 font-mono text-[11px] select-all">
                  {inviteAccess.accessCode}
                </code>
                <button
                  type="button"
                  onClick={() => void handleCopyAccessCode(inviteAccess.accessCode)}
                  className="min-h-[44px] min-w-[44px] rounded-lg border border-[#D4B08C] px-2 text-[10px] font-bold text-[#854D27] hover:bg-[#854D27]/5 cursor-pointer"
                  aria-label={`${t('copyLink')} ${t('timeCapsuleAccessCodeLabel')}`}
                >
                  {copiedAccessCode === inviteAccess.accessCode ? t('copied') : t('copyLink')}
                </button>
              </div>
            </div>
          ))}

          <div>
            <label className="block text-xs font-bold text-[#854D27] mb-1">
              {t('yourName')} <span className="text-red-500">*</span>
            </label>
            <input
              id="time-capsule-sender"
              name="sender"
              type="text"
              required
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder={t('yourName')}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#D4B08C] text-xs text-[#854D27] focus:outline-none focus:ring-2 focus:ring-[#854D27]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#854D27] mb-1">
              {t('recipientOptional')}
            </label>
            <input
              id="time-capsule-recipient"
              name="recipient"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={t('recipientExamplePlaceholder')}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#D4B08C] text-xs text-[#854D27] focus:outline-none focus:ring-2 focus:ring-[#854D27]"
            />
          </div>

          <div>
            <label htmlFor="time-capsule-unlock-date" className="block text-xs font-bold text-[#854D27] mb-1">
              {t('timeCapsuleUnlockDate')} <span className="text-red-500">*</span>
            </label>
            <input
              id="time-capsule-unlock-date"
              name="unlockDate"
              type="date"
              required
              value={unlockDate}
              min={formatLocalDate(new Date())}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#D4B08C] text-xs text-[#854D27] focus:outline-none focus:ring-2 focus:ring-[#854D27]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#854D27] mb-1">
              {t('typeMessage')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="time-capsule-message"
              name="message"
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('capsuleMessagePlaceholder')}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#D4B08C] text-xs text-[#854D27] focus:outline-none focus:ring-2 focus:ring-[#854D27]"
            />
          </div>

          <div>
            <label htmlFor="time-capsule-photo" className="block text-xs font-bold text-[#854D27] mb-1">
              {t('attachPhotoOptional')}
            </label>
            <input
              id="time-capsule-photo"
              name="photo"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              aria-label={photoFile ? `${t('selectPhoto')}: ${photoFile.name}` : t('selectPhoto')}
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[44px] py-2 px-3 rounded-xl border border-dashed border-[#854D27] text-[#854D27] text-xs font-medium hover:bg-[#854D27]/5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Icon name="Camera" size={16} />
              {photoFile ? photoFile.name : t('selectPhoto')}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[44px] py-3 rounded-xl bg-[#854D27] text-[#FFF9F3] font-bold text-xs shadow-md hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSubmitting ? t('uploading') : submitSuccess ? t('sealedSuccess') : t('timeCapsuleSeal')}
          </button>
        </form>
      )}
    </div>
  )
}

export default TimeCapsule
