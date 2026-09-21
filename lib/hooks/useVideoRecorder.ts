'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface VideoRecorderState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  videoBlob: Blob | null
  videoUrl: string | null
  error: string | null
  hasPermission: boolean
}

// 利用可能な動画 MIME タイプをブラウザごとに安全に取得（iOS Safari対応）
function getSupportedVideoMimeType(): string | undefined {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return undefined
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4;codecs=avc1',
    'video/mp4',
  ]
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return undefined
}

export function useVideoRecorder() {
  const { t } = useLanguage()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const [state, setState] = useState<VideoRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    videoBlob: null,
    videoUrl: null,
    error: null,
    hasPermission: false,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: true,
      })
      streamRef.current = stream
      setState(prev => ({ ...prev, hasPermission: true, error: null }))
      return stream
    } catch {
      setState(prev => ({
        ...prev,
        error: tRef.current('cameraMicPermissionError'),
        hasPermission: false,
      }))
      return null
    }
  }, [])

  const setVideoPreviewRef = useCallback((element: HTMLVideoElement | null) => {
    videoPreviewRef.current = element
    if (element && streamRef.current) {
      element.srcObject = streamRef.current
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        videoBlob: null,
        videoUrl: null,
        error: null,
        duration: 0,
      }))
      chunksRef.current = []

      let stream = streamRef.current
      if (!stream) {
        stream = await requestPermission()
        if (!stream) return
      }

      // プレビューを設定
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
      }

      const supportedMimeType = getSupportedVideoMimeType()
      const mediaRecorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || supportedMimeType || 'video/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setState(prev => {
          // 古い ObjectURL を解放してメモリリークを防止
          if (prev.videoUrl) {
            URL.revokeObjectURL(prev.videoUrl)
          }
          return {
            ...prev,
            videoBlob: blob,
            videoUrl: url,
            isRecording: false,
            isPaused: false,
          }
        })
      }

      mediaRecorder.start(100)

      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }))
      }, 1000)

      setState(prev => ({ ...prev, isRecording: true, isPaused: false }))
    } catch {
      setState(prev => ({
        ...prev,
        error: tRef.current('recordingStartError'),
      }))
    }
  }, [requestPermission])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop()

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [state.isRecording])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setState(prev => ({ ...prev, isPaused: true }))
    }
  }, [state.isRecording, state.isPaused])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume()
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }))
      }, 1000)
      setState(prev => ({ ...prev, isPaused: false }))
    }
  }, [state.isRecording, state.isPaused])

  const resetRecording = useCallback(() => {
    if (state.videoUrl) {
      URL.revokeObjectURL(state.videoUrl)
    }
    setState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false,
      duration: 0,
      videoBlob: null,
      videoUrl: null,
      error: null,
    }))
    chunksRef.current = []
  }, [state.videoUrl])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setState(prev => ({ ...prev, hasPermission: false }))
  }, [])

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // アンマウント時のリソース解放（カメラストリームの停止・タイマー解除・ObjectURL破棄）
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (state.videoUrl) {
        URL.revokeObjectURL(state.videoUrl)
      }
    }
  }, [state.videoUrl])

  return {
    ...state,
    requestPermission,
    setVideoPreviewRef,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    stopCamera,
    formatDuration,
  }
}
