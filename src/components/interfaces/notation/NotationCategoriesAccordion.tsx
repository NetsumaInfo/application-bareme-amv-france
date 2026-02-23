import type { KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from 'react'
import { withAlpha } from '@/utils/colors'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import { DetachedCategoryHeader } from '@/components/notes/detached/DetachedCategoryHeader'
import { DetachedCriterionItem } from '@/components/notes/detached/DetachedCriterionItem'
import type { Note } from '@/types/notation'
import type { Criterion } from '@/types/bareme'
import type { NotationCategory } from '@/components/interfaces/notation/types'

interface NotationCategoriesAccordionProps {
  categories: NotationCategory[]
  effectiveExpandedCategory: string | null
  flatCriteria: Criterion[]
  note: Note | undefined
  currentClipId: string
  shouldHideTotals: boolean
  clipFps: number | null
  expandedCriterionNotes: Record<string, boolean>
  inputRefs: MutableRefObject<Map<string, HTMLInputElement>>
  categoryTextareaRefs: MutableRefObject<Map<string, HTMLTextAreaElement>>
  onToggleCategory: (category: string, isExpanded: boolean) => void
  onToggleCriterionNote: (criterionId: string) => void
  onExpandCriterionNote: (criterionId: string) => void
  onValueChange: (criterionId: string, value: number | string) => void
  onKeyDown: (event: ReactKeyboardEvent, index: number) => void
  onSetCriterionNote: (clipId: string, criterionId: string, text: string) => void
  onSetCategoryNote: (clipId: string, category: string, text: string) => void
  onSetActiveCategoryField: (category: string) => void
  onJumpToTimecode: (seconds: number, payload?: { category?: string; criterionId?: string }) => void
  onTimecodeHover: (params: { seconds: number; anchorRect: DOMRect }) => void
  onTimecodeLeave: () => void
  onMarkDirty: () => void
  getCategoryScore: (cat: { criteria: Criterion[] }) => number
}

export function NotationCategoriesAccordion({
  categories,
  effectiveExpandedCategory,
  flatCriteria,
  note,
  currentClipId,
  shouldHideTotals,
  clipFps,
  expandedCriterionNotes,
  inputRefs,
  categoryTextareaRefs,
  onToggleCategory,
  onToggleCriterionNote,
  onExpandCriterionNote,
  onValueChange,
  onKeyDown,
  onSetCriterionNote,
  onSetCategoryNote,
  onSetActiveCategoryField,
  onJumpToTimecode,
  onTimecodeHover,
  onTimecodeLeave,
  onMarkDirty,
  getCategoryScore,
}: NotationCategoriesAccordionProps) {
  return (
    <div className="flex-1 overflow-y-auto py-1">
      {categories.map(({ category, criteria, color, totalMax }) => {
        const isExpanded = effectiveExpandedCategory === category
        const catScore = getCategoryScore({ criteria })

        return (
          <div key={category} className="border-b border-gray-800/60">
            <DetachedCategoryHeader
              category={category}
              color={color}
              isExpanded={isExpanded}
              shouldHideTotals={shouldHideTotals}
              categoryScore={catScore}
              totalMax={totalMax}
              onToggle={() => onToggleCategory(category, isExpanded)}
            />

            {isExpanded && (
              <div className="px-2 py-1.5 space-y-1" style={{ backgroundColor: withAlpha(color, 0.04) }}>
                {criteria.map((criterion) => {
                  const flatIndex = flatCriteria.findIndex((item) => item.id === criterion.id)
                  const score = note?.scores[criterion.id]
                  const criterionNoteValue = note?.criterionNotes?.[criterion.id] ?? ''
                  const isCriterionNoteExpanded = Boolean(expandedCriterionNotes[criterion.id])

                  return (
                    <DetachedCriterionItem
                      key={criterion.id}
                      criterion={criterion}
                      category={category}
                      color={color}
                      flatIndex={flatIndex}
                      score={score}
                      criterionNoteValue={criterionNoteValue}
                      isCriterionNoteExpanded={isCriterionNoteExpanded}
                      onToggleNote={() => onToggleCriterionNote(criterion.id)}
                      onExpandNote={() => onExpandCriterionNote(criterion.id)}
                      inputRefs={inputRefs}
                      clipFps={clipFps}
                      onValueChange={onValueChange}
                      onInputKeyDown={onKeyDown}
                      onCriterionNoteChange={(criterionId, nextValue) => {
                        onSetCriterionNote(currentClipId, criterionId, nextValue)
                        onMarkDirty()
                      }}
                      onTimecodeJump={onJumpToTimecode}
                      onTimecodeHover={onTimecodeHover}
                      onTimecodeLeave={onTimecodeLeave}
                    />
                  )
                })}

                <TimecodeTextarea
                  textareaRef={(el) => {
                    if (el) categoryTextareaRefs.current.set(category, el)
                    else categoryTextareaRefs.current.delete(category)
                  }}
                  placeholder={`Notes "${category}"...`}
                  value={note?.categoryNotes?.[category] ?? ''}
                  onChange={(nextValue) => {
                    onSetCategoryNote(currentClipId, category, nextValue)
                    onMarkDirty()
                  }}
                  onFocus={() => {
                    onSetActiveCategoryField(category)
                  }}
                  className="mt-1"
                  textareaClassName="min-h-[36px]"
                  style={{
                    backgroundColor: withAlpha(color, 0.05),
                    borderColor: withAlpha(color, 0.2),
                  }}
                  color={color}
                  fpsHint={clipFps ?? undefined}
                  onTimecodeSelect={(item) => {
                    onJumpToTimecode(item.seconds, { category })
                  }}
                  onTimecodeHover={({ item, anchorRect }) => {
                    onTimecodeHover({ seconds: item.seconds, anchorRect })
                  }}
                  onTimecodeLeave={onTimecodeLeave}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
