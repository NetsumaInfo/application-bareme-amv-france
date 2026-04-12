import { useState, type ReactNode } from 'react'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { getInterfaceOptions } from '@/components/settings/settingsPanelConfig'
import { SettingsToggle } from '@/components/settings/SettingsToggle'
import { AppRangeSlider } from '@/components/ui/AppRangeSlider'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import type { InterfaceMode } from '@/types/notation'
import {
  APP_THEME_OPTIONS,
  PRIMARY_COLOR_OPTIONS,
  type AppThemePreset,
  type PrimaryColorPreset,
} from '@/utils/appTheme'
import { useI18n, type TranslateFn } from '@/i18n'

const SUBTLE_BORDER_CLASS_NAME = 'ring-1 ring-inset ring-primary-400/10'
const SECTION_CLASS_NAME = `rounded-xl bg-surface/40 p-4 ${SUBTLE_BORDER_CLASS_NAME}`
const OPTION_CARD_CLASS_NAME = `rounded-lg bg-surface-dark/45 ${SUBTLE_BORDER_CLASS_NAME}`
const SETTING_ROW_CLASS_NAME = `flex items-center justify-between gap-3 rounded-lg bg-surface-dark/45 px-3 py-2.5 ${SUBTLE_BORDER_CLASS_NAME}`

type ThemeOption = typeof APP_THEME_OPTIONS[number]
type AccentOption = typeof PRIMARY_COLOR_OPTIONS[number]

interface SettingsGeneralTabProps {
  currentInterface: InterfaceMode
  zoomMode: 'fixed' | 'navigable'
  zoomLevel: number
  appTheme: AppThemePreset
  primaryColorPreset: PrimaryColorPreset
  showAudioDb: boolean
  confirmClipDeletion: boolean
  projectsFolderPath: string
  baremesFolderPath: string
  onSwitchInterface: (mode: InterfaceMode) => void
  onSetZoomMode: (mode: 'fixed' | 'navigable') => void
  onSetZoomLevel: (level: number) => void
  onSetAppTheme: (theme: AppThemePreset) => void
  onSetPrimaryColorPreset: (preset: PrimaryColorPreset) => void
  onToggleAudioDb: () => void
  onToggleConfirmClipDeletion: () => void
  onChangeProjectsFolder: () => Promise<void>
  onChangeBaremesFolder: () => Promise<void>
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={SECTION_CLASS_NAME}>
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      {children}
    </div>
  )
}

