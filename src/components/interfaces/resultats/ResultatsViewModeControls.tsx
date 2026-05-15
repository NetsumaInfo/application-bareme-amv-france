import { FileText, Image, Star } from 'lucide-react'
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
  favoritesPanelVisible?: boolean
  onToggleFavoritesPanel?: () => void
  showMiniatures: boolean
  hasAnyLinkedVideo: boolean
  onToggleMiniatures: () => void
  showJudgeNotesView?: boolean
  showNotesPanelToggle?: boolean
}

function SegmentedButton({
  active,
  children,
  onClick,
  ariaLabel,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] transition-colors ${
        active
          ? 'bg-surface-dark/90 text-white'
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
  favoritesPanelVisible = false,
  onToggleFavoritesPanel,
  showMiniatures,
  hasAnyLinkedVideo,
  onToggleMiniatures,
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
          ariaLabel={t('Tableau par juge')}
        >
          {t('Tableau par juge')}
        </SegmentedButton>
        <SegmentedButton
          active={mainView === 'global'}
          onClick={() => onMainViewChange('global')}
          ariaLabel={t('Tableau global')}
        >
          {t('Tableau global')}
        </SegmentedButton>
        <SegmentedButton
          active={mainView === 'top'}
          onClick={() => onMainViewChange('top')}
          ariaLabel={t('Liste Top')}
        >
          {t('Liste Top')}
        </SegmentedButton>
        {showJudgeNotesView && (
          <SegmentedButton
            active={mainView === 'judgeNotes'}
            onClick={() => onMainViewChange('judgeNotes')}
            ariaLabel={t('Commentaires des juges')}
          >
            {t('Commentaires des juges')}
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
              ariaLabel={t('Détaillé')}
            >
              {t('Détaillé')}
            </SegmentedButton>
            <SegmentedButton
              active={globalVariant === 'category'}
              onClick={() => onGlobalVariantChange('category')}
              ariaLabel={t('Par catégorie')}
            >
              {t('Par catégorie')}
            </SegmentedButton>
          </div>
        )}

        {showNotesPanelToggle && (
          <>
            <HoverTextTooltip text={notesPanelHidden ? t('Afficher commentaire général') : t('Masquer commentaire général')}>
              <button
                type="button"
                onClick={onToggleNotesPanel}
                aria-label={notesPanelHidden ? t('Afficher commentaire général') : t('Masquer commentaire général')}
                className={`ml-1 inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                  notesPanelHidden
                    ? 'text-gray-500 hover:bg-white/5 hover:text-white'
                    : 'bg-surface-dark/90 text-gray-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                <FileText size={14} />
              </button>
            </HoverTextTooltip>
            {onToggleFavoritesPanel ? (
              <HoverTextTooltip text={t('Afficher les favoris')}>
                <button
                  type="button"
                  onClick={onToggleFavoritesPanel}
                  aria-label={t('Afficher les favoris')}
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                    favoritesPanelVisible
                      ? 'bg-amber-400/14 text-amber-200'
                      : 'text-gray-500 hover:bg-white/5 hover:text-amber-200'
                  }`}
                >
                  <Star size={14} fill={favoritesPanelVisible ? 'currentColor' : 'none'} />
                </button>
              </HoverTextTooltip>
            ) : null}
            <HoverTextTooltip text={showMiniatures ? t('Masquer les miniatures') : t('Afficher les miniatures')}>
              <button
                type="button"
                onClick={hasAnyLinkedVideo ? onToggleMiniatures : undefined}
                aria-label={showMiniatures ? t('Masquer les miniatures') : t('Afficher les miniatures')}
                disabled={!hasAnyLinkedVideo}
                className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                  showMiniatures
                    ? 'bg-surface-dark/90 text-gray-200 hover:bg-white/5 hover:text-white'
                    : 'text-gray-500 hover:bg-white/5 hover:text-white'
                } disabled:cursor-not-allowed disabled:opacity-35`}
              >
                <Image size={14} />
              </button>
            </HoverTextTooltip>
          </>
        )}
      </div>
    </div>
  )
}
