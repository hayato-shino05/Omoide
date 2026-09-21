'use client'

import { forwardRef, ButtonHTMLAttributes, useState } from 'react'
import { Icon } from './Icon'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'gradient' | 'vintage'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  rounded?: 'default' | 'full' | 'none'
  ripple?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#854D27] hover:bg-[#6e3e1e] text-[#FFF9F3] border-2 border-[#D4B08C] shadow-[3px_3px_0_#D4B08C] hover:shadow-[4px_4px_0_#D4B08C] active:shadow-[1px_1px_0_#D4B08C]',
  secondary: 'bg-[#FFF9F3] hover:bg-[#FAF0E6] text-[#854D27] border-2 border-[#D4B08C] shadow-[3px_3px_0_#D4B08C] hover:shadow-[4px_4px_0_#D4B08C] active:shadow-[1px_1px_0_#D4B08C]',
  vintage: 'bg-[#854D27] hover:bg-[#6e3e1e] text-[#FFF9F3] border-2 border-[#D4B08C] shadow-[4px_4px_0_#D4B08C] hover:shadow-[5px_5px_0_#D4B08C] active:shadow-[2px_2px_0_#D4B08C]',
  ghost: 'bg-transparent hover:bg-white/10 text-white border border-transparent hover:border-white/20',
  danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md shadow-red-500/20 border border-red-400/30',
  success: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 border border-emerald-400/30',
  gradient: 'bg-gradient-to-r from-amber-700 via-orange-600 to-[#854D27] hover:from-amber-800 hover:to-[#6e3e1e] text-white shadow-md shadow-orange-900/20 border border-[#D4B08C]/50',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1 min-h-[32px]',
  sm: 'px-3 py-1.5 text-sm gap-1.5 min-h-[38px]',
  md: 'px-4 py-2 text-base gap-2 min-h-[44px]',
  lg: 'px-6 py-3 text-lg gap-2 min-h-[48px]',
  xl: 'px-8 py-3.5 text-xl gap-3 min-h-[56px]',
}

const roundedClasses = {
  default: 'rounded-lg',
  full: 'rounded-full',
  none: 'rounded-none',
}

const iconSizeClasses: Record<ButtonSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading,
      leftIcon,
      rightIcon,
      fullWidth = false,
      rounded = 'default',
      ripple = true,
      children,
      className = '',
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled && !isLoading) {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const id = Date.now()

        setRipples((prev) => [...prev, { x, y, id }])
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id))
        }, 600)
      }

      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={`
          relative inline-flex items-center justify-center font-medium
          transition-all duration-150 ease-out
          transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF9F3]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:translate-y-0 disabled:active:scale-100 disabled:shadow-none
          overflow-hidden cursor-pointer select-none
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${roundedClasses[rounded]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {/* リップルエフェクト */}
        {ripples.map((r) => (
          <span
            key={r.id}
            className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
            style={{
              left: r.x,
              top: r.y,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* ローディングスピナー */}
        {isLoading && (
          <Icon name="LoaderCircle" size={20} className={`animate-spin ${iconSizeClasses[size]}`} />
        )}

        {/* 左側のアイコン */}
        {!isLoading && leftIcon && (
          <span className={iconSizeClasses[size]}>{leftIcon}</span>
        )}

        {/* ボタンテキスト */}
        <span className={isLoading ? 'opacity-0' : ''}>{children}</span>
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Icon name="LoaderCircle" size={20} className={`animate-spin ${iconSizeClasses[size]}`} />
          </span>
        )}

        {/* 右側のアイコン */}
        {!isLoading && rightIcon && (
          <span className={iconSizeClasses[size]}>{rightIcon}</span>
        )}

        {/* ホバー時の光沢エフェクト */}
        <span className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button

// アイコンボタン用バリアント
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', className = '', ...props }, ref) => {
    const iconButtonSizes: Record<ButtonSize, string> = {
      xs: 'w-8 h-8 min-w-[32px] min-h-[32px]',
      sm: 'w-10 h-10 min-w-[40px] min-h-[40px]',
      md: 'w-11 h-11 min-w-[44px] min-h-[44px]',
      lg: 'w-12 h-12 min-w-[48px] min-h-[48px]',
      xl: 'w-14 h-14 min-w-[56px] min-h-[56px]',
    }

    return (
      <Button
        ref={ref}
        size={size}
        rounded="full"
        className={`${iconButtonSizes[size]} !p-0 ${className}`}
        {...props}
      >
        <span className={iconSizeClasses[size]}>{icon}</span>
      </Button>
    )
  }
)

IconButton.displayName = 'IconButton'
