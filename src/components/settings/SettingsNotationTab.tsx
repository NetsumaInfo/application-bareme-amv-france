import { SettingsToggle } from '@/components/settings/SettingsToggle'
import type { Bareme } from '@/types/bareme'
import type { MultiPseudoDisplayMode, ProjectSettings } from '@/types/project'

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
          <span className="text-xs font-medium text-gray-300">Barème actif</span>
          <button
            onClick={onOpenBaremeEditor}
            className="text-[10px] text-primary-400 hover:text-primary-300"
          >
            Éditeur complet
          </button>
        </div>
        <div className="text-sm text-white font-medium">{currentBareme?.name ?? 'Aucun'}</div>
        {currentBareme && (
          <div className="text-[10px] text-gray-500 mt-0.5">
            {currentBareme.criteria.length} critères — {currentBareme.totalPoints} points
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-300 block">Bloquer les résultats jusqu'à tout noter</span>
            <span className="text-[10px] text-gray-500">
              Cache les totaux et les onglets Résultat/Export tant que des clips ne sont pas marqués notés
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
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-300 block">Masquer les scores</span>
            <span className="text-[10px] text-gray-500">Cache le score total pendant la notation</span>
          </div>
          <SettingsToggle checked={hideFinalScore} onChange={onToggleFinalScore} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-300 block">Masquer les totaux</span>
            <span className="text-[10px] text-gray-500">Cache la colonne Total et désactive le tri par note</span>
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
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-300 block">Masquer les moyennes</span>
            <span className="text-[10px] text-gray-500">Cache la ligne de moyennes du tableur</span>
          </div>
          <SettingsToggle checked={hideAverages} onChange={onToggleAverages} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-300 block">Afficher miniatures des clips</span>
            <span className="text-[10px] text-gray-500">Affiche une image du clip sous le pseudo dans le tableur</span>
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
            <span className="text-sm text-gray-300 block">Affichage des pseudos multiples</span>
            <span className="text-[10px] text-gray-500">
              Choisis comment afficher les auteurs contenant plusieurs pseudos
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {multiPseudoDisplayOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onUpdateSettings({ multiPseudoDisplayMode: option.value })}
                className={`px-2 py-1.5 rounded border text-[11px] transition-colors ${
                  multiPseudoDisplayMode === option.value
                    ? 'border-primary-500 text-primary-300 bg-primary-500/10'
                    : 'border-gray-700 text-gray-300 hover:text-white hover:border-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-300 block">Afficher bouton “Ajouter une ligne”</span>
            <span className="text-[10px] text-gray-500">Affiche/masque la barre d’ajout manuel dans le tableur</span>
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
            <span className="text-sm text-gray-300 block">Frame miniature par défaut</span>
            <span className="text-[10px] text-gray-500">secondes</span>
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
            Utilisée si aucune frame manuelle n&apos;est définie pour le clip.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-300 block">Masquer la prise de notes</span>
            <span className="text-[10px] text-gray-500">Cache les zones de texte "Notes libres"</span>
          </div>
          <SettingsToggle checked={hideTextNotes} onChange={onToggleTextNotes} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-300 block">Afficher VU-mètre audio L/R (dB)</span>
            <span className="text-[10px] text-gray-500">Niveaux audio en temps réel sur le lecteur vidéo</span>
          </div>
          <SettingsToggle checked={showAudioDb} onChange={onToggleAudioDb} />
        </div>
      </div>
    </>
  )
}
