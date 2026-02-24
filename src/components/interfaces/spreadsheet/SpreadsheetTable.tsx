import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FocusEvent, KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from 'react'
import type { Bareme } from '@/types/bareme'
import type { Clip } from '@/types/project'
import type { CategoryGroup, SpreadsheetNoteLike } from './types'
import { SpreadsheetTableFooter } from './SpreadsheetTableFooter'
import { SpreadsheetTableHeader } from './SpreadsheetTableHeader'
import { SpreadsheetTableRow } from './SpreadsheetTableRow'
import { SpreadsheetSubcategoryBubble } from './SpreadsheetSubcategoryBubble'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'

function normalizeComment(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

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
  onSeekAndPauseToTimecode: (seconds: number) => Promise<void>
  onShowFramePreview: (params: { seconds: number; anchorRect: DOMRect }) => Promise<void>
  onHideFramePreview: () => void
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
  onSeekAndPauseToTimecode,
  onShowFramePreview,
  onHideFramePreview,
}: SpreadsheetTableProps) {
  const [subcategoryBubble, setSubcategoryBubble] = useState<{
    clipId: string
    clipLabel: string
    clipSubLabel: string | null
    x: number
    y: number
    categories: Array<{
      category: string
      color: string
      categoryComment: string | null
      criteria: Array<{
        id: string
        label: string
        comment: string
      }>
    }>
  } | null>(null)
  const hideBubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bubbleRef = useRef<HTMLDivElement | null>(null)
  const [bubbleHovered, setBubbleHovered] = useState(false)

  useEffect(() => {
    if (hideBubbleTimeoutRef.current) {
      clearTimeout(hideBubbleTimeoutRef.current)
      hideBubbleTimeoutRef.current = null
    }

    if (!subcategoryBubble || bubbleHovered) return

    hideBubbleTimeoutRef.current = setTimeout(() => {
      setSubcategoryBubble(null)
      setBubbleHovered(false)
      hideBubbleTimeoutRef.current = null
    }, 6500)

    return () => {
      if (hideBubbleTimeoutRef.current) {
        clearTimeout(hideBubbleTimeoutRef.current)
        hideBubbleTimeoutRef.current = null
      }
    }
  }, [subcategoryBubble, bubbleHovered])

  useEffect(() => {
    if (!subcategoryBubble) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (target && bubbleRef.current?.contains(target)) return
      setSubcategoryBubble(null)
      setBubbleHovered(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setSubcategoryBubble(null)
      setBubbleHovered(false)
    }

    window.addEventListener('mousedown', handlePointerDown, true)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown, true)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [subcategoryBubble])

  const handleShowSubcategoryBubble = useCallback((params: {
    clip: Clip
    note: SpreadsheetNoteLike | undefined
    criterionId?: string
    x: number
    y: number
  }) => {
    const { clip, note, criterionId, x, y } = params

    setSubcategoryBubble({
      clipId: clip.id,
      clipLabel: getClipPrimaryLabel(clip),
      clipSubLabel: getClipSecondaryLabel(clip),
      x,
      y,
      categories: categoryGroups.flatMap((group) => {
        const categoryComment = normalizeComment(note?.categoryNotes?.[group.category])
        const globalComment = normalizeComment(note?.textNotes)
        const criteria = group.criteria
          .filter((criterion) => !criterionId || criterion.id === criterionId)
          .map((criterion) => ({
            id: criterion.id,
            label: criterion.name,
            comment:
              normalizeComment(note?.criterionNotes?.[criterion.id])
              ?? categoryComment
              ?? globalComment
              ?? 'Aucun commentaire',
          }))

        if (criteria.length === 0) return []

        return [{
          category: group.category,
          color: group.color,
          categoryComment: criterionId ? null : categoryComment,
          criteria,
        }]
      }),
    })
    setBubbleHovered(false)
  }, [categoryGroups])

  const handleTimecodeSelect = useCallback(async ({ clipId, seconds }: { clipId: string; seconds: number }) => {
    const targetIndex = clips.findIndex((clip) => clip.id === clipId)
    if (targetIndex === -1) return
    onSetCurrentClip(targetIndex)
    const targetClip = clips[targetIndex]
    if (!targetClip?.filePath) return
    await onSeekAndPauseToTimecode(seconds)
  }, [clips, onSeekAndPauseToTimecode, onSetCurrentClip])

  const critIdxMap = useMemo(() => {
    const nextMap = new Map<string, number>()
    for (const [index, criterion] of currentBareme.criteria.entries()) {
      nextMap.set(criterion.id, index)
    }
    return nextMap
  }, [currentBareme.criteria])

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
              onShowSubcategoryBubble={handleShowSubcategoryBubble}
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

      <SpreadsheetSubcategoryBubble
        bubble={subcategoryBubble}
        bubbleRef={bubbleRef}
        onMouseEnter={() => setBubbleHovered(true)}
        onMouseLeave={() => setBubbleHovered(false)}
        onTimecodeSelect={(payload) => {
          handleTimecodeSelect(payload).catch(() => {})
        }}
        onTimecodeHover={({ seconds, anchorRect }) => {
          onShowFramePreview({ seconds, anchorRect }).catch(() => {})
        }}
        onTimecodeLeave={onHideFramePreview}
      />
    </div>
  )
}
