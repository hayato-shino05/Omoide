'use client'

interface FeatureButtonProps {
  icon: React.ReactNode
  label: string
  description?: string
  onClick?: () => void
  variant?: 'default' | 'gradient' | 'outline' | 'vintage'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const variantClasses = {
  default: 'bg-[#FFF9F3] dark:bg-stone-900 border-2 border-[#D4B08C] text-[#854D27] dark:text-stone-100 shadow-[3px_3px_0_#D4B08C] hover:shadow-[4px_4px_0_#D4B08C] hover:bg-[#FAF0E6] dark:hover:bg-stone-800',
  vintage: 'bg-[#FFF9F3] dark:bg-stone-900 border-2 border-[#D4B08C] text-[#854D27] dark:text-stone-100 shadow-[4px_4px_0_#D4B08C] hover:shadow-[5px_5px_0_#D4B08C] hover:bg-[#FAF0E6] dark:hover:bg-stone-800',
  gradient: 'bg-gradient-to-r from-[#FFF9F3] to-[#F7EDE2] dark:from-stone-900 dark:to-stone-950 border-2 border-[#D4B08C] text-[#854D27] dark:text-stone-100 shadow-[3px_3px_0_#D4B08C] hover:shadow-[4px_4px_0_#D4B08C]',
  outline: 'bg-transparent border-2 border-[#D4B08C] text-[#854D27] dark:text-stone-100 hover:bg-[#D4B08C]/15',
}

const sizeClasses = {
  sm: 'p-3 min-h-[44px]',
  md: 'p-4 min-h-[56px]',
  lg: 'p-5 sm:p-6 min-h-[68px]',
}

const iconSizeClasses = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-13 h-13',
}

export default function FeatureButton({
  icon,
  label,
  description,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
}: FeatureButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full rounded-2xl border text-left
        transition-all duration-150 ease-out
        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
        hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27] dark:focus-visible:ring-[#D4B08C] focus-visible:ring-offset-2
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      <div className="flex items-center gap-3.5 sm:gap-4">
        <div className={`${iconSizeClasses[size]} rounded-xl bg-[#D4B08C]/25 border border-[#D4B08C] flex items-center justify-center text-[#854D27] dark:text-[#D4B08C] flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm sm:text-base font-heading truncate">{label}</p>
          {description && (
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 truncate mt-0.5 font-body">{description}</p>
          )}
        </div>
        <svg className="w-5 h-5 text-[#854D27]/70 dark:text-[#D4B08C]/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
