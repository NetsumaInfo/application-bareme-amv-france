import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { ClipInfo } from '@/components/player/overlay/types'

interface OverlayTransportControlsProps {
  compactControls: boolean
  clipInfo: ClipInfo
  isPlaying: boolean
  onPrevClip: () => void
  onNextClip: () => void
  onSeekRelative: (delta: number) => void
  onTogglePause: () => void
}

export function OverlayTransportControls({
  compactControls,
  clipInfo,
  isPlaying,
  onPrevClip,
  onNextClip,
  onSeekRelative,
  onTogglePause,
}: OverlayTransportControlsProps) {
  return (
    <div className={`flex items-center ${compactControls ? 'gap-1' : 'gap-2'}`}>
      <button
        onClick={onPrevClip}
        className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-default`}
        disabled={clipInfo.index <= 0}
        title="Clip precedent (P)"
      >
        <ChevronLeft size={compactControls ? 18 : 24} />
      </button>

      <button
        onClick={() => onSeekRelative(-5)}
        className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors`}
        title="Reculer 5s"
      >
        <SkipBack size={compactControls ? 16 : 22} />
      </button>

      <button
        onClick={onTogglePause}
        className={`${compactControls ? 'p-2 mx-0.5' : 'p-3.5 mx-1'} rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors`}
        title={isPlaying ? 'Pause (Espace)' : 'Lecture (Espace)'}
      >
        {isPlaying ? <Pause size={compactControls ? 20 : 28} /> : <Play size={compactControls ? 20 : 28} />}
      </button>

      <button
        onClick={() => onSeekRelative(5)}
        className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors`}
        title="Avancer 5s"
      >
        <SkipForward size={compactControls ? 16 : 22} />
      </button>

      <button
        onClick={onNextClip}
        className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-default`}
        disabled={clipInfo.total > 0 && clipInfo.index >= clipInfo.total - 1}
        title="Clip suivant (N)"
      >
        <ChevronRight size={compactControls ? 18 : 24} />
      </button>
    </div>
  )
}
