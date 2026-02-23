import type { FocusEvent, MutableRefObject } from 'react'
import type { Clip } from '@/types/project'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { ClipMiniaturePreview } from '@/components/interfaces/spreadsheet/miniaturePreview'

interface SpreadsheetClipCellProps {
  clip: Clip
  clips: Clip[]
  editingManualClipId: string | null
  stickyCellClassName: string
  showMiniatures: boolean
  thumbnailDefaultSeconds: number
  pendingManualCleanupTimeoutsRef: MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>
  onSetCurrentClip: (index: number) => void
  onOpenClipContextMenu: (clipId: string, x: number, y: number) => void
  onOpenPlayerAtFront: () => void
  onSetEditingManualClipId: (clipId: string | null) => void
  onManualClipBlur: (clipId: string, event: FocusEvent<HTMLDivElement>) => void
  onManualClipFieldChange: (clipId: string, field: 'author' | 'displayName', value: string) => void
}

export function SpreadsheetClipCell({
  clip,
  clips,
  editingManualClipId,
  stickyCellClassName,
  showMiniatures,
  thumbnailDefaultSeconds,
  pendingManualCleanupTimeoutsRef,
  onSetCurrentClip,
  onOpenClipContextMenu,
  onOpenPlayerAtFront,
  onSetEditingManualClipId,
  onManualClipBlur,
  onManualClipFieldChange,
}: SpreadsheetClipCellProps) {
  const isManual = !clip.filePath
  const shouldEditManual = isManual
    && (editingManualClipId === clip.id || (!clip.author?.trim() && !clip.displayName?.trim()))

  const focusClip = () => {
    const originalIndex = clips.findIndex((item) => item.id === clip.id)
    if (originalIndex !== -1) onSetCurrentClip(originalIndex)
  }

  const handleManualFieldFocus = () => {
    const pending = pendingManualCleanupTimeoutsRef.current.get(clip.id)
    if (pending) {
      clearTimeout(pending)
      pendingManualCleanupTimeoutsRef.current.delete(clip.id)
    }
    focusClip()
  }

  return (
    <td
      className={`px-2 py-1 border-r border-gray-800 sticky left-7 z-10 group/clip ${stickyCellClassName}`}
      onDoubleClick={() => {
        if (!clip.filePath) {
          onSetEditingManualClipId(clip.id)
          return
        }
        onOpenPlayerAtFront()
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onOpenClipContextMenu(clip.id, event.clientX, event.clientY)
      }}
    >
      <div className="flex items-center gap-1 min-w-0">
        <span className="w-2 flex items-center justify-center shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${clip.scored ? 'bg-green-500 opacity-100' : 'opacity-0'}`} />
        </span>
        {clip.filePath ? (
          <div className="truncate flex flex-col min-w-0 leading-tight flex-1">
            <span className="truncate text-primary-300 text-[11px] font-semibold">{getClipPrimaryLabel(clip)}</span>
            {getClipSecondaryLabel(clip) ? (
              <span className="truncate text-[9px] text-gray-500">{getClipSecondaryLabel(clip)}</span>
            ) : null}
            {showMiniatures ? (
              <ClipMiniaturePreview
                clip={clip}
                enabled={showMiniatures}
                defaultSeconds={thumbnailDefaultSeconds}
              />
            ) : null}
          </div>
        ) : shouldEditManual ? (
          <div className="flex flex-col gap-1 min-w-0 flex-1" onBlur={(event) => onManualClipBlur(clip.id, event)}>
            <input
              type="text"
              value={clip.author ?? ''}
              placeholder="Pseudo"
              onClick={(event) => event.stopPropagation()}
              onFocus={handleManualFieldFocus}
              onChange={(event) => onManualClipFieldChange(clip.id, 'author', event.target.value)}
              className="w-full px-1.5 py-0.5 rounded border border-gray-700 bg-surface-dark/70 text-[10px] text-primary-300 placeholder:text-gray-500 focus:outline-none focus:border-primary-500"
            />
            <input
              type="text"
              value={clip.displayName ?? ''}
              placeholder="Nom du clip"
              onClick={(event) => event.stopPropagation()}
              onFocus={handleManualFieldFocus}
              onChange={(event) => onManualClipFieldChange(clip.id, 'displayName', event.target.value)}
              className="w-full px-1.5 py-0.5 rounded border border-gray-700 bg-surface-dark/70 text-[10px] text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
        ) : (
          <div className="truncate flex flex-col min-w-0 leading-tight flex-1">
            <span className="truncate text-primary-300 text-[11px] font-semibold">{getClipPrimaryLabel(clip)}</span>
            {getClipSecondaryLabel(clip) ? (
              <span className="truncate text-[9px] text-gray-500">{getClipSecondaryLabel(clip)}</span>
            ) : null}
          </div>
        )}
      </div>
    </td>
  )
}
