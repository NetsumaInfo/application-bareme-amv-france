import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { getInterfaceOptions } from '@/components/settings/settingsPanelConfig'
import { SettingsToggle } from '@/components/settings/SettingsToggle'
import type { Project, ProjectSettings } from '@/types/project'
import type { InterfaceMode } from '@/types/notation'
import {
  APP_THEME_OPTIONS,
  PRIMARY_COLOR_OPTIONS,
  type AppThemePreset,
  type PrimaryColorPreset,
} from '@/utils/appTheme'
import { useI18n } from '@/i18n'

interface SettingsGeneralTabProps {
  currentProject: Project | null
  settings: ProjectSettings | undefined
  currentInterface: InterfaceMode
  zoomMode: 'fixed' | 'navigable'
  zoomLevel: number
  appTheme: AppThemePreset
  primaryColorPreset: PrimaryColorPreset
  projectsFolderPath: string
  onUpdateProject: (updates: Partial<Project>) => void
  onUpdateSettings: (updates: Partial<ProjectSettings>) => void
  onSwitchInterface: (mode: InterfaceMode) => void
  onSetZoomMode: (mode: 'fixed' | 'navigable') => void
  onSetZoomLevel: (level: number) => void
  onSetAppTheme: (theme: AppThemePreset) => void
  onSetPrimaryColorPreset: (preset: PrimaryColorPreset) => void
}

