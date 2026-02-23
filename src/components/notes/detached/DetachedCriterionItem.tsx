import type { KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from 'react'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import { withAlpha } from '@/utils/colors'
import type { Criterion } from '@/types/bareme'
import type { CriterionScore } from '@/types/notation'

interface DetachedCriterionItemProps {
  criterion: Criterion
  category: string
  color: string
  flatIndex: number
  score?: CriterionScore
  criterionNoteValue: string
  isCriterionNoteExpanded: boolean
  onToggleNote: () => void
  onExpandNote: () => void
  inputRefs: MutableRefObject<Map<string, HTMLInputElement>>
  clipFps: number | null
  onValueChange: (criterionId: string, value: number | string) => void
  onInputKeyDown: (event: ReactKeyboardEvent, index: number) => void
  onCriterionNoteChange: (criterionId: string, text: string) => void
  onTimecodeJump: (seconds: number, payload?: { category?: string; criterionId?: string }) => void
  onTimecodeHover: (payload: { seconds: number; anchorRect: DOMRect }) => void | Promise<void>
  onTimecodeLeave: () => void
}

export function DetachedCriterionItem({
  criterion,
  category,
  color,
  flatIndex,
  score,
  criterionNoteValue,
  isCriterionNoteExpanded,
  onToggleNote,
  onExpandNote,
  inputRefs,
  clipFps,
  onValueChange,
  onInputKeyDown,
  onCriterionNoteChange,
  onTimecodeJump,
  onTimecodeHover,
  onTimecodeLeave,
}: DetachedCriterionItemProps) {
  const value = score?.value ?? ''
  const hasError = Boolean(score && !score.isValid)

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
        style={{
          backgroundColor: hasError ? withAlpha('#ef4444', 0.12) : withAlpha(color, 0.07),
        }}
      >
        <div className="flex-1 min-w-0">
          <span className="text-xs text-gray-200 truncate block" title={criterion.name}>
            {criterion.name}
          </span>
          {criterion.description ? (
            <span className="text-[9px] text-gray-500 truncate block">{criterion.description}</span>
          ) : null}
        </div>
        <input
          ref={(element) => {
            if (element) inputRefs.current.set(criterion.id, element)
          }}
          type="number"
          min={criterion.min}
          max={criterion.max}
          step={criterion.step || 0.5}
          value={value === '' ? '' : String(value)}
          onChange={(event) =>
            onValueChange(
              criterion.id,
              event.target.value === '' ? '' : Number(event.target.value),
            )}
          onKeyDown={(event) => onInputKeyDown(event, flatIndex)}
          className={`amv-soft-number w-16 px-2 py-1 text-center text-sm rounded-md border font-mono focus-visible:outline-none ${
            hasError
              ? 'border-accent bg-accent/10 text-accent-light'
              : 'text-white focus:border-primary-500'
          } focus:outline-none`}
          style={
            !hasError
              ? {
                  borderColor: withAlpha(color, 0.42),
                  backgroundColor: withAlpha(color, 0.1),
                }
              : undefined
          }
        />
        <span className="text-[10px] text-gray-500 w-7 text-right font-mono">/{criterion.max ?? 10}</span>
        <button
          type="button"
          onClick={onToggleNote}
          className="ml-1 px-1 text-[10px] leading-none text-gray-400 hover:text-white transition-colors bg-transparent"
          style={{ background: 'transparent' }}
          title={isCriterionNoteExpanded ? 'Refermer la note' : 'Ouvrir la note'}
        >
          {isCriterionNoteExpanded ? '▲' : '▼'}
        </button>
      </div>
      {isCriterionNoteExpanded ? (
        <TimecodeTextarea
          placeholder={`Note "${criterion.name}"...`}
          value={criterionNoteValue}
          onChange={(nextValue) => onCriterionNoteChange(criterion.id, nextValue)}
          textareaClassName="min-h-[30px]"
          style={{
            backgroundColor: withAlpha(color, 0.045),
            borderColor: withAlpha(color, 0.15),
          }}
          color={color}
          fpsHint={clipFps ?? undefined}
          onTimecodeSelect={(item) => {
            onTimecodeJump(item.seconds, { category, criterionId: criterion.id })
          }}
          onTimecodeHover={({ item, anchorRect }) => {
            onTimecodeHover({
              seconds: item.seconds,
              anchorRect,
            })
          }}
          onTimecodeLeave={onTimecodeLeave}
        />
      ) : criterionNoteValue.trim() ? (
        <button
          type="button"
          onClick={onExpandNote}
          className="w-full text-left px-2.5 py-1 rounded-md text-[10px] text-gray-400 border border-gray-700 hover:text-gray-200 hover:border-gray-500 transition-colors truncate"
          style={{ backgroundColor: withAlpha(color, 0.04) }}
          title={criterionNoteValue}
        >
          {criterionNoteValue.replace(/\s+/g, ' ').slice(0, 96)}
        </button>
      ) : null}
    </div>
  )
}
