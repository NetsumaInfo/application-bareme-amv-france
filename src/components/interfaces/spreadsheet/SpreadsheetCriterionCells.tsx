import { memo } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from 'react'
import type { Bareme, Criterion } from '@/types/bareme'
import type { Clip } from '@/types/project'
import type { SpreadsheetNoteLike } from '@/components/interfaces/spreadsheet/types'

interface SpreadsheetCriterionCellsProps {
  clip: Clip
  clipIdx: number
  clips: Clip[]
  currentBareme: Bareme
  critIdxMap: Map<string, number>
  note: SpreadsheetNoteLike | undefined
  cellRefs: MutableRefObject<Map<string, HTMLInputElement>>
  getCriterionCellColor: (criterionId: string, value: number) => string | undefined
  onCellChange: (clipId: string, criterionId: string, value: string) => void
  onCellKeyDown: (event: ReactKeyboardEvent, clipIdx: number, critIdx: number) => void
  onSetCurrentClip: (index: number) => void
  onShowCriterionBubble: (params: {
    clip: Clip
    note: SpreadsheetNoteLike | undefined
    criterionId: string
    x: number
    y: number
  }) => void
}

function SpreadsheetCriterionCellsComponent({
  clip,
  clipIdx,
  clips,
  currentBareme,
  critIdxMap,
  note,
  cellRefs,
  getCriterionCellColor,
  onCellChange,
  onCellKeyDown,
  onSetCurrentClip,
  onShowCriterionBubble,
}: SpreadsheetCriterionCellsProps) {
  return (
    <>
      {currentBareme.criteria.map((criterion: Criterion) => {
        const critIdx = critIdxMap.get(criterion.id) ?? 0
        const score = note?.scores[criterion.id]
        const value = score?.value ?? ''
        const numericValue = typeof value === 'number' ? value : Number(value)
        const highlightColor =
          value !== '' && Number.isFinite(numericValue)
            ? getCriterionCellColor(criterion.id, numericValue)
            : undefined

        return (
          <td key={criterion.id} className="px-0.5 py-0.5 border-r border-gray-800 text-center">
            <input
              ref={(element) => {
                if (element) cellRefs.current.set(`${clipIdx}-${critIdx}`, element)
              }}
              type="number"
              min={criterion.min}
              max={criterion.max}
              step={criterion.step || 0.5}
              value={value === '' ? '' : String(value)}
              aria-label={criterion.name}
              style={highlightColor ? { color: highlightColor, fontWeight: 600 } : undefined}
              onChange={(event) => onCellChange(clip.id, criterion.id, event.target.value)}
              onKeyDown={(event) => onCellKeyDown(event, clipIdx, critIdx)}
              onFocus={() => {
                const originalIndex = clips.findIndex((item) => item.id === clip.id)
                if (originalIndex !== -1) onSetCurrentClip(originalIndex)
              }}
              onMouseDown={(event) => {
                if (event.button !== 0 || !event.ctrlKey) return
                event.preventDefault()
                event.stopPropagation()
                const originalIndex = clips.findIndex((item) => item.id === clip.id)
                if (originalIndex !== -1) onSetCurrentClip(originalIndex)
                onShowCriterionBubble({
                  clip,
                  note,
                  criterionId: criterion.id,
                  x: event.clientX,
                  y: event.clientY,
                })
              }}
              onClick={(event) => {
                if (event.ctrlKey) {
                  event.preventDefault()
                }
                event.stopPropagation()
              }}
              className="amv-soft-number w-full rounded-sm border border-transparent bg-transparent px-1 py-0.5 text-center text-xs text-white transition-colors hover:bg-surface-light/50 focus:border-primary-500 focus:bg-surface-dark focus:outline-hidden focus-visible:outline-hidden"
            />
          </td>
        )
      })}
    </>
  )
}

export const SpreadsheetCriterionCells = memo(SpreadsheetCriterionCellsComponent)
