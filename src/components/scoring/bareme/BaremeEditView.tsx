import { BaremeCriterionCard } from '@/components/scoring/bareme/BaremeCriterionCard'
import { BaremeEditCategoriesSummary } from '@/components/scoring/bareme/BaremeEditCategoriesSummary'
import { BaremeEditHeaderFields } from '@/components/scoring/bareme/BaremeEditHeaderFields'
import { BaremeQuickActionsBar } from '@/components/scoring/bareme/BaremeQuickActionsBar'
import type { Criterion } from '@/types/bareme'

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

      <BaremeEditCategoriesSummary
        readOnly={readOnly}
        categoryStats={categoryStats}
        categoryOrder={categoryOrder}
        categoryColors={categoryColors}
        getCategoryColor={getCategoryColor}
        onMoveCategory={onMoveCategory}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Critères</span>
        <span className="text-[11px] text-gray-500">
          Barre d’actions fixe en bas
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {criteria.map((criterion, index) => {
          const rawCategory = criterion.category?.trim() || ''
          const color = rawCategory ? getCategoryColor(rawCategory) : '#64748b'

          return (
            <BaremeCriterionCard
              key={criterion.id}
              criterion={criterion}
              index={index}
              totalCriteria={criteria.length}
              readOnly={readOnly}
              color={color}
              onMoveCriterion={onMoveCriterion}
              onRemoveCriterion={onRemoveCriterion}
              onUpdateCriterion={onUpdateCriterion}
              onUpdateCriterionCategory={onUpdateCriterionCategory}
              onCommitCategoryColor={onCommitCategoryColor}
              onSetCategoryColor={onSetCategoryColor}
            />
          )
        })}
      </div>

      {error && <p className="text-xs text-accent">{error}</p>}

      {!readOnly ? (
        <BaremeQuickActionsBar
          globalStep={globalStep}
          onGlobalStepChange={onGlobalStepChange}
          onApplyGlobalStep={onApplyGlobalStep}
          onAddCriterion={onAddCriterion}
        />
      ) : null}
    </div>
  )
}
