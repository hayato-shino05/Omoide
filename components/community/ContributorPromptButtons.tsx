import { useLanguage } from '@/lib/i18n/LanguageContext'

const promptKeys = [
  'contributorPromptBirthday',
  'contributorPromptMemory',
  'contributorPromptGratitude',
] as const

interface ContributorPromptButtonsProps {
  hasContent: boolean
  onSelect: (prompt: string) => void
}

export function ContributorPromptButtons({ hasContent, onSelect }: ContributorPromptButtonsProps) {
  const { t } = useLanguage()

  return (
    <div
      role="group"
      aria-label={t('contributorPrompts')}
      style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}
    >
      {promptKeys.map((promptKey) => (
        <button
          key={promptKey}
          type="button"
          disabled={hasContent}
          onClick={() => onSelect(t(promptKey))}
          className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
          style={{
            minHeight: '44px',
            padding: '8px 14px',
            border: '1.5px solid #D4B08C',
            borderRadius: '6px',
            background: '#FFF9F3',
            color: '#854D27',
            cursor: hasContent ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.82rem',
            fontWeight: 600,
            opacity: hasContent ? 0.5 : 1,
            boxShadow: '1px 1px 0 #D4B08C',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!hasContent) {
              e.currentTarget.style.borderColor = '#D95D39'
              e.currentTarget.style.background = 'rgba(217, 93, 57, 0.08)'
            }
          }}
          onMouseLeave={(e) => {
            if (!hasContent) {
              e.currentTarget.style.borderColor = '#D4B08C'
              e.currentTarget.style.background = '#FFF9F3'
            }
          }}
        >
          {t(promptKey)}
        </button>
      ))}
    </div>
  )
}
