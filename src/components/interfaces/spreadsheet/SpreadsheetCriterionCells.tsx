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
  onCellChange: (clipId: string, criterionId: string, value: string) => void
  onCellKeyDown: (event: ReactKeyboardEvent, clipIdx: number, critIdx: number) => void
  onSetCurrentClip: (index: number) => void
}

export function SpreadsheetCriterionCells({
  clip,
  clipIdx,
  clips,
  currentBareme,
  critIdxMap,
  note,
  cellRefs,
  onCellChange,
  onCellKeyDown,
  onSetCurrentClip,
}: SpreadsheetCriterionCellsProps) {
  return (
    <>
      {currentBareme.criteria.map((criterion: Criterion) => {
        const critIdx = critIdxMap.get(criterion.id) ?? 0
        const score = note?.scores[criterion.id]
        const hasError = score && !score.isValid
        const value = score?.value ?? ''

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
              onChange={(event) => onCellChange(clip.id, criterion.id, event.target.value)}
              onKeyDown={(event) => onCellKeyDown(event, clipIdx, critIdx)}
              onFocus={() => {
                const originalIndex = clips.findIndex((item) => item.id === clip.id)
                if (originalIndex !== -1) onSetCurrentClip(originalIndex)
              }}
              onClick={(event) => event.stopPropagation()}
              className={`amv-soft-number w-full px-1 py-0.5 text-center rounded text-xs font-mono transition-colors focus-visible:outline-none ${
                hasError
                  ? 'border border-accent bg-accent/10 text-accent-light'
                  : 'border border-transparent bg-transparent text-white hover:bg-surface-light/50 focus:border-primary-500 focus:bg-surface-dark'
              } focus:outline-none`}
            />
          </td>
        )
      })}
    </>
  )
}
