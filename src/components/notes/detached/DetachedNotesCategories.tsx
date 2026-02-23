import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import { withAlpha } from '@/utils/colors'
import type { Criterion } from '@/types/bareme'
import type { Note } from '@/types/notation'
import type { ActiveNoteField, CategoryGroup } from '@/components/notes/detached/types'
import { DetachedCategoryHeader } from '@/components/notes/detached/DetachedCategoryHeader'
import { DetachedCriterionItem } from '@/components/notes/detached/DetachedCriterionItem'

interface DetachedNotesCategoriesProps {
  categories: CategoryGroup[]
  expandedCategory: string | null
  setExpandedCategory: (value: string | null) => void
  shouldHideTotals: boolean
  getCategoryScore: (cat: { criteria: Criterion[] }) => number
  flatCriteria: Criterion[]
  localNote: Note | null
  expandedCriterionNotes: Record<string, boolean>
  setExpandedCriterionNotes: Dispatch<SetStateAction<Record<string, boolean>>>
  inputRefs: MutableRefObject<Map<string, HTMLInputElement>>
  categoryTextareaRefs: MutableRefObject<Map<string, HTMLTextAreaElement>>
  activeNoteFieldRef: MutableRefObject<ActiveNoteField | null>
  clipFps: number | null
  onValueChange: (criterionId: string, value: number | string) => void
  onInputKeyDown: (event: React.KeyboardEvent, index: number) => void
  onCriterionNoteChange: (criterionId: string, text: string) => void
  onCategoryNoteChange: (category: string, text: string) => void
  onTimecodeJump: (seconds: number, payload?: { category?: string; criterionId?: string }) => void
  onTimecodeHover: (payload: { seconds: number; anchorRect: DOMRect }) => void | Promise<void>
  onTimecodeLeave: () => void
}

export function DetachedNotesCategories({
  categories,
  expandedCategory,
  setExpandedCategory,
  shouldHideTotals,
  getCategoryScore,
  flatCriteria,
  localNote,
  expandedCriterionNotes,
  setExpandedCriterionNotes,
  inputRefs,
  categoryTextareaRefs,
  activeNoteFieldRef,
  clipFps,
  onValueChange,
  onInputKeyDown,
  onCriterionNoteChange,
  onCategoryNoteChange,
  onTimecodeJump,
  onTimecodeHover,
  onTimecodeLeave,
}: DetachedNotesCategoriesProps) {
  return (
    <div className="flex-1 overflow-y-auto py-1">
      {categories.map(({ category, criteria, color, totalMax }) => {
        const isExpanded = expandedCategory === category
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
              onToggle={() => setExpandedCategory(isExpanded ? null : category)}
            />

            {isExpanded && (
              <div className="px-2 py-1.5 space-y-1" style={{ backgroundColor: withAlpha(color, 0.04) }}>
                {criteria.map((criterion) => {
                  const flatIndex = flatCriteria.findIndex((item) => item.id === criterion.id)
                  const score = localNote?.scores[criterion.id]
                  const criterionNoteValue = localNote?.criterionNotes?.[criterion.id] ?? ''
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
                      onToggleNote={() => {
                        setExpandedCriterionNotes((prev) => ({
                          ...prev,
                          [criterion.id]: !prev[criterion.id],
                        }))
                      }}
                      onExpandNote={() => {
                        setExpandedCriterionNotes((prev) => ({
                          ...prev,
                          [criterion.id]: true,
                        }))
                      }}
                      inputRefs={inputRefs}
                      clipFps={clipFps}
                      onValueChange={onValueChange}
                      onInputKeyDown={onInputKeyDown}
                      onCriterionNoteChange={onCriterionNoteChange}
                      onTimecodeJump={onTimecodeJump}
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
                  value={localNote?.categoryNotes?.[category] ?? ''}
                  onChange={(nextValue) => onCategoryNoteChange(category, nextValue)}
                  onFocus={() => {
                    activeNoteFieldRef.current = { kind: 'category', category }
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
                    onTimecodeJump(item.seconds, { category })
                  }}
                  onTimecodeHover={({ item, anchorRect }) => {
                    onTimecodeHover({
                      seconds: item.seconds,
                      anchorRect,
                    })
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
