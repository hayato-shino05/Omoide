'use client'

import { forwardRef, TextareaHTMLAttributes, useId } from 'react'
import { Icon } from './Icon'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  isRequired?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, isRequired, className = '', id, disabled, ...props }, ref) => {
    const autoId = useId()
    const textareaId = id || autoId

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-white/90 mb-1.5 font-body">
            {label}
            {isRequired && <span className="text-rose-400 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          className={`
            w-full px-4 py-3 bg-white/10 dark:bg-stone-900/60 border rounded-xl text-white placeholder-white/45 font-body
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27] dark:focus-visible:ring-[#D4B08C] focus-visible:border-[#854D27]
            transition-colors duration-150 resize-y min-h-[96px]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-rose-400 focus-visible:ring-rose-400/25 focus-visible:border-rose-400' : 'border-[#D4B08C]/60 hover:border-[#D4B08C]'}
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />

        <div className="min-h-[20px] mt-1.5">
          {error && (
            <p
              id={`${textareaId}-error`}
              role="alert"
              className="text-xs sm:text-sm text-rose-300 flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1"
            >
              <span aria-hidden="true"><Icon name="CircleAlert" size={16} className="text-rose-300 flex-shrink-0" /></span>
              <span>{error}</span>
            </p>
          )}

          {helperText && !error && (
            <p id={`${textareaId}-helper`} className="text-xs sm:text-sm text-white/60">
              {helperText}
            </p>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea

