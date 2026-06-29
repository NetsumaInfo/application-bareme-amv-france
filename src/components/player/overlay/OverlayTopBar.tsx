import { useRef, type PointerEvent } from 'react'
import { X } from 'lucide-react'
import type { ClipInfo } from '@/components/player/overlay/types'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import { playerGetDetachedRect, playerMoveDetached } from '@/services/tauri'
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
  // The borderless player has no native title bar, so this bar IS the drag
  // handle. A native move loop can't be started from the separate overlay
  // window, so we move the player window ourselves: anchor on pointer-down,
  // then push the new absolute position (rAF-throttled) while dragging.
  const drag = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const pending = useRef<{ x: number; y: number } | null>(null)
  const rafId = useRef<number | null>(null)

  const flush = () => {
    rafId.current = null
    const target = pending.current
    if (!target) return
    pending.current = null
    playerMoveDetached(target.x, target.y).catch(() => {})
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    if ((event.target as HTMLElement).closest('button,a,input,[data-no-drag]')) return
    const startX = event.screenX
    const startY = event.screenY
    void playerGetDetachedRect()
      .then(([x, y]) => {
        drag.current = { startX, startY, baseX: x, baseY: y }
      })
      .catch(() => {})
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const anchor = drag.current
    if (!anchor) return
    const dpr = window.devicePixelRatio || 1
    pending.current = {
      x: Math.round(anchor.baseX + (event.screenX - anchor.startX) * dpr),
      y: Math.round(anchor.baseY + (event.screenY - anchor.startY) * dpr),
    }
    if (rafId.current == null) rafId.current = requestAnimationFrame(flush)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // pointer already released
    }
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={onPin}
      onMouseLeave={onUnpin}
      className={`absolute top-0 left-0 right-0 cursor-move select-none px-3 py-2 @[700px]/overlay:px-6 @[700px]/overlay:py-3
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
