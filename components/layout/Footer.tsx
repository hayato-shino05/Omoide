'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'

interface FooterProps {
  showSocial?: boolean
}

export default function Footer({ showSocial = true }: FooterProps) {
  const currentYear = new Date().getFullYear()
  const { t } = useLanguage()

  return (
    <footer className="relative z-10 mt-auto">
      <div className="bg-[#FFF9F3]/90 dark:bg-stone-900/90 backdrop-blur-md border-t-2 border-[#D4B08C]">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* 著作権表記 & オーナーリンク */}
            <p className="text-stone-700 dark:text-stone-300 text-xs sm:text-sm text-center md:text-left flex items-center justify-center md:justify-start gap-1.5 flex-wrap font-body">
              <span>© {currentYear} Omoide (想い出箱). {t('createdBy')}</span>
              <a
                href="https://github.com/hayato-shino05"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#854D27] dark:text-[#D4B08C] hover:underline decoration-[#D4B08C] underline-offset-2 transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27] rounded"
              >
                <svg className="w-4 h-4 inline-block" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                hayato-shino05
              </a>
            </p>

            {/* SNS & GitHub リンク */}
            {showSocial && (
              <div className="flex items-center gap-2.5">
                <a
                  href="https://github.com/hayato-shino05"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#FFF9F3] dark:bg-stone-800 border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C] flex items-center justify-center text-[#854D27] dark:text-stone-200 hover:bg-[#FAF0E6] hover:shadow-[3px_3px_0_#D4B08C] active:scale-[0.96] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27]"
                  aria-label="GitHub"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#FFF9F3] dark:bg-stone-800 border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C] flex items-center justify-center text-[#1877F2] hover:bg-[#FAF0E6] hover:shadow-[3px_3px_0_#D4B08C] active:scale-[0.96] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27]"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#FFF9F3] dark:bg-stone-800 border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C] flex items-center justify-center text-[#854D27] dark:text-stone-200 hover:bg-[#FAF0E6] hover:shadow-[3px_3px_0_#D4B08C] active:scale-[0.96] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27]"
                  aria-label="Twitter"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#FFF9F3] dark:bg-stone-800 border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C] flex items-center justify-center text-[#E1306C] hover:bg-[#FAF0E6] hover:shadow-[3px_3px_0_#D4B08C] active:scale-[0.96] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27]"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              </div>
            )}
          </div>
          <p className="mt-3.5 text-center text-stone-500 dark:text-stone-400 text-xs font-body">
            {t('iconsBy')}{' '}
            <a
              href="https://icons8.com/"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-[#854D27] dark:hover:text-[#D4B08C] transition-colors"
            >
              Icons8
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
