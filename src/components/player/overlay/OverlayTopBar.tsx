import { X } from 'lucide-react'
import type { ClipInfo } from '@/components/player/overlay/types'

interface OverlayTopBarProps {
  clipInfo: ClipInfo
  controlsVisible: boolean
  compactControls: boolean
  isPlayerFullscreen: boolean
  onClose: () => void
}

export function OverlayTopBar({
  clipInfo,
  controlsVisible,
  compactControls,
  isPlayerFullscreen,
  onClose,
}: OverlayTopBarProps) {
  return (
    <div
      className={`absolute top-0 left-0 right-0 ${compactControls ? 'px-3 py-2' : 'px-6 py-4'} ${
        isPlayerFullscreen
          ? 'bg-gradient-to-b from-black/55 via-slate-950/25 to-transparent'
          : 'bg-slate-950/52 border-b border-white/10 backdrop-blur-[3px]'
      } transition-opacity duration-300 ${
        controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`${compactControls ? 'text-base' : 'text-lg'} text-white font-medium drop-shadow-lg truncate`}>
            {clipInfo.name || 'Video'}
          </p>
          {clipInfo.total > 0 && (
            <p className={`${compactControls ? 'text-xs' : 'text-sm'} text-gray-300 drop-shadow`}>
              Clip {clipInfo.index + 1} / {clipInfo.total}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className={`${compactControls ? 'p-1.5' : 'p-2'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0`}
          title="Fermer le lecteur"
        >
          <X size={compactControls ? 14 : 18} />
        </button>
      </div>
    </div>
  )
}
