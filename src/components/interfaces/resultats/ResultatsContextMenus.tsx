import type { MutableRefObject } from 'react'
import type { Clip } from '@/types/project'

interface MenuPosition {
  x: number
  y: number
}

interface MemberMenuState extends MenuPosition {
  index: number
}

interface ClipMenuState extends MenuPosition {
  clipId: string
}

interface ResultatsContextMenusProps {
  memberContextMenu: MemberMenuState | null
  clipContextMenu: ClipMenuState | null
  clips: Clip[]
  memberContextMenuRef: MutableRefObject<HTMLDivElement | null>
  clipContextMenuRef: MutableRefObject<HTMLDivElement | null>
  onCloseMemberMenu: () => void
  onCloseClipMenu: () => void
  onRemoveImportedJudge: (index: number) => void
  onToggleClipScored: (clip: Clip) => void
  onOpenClipNotes: (clip: Clip) => void
  onRemoveClip: (clipId: string) => void
}

export function ResultatsContextMenus({
  memberContextMenu,
  clipContextMenu,
  clips,
  memberContextMenuRef,
  clipContextMenuRef,
  onCloseMemberMenu,
  onCloseClipMenu,
  onRemoveImportedJudge,
  onToggleClipScored,
  onOpenClipNotes,
  onRemoveClip,
}: ResultatsContextMenusProps) {
  return (
    <>
      {memberContextMenu && (
        <div
          ref={memberContextMenuRef}
          className="fixed z-[90] bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[210px]"
          style={{ left: memberContextMenu.x, top: memberContextMenu.y }}
        >
          <button
            onClick={() => {
              onRemoveImportedJudge(memberContextMenu.index)
              onCloseMemberMenu()
            }}
            className="w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:bg-gray-800 transition-colors"
          >
            Supprimer le membre sélectionné
          </button>
        </div>
      )}

      {clipContextMenu && (
        <div
          ref={clipContextMenuRef}
          className="fixed z-[90] bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[210px]"
          style={{ left: clipContextMenu.x, top: clipContextMenu.y }}
        >
          {(() => {
            const clip = clips.find((item) => item.id === clipContextMenu.clipId)
            if (!clip) return null
            return (
              <>
                <button
                  onClick={() => {
                    onToggleClipScored(clip)
                    onCloseClipMenu()
                  }}
                  className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  {clip.scored ? 'Retirer "noté"' : 'Marquer comme noté'}
                </button>
                <div className="border-t border-gray-700 my-0.5" />
                <button
                  onClick={() => {
                    onOpenClipNotes(clip)
                    onCloseClipMenu()
                  }}
                  className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Notes du clip
                </button>
                <div className="border-t border-gray-700 my-0.5" />
              </>
            )
          })()}
          <button
            onClick={() => {
              onRemoveClip(clipContextMenu.clipId)
              onCloseClipMenu()
            }}
            className="w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:bg-gray-800 transition-colors"
          >
            Supprimer la vidéo
          </button>
        </div>
      )}
    </>
  )
}
