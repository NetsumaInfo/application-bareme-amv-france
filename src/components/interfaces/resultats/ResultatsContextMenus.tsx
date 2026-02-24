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

type EmptyMenuState = MenuPosition

interface ResultatsContextMenusProps {
  memberContextMenu: MemberMenuState | null
  clipContextMenu: ClipMenuState | null
  emptyContextMenu: EmptyMenuState | null
  selectedClip: Clip | undefined
  clips: Clip[]
  memberContextMenuRef: MutableRefObject<HTMLDivElement | null>
  clipContextMenuRef: MutableRefObject<HTMLDivElement | null>
  emptyContextMenuRef: MutableRefObject<HTMLDivElement | null>
  onCloseMemberMenu: () => void
  onCloseClipMenu: () => void
  onCloseEmptyMenu: () => void
  onRemoveImportedJudge: (index: number) => void
  onOpenClipInNotation: (clip: Clip) => void
  onOpenDetailedNotes: (clip: Clip) => void
  onImportJudgeJson: () => void
  onRemoveClip: (clipId: string) => void
}

export function ResultatsContextMenus({
  memberContextMenu,
  clipContextMenu,
  emptyContextMenu,
  selectedClip,
  clips,
  memberContextMenuRef,
  clipContextMenuRef,
  emptyContextMenuRef,
  onCloseMemberMenu,
  onCloseClipMenu,
  onCloseEmptyMenu,
  onRemoveImportedJudge,
  onOpenClipInNotation,
  onOpenDetailedNotes,
  onImportJudgeJson,
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
                {clip.filePath ? (
                  <>
                    <button
                      onClick={() => {
                        onOpenClipInNotation(clip)
                        onCloseClipMenu()
                      }}
                      className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                      Ouvrir le lecteur
                    </button>
                    <div className="border-t border-gray-700 my-0.5" />
                  </>
                ) : null}
                <button
                  onClick={() => {
                    onOpenDetailedNotes(clip)
                    onCloseClipMenu()
                  }}
                  className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Notes détaillées des juges
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
            {clips.find((item) => item.id === clipContextMenu.clipId)?.filePath ? 'Supprimer la vidéo' : 'Supprimer la ligne'}
          </button>
        </div>
      )}

      {emptyContextMenu && (
        <div
          ref={emptyContextMenuRef}
          className="fixed z-[90] bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[230px]"
          style={{ left: emptyContextMenu.x, top: emptyContextMenu.y }}
        >
          <button
            onClick={() => {
              onImportJudgeJson()
              onCloseEmptyMenu()
            }}
            className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Importer un JE.json
          </button>
          {selectedClip ? (
            <>
              <div className="border-t border-gray-700 my-0.5" />
              {selectedClip.filePath ? (
                <button
                  onClick={() => {
                    onOpenClipInNotation(selectedClip)
                    onCloseEmptyMenu()
                  }}
                  className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Ouvrir le lecteur (clip sélectionné)
                </button>
              ) : null}
              <button
                onClick={() => {
                  onOpenDetailedNotes(selectedClip)
                  onCloseEmptyMenu()
                }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Notes détaillées des juges (clip sélectionné)
              </button>
            </>
          ) : null}
        </div>
      )}
    </>
  )
}
