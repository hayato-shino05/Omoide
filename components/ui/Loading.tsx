'use client'

import { useEffect, useState } from 'react'
import { Icon } from './Icon'

type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'bars' | 'ring'

interface LoadingProps {
  size?: LoadingSize
  variant?: LoadingVariant
  text?: string
  fullScreen?: boolean
  overlay?: boolean
  color?: string
}

const sizeClasses: Record<LoadingSize, { container: string; text: string }> = {
  xs: { container: 'w-4 h-4', text: 'text-xs' },
  sm: { container: 'w-6 h-6', text: 'text-sm' },
  md: { container: 'w-10 h-10', text: 'text-base' },
  lg: { container: 'w-14 h-14', text: 'text-lg' },
  xl: { container: 'w-20 h-20', text: 'text-xl' },
}

export default function Loading({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  overlay = false,
  color = 'pink',
}: LoadingProps) {
  const sizeStyle = sizeClasses[size]

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div className={`${sizeStyle.container} relative`}>
            <div className={`absolute inset-0 rounded-full border-2 border-white/20`} />
            <div
              className={`absolute inset-0 rounded-full border-2 border-transparent border-t-${color}-500 animate-spin`}
              style={{ borderTopColor: `var(--color-${color}-500, #ec4899)` }}
            />
          </div>
        )

      case 'dots':
        return (
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${size === 'xs' ? 'w-1.5 h-1.5' : size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full bg-[#D95D39] animate-pulse`}
                style={{ animationDelay: `${i * 0.2}s`, animationDuration: '1s' }}
              />
            ))}
          </div>
        )

      case 'pulse':
        return (
          <div className={`${sizeStyle.container} relative`}>
            <div className="absolute inset-0 rounded-full bg-[#D95D39] animate-ping opacity-50" />
            <div className="relative rounded-full bg-[#D95D39] w-full h-full" />
          </div>
        )

      case 'bars':
        return (
          <div className="flex items-end gap-1 h-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1.5 bg-[#D95D39] rounded-full"
                style={{
                  height: `${40 + Math.sin(i) * 30}%`,
                }}
              />
            ))}
          </div>
        )

      case 'ring':
        return (
          <div className={`${sizeStyle.container} relative`}>
            <svg className="animate-spin" viewBox="0 0 50 50">
              <circle
                className="stroke-amber-950/20 dark:stroke-white/20"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="4"
              />
              <circle
                className="stroke-[#D95D39]"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="80, 200"
                strokeDashoffset="0"
              />
            </svg>
          </div>
        )

      default:
        return null
    }
  }

  const content = (
    <div
      className="flex flex-col items-center gap-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {renderLoader()}
      {text ? (
        <p className={`text-[#854D27] dark:text-amber-100 font-medium ${sizeStyle.text}`}>{text}</p>
      ) : (
        <span className="sr-only">読み込み中...</span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-inherit">
        {content}
      </div>
    )
  }

  return content
}

// スケルトン用コンポーネント
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  animate?: boolean
}

export function Skeleton({ className = '', animate = true, style, ...props }: SkeletonProps) {
  return (
    <div
      className={`bg-white/10 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
      style={style}
      {...props}
    />
  )
}

// テキスト用スケルトン
interface TextSkeletonProps {
  lines?: number
  lastLineWidth?: string
}

export function TextSkeleton({ lines = 3, lastLineWidth = '60%' }: TextSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? lastLineWidth : '100%' } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// カード用スケルトン
export function CardSkeleton() {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <TextSkeleton lines={2} />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  )
}

// リスト用スケルトン
interface ListSkeletonProps {
  count?: number
  showAvatar?: boolean
}

export function ListSkeleton({ count = 5, showAvatar = true }: ListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {showAvatar && <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />}
          <div className="flex-1">
            <Skeleton className="h-4 w-2/5 mb-2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

// 画像用スケルトン
interface ImageSkeletonProps {
  aspectRatio?: 'video' | 'square' | 'portrait'
}

export function ImageSkeleton({ aspectRatio = 'video' }: ImageSkeletonProps) {
  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
  }

  return (
    <div className={`${aspectClasses[aspectRatio]} bg-white/10 rounded-xl animate-pulse flex items-center justify-center`}>
      <Icon name="Image" size={48} className="text-sky-300/70" aria-hidden="true" />
    </div>
  )
}

// 進捗バー付きローディング
interface ProgressLoadingProps {
  progress: number
  text?: string
  showPercentage?: boolean
}

export function ProgressLoading({ progress, text, showPercentage = true }: ProgressLoadingProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setDisplayProgress(progress), 100)
    return () => clearTimeout(timer)
  }, [progress])

  return (
    <div className="w-full">
      {(text || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {text && <span className="text-sm text-white/70">{text}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-white">{Math.round(displayProgress)}%</span>
          )}
        </div>
      )}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${displayProgress}%` }}
        />
      </div>
    </div>
  )
}
