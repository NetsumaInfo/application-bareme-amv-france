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

const SUBTLE_BORDER = 'ring-1 ring-inset ring-primary-400/10'
const CARD = `rounded-xl bg-surface/40 p-4 ${SUBTLE_BORDER}`
const ROW = `flex items-center justify-between gap-3 rounded-lg bg-surface-dark/45 px-3 py-2.5 ${SUBTLE_BORDER}`
const STACKED_ROW = `rounded-lg bg-surface-dark/45 px-3 py-2.5 ${SUBTLE_BORDER}`
const SECTION_LABEL = 'text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3'

type ThemeOption = (typeof APP_THEME_OPTIONS)[number]
type AccentOption = (typeof PRIMARY_COLOR_OPTIONS)[number]

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

// ── Shared sub-components ──────────────────────────────────────────────────

function Card({ children }: { children: ReactNode }) {
  return <div className={CARD}>{children}</div>
}

// ── Appearance ─────────────────────────────────────────────────────────────

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
      onClick={() => onSetAppTheme(option.value)}
      className={`rounded-xl p-2 text-left transition-all ${SUBTLE_BORDER} ${
        active ? 'bg-primary-600/10' : 'bg-surface-dark/45 hover:bg-surface-light/50'
      }`}
    >
      <div
        className={`mb-2 rounded-lg p-2 ${SUBTLE_BORDER}`}
        style={{ background: option.previewBackground }}
      >
        <div className="flex gap-1.5">
          {option.previewSurfaces.map((surface) => (
            <span
              key={`${option.value}-${surface}`}
              className={`h-6 flex-1 rounded-md ${SUBTLE_BORDER}`}
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
    <button
      onClick={() => onSetPrimaryColorPreset(option.value)}
      className={`appearance-accent-pill flex items-center gap-2 rounded-full px-2 py-1.5 text-xs font-medium transition-all ${SUBTLE_BORDER} ${
        active ? 'bg-primary-600/10' : 'bg-black/18 hover:bg-white/4'
      }`}
      style={
        active
          ? {
              color: isLightAppearanceTheme
                ? 'rgb(var(--color-primary-700))'
                : 'rgb(255 255 255)',
            }
          : undefined
      }
    >
      <span
        className={`h-4 w-4 rounded-full ${SUBTLE_BORDER}`}
        style={{ backgroundColor: option.color }}
      />
      <span>{t(option.label)}</span>
    </button>
  )
}

function AppearanceSection({
  appTheme,
  primaryColorPreset,
  onSetAppTheme,
  onSetPrimaryColorPreset,
  t,
}: Pick<
  SettingsGeneralTabProps,
  'appTheme' | 'primaryColorPreset' | 'onSetAppTheme' | 'onSetPrimaryColorPreset'
> & { t: TranslateFn }) {
  const isLight =
    appTheme === 'porcelain' ||
    appTheme === 'pearl' ||
    appTheme === 'ivory' ||
    appTheme === 'sand'

  return (
    <Card>
      <p className={SECTION_LABEL}>{t('Apparence')}</p>
      <div className="space-y-5">
        {/* Thème */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">
            {t("Thème de l'application")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {APP_THEME_OPTIONS.map((opt) => (
              <ThemeCard
                key={opt.value}
                option={opt}
                active={appTheme === opt.value}
                onSetAppTheme={onSetAppTheme}
                t={t}
              />
            ))}
          </div>
        </div>

        {/* Couleur d'accent */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-400">
              {t('Couleur principale')}
            </label>
            <span className="text-[10px] text-gray-500">{t('Accents harmonisés')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRIMARY_COLOR_OPTIONS.map((opt) => (
              <AccentPill
                key={opt.value}
                option={opt}
                active={primaryColorPreset === opt.value}
                isLightAppearanceTheme={isLight}
                onSetPrimaryColorPreset={onSetPrimaryColorPreset}
                t={t}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Interface ──────────────────────────────────────────────────────────────

function ZoomModeButton({
  active,
  title,
  onClick,
}: {
  active: boolean
  title: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'bg-surface-light/45 text-gray-400 hover:bg-surface-light hover:text-white'
      }`}
    >
      {title}
    </button>
  )
}

function InterfaceSection({
  currentInterface,
  zoomMode,
  zoomLevel,
  onSwitchInterface,
  onSetZoomMode,
  onSetZoomLevel,
  t,
}: Pick<
  SettingsGeneralTabProps,
  | 'currentInterface'
  | 'zoomMode'
  | 'zoomLevel'
  | 'onSwitchInterface'
  | 'onSetZoomMode'
  | 'onSetZoomLevel'
> & { t: TranslateFn }) {
  const interfaceOptions = getInterfaceOptions(t)

  return (
    <Card>
      <p className={SECTION_LABEL}>{t('Interface')}</p>
      <div className="space-y-5">
        {/* Langue */}
        <div className={`flex items-center justify-between gap-3 rounded-lg bg-surface-dark/45 px-3 py-2.5 ${SUBTLE_BORDER}`}>
          <label className="text-sm font-medium text-gray-300">{t('Langue')}</label>
          <LanguageSwitcher />
        </div>

        {/* Mode notation */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">
            {t('Interface de notation')}
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {interfaceOptions.map(({ mode, label, icon: Icon, iconSecondary: IconSecondary }) => (
              <button
                key={mode}
                onClick={() => onSwitchInterface(mode)}
                className={`flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-all ${SUBTLE_BORDER} ${
                  currentInterface === mode
                    ? 'bg-primary-600/12 text-primary-200'
                    : 'bg-surface-dark/45 text-gray-400 hover:text-white hover:bg-surface-light/50'
                }`}
              >
                <span className="inline-flex shrink-0 items-center gap-1">
                  <Icon size={14} />
                  {IconSecondary && <IconSecondary size={14} />}
                </span>
                <span className="whitespace-normal wrap-break-word leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className={ROW}>
            <div className="min-w-0 pr-2">
              <span className="block text-sm text-gray-300">{t('Mode de zoom')}</span>
              <span className="block text-[10px] text-gray-500">
                {zoomMode === 'fixed' ? t('Sans défilement horizontal') : t('Défilement libre')}
              </span>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-1.5">
              <ZoomModeButton
                active={zoomMode === 'fixed'}
                title={t('Zoom fixe')}
                onClick={() => onSetZoomMode('fixed')}
              />
              <ZoomModeButton
                active={zoomMode === 'navigable'}
                title={t('Zoom navigable')}
                onClick={() => onSetZoomMode('navigable')}
              />
            </div>
          </div>

          <div className={STACKED_ROW}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm text-gray-300">{t('Niveau de zoom')}</span>
              <span className="font-mono text-xs text-gray-500">{zoomLevel}%</span>
            </div>
            <AppRangeSlider
              min={50}
              max={200}
              step={5}
              value={zoomLevel}
              onChange={onSetZoomLevel}
              ariaLabel={t('Niveau de zoom')}
            />
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {[75, 100, 125, 150].map((preset) => (
                <button
                  key={preset}
                  onClick={() => onSetZoomLevel(preset)}
                  className={`rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors ${
                    zoomLevel === preset
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-light/45 text-gray-400 hover:bg-surface-light hover:text-white'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Projet ─────────────────────────────────────────────────────────────────

function ProjectSafetySection({
  confirmClipDeletion,
  onToggleConfirmClipDeletion,
  t,
}: Pick<SettingsGeneralTabProps, 'confirmClipDeletion' | 'onToggleConfirmClipDeletion'> & {
  t: TranslateFn
}) {
  return (
    <Card>
      <p className={SECTION_LABEL}>{t('Projet')}</p>
      <div className="space-y-2">
        <div className={ROW}>
          <span className="min-w-0 pr-2 text-sm text-gray-300">
            {t('Avertissement avant suppression de clip')}
          </span>
          <SettingsToggle checked={confirmClipDeletion} onChange={onToggleConfirmClipDeletion} />
        </div>
      </div>
    </Card>
  )
}

// ── Lecteur ────────────────────────────────────────────────────────────────

function PlayerSection({
  showAudioDb,
  onToggleAudioDb,
  t,
}: Pick<
  SettingsGeneralTabProps,
  'showAudioDb' | 'onToggleAudioDb'
> & { t: TranslateFn }) {
  return (
    <Card>
      <p className={SECTION_LABEL}>{t('Lecteur vidéo')}</p>
      <div className="space-y-2">
        <div className={ROW}>
          <span className="min-w-0 pr-2 text-sm text-gray-300">
            {t('Afficher VU-mètre audio L/R (dB)')}
          </span>
          <SettingsToggle checked={showAudioDb} onChange={onToggleAudioDb} />
        </div>
      </div>
    </Card>
  )
}

// ── Dossiers ───────────────────────────────────────────────────────────────

interface FolderRowProps {
  label: string
  path: string
  emptyLabel: string
  description: string
  error: string | null
  isChanging: boolean
  onChange: () => void
  t: TranslateFn
}

function FolderRow({
  label,
  path,
  emptyLabel,
  description,
  error,
  isChanging,
  onChange,
  t,
}: FolderRowProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="text-xs font-medium text-gray-400">{label}</label>
        <button
          type="button"
          onClick={onChange}
          disabled={isChanging}
          className={`shrink-0 rounded-lg bg-surface-light/70 px-2.5 py-1 text-[10px] font-medium text-gray-300 transition-colors hover:bg-surface-light hover:text-white disabled:cursor-not-allowed disabled:opacity-60 ${SUBTLE_BORDER}`}
        >
          {isChanging ? t('Sélection…') : t('Modifier')}
        </button>
      </div>
      <HoverTextTooltip text={path || emptyLabel}>
        <div
          className={`truncate rounded-lg bg-surface-dark/45 px-3 py-2 text-[11px] ${path ? 'text-gray-400' : 'text-gray-600 italic'} ${SUBTLE_BORDER}`}
        >
          {path || emptyLabel}
        </div>
      </HoverTextTooltip>
      <p className="mt-1 text-[10px] text-gray-500">{description}</p>
      {error && <p className="mt-1 text-[10px] text-accent">{error}</p>}
    </div>
  )
}

function FoldersSection({
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
    <Card>
      <p className={SECTION_LABEL}>{t('Dossiers')}</p>
      <div className="space-y-4">
        <FolderRow
          label={t('Dossier de projets')}
          path={projectsFolderPath}
          emptyLabel={t('Aucun dossier de projets défini')}
          description={t('Les nouveaux projets seront enregistrés dans ce dossier.')}
          error={projectFolderError}
          isChanging={isChangingProjectFolder}
          onChange={onChangeProjectsFolder}
          t={t}
        />
        <div className="border-t border-primary-400/10" />
        <FolderRow
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
    </Card>
  )
}

// ── Root export ────────────────────────────────────────────────────────────

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
      setProjectFolderError(
        t('Impossible de modifier le dossier de projets : {error}', { error: String(error) }),
      )
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
      setBaremeFolderError(
        t('Impossible de modifier le dossier de barèmes : {error}', { error: String(error) }),
      )
    } finally {
      setIsChangingBaremeFolder(false)
    }
  }

  return (
    <div className="space-y-5">
      <AppearanceSection
        appTheme={appTheme}
        primaryColorPreset={primaryColorPreset}
        onSetAppTheme={onSetAppTheme}
        onSetPrimaryColorPreset={onSetPrimaryColorPreset}
        t={t}
      />
      <InterfaceSection
        currentInterface={currentInterface}
        zoomMode={zoomMode}
        zoomLevel={zoomLevel}
        onSwitchInterface={onSwitchInterface}
        onSetZoomMode={onSetZoomMode}
        onSetZoomLevel={onSetZoomLevel}
        t={t}
      />
      <ProjectSafetySection
        confirmClipDeletion={confirmClipDeletion}
        onToggleConfirmClipDeletion={onToggleConfirmClipDeletion}
        t={t}
      />
      <PlayerSection
        showAudioDb={showAudioDb}
        onToggleAudioDb={onToggleAudioDb}
        t={t}
      />
      <FoldersSection
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
    </div>
  )
}
