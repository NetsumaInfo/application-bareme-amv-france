import { FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import type {
  ResultatsGlobalVariant,
  ResultatsMainView,
} from '@/components/interfaces/resultats/types'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'

interface ResultatsViewModeControlsProps {
  mainView: ResultatsMainView
  onMainViewChange: (view: ResultatsMainView) => void
  globalVariant: ResultatsGlobalVariant
  onGlobalVariantChange: (variant: ResultatsGlobalVariant) => void
  notesPanelHidden: boolean
  onToggleNotesPanel: () => void
}

function SegmentedButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] transition-colors ${
        active
          ? 'bg-surface-dark/80 text-white'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

export function ResultatsViewModeControls({
  mainView,
  onMainViewChange,
  globalVariant,
  onGlobalVariantChange,
  notesPanelHidden,
  onToggleNotesPanel,
}: ResultatsViewModeControlsProps) {
  const { t } = useI18n()
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-0.5">
      <div className="flex min-w-0 flex-wrap items-center gap-0.5">
        <SegmentedButton active={mainView === 'judge'} onClick={() => onMainViewChange('judge')}>
          {t('Tableau par juge')}
        </SegmentedButton>
        <SegmentedButton active={mainView === 'global'} onClick={() => onMainViewChange('global')}>
          {t('Tableau global')}
        </SegmentedButton>
        <SegmentedButton active={mainView === 'top'} onClick={() => onMainViewChange('top')}>
          {t('Liste Top')}
        </SegmentedButton>
        <SegmentedButton active={mainView === 'judgeNotes'} onClick={() => onMainViewChange('judgeNotes')}>
          {t('Notes des juges')}
        </SegmentedButton>

        {mainView === 'global' && (
          <div
            className="ml-1 flex items-center gap-0.5 rounded-md border-l-2 pl-2"
            style={{ borderColor: 'rgb(var(--color-primary-500) / 0.7)' }}
          >
            <SegmentedButton active={globalVariant === 'detailed'} onClick={() => onGlobalVariantChange('detailed')}>
              {t('Détaillé')}
            </SegmentedButton>
            <SegmentedButton active={globalVariant === 'category'} onClick={() => onGlobalVariantChange('category')}>
              {t('Par catégorie')}
            </SegmentedButton>
          </div>
        )}

        <HoverTextTooltip text={notesPanelHidden ? t('Afficher note générale') : t('Masquer note générale')}>
          <button
            type="button"
            onClick={onToggleNotesPanel}
            aria-label={notesPanelHidden ? t('Afficher note générale') : t('Masquer note générale')}
            className={`ml-1 inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
              notesPanelHidden
                ? 'text-gray-500 hover:bg-white/5 hover:text-white'
                : 'bg-surface-dark/80 text-gray-200 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FileText size={14} />
          </button>
        </HoverTextTooltip>
      </div>
    </div>
  )
}
