import type { FocusEvent, MutableRefObject } from 'react'
import type { Clip } from '@/types/project'
import {
  getAuthorCollabLabel,
  getClipPrimaryLabel,
  getClipSecondaryLabel,
  splitAuthorPseudos,
} from '@/utils/formatters'
import { useProjectStore } from '@/store/useProjectStore'
import { ClipMiniaturePreview } from '@/components/interfaces/spreadsheet/miniaturePreview'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'

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
  const multiPseudoDisplayMode = useProjectStore(
    (state) => state.currentProject?.settings.multiPseudoDisplayMode ?? 'collab_mep',
  )

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

  const clipPrimary = getClipPrimaryLabel(clip)
  const collabPseudos = splitAuthorPseudos(clip.author)
  const hasMultiplePseudos = collabPseudos.length > 1
  const fullPseudosLabel = collabPseudos.join(', ')
  const collabLabel = hasMultiplePseudos ? getAuthorCollabLabel(clip.author) : null

  const pseudoColumnWidthClass =
    multiPseudoDisplayMode === 'collab_mep'
      ? 'w-[170px] min-w-[170px] max-w-[170px]'
      : multiPseudoDisplayMode === 'first_three'
        ? 'w-[220px] min-w-[220px] max-w-[220px]'
        : 'w-[300px] min-w-[300px] max-w-[300px]'

  const pseudoDisplayLabel = (() => {
    if (!hasMultiplePseudos) return clipPrimary
    if (multiPseudoDisplayMode === 'collab_mep') return collabLabel ?? clipPrimary
    if (multiPseudoDisplayMode === 'first_three') {
      if (collabPseudos.length <= 3) return fullPseudosLabel
      return `${collabPseudos.slice(0, 3).join(', ')}, ...`
    }
    return fullPseudosLabel
  })()

  const showCollabBadge = hasMultiplePseudos && multiPseudoDisplayMode === 'collab_mep' && Boolean(collabLabel)
  const showPseudoTooltip = hasMultiplePseudos && multiPseudoDisplayMode !== 'all'
  const allowPseudoWrap = hasMultiplePseudos && multiPseudoDisplayMode === 'all'

  const pseudoTextNode = showCollabBadge ? (
    <span className="inline-flex items-center rounded px-1 py-[1px] border border-primary-500/40 bg-primary-500/15 text-primary-200">
      {pseudoDisplayLabel}
    </span>
  ) : (
    pseudoDisplayLabel
  )

  return (
    <td
      className={`px-2 py-1 border-r border-gray-800 sticky left-7 z-20 group/clip ${pseudoColumnWidthClass} ${stickyCellClassName}`}
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
          <div className="flex flex-col min-w-0 w-full leading-tight flex-1">
            <span className={`${allowPseudoWrap ? 'text-primary-300 text-[11px] font-semibold break-words' : 'truncate text-primary-300 text-[11px] font-semibold'}`}>
              {showPseudoTooltip ? (
                <HoverTextTooltip text={fullPseudosLabel}>
                  <span className="inline-flex min-w-0 max-w-full">{pseudoTextNode}</span>
                </HoverTextTooltip>
              ) : (
                pseudoTextNode
              )}
            </span>
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
          <div className="flex flex-col gap-1 min-w-0 w-full flex-1" onBlur={(event) => onManualClipBlur(clip.id, event)}>
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
          <div className="flex flex-col min-w-0 w-full leading-tight flex-1">
            <span className={`${allowPseudoWrap ? 'text-primary-300 text-[11px] font-semibold break-words' : 'truncate text-primary-300 text-[11px] font-semibold'}`}>
              {showPseudoTooltip ? (
                <HoverTextTooltip text={fullPseudosLabel}>
                  <span className="inline-flex min-w-0 max-w-full">{pseudoTextNode}</span>
                </HoverTextTooltip>
              ) : (
                pseudoTextNode
              )}
            </span>
            {getClipSecondaryLabel(clip) ? (
              <span className="truncate text-[9px] text-gray-500">{getClipSecondaryLabel(clip)}</span>
            ) : null}
          </div>
        )}
      </div>
    </td>
  )
}
