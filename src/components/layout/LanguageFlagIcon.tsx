import type { AppLanguage } from '@/i18n'

interface LanguageFlagIconProps {
  language: AppLanguage
  size?: 'sm' | 'md'
}

const FLAG_DIMENSIONS = {
  sm: { width: 28, height: 18 },
  md: { width: 32, height: 20 },
} as const

function Star({ points }: { points: string }) {
  return <polygon points={points} fill="#facc15" />
}

export function LanguageFlagIcon({
  language,
  size = 'md',
}: LanguageFlagIconProps) {
  const { width, height } = FLAG_DIMENSIONS[size]
  const radius = 5

  return (
    <span
      className="inline-flex overflow-hidden rounded-md border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
      aria-hidden="true"
      style={{ width, height }}
    >
      <svg
        viewBox="0 0 32 20"
        className="h-full w-full"
        role="presentation"
        focusable="false"
      >
        <defs>
          <clipPath id={`flag-${language}-${size}`}>
            <rect x="0" y="0" width="32" height="20" rx={radius} ry={radius} />
          </clipPath>
        </defs>
        <g clipPath={`url(#flag-${language}-${size})`}>
          {language === 'fr' ? (
            <>
              <rect width="10.666" height="20" fill="#2563eb" />
              <rect x="10.666" width="10.666" height="20" fill="#f8fafc" />
              <rect x="21.332" width="10.668" height="20" fill="#dc2626" />
            </>
          ) : null}

          {language === 'en' ? (
            <>
              <rect width="32" height="20" fill="#0f3b8c" />
              <path d="M0 0 L13 8 L32 8 L32 12 L19 12 L32 20 L27.5 20 L16 13 L4.5 20 L0 20 L13 12 L0 12 Z" fill="#ffffff" />
              <path d="M32 0 L19 8 L32 8 L32 12 L19 12 L32 20 L27.5 20 L16 13 L4.5 20 L0 20 L13 12 L0 12 L0 8 L13 8 L0 0 L4.5 0 L16 7 L27.5 0 Z" fill="#ffffff" />
              <path d="M0 0 L14 9 L11.5 9 L0 1.5 Z M32 0 L20.5 9 L18 9 L32 1.5 Z M0 20 L11.5 11 L14 11 L0 18.5 Z M32 20 L18 11 L20.5 11 L32 18.5 Z" fill="#dc2626" />
              <rect x="13" width="6" height="20" fill="#ffffff" />
              <rect y="7" width="32" height="6" fill="#ffffff" />
              <rect x="14" width="4" height="20" fill="#dc2626" />
              <rect y="8" width="32" height="4" fill="#dc2626" />
            </>
          ) : null}

          {language === 'ja' ? (
            <>
              <rect width="32" height="20" fill="#f8fafc" />
              <circle cx="16" cy="10" r="5.4" fill="#dc2626" />
            </>
          ) : null}

          {language === 'ru' ? (
            <>
              <rect width="32" height="6.666" fill="#f8fafc" />
              <rect y="6.666" width="32" height="6.666" fill="#2563eb" />
              <rect y="13.332" width="32" height="6.668" fill="#dc2626" />
            </>
          ) : null}

          {language === 'zh' ? (
            <>
              <rect width="32" height="20" fill="#dc2626" />
              <Star points="6.2,3.2 7.1,5.8 9.8,5.9 7.7,7.5 8.5,10.1 6.2,8.5 3.9,10.1 4.7,7.5 2.6,5.9 5.3,5.8" />
              <Star points="11.2,2.8 11.55,3.8 12.6,3.82 11.75,4.45 12.05,5.45 11.2,4.82 10.35,5.45 10.65,4.45 9.8,3.82 10.85,3.8" />
              <Star points="13.6,5.2 13.95,6.2 15,6.22 14.15,6.85 14.45,7.85 13.6,7.22 12.75,7.85 13.05,6.85 12.2,6.22 13.25,6.2" />
              <Star points="13.2,8.5 13.55,9.5 14.6,9.52 13.75,10.15 14.05,11.15 13.2,10.52 12.35,11.15 12.65,10.15 11.8,9.52 12.85,9.5" />
              <Star points="11,11 11.35,12 12.4,12.02 11.55,12.65 11.85,13.65 11,13.02 10.15,13.65 10.45,12.65 9.6,12.02 10.65,12" />
            </>
          ) : null}

          {language === 'es' ? (
            <>
              <rect width="32" height="20" fill="#c81e1e" />
              <rect y="4" width="32" height="12" fill="#facc15" />
              <rect x="7" y="7" width="3" height="6" rx="0.8" fill="#9a3412" />
              <rect x="7.8" y="8.1" width="1.4" height="3.8" rx="0.4" fill="#fde68a" />
            </>
          ) : null}
        </g>
      </svg>
    </span>
  )
}
