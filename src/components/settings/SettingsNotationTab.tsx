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
  const subtleBorderClassName = 'ring-1 ring-inset ring-primary-400/10'
  const cardClassName = `rounded-xl bg-surface/40 p-4 ${subtleBorderClassName}`
  const sectionClassName = 'space-y-2'
  const settingRowClassName = `flex items-center justify-between gap-3 rounded-lg bg-surface-dark/45 px-3 py-2.5 ${subtleBorderClassName}`

  return (
    <>
      <div className={cardClassName}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">{t('Barème')}</h3>
          </div>
          <button
            onClick={onOpenBaremeEditor}
            className="text-[10px] text-primary-400 hover:text-primary-300"
          >
            {t('Éditeur complet')}
          </button>
        </div>
        <div className={`mt-3 rounded-lg bg-surface-dark/45 p-3 ${subtleBorderClassName}`}>
          <div className="text-xs font-medium text-gray-300">{t('Barème actif')}</div>
          <div className="mt-1.5 text-sm font-medium text-white">{currentBareme?.name ?? t('Aucun')}</div>
          {currentBareme && (
            <div className="mt-0.5 text-[10px] text-gray-500">
              {t('{count} critères — {points} points', {
                count: currentBareme.criteria.length,
                points: currentBareme.totalPoints,
              })}
            </div>
          )}
        </div>
      </div>

      <div className={cardClassName}>
        <div className="space-y-3">
          <div className={sectionClassName}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{t('Scores')}</h3>

            <div className={settingRowClassName}>
              <span className="min-w-0 pr-2 text-sm text-gray-300">{t("Masquer les totaux jusqu'à tout noter")}</span>
              <SettingsToggle
                checked={settings?.hideFinalScoreUntilEnd ?? false}
                onChange={() =>
                  onUpdateSettings({
                    hideFinalScoreUntilEnd: !(settings?.hideFinalScoreUntilEnd ?? false),
                  })
                }
              />
            </div>

            <div className={settingRowClassName}>
              <span className="min-w-0 pr-2 text-sm text-gray-300">{t('Masquer les scores')}</span>
              <SettingsToggle checked={hideFinalScore} onChange={onToggleFinalScore} />
            </div>

            <div className={settingRowClassName}>
              <span className="min-w-0 pr-2 text-sm text-gray-300">{t('Masquer les totaux')}</span>
              <SettingsToggle
                checked={Boolean(settings?.hideTotals)}
                onChange={() =>
                  onUpdateSettings({
                    hideTotals: !(settings?.hideTotals ?? false),
                  })
                }
              />
            </div>

            <div className={settingRowClassName}>
              <span className="min-w-0 pr-2 text-sm text-gray-300">{t('Masquer les moyennes')}</span>
              <SettingsToggle checked={hideAverages} onChange={onToggleAverages} />
            </div>

            <div className={settingRowClassName}>
              <span className="min-w-0 pr-2 text-sm text-gray-300">{t('Masquer la prise de notes')}</span>
              <SettingsToggle checked={hideTextNotes} onChange={onToggleTextNotes} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
