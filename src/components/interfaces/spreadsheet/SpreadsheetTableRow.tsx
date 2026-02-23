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
  onManualClipFieldChange: (clipId: string, field: 'author' | 'displayName', value: string) => void
  onCellChange: (clipId: string, criterionId: string, value: string) => void
  onCellKeyDown: (event: ReactKeyboardEvent, clipIdx: number, critIdx: number) => void
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
}: SpreadsheetTableRowProps) {
  const rowClassName = isActive
    ? 'bg-primary-600/15'
    : clipIdx % 2 === 0
      ? 'bg-surface-dark/30'
      : 'bg-transparent'
  const stickyCellClassName = isActive
    ? 'bg-primary-900/30'
    : clipIdx % 2 === 0
      ? 'bg-surface-dark'
      : 'bg-surface'

  return (
    <tr
      key={clip.id}
      ref={(element) => {
        if (element) rowRefs.current.set(clipIdx, element)
      }}
      className={`transition-colors cursor-pointer ${rowClassName} hover:bg-primary-600/10`}
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
        className={`px-2 py-1 text-center font-mono text-[10px] text-gray-500 border-r border-gray-800 sticky left-0 z-10 ${stickyCellClassName}`}
      >
        {clipIdx + 1}
      </td>

      <SpreadsheetClipCell
        clip={clip}
        clips={clips}
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
      />

      {!hideTotalsSetting && (
        <td className="px-2 py-1 text-center font-mono font-bold text-[11px]">
          <span className={hideTotalsUntilAllScored ? 'text-gray-600' : totalScore > 0 ? 'text-white' : 'text-gray-600'}>
            {hideTotalsUntilAllScored ? '-' : totalScore}
          </span>
        </td>
      )}
    </tr>
  )
}
