'use client'

import { forwardRef, HTMLAttributes, useState } from 'react'
import { Icon } from './Icon'

type CardVariant = 'default' | 'glass' | 'solid' | 'gradient' | 'outline' | 'vintage'
type CardSize = 'sm' | 'md' | 'lg'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  size?: CardSize
  hover?: boolean
  glow?: boolean
  animated?: boolean
  as?: 'div' | 'article' | 'section'
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-[#FFF9F3]/95 dark:bg-stone-900/95 text-[#854D27] dark:text-stone-100 border-2 border-[#D4B08C] shadow-[4px_4px_0_#D4B08C]',
  vintage: 'bg-[#FFF9F3] dark:bg-stone-900 text-[#854D27] dark:text-stone-100 border-2 border-[#D4B08C] shadow-[6px_6px_0_#D4B08C]',
  glass: 'bg-white/10 dark:bg-stone-900/80 backdrop-blur-md border border-white/20 dark:border-stone-700/60 text-white shadow-lg',
  solid: 'bg-stone-900/95 border border-stone-800 text-stone-100 shadow-xl',
  gradient: 'bg-gradient-to-br from-[#FFF9F3] to-[#F7EDE2] dark:from-stone-900 dark:to-stone-950 border-2 border-[#D4B08C] text-[#854D27] dark:text-stone-100 shadow-[4px_4px_0_#D4B08C]',
  outline: 'bg-transparent border-2 border-[#D4B08C] text-[#854D27] dark:text-stone-100',
}

const sizeClasses: Record<CardSize, string> = {
  sm: 'p-3.5 sm:p-4 rounded-xl',
  md: 'p-4 sm:p-5 rounded-2xl',
  lg: 'p-5 sm:p-6 rounded-3xl',
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      size = 'md',
      hover = false,
      glow = false,
      animated = false,
      as: Component = 'div',
      className = '',
      children,
      onClick,
      onKeyDown,
      tabIndex,
      role,
      ...props
    },
    ref
  ) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = useState(false)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!glow) return
      const rect = e.currentTarget.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    const isInteractive = Boolean(onClick || hover)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isInteractive && onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onClick(e as unknown as React.MouseEvent<HTMLDivElement>)
      }
      onKeyDown?.(e)
    }

    return (
      <Component
        ref={ref}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={isInteractive && tabIndex === undefined ? 0 : tabIndex}
        role={isInteractive && role === undefined ? 'button' : role}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative overflow-hidden
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${
            hover
              ? 'hover:shadow-[6px_6px_0_#D4B08C] hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:ring-offset-2'
              : ''
          }
          ${animated ? 'animate-in fade-in slide-in-from-bottom-3 duration-300' : ''}
          ${className}
        `}
        {...props}
      >
        {/* グローエフェクト */}
        {glow && isHovered && (
          <div
            className="absolute pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(212, 176, 140, 0.25), transparent 50%)`,
              inset: 0,
            }}
          />
        )}

        {/* コンテンツ */}
        <div className="relative z-10">{children}</div>

        {/* ホバー時の光沢エフェクト */}
        {hover && (
          <div
            className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-700 pointer-events-none ${
              isHovered ? 'translate-x-full' : ''
            }`}
          />
        )}
      </Component>
    )
  }
)

Card.displayName = 'Card'

export default Card

// カードヘッダー
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode
}

export function CardHeader({ children, action, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-3 ${className}`} {...props}>
      <div className="flex-1">{children}</div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// カードタイトル
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  icon?: React.ReactNode
}

export function CardTitle({ children, as: Component = 'h3', icon, className = '', ...props }: CardTitleProps) {
  return (
    <Component className={`text-base sm:text-lg font-bold flex items-center gap-2 font-heading ${className}`} {...props}>
      {icon && <span className="w-5 h-5 sm:w-6 sm:h-6 text-[#854D27] dark:text-[#D4B08C] flex-shrink-0">{icon}</span>}
      {children}
    </Component>
  )
}

// カードの説明文
export function CardDescription({ children, className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  )
}

// カードコンテンツ
export function CardContent({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`text-stone-800 dark:text-stone-200 text-sm ${className}`} {...props}>
      {children}
    </div>
  )
}

// カードフッター
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  justify?: 'start' | 'end' | 'center' | 'between'
}

export function CardFooter({ children, justify = 'end', className = '', ...props }: CardFooterProps) {
  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
  }

  return (
    <div
      className={`flex items-center gap-3 mt-4 pt-3 border-t border-[#D4B08C]/40 ${justifyClasses[justify]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// カード画像
interface CardImageProps {
  src: string
  alt: string
  aspectRatio?: 'video' | 'square' | 'portrait'
  overlay?: boolean
}

export function CardImage({ src, alt, aspectRatio = 'video', overlay = false }: CardImageProps) {
  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
  }

  return (
    <div className={`relative ${aspectClasses[aspectRatio]} -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 mb-4 overflow-hidden rounded-t-xl sm:rounded-t-2xl`}>
      {/* src is caller-provided and may be private or signed; no remote allowlist is available. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full h-full object-cover" />
      {overlay && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />}
    </div>
  )
}

// 統計情報カード
interface StatsCardProps {
  title: string
  value: string | number
  change?: { value: number; label?: string }
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export function StatsCard({ title, value, change, icon, trend }: StatsCardProps) {
  const trendColors = {
    up: 'text-emerald-700 dark:text-emerald-400',
    down: 'text-rose-700 dark:text-rose-400',
    neutral: 'text-stone-600 dark:text-stone-400',
  }

  return (
    <Card variant="default" hover glow>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-1 font-medium">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold font-heading">{value}</p>
          {change && (
            <p className={`text-xs sm:text-sm mt-2 flex items-center gap-1 font-medium ${trendColors[trend || 'neutral']}`}>
              {trend === 'up' && (
                <Icon name="ArrowUp" size={16} className="text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
              )}
              {trend === 'down' && (
                <Icon name="ArrowDown" size={16} className="text-rose-600 dark:text-rose-300" aria-hidden="true" />
              )}
              {change.value > 0 ? '+' : ''}{change.value}%
              {change.label && <span className="opacity-70 ml-1">{change.label}</span>}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#D4B08C]/20 border border-[#D4B08C] flex items-center justify-center text-[#854D27] dark:text-[#D4B08C] flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
