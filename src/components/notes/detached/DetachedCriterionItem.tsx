import type { KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from 'react'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import { withAlpha } from '@/utils/colors'
import type { Criterion } from '@/types/bareme'
import type { CriterionScore } from '@/types/notation'
import { useI18n } from '@/i18n'

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
  const { t } = useI18n()
  const value = score?.value ?? ''

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors"
        style={{
          backgroundColor: 'rgb(var(--color-surface) / 0.88)',
          boxShadow: `inset 0 1px 0 ${withAlpha(color, 0.05)}`,
        }}
      >
        <div className="flex-1 min-w-0">
          <span className="block truncate text-[11px] text-gray-200" title={criterion.name}>
            {criterion.name}
          </span>
          {criterion.description ? (
            <span className="block truncate text-[9px] text-gray-500">{criterion.description}</span>
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
              event.target.value,
            )}
          onKeyDown={(event) => onInputKeyDown(event, flatIndex)}
          className="amv-soft-number w-14 rounded-md border border-transparent px-2 py-1 text-center text-[12px] font-mono text-white focus:border-primary-500/18 focus:outline-none focus-visible:outline-none"
          style={{
            backgroundColor: 'rgb(var(--color-surface-light) / 0.86)',
            boxShadow: `inset 0 0 0 1px ${withAlpha(color, 0.08)}`,
          }}
        />
        <span className="w-7 text-right font-mono text-[9px] text-gray-500">/{criterion.max ?? 10}</span>
        <button
          type="button"
          onClick={onToggleNote}
          className="ml-0.5 px-1 text-[10px] leading-none text-gray-500 transition-colors hover:text-white bg-transparent"
          style={{ background: 'transparent' }}
          title={isCriterionNoteExpanded ? t('Refermer la note') : t('Ouvrir la note')}
        >
          {isCriterionNoteExpanded ? '▲' : '▼'}
        </button>
      </div>
      {isCriterionNoteExpanded ? (
        <TimecodeTextarea
          placeholder={t('Note "{name}"...', { name: criterion.name })}
          value={criterionNoteValue}
          onChange={(nextValue) => onCriterionNoteChange(criterion.id, nextValue)}
          textareaClassName="min-h-[30px]"
          style={{
            backgroundColor: 'rgb(var(--color-surface-dark) / 0.68)',
            borderColor: 'rgb(var(--color-primary-500) / 0.18)',
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
          className="w-full truncate rounded-md px-2.5 py-1 text-left text-[10px] text-gray-400 transition-colors hover:text-gray-200"
          style={{ backgroundColor: 'rgb(var(--color-surface-dark) / 0.5)' }}
          title={criterionNoteValue}
        >
          {criterionNoteValue.replace(/\s+/g, ' ').slice(0, 96)}
        </button>
      ) : null}
    </div>
  )
}
