import type { FocusEvent, KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from 'react'
import type { Bareme } from '@/types/bareme'
import type { Clip } from '@/types/project'
import type { CategoryGroup, SpreadsheetNoteLike } from './types'
import { SpreadsheetTableFooter } from './SpreadsheetTableFooter'
import { SpreadsheetTableHeader } from './SpreadsheetTableHeader'
import { SpreadsheetTableRow } from './SpreadsheetTableRow'

interface SpreadsheetTableProps {
  clips: Clip[]
  sortedClips: Clip[]
  currentClipIndex: number
  currentBareme: Bareme
  categoryGroups: CategoryGroup[]
  hideTotalsSetting: boolean
  hideTotalsUntilAllScored: boolean
  hideAverages: boolean
  showMiniatures: boolean
  thumbnailDefaultSeconds: number
  editingManualClipId: string | null
  cellRefs: MutableRefObject<Map<string, HTMLInputElement>>
  rowRefs: MutableRefObject<Map<number, HTMLTableRowElement>>
  pendingManualCleanupTimeoutsRef: MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>
  getNoteForClip: (clipId: string) => SpreadsheetNoteLike | undefined
  getScoreForClip: (clipId: string) => number
  getCategoryScore: (clipId: string, group: CategoryGroup) => number
  hasAnyScoreInGroup: (clipId: string, group: CategoryGroup) => boolean
  hasAnyScoreInBareme: (clipId: string) => boolean
  onSetCurrentClip: (index: number) => void
  onOpenClipContextMenu: (clipId: string, x: number, y: number) => void
  onOpenPlayerAtFront: () => void
  onSetEditingManualClipId: (clipId: string | null) => void
  onManualClipBlur: (clipId: string, event: FocusEvent<HTMLDivElement>) => void
  onManualClipFieldChange: (clipId: string, field: 'author' | 'displayName', value: string) => void
  onCellChange: (clipId: string, criterionId: string, value: string) => void
  onCellKeyDown: (event: ReactKeyboardEvent, clipIdx: number, critIdx: number) => void
  onToggleScoringCategory: (category: string) => void
}

export function SpreadsheetTable({
  clips,
  sortedClips,
  currentClipIndex,
  currentBareme,
  categoryGroups,
  hideTotalsSetting,
  hideTotalsUntilAllScored,
  hideAverages,
  showMiniatures,
  thumbnailDefaultSeconds,
  editingManualClipId,
  cellRefs,
  rowRefs,
  pendingManualCleanupTimeoutsRef,
  getNoteForClip,
  getScoreForClip,
  getCategoryScore,
  hasAnyScoreInGroup,
  hasAnyScoreInBareme,
  onSetCurrentClip,
  onOpenClipContextMenu,
  onOpenPlayerAtFront,
  onSetEditingManualClipId,
  onManualClipBlur,
  onManualClipFieldChange,
  onCellChange,
  onCellKeyDown,
  onToggleScoringCategory,
}: SpreadsheetTableProps) {
  const critIdxMap = new Map<string, number>()
  for (const [index, criterion] of currentBareme.criteria.entries()) {
    critIdxMap.set(criterion.id, index)
  }

  const currentClip = clips[currentClipIndex]

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse text-xs">
        <SpreadsheetTableHeader
          categoryGroups={categoryGroups}
          currentBareme={currentBareme}
          hideTotalsSetting={hideTotalsSetting}
          onToggleScoringCategory={onToggleScoringCategory}
        />

        <tbody>
          {sortedClips.map((clip, clipIdx) => (
            <SpreadsheetTableRow
              key={clip.id}
              clip={clip}
              clipIdx={clipIdx}
              clips={clips}
              currentBareme={currentBareme}
              critIdxMap={critIdxMap}
              note={getNoteForClip(clip.id)}
              totalScore={getScoreForClip(clip.id)}
              isActive={currentClip?.id === clip.id}
              hideTotalsSetting={hideTotalsSetting}
              hideTotalsUntilAllScored={hideTotalsUntilAllScored}
              showMiniatures={showMiniatures}
              thumbnailDefaultSeconds={thumbnailDefaultSeconds}
              editingManualClipId={editingManualClipId}
              cellRefs={cellRefs}
              rowRefs={rowRefs}
              pendingManualCleanupTimeoutsRef={pendingManualCleanupTimeoutsRef}
              onSetCurrentClip={onSetCurrentClip}
              onOpenClipContextMenu={onOpenClipContextMenu}
              onOpenPlayerAtFront={onOpenPlayerAtFront}
              onSetEditingManualClipId={onSetEditingManualClipId}
              onManualClipBlur={onManualClipBlur}
              onManualClipFieldChange={onManualClipFieldChange}
              onCellChange={onCellChange}
              onCellKeyDown={onCellKeyDown}
            />
          ))}
        </tbody>

        {clips.length > 1 && !hideAverages && !hideTotalsUntilAllScored && (
          <SpreadsheetTableFooter
            clips={clips}
            currentBareme={currentBareme}
            categoryGroups={categoryGroups}
            hideTotalsSetting={hideTotalsSetting}
            hasAnyScoreInGroup={hasAnyScoreInGroup}
            getCategoryScore={getCategoryScore}
            hasAnyScoreInBareme={hasAnyScoreInBareme}
            getScoreForClip={getScoreForClip}
          />
        )}
      </table>
    </div>
  )
}
