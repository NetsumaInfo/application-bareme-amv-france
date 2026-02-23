import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import type { Clip } from '@/types/project'

interface NotationClipHeaderProps {
  clip: Clip
  currentClipIndex: number
  totalClips: number
  hasVideo: boolean
  totalScore: number
  totalPoints: number
  shouldHideTotals: boolean
  onNavigate: (direction: 'next' | 'prev') => void
  onOpenPlayer: () => void
}

export function NotationClipHeader({
  clip,
  currentClipIndex,
  totalClips,
  hasVideo,
  totalScore,
  totalPoints,
  shouldHideTotals,
  onNavigate,
  onOpenPlayer,
}: NotationClipHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0" style={{ background: '#1a1a2e' }}>
        <button
          onClick={() => onNavigate('prev')}
          disabled={currentClipIndex === 0}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div
          className="text-center min-w-0 flex-1 px-2"
          onDoubleClick={hasVideo ? onOpenPlayer : undefined}
          title={hasVideo ? 'Double clic pour ouvrir le lecteur' : 'Aucune vidéo liée à cette ligne'}
        >
          <div className="flex items-center justify-center gap-2 min-w-0 text-[11px] leading-none">
            <button
              onClick={(event) => {
                event.stopPropagation()
                if (!hasVideo) return
                onOpenPlayer()
              }}
              disabled={!hasVideo}
              className="p-0.5 rounded hover:bg-surface-light text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              title={hasVideo ? 'Ouvrir la vidéo' : 'Vidéo indisponible'}
            >
              <Play size={13} />
            </button>
            <span className="font-semibold text-white truncate max-w-[40%]">
              {getClipPrimaryLabel(clip)}
            </span>
            {getClipSecondaryLabel(clip) && (
              <>
                <span className="text-gray-600">-</span>
                <span className="text-primary-400 truncate max-w-[32%]">{getClipSecondaryLabel(clip)}</span>
              </>
            )}
            <span className="text-gray-500 shrink-0">
              {currentClipIndex + 1}/{totalClips}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate('next')}
            disabled={currentClipIndex >= totalClips - 1}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {!shouldHideTotals && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700/50 shrink-0" style={{ background: '#12122a' }}>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Score total</span>
          <span className="text-sm font-bold text-white">
            {totalScore}
            <span className="text-xs text-gray-400 font-normal">/{totalPoints}</span>
          </span>
        </div>
      )}
    </>
  )
}
