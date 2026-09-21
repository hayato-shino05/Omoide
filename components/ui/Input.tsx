'use client'

import { forwardRef, InputHTMLAttributes, useState, useId } from 'react'
import { Icon } from './Icon'
import { useOptionalLanguage } from '@/lib/i18n/LanguageContext'
import { DEFAULT_LOCALE, translate } from '@/lib/i18n/resolveLocale'

type InputSize = 'sm' | 'md' | 'lg'
type InputVariant = 'default' | 'filled' | 'flushed'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
  size?: InputSize
  variant?: InputVariant
  isRequired?: boolean
  showCharCount?: boolean
  onClear?: () => void
  showClearButton?: boolean
}

const sizeClasses: Record<InputSize, { input: string; icon: string; label: string }> = {
  sm: { input: 'px-3 py-2 text-sm min-h-[38px]', icon: 'w-4 h-4', label: 'text-xs' },
  md: { input: 'px-4 py-2.5 text-base min-h-[44px]', icon: 'w-5 h-5', label: 'text-sm' },
  lg: { input: 'px-5 py-3.5 text-lg min-h-[50px]', icon: 'w-6 h-6', label: 'text-base' },
}

const variantClasses: Record<InputVariant, { base: string; focus: string }> = {
  default: {
    base: 'bg-white/10 dark:bg-stone-900/60 border border-[#D4B08C]/60 hover:border-[#D4B08C] rounded-xl text-white placeholder-white/50',
    focus: 'focus:border-[#854D27] dark:focus:border-[#D4B08C] focus:ring-2 focus:ring-[#854D27]/25 dark:focus:ring-[#D4B08C]/25',
  },
  filled: {
    base: 'bg-white/15 dark:bg-stone-800/80 border border-transparent hover:border-[#D4B08C]/40 rounded-xl text-white placeholder-white/50',
    focus: 'focus:bg-white/10 dark:focus:bg-stone-900 focus:border-[#854D27] dark:focus:border-[#D4B08C] focus:ring-2 focus:ring-[#854D27]/20',
  },
  flushed: {
    base: 'bg-transparent border-b border-[#D4B08C]/60 hover:border-[#D4B08C] rounded-none px-0 text-white placeholder-white/50',
    focus: 'focus:border-[#854D27] dark:focus:border-[#D4B08C]',
  },
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      size = 'md',
      variant = 'default',
      isRequired,
      showCharCount,
      maxLength,
      onClear,
      showClearButton,
      className = '',
      value,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const language = useOptionalLanguage()
    const clearLabel = language?.t('clear') ?? translate(DEFAULT_LOCALE, 'clear', DEFAULT_LOCALE)
    const [isFocused, setIsFocused] = useState(false)
    const [charCount, setCharCount] = useState(String(value || '').length)
    const inputId = useId()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCharCount(e.target.value.length)
      onChange?.(e)
    }

    const sizeStyle = sizeClasses[size]
    const variantStyle = variantClasses[variant]

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={`block font-medium text-white/90 mb-1.5 ${sizeStyle.label} transition-colors ${
              isFocused ? 'text-[#D4B08C]' : ''
            }`}
          >
            {label}
            {isRequired && <span className="text-rose-400 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex">
          {leftAddon && (
            <div className="flex items-center px-3.5 bg-white/10 border border-r-0 border-[#D4B08C]/60 rounded-l-xl text-white/70 text-sm">
              {leftAddon}
            </div>
          )}

          <div className="relative flex-1">
            {leftIcon && (
              <div
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 transition-colors pointer-events-none ${
                  isFocused ? 'text-[#D4B08C]' : ''
                } ${sizeStyle.icon}`}
              >
                {leftIcon}
              </div>
            )}

            <input
              ref={ref}
              id={inputId}
              value={value}
              onChange={handleChange}
              maxLength={maxLength}
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`
                w-full text-white placeholder-white/45 font-body
                transition-all duration-200 outline-none
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variantStyle.base}
                ${variantStyle.focus}
                ${sizeStyle.input}
                ${leftIcon ? 'pl-10' : ''}
                ${rightIcon || showClearButton ? 'pr-11' : ''}
                ${leftAddon ? 'rounded-l-none' : ''}
                ${rightAddon ? 'rounded-r-none' : ''}
                ${error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/25' : ''}
                ${className}
              `}
              aria-invalid={!!error}
              aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
              {...props}
            />

            {(rightIcon || (showClearButton && value)) && (
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                {showClearButton && value && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="w-11 h-11 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27]"
                    aria-label={clearLabel}
                  >
                    <span aria-hidden="true"><Icon name="X" size={16} className="text-rose-300" /></span>
                  </button>
                )}
                {rightIcon && (
                  <div className={`w-11 h-11 flex items-center justify-center text-white/50 ${sizeStyle.icon}`}>
                    {rightIcon}
                  </div>
                )}
              </div>
            )}
          </div>

          {rightAddon && (
            <div className="flex items-center px-3.5 bg-white/10 border border-l-0 border-[#D4B08C]/60 rounded-r-xl text-white/70 text-sm">
              {rightAddon}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5 min-h-[20px]">
          <div className="flex-1">
            {error && (
              <p
                id={`${inputId}-error`}
                role="alert"
                className="text-xs sm:text-sm text-rose-300 flex items-center gap-1.5 animate-in slide-in-from-top-1 font-medium"
              >
                <span aria-hidden="true"><Icon name="CircleAlert" size={16} className="text-rose-300 flex-shrink-0" /></span>
                <span>{error}</span>
              </p>
            )}
            {helperText && !error && (
              <p id={`${inputId}-helper`} className="text-xs sm:text-sm text-white/60">
                {helperText}
              </p>
            )}
          </div>

          {showCharCount && maxLength && (
            <span
              className={`text-xs ${
                charCount >= maxLength ? 'text-rose-300 font-bold' : 'text-white/50'
              }`}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onSearch?: (value: string) => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
        onSearch((e.target as HTMLInputElement).value)
      }
      onKeyDown?.(e)
    }

    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<Icon name="Search" size={20} className="text-sky-300" />}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)

SearchInput.displayName = 'SearchInput'

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'rightIcon'>>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const language = useOptionalLanguage()
    const passwordAriaLabel = showPassword
      ? (language?.t('passwordHide') ?? translate(DEFAULT_LOCALE, 'passwordHide', DEFAULT_LOCALE))
      : (language?.t('passwordShow') ?? translate(DEFAULT_LOCALE, 'passwordShow', DEFAULT_LOCALE))

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="w-11 h-11 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27]"
            aria-label={passwordAriaLabel}
          >
            {showPassword ? (
              <Icon name="EyeOff" size={20} className="text-amber-300" aria-hidden="true" />
            ) : (
              <Icon name="Eye" size={20} className="text-sky-300" aria-hidden="true" />
            )}
          </button>
        }
        {...props}
      />
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
