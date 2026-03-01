import { SettingsToggle } from '@/components/settings/SettingsToggle'
import type { Bareme } from '@/types/bareme'
import type { MultiPseudoDisplayMode, ProjectSettings } from '@/types/project'
import { useI18n } from '@/i18n'

interface SettingsNotationTabProps {
  currentBareme: Bareme | null
  settings: ProjectSettings | undefined
  hideFinalScore: boolean
  hideAverages: boolean
  hideTextNotes: boolean
  showAudioDb: boolean
  onOpenBaremeEditor: () => void
  onToggleFinalScore: () => void
  onToggleAverages: () => void
  onToggleTextNotes: () => void
  onToggleAudioDb: () => void
  onUpdateSettings: (updates: Partial<ProjectSettings>) => void
}

export function SettingsNotationTab({
  currentBareme,
  settings,
  hideFinalScore,
  hideAverages,
  hideTextNotes,
  showAudioDb,
  onOpenBaremeEditor,
  onToggleFinalScore,
  onToggleAverages,
  onToggleTextNotes,
  onToggleAudioDb,
  onUpdateSettings,
}: SettingsNotationTabProps) {
  const { t } = useI18n()
  const multiPseudoDisplayMode = settings?.multiPseudoDisplayMode ?? 'collab_mep'
  const multiPseudoDisplayOptions: Array<{
    value: MultiPseudoDisplayMode
    label: string
  }> = [
    { value: 'collab_mep', label: 'colab / mep' },
    { value: 'first_three', label: '3 pseudos + ...' },
    { value: 'all', label: 'Tous les pseudos' },
  ]

  return (
    <>
      <div className="p-3 rounded-lg bg-surface-dark border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-300">{t('Barème actif')}</span>
          <button
            onClick={onOpenBaremeEditor}
            className="text-[10px] text-primary-400 hover:text-primary-300"
          >
            {t('Éditeur complet')}
          </button>
        </div>
        <div className="text-sm text-white font-medium">{currentBareme?.name ?? t('Aucun')}</div>
        {currentBareme && (
          <div className="text-[10px] text-gray-500 mt-0.5">
            {t('{count} critères — {points} points', {
              count: currentBareme.criteria.length,
              points: currentBareme.totalPoints,
            })}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2 border-t border-gray-700">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <span className="text-sm text-gray-300 block">{t("Masquer les totaux jusqu'à tout noter")}</span>
            <span className="text-[10px] text-gray-500">
              {t('Les pages Résultat/Export restent accessibles, mais les totaux restent masqués tant que tous les clips ne sont pas notés')}
            </span>
          </div>
          <SettingsToggle
            checked={settings?.hideFinalScoreUntilEnd ?? false}
            onChange={() =>
              onUpdateSettings({
                hideFinalScoreUntilEnd: !(settings?.hideFinalScoreUntilEnd ?? false),
              })
            }
          />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <span className="text-sm text-gray-300 block">{t('Masquer les scores')}</span>
            <span className="text-[10px] text-gray-500">{t('Cache le score total pendant la notation')}</span>
          </div>
          <SettingsToggle checked={hideFinalScore} onChange={onToggleFinalScore} />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <span className="text-sm text-gray-300 block">{t('Masquer les totaux')}</span>
            <span className="text-[10px] text-gray-500">{t('Cache la colonne Total et désactive le tri par note')}</span>
          </div>
          <SettingsToggle
            checked={Boolean(settings?.hideTotals)}
            onChange={() =>
              onUpdateSettings({
                hideTotals: !(settings?.hideTotals ?? false),
              })
            }
          />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <span className="text-sm text-gray-300 block">{t('Masquer les moyennes')}</span>
            <span className="text-[10px] text-gray-500">{t('Cache la ligne de moyennes du tableur')}</span>
          </div>
          <SettingsToggle checked={hideAverages} onChange={onToggleAverages} />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <span className="text-sm text-gray-300 block">{t('Afficher miniatures des clips')}</span>
            <span className="text-[10px] text-gray-500">{t('Affiche une image du clip sous le pseudo dans le tableur')}</span>
          </div>
          <SettingsToggle
            checked={Boolean(settings?.showMiniatures)}
            onChange={() =>
              onUpdateSettings({
                showMiniatures: !(settings?.showMiniatures ?? false),
              })
            }
          />
        </div>
        <div>
          <div className="mb-1">
            <span className="text-sm text-gray-300 block">{t('Affichage des pseudos multiples')}</span>
            <span className="text-[10px] text-gray-500">
              {t('Choisis comment afficher les auteurs contenant plusieurs pseudos')}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {multiPseudoDisplayOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onUpdateSettings({ multiPseudoDisplayMode: option.value })}
                className={`rounded border px-2 py-2 text-[11px] transition-colors ${
                  multiPseudoDisplayMode === option.value
                    ? 'border-primary-500 text-primary-300 bg-primary-500/10'
                    : 'border-gray-700 text-gray-300 hover:text-white hover:border-gray-600'
                }`}
              >
                <span className="whitespace-normal break-words leading-tight">{t(option.label)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <span className="text-sm text-gray-300 block">{t('Afficher bouton “Ajouter une ligne”')}</span>
            <span className="text-[10px] text-gray-500">{t('Affiche/masque la barre d’ajout manuel dans le tableur')}</span>
          </div>
          <SettingsToggle
            checked={Boolean(settings?.showAddRowButton)}
            onChange={() =>
              onUpdateSettings({
                showAddRowButton: !(settings?.showAddRowButton ?? false),
              })
            }
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-300 block">{t('Frame miniature par défaut')}</span>
            <span className="text-[10px] text-gray-500">{t('secondes')}</span>
          </div>
          <input
            type="number"
            min={0}
            max={600}
            step={0.1}
            value={settings?.thumbnailDefaultTimeSec ?? 10}
            onChange={(event) => {
              const raw = Number(event.target.value)
              if (!Number.isFinite(raw)) return
              const clamped = Math.max(0, Math.min(600, raw))
              onUpdateSettings({ thumbnailDefaultTimeSec: clamped })
            }}
            className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
          />
          <p className="text-[10px] text-gray-500 mt-1">
            {t('Utilisée si aucune frame manuelle n’est définie pour le clip.')}
          </p>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <span className="text-sm text-gray-300 block">{t('Masquer la prise de notes')}</span>
            <span className="text-[10px] text-gray-500">{t('Cache les zones de texte "Notes libres"')}</span>
          </div>
          <SettingsToggle checked={hideTextNotes} onChange={onToggleTextNotes} />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <span className="text-sm text-gray-300 block">{t('Afficher VU-mètre audio L/R (dB)')}</span>
            <span className="text-[10px] text-gray-500">{t('Niveaux audio en temps réel sur le lecteur vidéo')}</span>
          </div>
          <SettingsToggle checked={showAudioDb} onChange={onToggleAudioDb} />
        </div>
      </div>
    </>
  )
}
