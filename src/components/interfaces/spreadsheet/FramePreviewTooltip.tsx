import { createPortal } from 'react-dom'
import { useI18n } from '@/i18n'

interface FramePreviewTooltipState {
  visible: boolean
  left: number
  top: number
  image: string | null
  loading: boolean
}

interface FramePreviewTooltipProps {
  framePreview: FramePreviewTooltipState
}

export function FramePreviewTooltip({ framePreview }: FramePreviewTooltipProps) {
  const { t } = useI18n()
  if (!framePreview.visible) return null

  const preview = (
    <div
      className="fixed z-[9998] pointer-events-none rounded-lg border border-gray-600 bg-surface shadow-2xl overflow-hidden"
      style={{ left: framePreview.left, top: framePreview.top, width: 236 }}
    >
      <div className="h-[132px] bg-black flex items-center justify-center">
        {framePreview.loading ? (
          <span className="text-[10px] text-gray-500">{t('Chargement frame...')}</span>
        ) : framePreview.image ? (
          <img
            src={framePreview.image}
            alt={t('Aperçu frame')}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[10px] text-gray-500">{t('Preview indisponible')}</span>
        )}
      </div>
    </div>
  )

  if (typeof document === 'undefined') {
    return preview
  }

  return createPortal(preview, document.body)
}
