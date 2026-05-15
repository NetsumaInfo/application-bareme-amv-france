import { SettingsToggle } from '@/components/settings/SettingsToggle'
import type { Bareme } from '@/types/bareme'
import type { ProjectSettings } from '@/types/project'
import { useI18n } from '@/i18n'

interface SettingsNotationTabProps {
  currentBareme: Bareme | null
  settings: ProjectSettings | undefined
  hideFinalScore: boolean
  hideAverages: boolean
  hideTextNotes: boolean
  onOpenBaremeEditor: () => void
  onToggleFinalScore: () => void
  onToggleAverages: () => void
  onToggleTextNotes: () => void
  onUpdateSettings: (updates: Partial<ProjectSettings>) => void
}

const SUBTLE_BORDER = 'ring-1 ring-inset ring-primary-400/10'
const CARD = `rounded-xl bg-surface/40 p-4 ${SUBTLE_BORDER}`
const ROW = `flex items-center justify-between gap-3 rounded-lg bg-surface-dark/45 px-3 py-2.5 ${SUBTLE_BORDER}`
const SECTION_LABEL = 'text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3'

export function SettingsNotationTab({
  currentBareme,
  settings,
  hideFinalScore,
  hideAverages,
  hideTextNotes,
  onOpenBaremeEditor,
  onToggleFinalScore,
  onToggleAverages,
  onToggleTextNotes,
  onUpdateSettings,
}: SettingsNotationTabProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-5">

      {/* ── Barème actif ── */}
      <div className={CARD}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className={SECTION_LABEL + ' mb-0'}>{t('Barème')}</p>
          <button
            onClick={onOpenBaremeEditor}
            className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors shrink-0"
          >
            {t('Éditeur complet')} →
          </button>
        </div>
        <div className={`rounded-lg bg-surface-dark/45 px-3 py-3 ${SUBTLE_BORDER}`}>
          {currentBareme ? (
            <>
              <div className="text-sm font-semibold text-white">{currentBareme.name}</div>
              <div className="mt-1 text-[10px] text-gray-500">
                {t('{count} critères — {points} points', {
                  count: currentBareme.criteria.length,
                  points: currentBareme.totalPoints,
                })}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 italic">{t('Aucun barème sélectionné')}</div>
          )}
        </div>
      </div>

      {/* ── Affichage des scores ── */}
      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('Affichage des scores')}</p>
        <div className="space-y-2">
          <div className={ROW}>
            <div>
              <span className="text-sm text-gray-300 block">{t('Masquer les totaux jusqu\'à tout noter')}</span>
              <span className="text-[10px] text-gray-500">{t('Les scores restent cachés tant que tous les clips ne sont pas notés')}</span>
            </div>
            <SettingsToggle
              checked={settings?.hideFinalScoreUntilEnd ?? false}
              onChange={() =>
                onUpdateSettings({ hideFinalScoreUntilEnd: !(settings?.hideFinalScoreUntilEnd ?? false) })
              }
            />
          </div>

          <div className={ROW}>
            <span className="min-w-0 pr-2 text-sm text-gray-300">{t('Masquer les scores')}</span>
            <SettingsToggle checked={hideFinalScore} onChange={onToggleFinalScore} />
          </div>

          <div className={ROW}>
            <span className="min-w-0 pr-2 text-sm text-gray-300">{t('Masquer les totaux')}</span>
            <SettingsToggle
              checked={Boolean(settings?.hideTotals)}
              onChange={() => onUpdateSettings({ hideTotals: !(settings?.hideTotals ?? false) })}
            />
          </div>

          <div className={ROW}>
            <span className="min-w-0 pr-2 text-sm text-gray-300">{t('Masquer les moyennes')}</span>
            <SettingsToggle checked={hideAverages} onChange={onToggleAverages} />
          </div>
        </div>
      </div>

      {/* ── Commentaires ── */}
      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('Commentaires')}</p>
        <div className="space-y-2">
          <div className={ROW}>
            <span className="min-w-0 pr-2 text-sm text-gray-300">{t('Masquer les commentaires')}</span>
            <SettingsToggle checked={hideTextNotes} onChange={onToggleTextNotes} />
          </div>
        </div>
      </div>

    </div>
  )
}
