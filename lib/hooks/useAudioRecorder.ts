'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface AudioRecorderState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
  audioUrl: string | null
  error: string | null
}

export function useAudioRecorder() {
  const { t } = useLanguage()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = useCallback(async () => {
    try {
      // 状態をリセット
      setState(prev => ({
        ...prev,
        audioBlob: null,
        audioUrl: null,
        error: null,
        duration: 0,
      }))
      chunksRef.current = []

      // マイクへのアクセス権限をリクエスト
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // MediaRecorder を作成
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4',
      })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        const url = URL.createObjectURL(blob)
        setState(prev => {
          // 古い ObjectURL を解放してメモリリークを防止
          if (prev.audioUrl) {
            URL.revokeObjectURL(prev.audioUrl)
          }
          return {
            ...prev,
            audioBlob: blob,
            audioUrl: url,
            isRecording: false,
            isPaused: false,
          }
        })
      }

      mediaRecorder.start(100) // 100ms ごとにデータを収集

      // 録音時間のタイマーを開始
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }))
      }, 1000)

      setState(prev => ({ ...prev, isRecording: true, isPaused: false }))
    } catch {
      setState(prev => ({
        ...prev,
        error: tRef.current('microphonePermissionError'),
      }))
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop()
      
      // すべてのトラックを停止する
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // タイマーを解除する
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
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl)
    }
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
    })
    chunksRef.current = []
  }, [state.audioUrl])

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // アンマウント時のリソース解放（マイクストリームの停止・タイマー解除・ObjectURL破棄）
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
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl)
      }
    }
  }, [state.audioUrl])

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    formatDuration,
  }
}
