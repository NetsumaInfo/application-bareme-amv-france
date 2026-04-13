import { AppSelect } from '@/components/ui/AppSelect'
import { SettingsToggle } from '@/components/settings/SettingsToggle'
import type { ClipNamePattern, MultiPseudoDisplayMode, Project, ProjectSettings } from '@/types/project'
import { useI18n } from '@/i18n'

interface SettingsProjectTabProps {
  currentProject: Project | null
  settings: ProjectSettings | undefined
  onUpdateProject: (updates: Partial<Project>) => void
  onUpdateSettings: (updates: Partial<ProjectSettings>) => void
}

const SUBTLE_BORDER = 'ring-1 ring-inset ring-primary-400/10'
const CARD = `rounded-xl bg-surface/40 p-4 ${SUBTLE_BORDER}`
const ROW = `flex items-center justify-between gap-3 rounded-lg bg-surface-dark/45 px-3 py-2.5 ${SUBTLE_BORDER}`
const SECTION_LABEL = 'text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3'

export function SettingsProjectTab({
  currentProject,
  settings,
  onUpdateProject,
  onUpdateSettings,
}: SettingsProjectTabProps) {
  const { t } = useI18n()
  const showQuickActions = settings?.showQuickActions ?? true
  const multiPseudoDisplayMode = settings?.multiPseudoDisplayMode ?? 'all'
  const clipNamePattern = settings?.clipNamePattern ?? 'pseudo_clip'

  const multiPseudoDisplayOptions: Array<{ value: MultiPseudoDisplayMode; label: string }> = [
    { value: 'collab_mep', label: t('Collab / MEP') },
    { value: 'first_three', label: t('3 pseudos puis ...') },
    { value: 'all', label: t('Tous les pseudos') },
  ]
  const clipNamePatternOptions: Array<{ value: ClipNamePattern; label: string; example: string }> = [
    { value: 'pseudo_clip', label: t('Pseudo — Clip'), example: t('Pseudo - Titre.mp4') },
    { value: 'clip_pseudo', label: t('Clip — Pseudo'), example: t('Titre - Pseudo.mp4') },
  ]

  return (
    <div className="space-y-5">
      {/* ── Identité ── */}
      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('Identité du projet')}</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">{t('Nom du juge')}</label>
            <input
              value={currentProject?.judgeName ?? ''}
              onChange={(e) => onUpdateProject({ judgeName: e.target.value })}
              placeholder={t('ex: Netsuma')}
              className={`w-full px-3 py-2 bg-surface-dark/45 rounded-lg text-sm text-white placeholder-gray-500 ${SUBTLE_BORDER} focus:outline-none`}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">{t('Nom du concours')}</label>
            <input
              value={currentProject?.name ?? ''}
              onChange={(e) => onUpdateProject({ name: e.target.value })}
              placeholder={t('ex: Concours Japan Expo')}
              className={`w-full px-3 py-2 bg-surface-dark/45 rounded-lg text-sm text-white placeholder-gray-500 ${SUBTLE_BORDER} focus:outline-none`}
            />
          </div>
        </div>
      </div>

      {/* ── Sauvegarde ── */}
      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('Sauvegarde')}</p>
        <div className={ROW}>
          <div>
            <span className="text-sm text-gray-300 block">{t('Sauvegarde automatique')}</span>
            <span className="text-[10px] text-gray-500">{t('Sauvegarde le projet à intervalle régulier')}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {settings?.autoSave && (
              <AppSelect
                value={settings.autoSaveInterval}
                onChange={(autoSaveInterval) => onUpdateSettings({ autoSaveInterval })}
                ariaLabel={t('Sauvegarde automatique')}
                className="w-[5.8rem]"
                options={[
                  { value: 10, label: '10s' },
                  { value: 30, label: '30s' },
                  { value: 60, label: '1min' },
                  { value: 120, label: '2min' },
                ]}
              />
            )}
            <SettingsToggle
              checked={settings?.autoSave ?? true}
              onChange={() => onUpdateSettings({ autoSave: !settings?.autoSave })}
            />
          </div>
        </div>
      </div>

      {/* ── Clips ── */}
      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('Clips du projet')}</p>
        <div className="space-y-5">

          {/* Convention noms */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">{t('Convention des noms de clips')}</label>
            <div className="grid grid-cols-2 gap-2">
              {clipNamePatternOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSettings({ clipNamePattern: opt.value })}
                  className={`rounded-lg px-3 py-2.5 text-left text-[11px] transition-colors ${SUBTLE_BORDER} ${
                    clipNamePattern === opt.value
                      ? 'bg-primary-500/10 text-primary-300'
                      : 'bg-surface-dark/45 text-gray-300 hover:bg-surface-light/50 hover:text-white'
                  }`}
                >
                  <span className="block font-medium leading-tight">{opt.label}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-gray-500">{opt.example}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500">
              {t('Appliqué aux prochains imports vidéo. Les clips déjà importés ne sont pas renommés.')}
            </p>
          </div>

          {/* Pseudos multiples */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">{t('Affichage des pseudos multiples')}</label>
            <div className="grid grid-cols-3 gap-2">
              {multiPseudoDisplayOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSettings({ multiPseudoDisplayMode: opt.value })}
                  className={`rounded-lg px-2.5 py-2 text-[11px] text-center transition-colors ${SUBTLE_BORDER} ${
                    multiPseudoDisplayMode === opt.value
                      ? 'bg-primary-500/10 text-primary-300'
                      : 'bg-surface-dark/45 text-gray-300 hover:bg-surface-light/50 hover:text-white'
                  }`}
                >
                  <span className="whitespace-normal break-words leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <div className={ROW}>
              <span className="min-w-0 pr-2 text-sm text-gray-300">{t('Afficher les miniatures des clips')}</span>
              <SettingsToggle
                checked={Boolean(settings?.showMiniatures)}
                onChange={() => onUpdateSettings({ showMiniatures: !(settings?.showMiniatures ?? false) })}
              />
            </div>
            <div className={ROW}>
              <span className="min-w-0 pr-2 text-sm text-gray-300">{t('Afficher les actions rapides')}</span>
              <SettingsToggle
                checked={showQuickActions}
                onChange={() => onUpdateSettings({ showQuickActions: !showQuickActions })}
              />
            </div>
          </div>

          {/* Miniature frame */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">{t('Frame miniature par défaut')}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={600}
                step={0.1}
                value={settings?.thumbnailDefaultTimeSec ?? 10}
                onChange={(e) => {
                  const raw = Number(e.target.value)
                  if (!Number.isFinite(raw)) return
                  onUpdateSettings({ thumbnailDefaultTimeSec: Math.max(0, Math.min(600, raw)) })
                }}
                className={`w-28 rounded-lg bg-surface-dark/45 px-3 py-2 text-sm text-white placeholder-gray-500 ${SUBTLE_BORDER} focus:outline-none`}
              />
              <span className="text-xs text-gray-500">{t('secondes')}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
