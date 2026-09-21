'use client'

import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react'

interface ButtonVintageProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'feature' | 'game'
  size?: 'sm' | 'md' | 'lg'
}

export const ButtonVintage = forwardRef<HTMLButtonElement, ButtonVintageProps>(
  function ButtonVintage(
    {
      children,
      variant = 'primary',
      size = 'md',
      className = '',
      disabled,
      ...props
    },
    ref
  ) {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs min-h-[36px]',
      md: 'px-5 py-2.5 text-sm min-h-[44px]',
      lg: 'px-6 py-3.5 text-base min-h-[50px]',
    }

    const variantClasses = {
      primary: 'bg-[#854D27] text-[#FFF9F3] hover:bg-[#6e3e1e] active:bg-[#5a3217]',
      secondary: 'bg-[#FFF9F3] text-[#854D27] hover:bg-[#FAF0E6] active:bg-[#F3E5D8]',
      feature: 'bg-[#854D27] text-[#FFF9F3] hover:bg-[#6e3e1e] active:bg-[#5a3217]',
      game: 'bg-[#854D27] text-[#FFF9F3] hover:bg-[#6e3e1e] active:bg-[#5a3217]',
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          btn-vintage inline-flex items-center justify-center font-semibold uppercase tracking-wider
          border-2 border-[#D4B08C] rounded-none
          shadow-[4px_4px_0_#D4B08C] hover:shadow-[5px_5px_0_#D4B08C] active:shadow-[1px_1px_0_#D4B08C]
          hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:scale-[0.96]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF9F3]
          transition-all duration-150 ease-out cursor-pointer select-none
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    )
  }
)

ButtonVintage.displayName = 'ButtonVintage'