function InterfaceSettings({
  currentInterface,
  zoomMode,
  zoomLevel,
  onSwitchInterface,
  onSetZoomMode,
  onSetZoomLevel,
  t,
}: Pick<SettingsGeneralTabProps,
  | 'currentInterface'
  | 'zoomMode'
  | 'zoomLevel'
  | 'onSwitchInterface'
  | 'onSetZoomMode'
  | 'onSetZoomLevel'
> & { t: TranslateFn }) {
  const interfaceOptions = getInterfaceOptions(t)

  return (
    <SettingsSection title={t('Interface')}>
      <div className="space-y-4">
        <div className={`${OPTION_CARD_CLASS_NAME} px-3 py-2.5`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <label className="block text-xs font-medium text-gray-300">{t('Langue')}</label>
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
                className={`flex min-h-[48px] items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-all ${SUBTLE_BORDER_CLASS_NAME} ${currentInterface === mode
                    ? 'bg-primary-600/12 text-primary-200'
                    : 'bg-surface-dark/45 text-gray-400 hover:text-white hover:bg-surface-light/50'
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

        <ZoomSettings
          zoomMode={zoomMode}
          zoomLevel={zoomLevel}
          onSetZoomMode={onSetZoomMode}
          onSetZoomLevel={onSetZoomLevel}
          t={t}
        />
      </div>
    </SettingsSection>
  )
}

function ZoomModeButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[56px] px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${SUBTLE_BORDER_CLASS_NAME} ${active
          ? 'bg-primary-600/12 text-primary-200'
          : 'bg-surface-dark/45 text-gray-400 hover:text-white hover:bg-surface-light/50'
        }`}
    >
      <span className="block whitespace-normal break-words leading-tight">{title}</span>
      <p className="mt-0.5 whitespace-normal break-words text-[9px] font-normal text-gray-500">{description}</p>
    </button>
  )
}

function ZoomSettings({
  zoomMode,
  zoomLevel,
  onSetZoomMode,
  onSetZoomLevel,
  t,
}: Pick<SettingsGeneralTabProps, 'zoomMode' | 'zoomLevel' | 'onSetZoomMode' | 'onSetZoomLevel'> & { t: TranslateFn }) {
  return (
    <>
      <div>
        <label className="text-xs font-medium text-gray-400 mb-2 block">{t('Mode de zoom')}</label>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <ZoomModeButton
            active={zoomMode === 'fixed'}
            title={t('Zoom fixe')}
            description={t('Sans défilement horizontal')}
            onClick={() => onSetZoomMode('fixed')}
          />
          <ZoomModeButton
            active={zoomMode === 'navigable'}
            title={t('Zoom navigable')}
            description={t('Défilement libre')}
            onClick={() => onSetZoomMode('navigable')}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-400">{t('Niveau de zoom')}</span>
          <span className="text-xs text-gray-500 font-mono">{zoomLevel}%</span>
        </div>
        <AppRangeSlider
          min={50}
          max={200}
          step={5}
          value={zoomLevel}
          onChange={onSetZoomLevel}
          ariaLabel={t('Niveau de zoom')}
        />
        <div className="flex gap-1.5 mt-2">
          {[75, 100, 125, 150].map((preset) => (
            <button
              key={preset}
              onClick={() => onSetZoomLevel(preset)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${SUBTLE_BORDER_CLASS_NAME} ${zoomLevel === preset
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-dark/45 text-gray-400 hover:text-white hover:bg-surface-light/50'
                }`}
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

interface FolderPathSettingProps {
  label: string
  path: string
  emptyLabel: string
  description: string
  error: string | null
  isChanging: boolean
  onChange: () => void
  t: TranslateFn
}

function FolderPathSetting({
  label,
  path,
  emptyLabel,
  description,
  error,
  isChanging,
  onChange,
  t,
}: FolderPathSettingProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label className="block text-xs font-medium text-gray-400">{label}</label>
        <button
          type="button"
          onClick={onChange}
          disabled={isChanging}
          className={`shrink-0 rounded-lg bg-surface-light/70 px-2.5 py-1 text-[10px] font-medium text-gray-300 transition-colors hover:bg-surface-light hover:text-white disabled:cursor-not-allowed disabled:opacity-60 ${SUBTLE_BORDER_CLASS_NAME}`}
        >
          {isChanging ? t('Sélection...') : t('Modifier')}
        </button>
      </div>
      {path ? (
        <HoverTextTooltip text={path}>
          <div className={`truncate rounded-lg bg-surface-dark/45 px-3 py-2 text-[11px] text-gray-500 ${SUBTLE_BORDER_CLASS_NAME}`}>
            {path}
          </div>
        </HoverTextTooltip>
      ) : (
        <div className={`rounded-lg bg-surface-dark/45 px-3 py-2 text-[11px] text-gray-500 ${SUBTLE_BORDER_CLASS_NAME}`}>
          {emptyLabel}
        </div>
      )}
      <p className="mt-1 text-[10px] text-gray-500">{description}</p>
      {error ? <p className="mt-1 text-[10px] text-accent">{error}</p> : null}
    </div>
  )
}

function FoldersSettings({
  projectsFolderPath,
  baremesFolderPath,
  projectFolderError,
  baremeFolderError,
  isChangingProjectFolder,
  isChangingBaremeFolder,
  onChangeProjectsFolder,
  onChangeBaremesFolder,
  t,
}: Pick<SettingsGeneralTabProps, 'projectsFolderPath' | 'baremesFolderPath'> & {
  projectFolderError: string | null
  baremeFolderError: string | null
  isChangingProjectFolder: boolean
  isChangingBaremeFolder: boolean
  onChangeProjectsFolder: () => void
  onChangeBaremesFolder: () => void
  t: TranslateFn
}) {
  return (
    <SettingsSection title={t('Dossiers')}>
      <div className="space-y-4">
        <FolderPathSetting
          label={t('Dossier de projets')}
          path={projectsFolderPath}
          emptyLabel={t('Aucun dossier de projets défini')}
          description={t('Les nouveaux projets seront enregistrés dans ce dossier.')}
          error={projectFolderError}
          isChanging={isChangingProjectFolder}
          onChange={onChangeProjectsFolder}
          t={t}
        />
        <FolderPathSetting
          label={t('Dossier de barèmes')}
          path={baremesFolderPath}
          emptyLabel={t('Aucun dossier de barèmes défini')}
          description={t('Les barèmes personnalisés seront enregistrés dans ce dossier.')}
          error={baremeFolderError}
          isChanging={isChangingBaremeFolder}
          onChange={onChangeBaremesFolder}
          t={t}
        />
      </div>
    </SettingsSection>
  )
}

function PlayerSettings({
  showAudioDb,
  confirmClipDeletion,
  onToggleAudioDb,
  onToggleConfirmClipDeletion,
  t,
}: Pick<SettingsGeneralTabProps,
  | 'showAudioDb'
  | 'confirmClipDeletion'
  | 'onToggleAudioDb'
  | 'onToggleConfirmClipDeletion'
> & { t: TranslateFn }) {
  return (
    <SettingsSection title={t('Lecteur')}>
      <div className="space-y-2">
        <div className={SETTING_ROW_CLASS_NAME}>
          <span className="min-w-0 pr-2 text-sm text-gray-300">{t('Afficher l’avertissement de suppression')}</span>
          <SettingsToggle checked={confirmClipDeletion} onChange={onToggleConfirmClipDeletion} />
        </div>
        <div className={SETTING_ROW_CLASS_NAME}>
          <span className="min-w-0 pr-2 text-sm text-gray-300">{t('Afficher VU-mètre audio L/R (dB)')}</span>
          <SettingsToggle checked={showAudioDb} onChange={onToggleAudioDb} />
        </div>
      </div>
    </SettingsSection>
  )
}

function ThemeCard({
  option,
  active,
  onSetAppTheme,
  t,
}: {
  option: ThemeOption
  active: boolean
  onSetAppTheme: (theme: AppThemePreset) => void
  t: TranslateFn
}) {
  return (
    <button
      key={option.value}
      onClick={() => onSetAppTheme(option.value)}
      className={`rounded-xl p-2 text-left transition-all ${SUBTLE_BORDER_CLASS_NAME} ${active
          ? 'bg-primary-600/10'
          : 'bg-surface-dark/45 hover:bg-surface-light/50'
        }`}
    >
      <div className={`mb-2 rounded-lg p-2 ${SUBTLE_BORDER_CLASS_NAME}`} style={{ background: option.previewBackground }}>
        <div className="flex gap-1.5">
          {option.previewSurfaces.map((surface) => (
            <span
              key={`${option.value}-${surface}`}
              className={`h-6 flex-1 rounded-md ${SUBTLE_BORDER_CLASS_NAME}`}
              style={{ backgroundColor: surface }}
            />
          ))}
        </div>
      </div>
      <span
        className="appearance-theme-card-label block text-xs font-semibold"
        style={active ? { color: 'rgb(var(--color-primary-600))' } : undefined}
      >
        {t(option.label)}
      </span>
      <span className="appearance-theme-card-description mt-0.5 block text-[10px]">
        {t(option.description)}
      </span>
    </button>
  )
}

function AccentPill({
  option,
  active,
  isLightAppearanceTheme,
  onSetPrimaryColorPreset,
  t,
}: {
  option: AccentOption
  active: boolean
  isLightAppearanceTheme: boolean
  onSetPrimaryColorPreset: (preset: PrimaryColorPreset) => void
  t: TranslateFn
}) {
  return (
    <HoverTextTooltip key={option.value} text={t(option.label)}>
      <button
        onClick={() => onSetPrimaryColorPreset(option.value)}
        className={`appearance-accent-pill flex items-center gap-2 rounded-full px-2 py-1.5 text-xs font-medium transition-all ${SUBTLE_BORDER_CLASS_NAME} ${active
            ? 'bg-primary-600/10'
            : 'bg-black/18 hover:bg-white/[0.04]'
          }`}
        style={active
          ? { color: isLightAppearanceTheme ? 'rgb(var(--color-primary-700))' : 'rgb(255 255 255)' }
          : undefined}
      >
        <span className={`h-4 w-4 rounded-full ${SUBTLE_BORDER_CLASS_NAME}`} style={{ backgroundColor: option.color }} />
        <span>{t(option.label)}</span>
      </button>
    </HoverTextTooltip>
  )
}

function AppearanceSettings({
  appTheme,
  primaryColorPreset,
  onSetAppTheme,
  onSetPrimaryColorPreset,
  t,
}: Pick<SettingsGeneralTabProps,
  | 'appTheme'
  | 'primaryColorPreset'
  | 'onSetAppTheme'
  | 'onSetPrimaryColorPreset'
> & { t: TranslateFn }) {
  const isLightAppearanceTheme = appTheme === 'porcelain' || appTheme === 'pearl' || appTheme === 'ivory' || appTheme === 'sand'

  return (
    <SettingsSection title={t('Apparence')}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">{t("Thème de l'application")}</label>
          <div className="grid grid-cols-2 gap-2">
            {APP_THEME_OPTIONS.map((option) => (
              <ThemeCard
                key={option.value}
                option={option}
                active={appTheme === option.value}
                onSetAppTheme={onSetAppTheme}
                t={t}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <label className="text-xs font-medium text-gray-400 block">{t('Couleur principale')}</label>
            <span className="text-[10px] text-gray-500">{t('Accents harmonisés')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRIMARY_COLOR_OPTIONS.map((option) => (
              <AccentPill
                key={option.value}
                option={option}
                active={primaryColorPreset === option.value}
                isLightAppearanceTheme={isLightAppearanceTheme}
                onSetPrimaryColorPreset={onSetPrimaryColorPreset}
                t={t}
              />
            ))}
          </div>
        </div>
      </div>
    </SettingsSection>
  )
}

export function SettingsGeneralTab({
  currentInterface,
  zoomMode,
  zoomLevel,
  appTheme,
  primaryColorPreset,
  showAudioDb,
  confirmClipDeletion,
  projectsFolderPath,
  baremesFolderPath,
  onSwitchInterface,
  onSetZoomMode,
  onSetZoomLevel,
  onSetAppTheme,
  onSetPrimaryColorPreset,
  onToggleAudioDb,
  onToggleConfirmClipDeletion,
  onChangeProjectsFolder,
  onChangeBaremesFolder,
}: SettingsGeneralTabProps) {
  const { t } = useI18n()
  const [projectFolderError, setProjectFolderError] = useState<string | null>(null)
  const [isChangingProjectFolder, setIsChangingProjectFolder] = useState(false)
  const [baremeFolderError, setBaremeFolderError] = useState<string | null>(null)
  const [isChangingBaremeFolder, setIsChangingBaremeFolder] = useState(false)

  const handleChangeProjectsFolder = async () => {
    setIsChangingProjectFolder(true)
    setProjectFolderError(null)
    try {
      await onChangeProjectsFolder()
    } catch (error) {
      setProjectFolderError(t('Impossible de modifier le dossier de projets : {error}', { error: String(error) }))
    } finally {
      setIsChangingProjectFolder(false)
    }
  }

  const handleChangeBaremesFolder = async () => {
    setIsChangingBaremeFolder(true)
    setBaremeFolderError(null)
    try {
      await onChangeBaremesFolder()
    } catch (error) {
      setBaremeFolderError(t('Impossible de modifier le dossier de barèmes : {error}', { error: String(error) }))
    } finally {
      setIsChangingBaremeFolder(false)
    }
  }

  return (
    <>
      <InterfaceSettings
        currentInterface={currentInterface}
        zoomMode={zoomMode}
        zoomLevel={zoomLevel}
        onSwitchInterface={onSwitchInterface}
        onSetZoomMode={onSetZoomMode}
        onSetZoomLevel={onSetZoomLevel}
        t={t}
      />
      <FoldersSettings
        projectsFolderPath={projectsFolderPath}
        baremesFolderPath={baremesFolderPath}
        projectFolderError={projectFolderError}
        baremeFolderError={baremeFolderError}
        isChangingProjectFolder={isChangingProjectFolder}
        isChangingBaremeFolder={isChangingBaremeFolder}
        onChangeProjectsFolder={handleChangeProjectsFolder}
        onChangeBaremesFolder={handleChangeBaremesFolder}
        t={t}
      />
      <PlayerSettings
        showAudioDb={showAudioDb}
        confirmClipDeletion={confirmClipDeletion}
        onToggleAudioDb={onToggleAudioDb}
        onToggleConfirmClipDeletion={onToggleConfirmClipDeletion}
        t={t}
      />
      <AppearanceSettings
        appTheme={appTheme}
        primaryColorPreset={primaryColorPreset}
        onSetAppTheme={onSetAppTheme}
        onSetPrimaryColorPreset={onSetPrimaryColorPreset}
        t={t}
      />
    </>
  )
}
