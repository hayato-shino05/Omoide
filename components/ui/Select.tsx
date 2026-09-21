'use client'

import { forwardRef, SelectHTMLAttributes, useId } from 'react'
import { Icon } from '@/components/ui/Icon'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  isRequired?: boolean
  options: SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, isRequired, options, placeholder, className = '', id, disabled, ...props }, ref) => {
    const autoId = useId()
    const selectId = id || autoId

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-white/90 mb-1.5 font-body">
            {label}
            {isRequired && <span className="text-rose-400 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`
              w-full px-4 py-2.5 bg-white/10 dark:bg-stone-900/70 border rounded-xl text-white font-body min-h-[44px]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27] dark:focus-visible:ring-[#D4B08C] focus-visible:border-[#854D27]
              transition-colors duration-150 appearance-none cursor-pointer pr-10
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-rose-400 focus-visible:ring-rose-400/25 focus-visible:border-rose-400' : 'border-[#D4B08C]/60 hover:border-[#D4B08C]'}
              ${className}
            `}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-stone-900 text-stone-300">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-stone-900 text-stone-100">
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/60">
            <Icon name="ChevronDown" size={18} aria-hidden="true" />
          </div>
        </div>

        <div className="min-h-[20px] mt-1.5">
          {error && (
            <p
              id={`${selectId}-error`}
              role="alert"
              className="text-xs sm:text-sm text-rose-300 flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1"
            >
              <span aria-hidden="true"><Icon name="CircleAlert" size={16} className="text-rose-300 flex-shrink-0" /></span>
              <span>{error}</span>
            </p>
          )}

          {helperText && !error && (
            <p id={`${selectId}-helper`} className="text-xs sm:text-sm text-white/60">
              {helperText}
            </p>
          )}
        </div>
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select

