import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { withAlpha } from '@/utils/colors'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { AppCheckbox } from '@/components/ui/AppCheckbox'
import { BaremeCriterionCategoryField } from '@/components/scoring/bareme/BaremeCriterionCategoryField'
import { useI18n } from '@/i18n'
import type { Criterion } from '@/types/bareme'

interface BaremeCriterionCardProps {
  criterion: Criterion
  index: number
  positionLabel: number
  readOnly: boolean
  color: string
  isSpotlight: boolean
  categorySuggestions: string[]
  getCategoryColor: (category: string) => string
  canMoveUp: boolean
  canMoveDown: boolean
  canRemove: boolean
  onCategoryFieldChange: (index: number, criterionId: string, value: string) => void
  onCategoryFieldFocus: (criterionId: string) => void
  onCategoryFieldBlur: (criterionId: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemoveCriterion: (index: number) => void
  onUpdateCriterion: (index: number, updates: Partial<Criterion>) => void
  onCommitCategoryColor: (category: string) => void
  onSetCategoryColor: (category: string, color: string) => void
}

export function BaremeCriterionCard({
  criterion,
  index,
  positionLabel,
  readOnly,
  color,
  isSpotlight,
  categorySuggestions,
  getCategoryColor,
  canMoveUp,
  canMoveDown,
  canRemove,
  onCategoryFieldChange,
  onCategoryFieldFocus,
  onCategoryFieldBlur,
  onMoveUp,
  onMoveDown,
  onRemoveCriterion,
  onUpdateCriterion,
  onCommitCategoryColor,
  onSetCategoryColor,
}: BaremeCriterionCardProps) {
  const { t } = useI18n()
  const rawCategory = criterion.category?.trim() || ''
  const accentColor = rawCategory ? getCategoryColor(rawCategory) : color

  return (
    <div
      key={criterion.id}
      data-bareme-criterion-id={criterion.id}
      className={`bareme-criterion-card relative overflow-hidden rounded-xl border bg-surface-dark/45 p-3.5 pl-4 ${
        isSpotlight ? 'bareme-criterion-card--spotlight' : ''
      }`}
      style={{
        borderColor: withAlpha(accentColor, isSpotlight ? 0.44 : 0.28),
        boxShadow: isSpotlight
          ? `0 18px 34px ${withAlpha(accentColor, 0.14)}, inset 0 1px 0 ${withAlpha(accentColor, 0.1)}`
          : `inset 0 1px 0 ${withAlpha(accentColor, 0.04)}`,
      }}
    >
      <span
        className={`absolute inset-y-0 left-0 ${isSpotlight ? 'w-[3px]' : 'w-px'} transition-[width] duration-200`}
        style={{ backgroundColor: withAlpha(accentColor, 0.95) }}
        aria-hidden="true"
      />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="amv-number-ui inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-gray-700 bg-surface px-1.5 text-[11px] font-medium text-gray-300">
            {positionLabel}
          </span>
          <span className="truncate text-sm font-medium text-white">
            {criterion.name || t('Nouveau critère')}
          </span>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1">
            <HoverTextTooltip text={t('Monter')}>
              <button
                type="button"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                aria-label={t('Monter')}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-surface-light hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowUp size={12} />
              </button>
            </HoverTextTooltip>
            <HoverTextTooltip text={t('Descendre')}>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                aria-label={t('Descendre')}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-surface-light hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowDown size={12} />
              </button>
            </HoverTextTooltip>
            {canRemove && (
              <HoverTextTooltip text={t('Supprimer ce critère')}>
                <button
                  type="button"
                  onClick={() => onRemoveCriterion(index)}
                  aria-label={t('Supprimer ce critère')}
                  className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-surface-light hover:text-accent"
                >
                  <Trash2 size={14} />
                </button>
              </HoverTextTooltip>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <BaremeCriterionCategoryField
          criterionId={criterion.id}
          index={index}
          rawCategory={rawCategory}
          readOnly={readOnly}
          color={color}
          getCategoryColor={getCategoryColor}
          categorySuggestions={categorySuggestions}
          onCategoryFieldChange={onCategoryFieldChange}
          onCategoryFieldFocus={onCategoryFieldFocus}
          onCategoryFieldBlur={onCategoryFieldBlur}
          onCommitCategoryColor={onCommitCategoryColor}
          onSetCategoryColor={onSetCategoryColor}
        />

        <div className="md:col-span-4">
          <label className="mb-1 block text-[11px] font-medium text-gray-400">{t('Nom du critère')}</label>
          <input
            value={criterion.name}
            onChange={(event) => onUpdateCriterion(index, { name: event.target.value })}
            aria-label={t('Nom du critère')}
            placeholder={t('Rythme / Synchro')}
            className="w-full rounded-lg border border-gray-700 bg-surface px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-hidden"
            disabled={readOnly}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-[11px] font-medium text-gray-400">{t('Noté sur')}</label>
          <input
            type="number"
            aria-label={t('Noté sur')}
            value={criterion.max ?? 10}
            onChange={(event) => onUpdateCriterion(index, { max: Number(event.target.value) })}
            min={1}
            step={1}
            className="amv-soft-number w-full rounded-lg border border-gray-700 bg-surface px-3 py-2 text-center text-sm text-white focus:border-primary-500 focus:outline-hidden"
            disabled={readOnly}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-[11px] font-medium text-gray-400">{t('Pas')}</label>
          <input
            type="number"
            aria-label={t('Pas')}
            value={criterion.step ?? 0.5}
            onChange={(event) => onUpdateCriterion(index, { step: Number(event.target.value) })}
            step={0.1}
            className="amv-soft-number w-full rounded-lg border border-gray-700 bg-surface px-3 py-2 text-center text-sm text-white focus:border-primary-500 focus:outline-hidden"
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="mt-3 flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-[11px] font-medium text-gray-400">{t('Description')}</label>
          <input
            value={criterion.description || ''}
            onChange={(event) => onUpdateCriterion(index, { description: event.target.value })}
            aria-label={t('Description')}
            placeholder={t('Optionnel')}
            className="w-full rounded-lg border border-gray-700 bg-surface px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-hidden"
            disabled={readOnly}
          />
        </div>
        <div className="flex shrink-0 items-center rounded-lg border border-gray-700 bg-surface px-3 py-2">
          <AppCheckbox
            checked={criterion.required}
            onChange={(required) => onUpdateCriterion(index, { required })}
            disabled={readOnly}
            label={t('Requis')}
            className="gap-1.5 whitespace-nowrap text-sm"
          />
        </div>
      </div>
    </div>
  )
}
