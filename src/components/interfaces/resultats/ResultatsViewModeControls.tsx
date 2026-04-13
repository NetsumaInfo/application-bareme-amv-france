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
  showJudgeNotesView?: boolean
  showNotesPanelToggle?: boolean
}

function SegmentedButton({
  active,
  children,
  onClick,
  tooltip,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
  tooltip: string
}) {
  return (
    <HoverTextTooltip text={tooltip} className="inline-flex">
      <button
        type="button"
        onClick={onClick}
        aria-label={tooltip}
        className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] transition-colors ${
          active
            ? 'bg-surface-dark/90 text-white'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        {children}
      </button>
    </HoverTextTooltip>
  )
}

export function ResultatsViewModeControls({
  mainView,
  onMainViewChange,
  globalVariant,
  onGlobalVariantChange,
  notesPanelHidden,
  onToggleNotesPanel,
  showJudgeNotesView = true,
  showNotesPanelToggle = true,
}: ResultatsViewModeControlsProps) {
  const { t } = useI18n()
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-0.5">
      <div className="flex min-w-0 flex-wrap items-center gap-0.5">
        <SegmentedButton
          active={mainView === 'judge'}
          onClick={() => onMainViewChange('judge')}
          tooltip={t('Afficher un tableau séparé pour chaque juge')}
        >
          {t('Tableau par juge')}
        </SegmentedButton>
        <SegmentedButton
          active={mainView === 'global'}
          onClick={() => onMainViewChange('global')}
          tooltip={t('Afficher la synthèse globale des résultats')}
        >
          {t('Tableau global')}
        </SegmentedButton>
        <SegmentedButton
          active={mainView === 'top'}
          onClick={() => onMainViewChange('top')}
          tooltip={t('Afficher uniquement le classement Top')}
        >
          {t('Liste Top')}
        </SegmentedButton>
        {showJudgeNotesView && (
          <SegmentedButton
            active={mainView === 'judgeNotes'}
            onClick={() => onMainViewChange('judgeNotes')}
            tooltip={t('Afficher les notes écrites par juge')}
          >
            {t('Notes des juges')}
          </SegmentedButton>
        )}

        {mainView === 'global' && (
          <div
            className="ml-1 flex items-center gap-0.5 rounded-md border-l-2 pl-2"
            style={{ borderColor: 'rgb(var(--color-primary-500) / 0.7)' }}
          >
            <SegmentedButton
              active={globalVariant === 'detailed'}
              onClick={() => onGlobalVariantChange('detailed')}
              tooltip={t('Afficher le détail de chaque critère')}
            >
              {t('Détaillé')}
            </SegmentedButton>
            <SegmentedButton
              active={globalVariant === 'category'}
              onClick={() => onGlobalVariantChange('category')}
              tooltip={t('Regrouper les scores par catégorie')}
            >
              {t('Par catégorie')}
            </SegmentedButton>
          </div>
        )}

        {showNotesPanelToggle && (
          <HoverTextTooltip text={notesPanelHidden ? t('Afficher note générale') : t('Masquer note générale')}>
            <button
              type="button"
              onClick={onToggleNotesPanel}
              aria-label={notesPanelHidden ? t('Afficher note générale') : t('Masquer note générale')}
              className={`ml-1 inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                notesPanelHidden
                  ? 'text-gray-500 hover:bg-white/5 hover:text-white'
                  : 'bg-surface-dark/90 text-gray-200 hover:bg-white/5 hover:text-white'
              }`}
            >
              <FileText size={14} />
            </button>
          </HoverTextTooltip>
        )}
      </div>
    </div>
  )
}
