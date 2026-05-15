import type { FocusEvent, KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from 'react'
import type { Bareme } from '@/types/bareme'
import type { Clip } from '@/types/project'
import type { SpreadsheetNoteLike } from './types'
import { SpreadsheetClipCell } from '@/components/interfaces/spreadsheet/SpreadsheetClipCell'
import { SpreadsheetCriterionCells } from '@/components/interfaces/spreadsheet/SpreadsheetCriterionCells'

interface SpreadsheetTableRowProps {
  clip: Clip
  clipIdx: number
  clips: Clip[]
  currentBareme: Bareme
  critIdxMap: Map<string, number>
  note: SpreadsheetNoteLike | undefined
  totalScore: number
  isActive: boolean
  hideTotalsSetting: boolean
  hideTotalsUntilAllScored: boolean
  showMiniatures: boolean
  thumbnailDefaultSeconds: number
  editingManualClipId: string | null
  cellRefs: MutableRefObject<Map<string, HTMLInputElement>>
  rowRefs: MutableRefObject<Map<number, HTMLTableRowElement>>
  pendingManualCleanupTimeoutsRef: MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>
  onSetCurrentClip: (index: number) => void
  onOpenClipContextMenu: (clipId: string, x: number, y: number) => void
  onOpenPlayerAtFront: () => void
  onSetEditingManualClipId: (clipId: string | null) => void
  onManualClipBlur: (clipId: string, event: FocusEvent<HTMLDivElement>) => void
  onManualClipFieldChange: (
    clipId: string,
    field: 'author' | 'displayName' | 'contestCategory',
    value: string,
  ) => void
  onCellChange: (clipId: string, criterionId: string, value: string) => void
  onCellKeyDown: (event: ReactKeyboardEvent, clipIdx: number, critIdx: number) => void
  onShowSubcategoryBubble: (params: {
    clip: Clip
    note: SpreadsheetNoteLike | undefined
    criterionId?: string
    x: number
    y: number
  }) => void
}

export function SpreadsheetTableRow({
  clip,
  clipIdx,
  clips,
  currentBareme,
  critIdxMap,
  note,
  totalScore,
  isActive,
  hideTotalsSetting,
  hideTotalsUntilAllScored,
  showMiniatures,
  thumbnailDefaultSeconds,
  editingManualClipId,
  cellRefs,
  rowRefs,
  pendingManualCleanupTimeoutsRef,
  onSetCurrentClip,
  onOpenClipContextMenu,
  onOpenPlayerAtFront,
  onSetEditingManualClipId,
  onManualClipBlur,
  onManualClipFieldChange,
  onCellChange,
  onCellKeyDown,
  onShowSubcategoryBubble,
}: SpreadsheetTableRowProps) {
  const isScored = clip.scored || (currentBareme.criteria.length > 0 && currentBareme.criteria.every((criterion) => {
    const score = note?.scores?.[criterion.id]
    if (!score || !score.isValid) return false
    return score.value !== undefined && score.value !== null && score.value !== ''
  }))
  const rowClassName = isActive
    ? 'bg-white/[0.07]'
    : clipIdx % 2 === 0
      ? 'bg-white/4'
      : 'bg-transparent'
  const stickyCellClassName = 'bg-inherit'

  return (
    <tr
      key={clip.id}
      ref={(element) => {
        if (element) rowRefs.current.set(clipIdx, element)
      }}
      className={`transition-colors cursor-pointer ${rowClassName} hover:bg-primary-600/8`}
      onClick={() => {
        const originalIndex = clips.findIndex((item) => item.id === clip.id)
        if (originalIndex !== -1) onSetCurrentClip(originalIndex)
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onOpenClipContextMenu(clip.id, event.clientX, event.clientY)
      }}
    >
      <td
        className={`amv-number-ui w-8 px-2 py-1 text-center text-[10px] text-gray-500 border-r border-gray-800/60 bg-inherit ${stickyCellClassName}`}
      >
        {clipIdx + 1}
      </td>

      <SpreadsheetClipCell
        clip={clip}
        clips={clips}
        isScored={isScored}
        editingManualClipId={editingManualClipId}
        stickyCellClassName={stickyCellClassName}
        showMiniatures={showMiniatures}
        thumbnailDefaultSeconds={thumbnailDefaultSeconds}
        pendingManualCleanupTimeoutsRef={pendingManualCleanupTimeoutsRef}
        onSetCurrentClip={onSetCurrentClip}
        onOpenClipContextMenu={onOpenClipContextMenu}
        onOpenPlayerAtFront={onOpenPlayerAtFront}
        onSetEditingManualClipId={onSetEditingManualClipId}
        onManualClipBlur={onManualClipBlur}
        onManualClipFieldChange={onManualClipFieldChange}
      />

      <SpreadsheetCriterionCells
        clip={clip}
        clipIdx={clipIdx}
        clips={clips}
        currentBareme={currentBareme}
        critIdxMap={critIdxMap}
        note={note}
        cellRefs={cellRefs}
        onCellChange={onCellChange}
        onCellKeyDown={onCellKeyDown}
        onSetCurrentClip={onSetCurrentClip}
        onShowCriterionBubble={(params) => onShowSubcategoryBubble(params)}
      />

      {!hideTotalsSetting && (
        <td className="amv-number-ui px-2 py-1 text-center font-bold text-[11px]">
          <span className={hideTotalsUntilAllScored ? 'text-gray-600' : totalScore > 0 ? 'text-white' : 'text-gray-600'}>
            {hideTotalsUntilAllScored ? '-' : totalScore}
          </span>
        </td>
      )}
    </tr>
  )
}
