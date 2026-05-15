import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { CATEGORY_COLOR_PRESETS, sanitizeColor, withAlpha } from '@/utils/colors'
import { ColorSwatchPicker } from '@/components/ui/ColorSwatchPicker'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { AppCheckbox } from '@/components/ui/AppCheckbox'
import { COLOR_MEMORY_KEYS } from '@/utils/colorPickerStorage'
import { useI18n } from '@/i18n'
import type { Criterion } from '@/types/bareme'

interface BaremeCriterionCardProps {
  criterion: Criterion
  index: number
  totalCriteria: number
  readOnly: boolean
  color: string
  isSpotlight: boolean
  onCategoryFieldChange: (index: number, criterionId: string, value: string) => void
  onCategoryFieldFocus: (criterionId: string) => void
  onCategoryFieldBlur: (criterionId: string) => void
  onMoveCriterion: (index: number, direction: 'up' | 'down') => void
  onRemoveCriterion: (index: number) => void
  onUpdateCriterion: (index: number, updates: Partial<Criterion>) => void
  onCommitCategoryColor: (category: string) => void
  onSetCategoryColor: (category: string, color: string) => void
}

export function BaremeCriterionCard({
  criterion,
  index,
  totalCriteria,
  readOnly,
  color,
  isSpotlight,
  onCategoryFieldChange,
  onCategoryFieldFocus,
  onCategoryFieldBlur,
  onMoveCriterion,
  onRemoveCriterion,
  onUpdateCriterion,
  onCommitCategoryColor,
  onSetCategoryColor,
}: BaremeCriterionCardProps) {
  const { t } = useI18n()
  const rawCategory = criterion.category?.trim() || ''

  return (
    <div
      key={criterion.id}
      data-bareme-criterion-id={criterion.id}
      className={`bareme-criterion-card relative overflow-hidden rounded-xl border bg-surface-dark/45 p-3.5 pl-4 ${
        isSpotlight ? 'bareme-criterion-card--spotlight' : ''
      }`}
      style={{
        borderColor: withAlpha(color, isSpotlight ? 0.44 : 0.28),
        boxShadow: isSpotlight
          ? `0 18px 34px ${withAlpha(color, 0.14)}, inset 0 1px 0 ${withAlpha(color, 0.1)}`
          : `inset 0 1px 0 ${withAlpha(color, 0.04)}`,
      }}
    >
      <span
        className={`absolute inset-y-0 left-0 ${isSpotlight ? 'w-[3px]' : 'w-px'} transition-[width] duration-200`}
        style={{ backgroundColor: withAlpha(color, 0.95) }}
        aria-hidden="true"
      />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="amv-number-ui inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-gray-700 bg-surface px-1.5 text-[11px] font-medium text-gray-300">
            {index + 1}
          </span>
          <span
            className="truncate rounded-full border px-2 py-1 text-[11px] font-medium"
            style={{
              borderColor: withAlpha(color, 0.28),
              backgroundColor: withAlpha(color, 0.1),
              color,
            }}
          >
            {rawCategory || t('Sans catégorie')}
          </span>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1">
            <HoverTextTooltip text={t('Monter')}>
              <button
                onClick={() => onMoveCriterion(index, 'up')}
                disabled={index === 0}
                aria-label={t('Monter')}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-surface-light hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowUp size={12} />
              </button>
            </HoverTextTooltip>
            <HoverTextTooltip text={t('Descendre')}>
              <button
                onClick={() => onMoveCriterion(index, 'down')}
                disabled={index >= totalCriteria - 1}
                aria-label={t('Descendre')}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-surface-light hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowDown size={12} />
              </button>
            </HoverTextTooltip>
            {totalCriteria > 1 && (
              <HoverTextTooltip text={t('Supprimer ce critère')}>
                <button
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
        <div className="md:col-span-3">
          <label className="mb-1 block text-[11px] font-medium text-gray-400">{t('Catégorie')}</label>
          <div className="flex items-center gap-2">
            <input
              data-bareme-category-input={criterion.id}
              value={rawCategory}
              onChange={(event) => onCategoryFieldChange(index, criterion.id, event.target.value)}
              onFocus={() => onCategoryFieldFocus(criterion.id)}
              onBlur={(event) => {
                onCommitCategoryColor(event.target.value)
                onCategoryFieldBlur(criterion.id)
              }}
              placeholder={t('Montage')}
              className="w-full rounded-lg border bg-surface px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-hidden"
              style={{ borderColor: withAlpha(color, 0.45) }}
              disabled={readOnly}
            />
            <ColorSwatchPicker
              value={sanitizeColor(color)}
              onChange={(nextColor) => {
                if (!rawCategory) return
                onSetCategoryColor(rawCategory, nextColor)
              }}
              disabled={readOnly || !rawCategory}
              title={rawCategory ? t('Couleur de {category}', { category: rawCategory }) : t('Saisis une catégorie d’abord')}
              memoryKey={COLOR_MEMORY_KEYS.recentBaremeColors}
            />
          </div>
          {rawCategory && (
            <div className="flex flex-wrap gap-1 mt-1">
              {CATEGORY_COLOR_PRESETS.map((preset) => (
                <HoverTextTooltip
                  key={`${criterion.id}-${preset}`}
                  text={t('Appliquer {color}', { color: preset })}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const categoryKey = rawCategory.trim()
                      if (!categoryKey) return
                      onSetCategoryColor(categoryKey, preset)
                    }}
                    disabled={readOnly}
                    aria-label={t('Appliquer {color}', { color: preset })}
                    className={`w-4 h-4 rounded border transition-opacity ${
                      sanitizeColor(color) === sanitizeColor(preset)
                        ? 'border-white'
                        : 'border-gray-700'
                    }`}
                    style={{ backgroundColor: preset }}
                  />
                </HoverTextTooltip>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-4">
          <label className="mb-1 block text-[11px] font-medium text-gray-400">{t('Nom du critère')}</label>
          <input
            value={criterion.name}
            onChange={(event) => onUpdateCriterion(index, { name: event.target.value })}
            placeholder={t('Rythme / Synchro')}
            className="w-full rounded-lg border border-gray-700 bg-surface px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-hidden"
            disabled={readOnly}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-[11px] font-medium text-gray-400">{t('Noté sur')}</label>
          <input
            type="number"
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
            value={criterion.step ?? 0.5}
            onChange={(event) => onUpdateCriterion(index, { step: Number(event.target.value) })}
            step={0.1}
            className="amv-soft-number w-full rounded-lg border border-gray-700 bg-surface px-3 py-2 text-center text-sm text-white focus:border-primary-500 focus:outline-hidden"
            disabled={readOnly}
          />
        </div>

        <div className="md:col-span-1">
          <label className="mb-1 block text-[11px] font-medium text-gray-400">{t('Options')}</label>
          <div className="flex h-10 items-center justify-center rounded-lg border border-gray-700 bg-surface px-2 py-1.5">
            <AppCheckbox
              checked={criterion.required}
              onChange={(required) => onUpdateCriterion(index, { required })}
              disabled={readOnly}
              label={t('Requis')}
              className="gap-1.5 text-[12px]"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-400">{t('Description')}</label>
          <input
            value={criterion.description || ''}
            onChange={(event) => onUpdateCriterion(index, { description: event.target.value })}
            placeholder={t('Optionnel')}
            className="w-full rounded-lg border border-gray-700 bg-surface px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-hidden"
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  )
}
