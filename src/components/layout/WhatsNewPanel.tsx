import { useEffect } from 'react'
import { X } from 'lucide-react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import type { ReleaseNote } from '@/constants/releaseNotes'
import { useI18n } from '@/i18n'
import appIconUrl from '@/assets/app-icon.png'

interface WhatsNewPanelProps {
  release: ReleaseNote
  onClose: () => void
}

export function WhatsNewPanel({ release, onClose }: WhatsNewPanelProps) {
  const { t } = useI18n()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-130 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClose()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={t('Fermer')}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-gray-700 bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('Nouveautés')}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-700 bg-blue-500/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <img
              src={appIconUrl}
              alt=""
              aria-hidden="true"
              className="h-9 w-9 shrink-0 rounded-lg object-cover"
            />
            <div>
              <h2 className="text-sm font-semibold text-white">{t('Nouveautés')}</h2>
              <p className="text-xs text-gray-400">{t('Version {version}', { version: release.version })}</p>
            </div>
          </div>
          <HoverTextTooltip text={t('Fermer')}>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('Fermer')}
              className="rounded-sm p-1 text-gray-400 transition-colors hover:bg-surface-light hover:text-white"
            >
              <X size={16} />
            </button>
          </HoverTextTooltip>
        </div>

        <div className="px-5 py-4">
          <ul className="flex flex-col gap-2.5">
            {release.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2.5 text-sm text-gray-200">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" aria-hidden="true" />
                <span className="leading-snug">{t(highlight)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500"
            >
              {t('Continuer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
