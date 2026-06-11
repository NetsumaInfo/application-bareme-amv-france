import { useMemo } from 'react'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { BaremeCriterionCard } from '@/components/scoring/bareme/BaremeCriterionCard'
import { BaremeEditCategoriesSummary } from '@/components/scoring/bareme/BaremeEditCategoriesSummary'
import { BaremeEditHeaderFields } from '@/components/scoring/bareme/BaremeEditHeaderFields'
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
  onSwapCriteria: (indexA: number, indexB: number) => void
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
  onSwapCriteria,
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

  const categorySuggestions = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const criterion of criteria) {
      const category = criterion.category?.trim()
      if (!category) continue
      const key = category.toLocaleLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(category)
    }
    return out
  }, [criteria])

  const hasVisibleCategories = categoryOrder.some((category) => categoryStats.has(category))

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <aside className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-0 lg:w-72">
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

        {hasVisibleCategories && (
          <div>
            <span className="mb-1.5 block text-xs font-medium text-gray-400">{t('Catégories')}</span>
            <BaremeEditCategoriesSummary
              readOnly={readOnly}
              categoryStats={categoryStats}
              categoryOrder={categoryOrder}
              categoryColors={categoryColors}
              onMoveCategory={onMoveCategory}
            />
          </div>
        )}

        {!readOnly && (
          <div>
            <label htmlFor="bareme-global-step" className="mb-1.5 block text-xs font-medium text-gray-400">
              {t('Pas global')}
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-700/70 bg-surface-dark/28 px-3 py-2.5">
              <input
                id="bareme-global-step"
                type="number"
                min={0.1}
                step={0.1}
                value={globalStep}
                onChange={(event) => onGlobalStepChange(Number(event.target.value))}
                aria-label={t('Pas global')}
                className="w-16 shrink-0 rounded-lg border border-gray-700 bg-surface px-2 py-1.5 text-center text-sm text-white focus:border-primary-500 focus:outline-hidden"
              />
              <HoverTextTooltip text={t('Appliquer ce pas à tous les critères')}>
                <button
                  type="button"
                  onClick={onApplyGlobalStep}
                  className="min-w-0 flex-1 truncate rounded-lg border border-gray-700 bg-surface px-2 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
                >
                  {t('Appliquer partout')}
                </button>
              </HoverTextTooltip>
            </div>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('Critères')}</span>
          <span className="amv-number-ui text-[11px] text-gray-500">
            {t('{count} critères', { count: criteria.length })}
          </span>
        </div>

        {criterionSections.map((section, sectionIndex) => (
          <section key={section.key} className="overflow-hidden rounded-xl border border-gray-800/80 bg-surface-dark/20">
            <div
              className="flex items-center gap-3 border-b px-3 py-2.5"
              style={{
                borderColor: withAlpha(section.color, 0.2),
                backgroundColor: withAlpha(section.color, 0.08),
              }}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: section.color }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{section.label}</div>
                <div className="amv-number-ui text-[11px] text-gray-400">
                  {t('{count} critères • {points} points', {
                    count: section.items.length,
                    points: section.total,
                  })}
                </div>
              </div>
              {!readOnly && criterionSections.length > 1 && (
                <div className="flex shrink-0 items-center gap-0.5">
                  <HoverTextTooltip text={t('Monter la catégorie')}>
                    <button
                      type="button"
                      onClick={() => onMoveCategory(section.categoryToken, 'up')}
                      disabled={sectionIndex === 0}
                      aria-label={t('Monter la catégorie')}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-light hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                  </HoverTextTooltip>
                  <HoverTextTooltip text={t('Descendre la catégorie')}>
                    <button
                      type="button"
                      onClick={() => onMoveCategory(section.categoryToken, 'down')}
                      disabled={sectionIndex >= criterionSections.length - 1}
                      aria-label={t('Descendre la catégorie')}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-light hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </HoverTextTooltip>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 p-2.5">
              {section.items.map(({ criterion, index }, posInSection) => {
                const prevSibling = section.items[posInSection - 1]
                const nextSibling = section.items[posInSection + 1]
                return (
                  <BaremeCriterionCard
                    key={criterion.id}
                    criterion={criterion}
                    index={index}
                    positionLabel={posInSection + 1}
                    readOnly={readOnly}
                    color={section.color}
                    isSpotlight={criterion.id === spotlightCriterionId}
                    categorySuggestions={categorySuggestions}
                    getCategoryColor={getCategoryColor}
                    canMoveUp={Boolean(prevSibling)}
                    canMoveDown={Boolean(nextSibling)}
                    canRemove={criteria.length > 1}
                    onCategoryFieldChange={handleCategoryFieldChange}
                    onCategoryFieldFocus={handleCategoryFieldFocus}
                    onCategoryFieldBlur={handleCategoryFieldBlur}
                    onMoveUp={() => prevSibling && onSwapCriteria(index, prevSibling.index)}
                    onMoveDown={() => nextSibling && onSwapCriteria(index, nextSibling.index)}
                    onRemoveCriterion={onRemoveCriterion}
                    onUpdateCriterion={onUpdateCriterion}
                    onCommitCategoryColor={onCommitCategoryColor}
                    onSetCategoryColor={onSetCategoryColor}
                  />
                )
              })}
            </div>
          </section>
        ))}

        {!readOnly && (
          <button
            type="button"
            onClick={onAddCriterion}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-700 px-3 py-3 text-sm font-medium text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
          >
            <Plus size={14} aria-hidden="true" />
            {t('Ajouter un critère')}
          </button>
        )}

        {error && <p className="text-xs text-accent">{error}</p>}
      </div>
    </div>
  )
}
