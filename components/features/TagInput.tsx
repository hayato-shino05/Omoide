'use client'

import { useState, useCallback } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const { t } = useLanguage()
  const effectivePlaceholder = placeholder ?? t('addTag')
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault()
        const newTag = inputValue.trim().toLowerCase()
        if (!tags.includes(newTag)) {
          onChange([...tags, newTag])
        }
        setInputValue('')
      } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
        onChange(tags.slice(0, -1))
      }
    },
    [inputValue, tags, onChange]
  )

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onChange(tags.filter((tag) => tag !== tagToRemove))
    },
    [tags, onChange]
  )

  return (
    <div className="flex flex-wrap gap-2 p-2.5 border-2 border-[#D4B08C] rounded-lg bg-[#FFF9F3] min-h-[50px] items-center focus-within:border-[#854D27] transition-colors">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 bg-[#854D27] text-[#FFF9F3] rounded-md text-xs font-bold"
        >
          #{tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#FFF9F3] hover:bg-white/20 active:scale-95 transition-all cursor-pointer text-sm font-bold"
            aria-label={`${t('reset')} ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? effectivePlaceholder : ''}
        className="flex-1 min-w-[120px] min-h-[36px] px-2 border-none outline-hidden bg-transparent font-[var(--font-body)] text-sm text-[#2C1810]"
      />
    </div>
  )
}
