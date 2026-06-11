import { X } from 'lucide-react'
import type { ClipInfo } from '@/components/player/overlay/types'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import type { OverlayIconScale } from '@/components/player/overlay/overlayConstants'

interface OverlayTopBarProps {
  clipInfo: ClipInfo
  controlsVisible: boolean
  iconScale: OverlayIconScale
  onClose: () => void
  onPin?: () => void
  onUnpin?: () => void
}

export function OverlayTopBar({
  clipInfo,
  controlsVisible,
  iconScale,
  onClose,
  onPin,
  onUnpin,
}: OverlayTopBarProps) {
  const { t } = useI18n()
  return (
    <div
      onMouseEnter={onPin}
      onMouseLeave={onUnpin}
      className={`absolute top-0 left-0 right-0 px-3 py-2 @[700px]/overlay:px-6 @[700px]/overlay:py-3
        bg-linear-to-b from-black/45 via-black/15 to-transparent
        transition-opacity duration-300 motion-reduce:transition-none ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {clipInfo.name && (
            <p className="text-base @[700px]/overlay:text-lg text-white font-medium drop-shadow-lg truncate">
              {clipInfo.name}
            </p>
          )}
          {clipInfo.total > 0 && (
            <p className="text-xs @[700px]/overlay:text-sm text-gray-300 drop-shadow-sm">
              {t('Clip')} {clipInfo.index + 1} / {clipInfo.total}
            </p>
          )}
        </div>
        <HoverTextTooltip text={t('Fermer le lecteur')}>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Fermer le lecteur')}
            className="p-1.5 @[700px]/overlay:p-2 rounded-full text-white/80 transition-colors motion-reduce:transition-none
              hover:bg-primary-500/25 hover:text-white
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-0
              shrink-0"
          >
            <X size={iconScale.iconPx < 18 ? 14 : 18} />
          </button>
        </HoverTextTooltip>
      </div>
    </div>
  )
}