export function SettingsGeneralTab({
  currentProject,
  settings,
  currentInterface,
  zoomMode,
  zoomLevel,
  appTheme,
  primaryColorPreset,
  projectsFolderPath,
  onUpdateProject,
  onUpdateSettings,
  onSwitchInterface,
  onSetZoomMode,
  onSetZoomLevel,
  onSetAppTheme,
  onSetPrimaryColorPreset,
}: SettingsGeneralTabProps) {
  const { t } = useI18n()
  const isLightAppearanceTheme = appTheme === 'porcelain' || appTheme === 'pearl' || appTheme === 'ivory' || appTheme === 'sand'
  const orderedThemes = APP_THEME_OPTIONS
  const orderedAccents = PRIMARY_COLOR_OPTIONS
  const interfaceOptions = getInterfaceOptions(t)

  const renderThemeCard = (option: typeof APP_THEME_OPTIONS[number]) => (
    <button
      key={option.value}
      onClick={() => onSetAppTheme(option.value)}
      className={`rounded-xl border p-2 text-left transition-all ${appTheme === option.value
          ? 'border-primary-500 bg-primary-600/10 shadow-[0_0_0_1px_rgba(59,130,246,0.12)]'
          : 'border-gray-700 bg-surface-dark hover:border-gray-600'
        }`}
    >
      <div
        className="mb-2 rounded-lg border border-white/10 p-2"
        style={{ background: option.previewBackground }}
      >
        <div className="flex gap-1.5">
          {option.previewSurfaces.map((surface, index) => (
            <span
              key={`${option.value}-${index}`}
              className="h-6 flex-1 rounded-md border border-white/10"
              style={{ backgroundColor: surface }}
            />
          ))}
        </div>
      </div>
      <span
        className="appearance-theme-card-label block text-xs font-semibold"
        style={appTheme === option.value ? { color: 'rgb(var(--color-primary-600))' } : undefined}
      >
        {t(option.label)}
      </span>
      <span className="appearance-theme-card-description mt-0.5 block text-[10px]">
        {t(option.description)}
      </span>
    </button>
  )

  const renderAccentPill = (option: typeof PRIMARY_COLOR_OPTIONS[number]) => (
    <button
      key={option.value}
      onClick={() => onSetPrimaryColorPreset(option.value)}
      className={`appearance-accent-pill flex items-center gap-2 rounded-full border px-2 py-1.5 text-xs font-medium transition-all ${primaryColorPreset === option.value
          ? 'border-primary-500 bg-primary-600/10'
          : 'border-gray-700 bg-surface-dark hover:border-gray-600'
        }`}
      title={t(option.label)}
      style={primaryColorPreset === option.value
        ? { color: isLightAppearanceTheme ? 'rgb(var(--color-primary-700))' : 'rgb(255 255 255)' }
        : undefined}
    >
      <span
        className="h-4 w-4 rounded-full border border-white/20"
        style={{ backgroundColor: option.color }}
      />
      <span>{t(option.label)}</span>
    </button>
  )

  return (
    <>
      <div className="rounded-xl border border-gray-700 bg-surface/40 p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white">{t('Projet')}</h3>
          <p className="text-[11px] text-gray-500">{t('Informations de base et sauvegarde.')}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">{t('Nom du juge')}</label>
            <input
              value={currentProject?.judgeName ?? ''}
              onChange={(event) => onUpdateProject({ judgeName: event.target.value })}
              placeholder={t('ex: Netsuma')}
              className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">{t('Nom du concours')}</label>
            <input
              value={currentProject?.name ?? ''}
              onChange={(event) => onUpdateProject({ name: event.target.value })}
              placeholder={t('ex: Concours Japan Expo')}
              className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-300 block">{t('Sauvegarde automatique')}</span>
              <span className="text-[10px] text-gray-500">{t("Sauvegarde le projet à intervalle régulier")}</span>
            </div>
            <div className="flex items-center gap-2">
              {settings?.autoSave && (
                <select
                  value={settings.autoSaveInterval}
                  onChange={(event) =>
                    onUpdateSettings({
                      autoSaveInterval: Number(event.target.value),
                    })
                  }
                  className="bg-surface-dark text-gray-400 text-xs rounded px-2 py-1 border border-gray-700 focus:border-primary-500 outline-none"
                >
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                  <option value={60}>1min</option>
                  <option value={120}>2min</option>
                </select>
              )}
              <SettingsToggle
                checked={settings?.autoSave ?? true}
                onChange={() => onUpdateSettings({ autoSave: !settings?.autoSave })}
              />
            </div>
          </div>

          {projectsFolderPath && (
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">{t('Dossier de projets')}</label>
              <p
                className="text-[11px] text-gray-500 truncate px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg"
                title={projectsFolderPath}
              >
                {projectsFolderPath}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-700 bg-surface/40 p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white">{t('Interface')}</h3>
          <p className="text-[11px] text-gray-500">{t("Mode de travail et zoom de l'application.")}</p>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-700 bg-surface-dark/70 px-3 py-2.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-gray-300">{t('Langue')}</label>
                <p className="mt-0.5 text-[10px] text-gray-500">{t('Changer la langue de toute l’interface')}</p>
              </div>
              <LanguageSwitcher />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">{t('Interface de notation')}</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {interfaceOptions.map(({ mode, label, icon: Icon, iconSecondary: IconSecondary }) => (
                <button
                  key={mode}
                  onClick={() => onSwitchInterface(mode)}
                  className={`flex min-h-[56px] items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all ${currentInterface === mode
                      ? 'bg-primary-600/20 border-primary-500 text-primary-300'
                      : 'bg-surface-dark border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                    }`}
                >
                  <span className="inline-flex shrink-0 items-center gap-1">
                    <Icon size={14} />
                    {IconSecondary && <IconSecondary size={14} />}
                  </span>
                  <span className="whitespace-normal break-words leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">{t('Mode de zoom')}</label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <button
                onClick={() => onSetZoomMode('fixed')}
                className={`min-h-[64px] px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left ${zoomMode === 'fixed'
                    ? 'bg-primary-600/20 border-primary-500 text-primary-300'
                    : 'bg-surface-dark border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
              >
                <span className="block whitespace-normal break-words leading-tight">{t('Zoom fixe')}</span>
                <p className="text-[9px] text-gray-500 font-normal mt-0.5 whitespace-normal break-words">{t('Pas de défilement horizontal')}</p>
              </button>
              <button
                onClick={() => onSetZoomMode('navigable')}
                className={`min-h-[64px] px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left ${zoomMode === 'navigable'
                    ? 'bg-primary-600/20 border-primary-500 text-primary-300'
                    : 'bg-surface-dark border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
              >
                <span className="block whitespace-normal break-words leading-tight">{t('Zoom navigable')}</span>
                <p className="text-[9px] text-gray-500 font-normal mt-0.5 whitespace-normal break-words">{t('Défilement libre')}</p>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">{t('Niveau de zoom')}</span>
              <span className="text-xs text-gray-500 font-mono">{zoomLevel}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              step={5}
              value={zoomLevel}
              onChange={(event) => onSetZoomLevel(Number(event.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex gap-1.5 mt-2">
              {[75, 100, 125, 150].map((preset) => (
                <button
                  key={preset}
                  onClick={() => onSetZoomLevel(preset)}
                  className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${zoomLevel === preset
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-dark text-gray-400 hover:text-white border border-gray-700'
                    }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-700 bg-surface/40 p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white">{t('Apparence')}</h3>
          <p className="text-[11px] text-gray-500">{t("Thèmes et accent principal de l'interface.")}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">{t("Thème de l'application")}</label>
            <div className="grid grid-cols-2 gap-2">
              {orderedThemes.map(renderThemeCard)}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="text-xs font-medium text-gray-400 block">{t('Couleur principale')}</label>
              <span className="text-[10px] text-gray-500">{t('Accents harmonisés')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {orderedAccents.map(renderAccentPill)}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
