import { useEffect, useMemo } from 'react'
import { Copy, X } from 'lucide-react'
import { useMediaInfoData } from '@/components/player/mediaInfo/useMediaInfoData'
import { buildMediaInfoSections } from '@/components/player/mediaInfo/mediaInfoSections'
import { MediaInfoSectionTable } from '@/components/player/mediaInfo/MediaInfoSectionTable'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'

interface MediaInfoPanelProps {
  clipName: string
  filePath: string
  onClose: () => void
}

export default function MediaInfoPanel({ clipName, filePath, onClose }: MediaInfoPanelProps) {
  const { t } = useI18n()
  const { info, error } = useMediaInfoData({ filePath })

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const sections = useMemo(() => (info ? buildMediaInfoSections(info, t) : []), [info, t])

  const copyToClipboard = async () => {
    if (!info) return
    const content = {
      clip: clipName,
      path: filePath,
      ...info,
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(content, null, 2))
    } catch {
      // Ignore clipboard failures on restricted environments.
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
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
        className="bg-surface border border-gray-700 rounded-xl shadow-2xl w-[520px] max-w-[94vw] max-h-[86vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${t('MediaInfo')} - ${clipName}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-white truncate pr-2">
            {t('MediaInfo')} - {clipName}
          </h3>
          <div className="flex items-center gap-1">
            <HoverTextTooltip text={t('Copier les infos')}>
              <button
                onClick={copyToClipboard}
                aria-label={t('Copier les infos')}
                className="p-1 rounded-sm hover:bg-surface-light text-gray-400 hover:text-white transition-colors shrink-0"
              >
                <Copy size={14} />
              </button>
            </HoverTextTooltip>
            <button
              onClick={onClose}
              className="p-1 rounded-sm hover:bg-surface-light text-gray-400 hover:text-white transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 overflow-y-auto max-h-[68vh]">
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : !info ? (
            <p className="text-gray-500 text-sm">{t('Chargement...')}</p>
          ) : (
            <div className="space-y-4">
              {sections.map((section) => (
                <MediaInfoSectionTable key={section.title} section={section} />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-700">
          <HoverTextTooltip text={filePath}>
            <p className="text-[10px] text-gray-600 truncate">{filePath}</p>
          </HoverTextTooltip>
        </div>
      </div>
    </div>
  )
}
