import { BaremeEditCategoriesSummary } from '@/components/scoring/bareme/BaremeEditCategoriesSummary'
import { useI18n } from '@/i18n'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'

interface BaremeQuickActionsBarProps {
  readOnly: boolean
  categoryStats: Map<string, { count: number; total: number }>
  categoryOrder: string[]
  categoryColors: Record<string, string>
  globalStep: number
  onGlobalStepChange: (value: number) => void
  onMoveCategory: (category: string, direction: 'up' | 'down') => void
  onApplyGlobalStep: () => void
  onAddCriterion: () => void
}

export function BaremeQuickActionsBar({
  readOnly,
  categoryStats,
  categoryOrder,
  categoryColors,
  globalStep,
  onGlobalStepChange,
  onMoveCategory,
  onApplyGlobalStep,
  onAddCriterion,
}: BaremeQuickActionsBarProps) {
  const { t } = useI18n()

  return (
    <div className="bareme-quick-actions-bar sticky bottom-0 z-20 overflow-hidden rounded-xl border px-2.5 py-2">
      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="min-w-0 flex-1">
          <BaremeEditCategoriesSummary
            readOnly={readOnly}
            categoryStats={categoryStats}
            categoryOrder={categoryOrder}
            categoryColors={categoryColors}
            onMoveCategory={onMoveCategory}
            compact
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <div className="flex items-center gap-1">
            <HoverTextTooltip text={t('Pas global')}>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={globalStep}
                onChange={(event) => onGlobalStepChange(Number(event.target.value))}
                aria-label={t('Pas global')}
                className="w-11 shrink-0 rounded-lg border border-gray-700/70 bg-surface-dark/52 px-1 py-0.5 text-center text-[11px] font-medium text-white transition-colors focus:border-gray-600/80 focus:outline-none"
              />
            </HoverTextTooltip>
            <button
              onClick={onApplyGlobalStep}
              className="shrink-0 whitespace-nowrap rounded-lg border border-gray-700/70 bg-surface-dark/36 px-1.5 py-0.5 text-[11px] font-medium text-gray-200 transition-colors hover:border-gray-600/80 hover:text-white"
            >
              {t('Appliquer partout')}
            </button>
          </div>
          <button
            onClick={onAddCriterion}
            className="shrink-0 whitespace-nowrap rounded-lg border border-gray-700/70 bg-transparent px-1.5 py-0.5 text-[11px] font-semibold text-primary-200 transition-colors hover:border-gray-600/80 hover:bg-primary-500/6 hover:text-white"
          >
            {t('Ajouter un critère')}
          </button>
        </div>
      </div>
    </div>
  )
}
