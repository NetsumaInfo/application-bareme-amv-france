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
  const subtleBorderClassName = 'ring-1 ring-inset ring-primary-400/10'
  const sectionClassName = `rounded-xl bg-surface/40 p-4 ${subtleBorderClassName}`
  const settingRowClassName = `flex items-center justify-between gap-3 rounded-lg bg-surface-dark/45 px-3 py-2.5 ${subtleBorderClassName}`
  const multiPseudoDisplayOptions: Array<{
    value: MultiPseudoDisplayMode
    label: string
  }> = [
    { value: 'collab_mep', label: 'Collab / MEP' },
    { value: 'first_three', label: '3 pseudos puis ...' },
    { value: 'all', label: 'Tous les pseudos' },
  ]
  const clipNamePatternOptions: Array<{
    value: ClipNamePattern
    label: string
    example: string
  }> = [
    { value: 'pseudo_clip', label: t('Pseudo - Clip'), example: t('Pseudo - Titre.mp4') },
    { value: 'clip_pseudo', label: t('Clip - Pseudo'), example: t('Titre - Pseudo.mp4') },
  ]

  return (
    <>
      <div className={sectionClassName}>
        <h3 className="mb-3 text-sm font-semibold text-white">{t('Identité du projet')}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">{t('Nom du juge')}</label>
            <input
              value={currentProject?.judgeName ?? ''}
              onChange={(event) => onUpdateProject({ judgeName: event.target.value })}
              placeholder={t('ex: Netsuma')}
              className={`w-full px-3 py-2 bg-surface-dark/45 rounded-lg text-sm text-white placeholder-gray-500 ${subtleBorderClassName} focus:outline-none`}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">{t('Nom du concours')}</label>
            <input
              value={currentProject?.name ?? ''}
              onChange={(event) => onUpdateProject({ name: event.target.value })}
              placeholder={t('ex: Concours Japan Expo')}
              className={`w-full px-3 py-2 bg-surface-dark/45 rounded-lg text-sm text-white placeholder-gray-500 ${subtleBorderClassName} focus:outline-none`}
            />
          </div>

          <div className={settingRowClassName}>
            <div>
              <span className="text-sm text-gray-300 block">{t('Sauvegarde automatique')}</span>
              <span className="text-[10px] text-gray-500">{t("Sauvegarde le projet à intervalle régulier")}</span>
            </div>
            <div className="flex items-center gap-2">
              {settings?.autoSave && (
                <AppSelect
                  value={settings.autoSaveInterval}
                  onChange={(autoSaveInterval) =>
                    onUpdateSettings({
                      autoSaveInterval,
                    })
                  }
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
      </div>

      <div className={sectionClassName}>
        <h3 className="mb-3 text-sm font-semibold text-white">{t('Clips du projet')}</h3>
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-sm text-gray-300">{t('Convention des noms de clips')}</div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {clipNamePatternOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onUpdateSettings({ clipNamePattern: option.value })}
                  className={`rounded-lg px-2.5 py-2 text-left text-[11px] transition-colors ${subtleBorderClassName} ${
                    clipNamePattern === option.value
                      ? 'bg-primary-500/10 text-primary-300'
                      : 'bg-surface-dark/45 text-gray-300 hover:bg-surface-light/50 hover:text-white'
                  }`}
                >
                  <span className="block whitespace-normal break-words leading-tight">{option.label}</span>
                  <span className="mt-1 block truncate text-[10px] text-gray-500">{option.example}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500">
              {t("Appliqué aux prochains imports vidéo. Les clips déjà importés ne sont pas renommés.")}
            </p>
          </div>

          <div>
            <div className="mb-2 text-sm text-gray-300">{t('Affichage des pseudos multiples')}</div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {multiPseudoDisplayOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onUpdateSettings({ multiPseudoDisplayMode: option.value })}
                  className={`rounded-lg px-2.5 py-2 text-[11px] transition-colors ${subtleBorderClassName} ${
                    multiPseudoDisplayMode === option.value
                      ? 'bg-primary-500/10 text-primary-300'
                      : 'bg-surface-dark/45 text-gray-300 hover:bg-surface-light/50 hover:text-white'
                  }`}
                >
                  <span className="whitespace-normal break-words leading-tight">{t(option.label)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={settingRowClassName}>
            <span className="min-w-0 pr-2 text-sm text-gray-300">{t('Afficher les miniatures des clips')}</span>
            <SettingsToggle
              checked={Boolean(settings?.showMiniatures)}
              onChange={() =>
                onUpdateSettings({
                  showMiniatures: !(settings?.showMiniatures ?? false),
                })
              }
            />
          </div>

          <div className={settingRowClassName}>
            <span className="min-w-0 pr-2 text-sm text-gray-300">{t('Afficher les actions rapides')}</span>
            <SettingsToggle
              checked={showQuickActions}
              onChange={() =>
                onUpdateSettings({
                  showQuickActions: !showQuickActions,
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_120px] md:items-end">
            <label className="block">
              <span className="mb-2 block text-sm text-gray-300">{t('Frame miniature par défaut')}</span>
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
                className={`w-full rounded-lg bg-surface-dark/45 px-3 py-2 text-sm text-white placeholder-gray-500 ${subtleBorderClassName} focus:outline-none`}
              />
            </label>
            <span className="pb-2 text-right text-[10px] text-gray-500">{t('secondes')}</span>
          </div>
        </div>
      </div>
    </>
  )
}
