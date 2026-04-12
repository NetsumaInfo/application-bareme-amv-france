import { BaremeCriterionCard } from '@/components/scoring/bareme/BaremeCriterionCard'
import { BaremeEditHeaderFields } from '@/components/scoring/bareme/BaremeEditHeaderFields'
import { BaremeQuickActionsBar } from '@/components/scoring/bareme/BaremeQuickActionsBar'
import { useBaremeEditSections } from '@/components/scoring/bareme/useBaremeEditSections'
import { useI18n } from '@/i18n'
import type { Criterion } from '@/types/bareme'
import { withAlpha } from '@/utils/colors'

interface BaremeEditViewProps {
  readOnly: boolean
  name: string
  description: string
  criteria: Criterion[]
  categoryStats: Map<string, { count: number; total: number }>
  categoryOrder: string[]
  categoryColors: Record<string, string>
  globalStep: number
  hideTotalsUntilAllScored: boolean
  spotlightCriterionId: string | null
  error: string
  getCategoryColor: (category: string) => string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onGlobalStepChange: (value: number) => void
  onHideTotalsChange: (value: boolean) => void
  onMoveCategory: (category: string, direction: 'up' | 'down') => void
  onMoveCriterion: (index: number, direction: 'up' | 'down') => void
  onRemoveCriterion: (index: number) => void
  onUpdateCriterion: (index: number, updates: Partial<Criterion>) => void
  onUpdateCriterionCategory: (index: number, category: string) => void
  onCommitCategoryColor: (category: string) => void
  onSetCategoryColor: (category: string, color: string) => void
  onApplyGlobalStep: () => void
  onAddCriterion: () => void
}

export function BaremeEditView({
  readOnly,
  name,
  description,
  criteria,
  categoryStats,
  categoryOrder,
  categoryColors,
  globalStep,
  hideTotalsUntilAllScored,
  spotlightCriterionId,
  error,
  getCategoryColor,
  onNameChange,
  onDescriptionChange,
  onGlobalStepChange,
  onHideTotalsChange,
  onMoveCategory,
  onMoveCriterion,
  onRemoveCriterion,
  onUpdateCriterion,
  onUpdateCriterionCategory,
  onCommitCategoryColor,
  onSetCategoryColor,
  onApplyGlobalStep,
  onAddCriterion,
}: BaremeEditViewProps) {
  const { t } = useI18n()
  const {
    criterionSections,
    handleCategoryFieldChange,
    handleCategoryFieldFocus,
    handleCategoryFieldBlur,
  } = useBaremeEditSections({
    criteria,
    spotlightCriterionId,
    getCategoryColor,
    onUpdateCriterionCategory,
    t,
  })

  return (
    <div className="flex flex-col gap-4">
      <BaremeEditHeaderFields
        readOnly={readOnly}
        name={name}
        description={description}
        criteria={criteria}
        hideTotalsUntilAllScored={hideTotalsUntilAllScored}
        onNameChange={onNameChange}
        onDescriptionChange={onDescriptionChange}
        onHideTotalsChange={onHideTotalsChange}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('Critères')}</span>
        <span className="text-[11px] text-gray-500">{t('Barre d’actions fixe en bas')}</span>
      </div>

      <div className="flex flex-col gap-4 pb-28">
        {criterionSections.map((section) => (
          <section key={section.key} className="overflow-hidden rounded-xl border border-gray-800/80 bg-surface-dark/20">
            <div
              className="flex items-center gap-3 border-b px-3 py-2.5"
              style={{
                borderColor: withAlpha(section.color, 0.2),
                backgroundColor: withAlpha(section.color, 0.08),
              }}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: section.color }} aria-hidden="true" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">{section.label}</div>
                <div className="text-[11px] text-gray-400 tabular-nums">
                  {t('{count} critères • {points} points', {
                    count: section.items.length,
                    points: section.total,
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-2.5">
              {section.items.map(({ criterion, index }) => (
                <BaremeCriterionCard
                  key={criterion.id}
                  criterion={criterion}
                  index={index}
                  totalCriteria={criteria.length}
                  readOnly={readOnly}
                  color={section.color}
                  isSpotlight={criterion.id === spotlightCriterionId}
                  onCategoryFieldChange={handleCategoryFieldChange}
                  onCategoryFieldFocus={handleCategoryFieldFocus}
                  onCategoryFieldBlur={handleCategoryFieldBlur}
                  onMoveCriterion={onMoveCriterion}
                  onRemoveCriterion={onRemoveCriterion}
                  onUpdateCriterion={onUpdateCriterion}
                  onCommitCategoryColor={onCommitCategoryColor}
                  onSetCategoryColor={onSetCategoryColor}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {error && <p className="text-xs text-accent">{error}</p>}

      {!readOnly ? (
        <BaremeQuickActionsBar
          readOnly={readOnly}
          categoryStats={categoryStats}
          categoryOrder={categoryOrder}
          categoryColors={categoryColors}
          globalStep={globalStep}
          onGlobalStepChange={onGlobalStepChange}
          onMoveCategory={onMoveCategory}
          onApplyGlobalStep={onApplyGlobalStep}
          onAddCriterion={onAddCriterion}
        />
      ) : null}
    </div>
  )
}
