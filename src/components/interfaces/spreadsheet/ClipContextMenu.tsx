import type { RefObject } from 'react'
import type { Clip } from '@/types/project'

interface ContextMenuPosition {
  clipId: string
  x: number
  y: number
}

interface ClipContextMenuProps {
  contextMenu: ContextMenuPosition | null
  contextClip: Clip | null
  currentClipId?: string
  showMiniatures: boolean
  contextMenuRef: RefObject<HTMLDivElement | null>
  onToggleScored: (clip: Clip) => void
  onOpenNotes: (clip: Clip) => void
  onAttachVideo: (clip: Clip) => void
  onSetMiniatureFromCurrentFrame: (clip: Clip) => void
  onResetMiniature: (clip: Clip) => void
  onToggleMiniatures: () => void
  onShowMediaInfo: (clip: Clip) => void
  onRemoveClip: (clip: Clip) => void
}

export function ClipContextMenu({
  contextMenu,
  contextClip,
  currentClipId,
  showMiniatures,
  contextMenuRef,
  onToggleScored,
  onOpenNotes,
  onAttachVideo,
  onSetMiniatureFromCurrentFrame,
  onResetMiniature,
  onToggleMiniatures,
  onShowMediaInfo,
  onRemoveClip,
}: ClipContextMenuProps) {
  if (!contextMenu) return null
  const hasVideo = Boolean(contextClip?.filePath)

  return (
    <div
      ref={contextMenuRef}
      className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[160px]"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      {contextClip && (
        <>
          <button
            onClick={() => onToggleScored(contextClip)}
            className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
          >
            {contextClip.scored ? 'Retirer "noté"' : 'Marquer comme noté'}
          </button>
          <div className="border-t border-gray-700 my-0.5" />
          <button
            onClick={() => onOpenNotes(contextClip)}
            className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Notes du clip
          </button>
          {!contextClip.filePath && (
            <button
              onClick={() => onAttachVideo(contextClip)}
              className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Lier une vidéo à cette ligne...
            </button>
          )}
          {showMiniatures && currentClipId === contextClip.id && contextClip.filePath && (
            <>
              <div className="border-t border-gray-700 my-0.5" />
              <button
                onClick={() => onSetMiniatureFromCurrentFrame(contextClip)}
                className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Définir miniature (frame courante)
              </button>
              <button
                onClick={() => onResetMiniature(contextClip)}
                className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Réinitialiser miniature
              </button>
            </>
          )}
          <div className="border-t border-gray-700 my-0.5" />
        </>
      )}
      {hasVideo ? (
        <button
          onClick={onToggleMiniatures}
          className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
        >
          {showMiniatures ? 'Masquer miniatures' : 'Afficher miniatures'}
        </button>
      ) : (
        <div className="w-full text-left px-3 py-1.5 text-[11px] text-gray-600">
          Miniatures indisponibles (pas de vidéo)
        </div>
      )}
      <div className="border-t border-gray-700 my-0.5" />
      <button
        onClick={() => contextClip && onShowMediaInfo(contextClip)}
        disabled={!contextClip?.filePath}
        className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors ${contextClip?.filePath
            ? 'text-gray-300 hover:bg-gray-800'
            : 'text-gray-600 cursor-not-allowed'
          }`}
      >
        {contextClip?.filePath ? 'Afficher MediaInfo' : 'MediaInfo indisponible (pas de vidéo)'}
      </button>
      <div className="border-t border-gray-700 my-0.5" />
      <button
        onClick={() => contextClip && onRemoveClip(contextClip)}
        className="w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:bg-gray-800 transition-colors"
      >
        {contextClip?.filePath ? 'Supprimer la vidéo' : 'Supprimer la ligne'}
      </button>
    </div>
  )
}
