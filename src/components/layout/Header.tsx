import { Download, DownloadCloud, Home, Loader2, SlidersHorizontal, Upload } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { useProjectMenuActions } from '@/components/project/useProjectMenuActions'
import ProjectManager from '@/components/project/ProjectManager'
import InterfaceSwitcher from '@/components/interfaces/InterfaceSwitcher'
import { BaremeSelector } from '@/components/layout/BaremeSelector'
import { NotationModeSwitcher } from '@/components/layout/NotationModeSwitcher'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { useJudgeImport } from '@/components/project/useJudgeImport'
import { useAppUpdateStore } from '@/store/useAppUpdateStore'
import { useUpdateInstaller } from '@/hooks/useUpdateInstaller'
import { useWindowDrag } from '@/hooks/useWindowDrag'
import { WindowControls } from '@/components/window/WindowControls'

export default function Header({
  onOpenSettings,
}: {
  onOpenSettings: () => void
}) {
  const currentProject = useProjectStore((state) => state.currentProject)
  const isDirty = useProjectStore((state) => state.isDirty)
  const resetProject = useProjectStore((state) => state.reset)
  const clips = useProjectStore((state) => state.clips)
  const resetNotation = useNotationStore((state) => state.reset)
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const currentTab = useUIStore((state) => state.currentTab)
  const { handleExport } = useProjectMenuActions()
  const { importing, handleImportJudgeJson } = useJudgeImport()
  const updateStatus = useAppUpdateStore((state) => state.status)
  const latestVersion = useAppUpdateStore((state) => state.latestVersion)
  const { phase: updatePhase, progressPct, busy: updateBusy, applyUpdate } = useUpdateInstaller()
  const { t } = useI18n()
  const onPointerDown = useWindowDrag()
  const projectName = currentProject?.name?.trim() || 'AMV Notation'
  const judgeName = currentProject?.judgeName?.trim() || ''
  const showProjectActions = Boolean(currentProject) && currentTab !== 'export'
  const showJudgeImport = Boolean(currentProject) && currentTab === 'resultats'
  const showJudgeExport = Boolean(currentProject) && currentTab === 'notation'
  const canExportJudge = clips.length > 0 && Boolean(currentBareme)
  const judgeExportTooltip = clips.length === 0
    ? t('Aucun clip dans le projet')
    : currentBareme
      ? t('Exporter tout (concours + notes + barème)')
      : t('Aucun barème sélectionné')
  const hasUpdateAvailable = updateStatus === 'update_available'
  const settingsTooltip = hasUpdateAvailable
    ? t('Mise à jour disponible (ouvrez les paramètres)')
    : t('Paramètres')

  const updateButtonLabel = (() => {
    switch (updatePhase) {
      case 'saving':
        return t('Sauvegarde...')
      case 'checking':
        return t('Vérification...')
      case 'downloading':
        return progressPct != null
          ? t('Téléchargement... {pct}%', { pct: String(progressPct) })
          : t('Téléchargement...')
      case 'installing':
        return t('Installation...')
      default:
        return t('Mettre à jour')
    }
  })()
  // Reserve the button width for the longest label it can ever show (download
  // at 100%) so the percentage counting up does not resize the button and shove
  // the whole header sideways.
  const widestUpdateLabel = [
    t('Mettre à jour'),
    t('Sauvegarde...'),
    t('Vérification...'),
    t('Téléchargement... {pct}%', { pct: '100' }),
    t('Installation...'),
  ].reduce((longest, candidate) => (candidate.length > longest.length ? candidate : longest), '')
  const updateButtonTooltip = updateBusy
    ? updateButtonLabel
    : latestVersion
      ? t('Installer la mise à jour {version}', { version: latestVersion })
      : t('Installer la mise à jour')

  const handleCloseProject = () => {
    if (isDirty) {
      const confirmed = confirm(
        t('Le projet a des modifications non sauvegardées. Fermer quand même ?'),
      )
      if (!confirmed) return
    }
    resetProject()
    resetNotation()
  }

  return (
    <header
      onPointerDown={onPointerDown}
      className="relative z-60 grid min-h-[22px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] select-none items-center gap-1 bg-surface px-3 py-0"
    >
      {currentProject && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 flex -translate-y-1/2 justify-center px-3">
          <div className="pointer-events-auto relative">
            <div className="absolute right-full top-1/2 mr-1 -translate-y-1/2">
              <NotationModeSwitcher />
            </div>
            <InterfaceSwitcher />
          </div>
        </div>
      )}

      {/* Left: Home + title */}
      <div className="relative z-10 col-start-1 flex min-w-0 items-center gap-0.5 justify-self-start">
        {currentProject && (
          <HoverTextTooltip text={t('Fermer le projet')}>
            <button
              type="button"
              onClick={handleCloseProject}
              aria-label={t('Fermer le projet')}
              className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-surface-light hover:text-white"
            >
              <Home size={11} className="shrink-0" />
            </button>
          </HoverTextTooltip>
        )}
        <div className="flex min-w-0 items-center gap-1.5">
          <h1 className="truncate text-[13px] font-bold leading-[1.1] tracking-tight text-white">
            {projectName}
          </h1>
          {currentProject && judgeName ? (
            <span className="hidden shrink min-w-0 truncate text-xs leading-[1.1] text-gray-500 md:inline">
              — {judgeName}
            </span>
          ) : null}
          {currentProject ? (
            <span
              className={`inline-block w-2 text-accent transition-opacity ${
                isDirty ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden={!isDirty}
            >
              *
            </span>
          ) : null}
        </div>
      </div>

      {/* Right: Barème + File menu + Settings */}
      <div className="relative z-10 col-start-3 flex items-center gap-0.5 justify-self-end">
        {showJudgeImport && (
          <HoverTextTooltip text={clips.length > 0 ? t('Importer un juge') : t('Aucun clip dans le projet')}>
            <button
              type="button"
              onClick={() => {
                handleImportJudgeJson().catch(() => {})
              }}
              disabled={clips.length === 0 || importing}
              className="app-header-trigger gap-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload size={11} className="shrink-0" />
              <span className="leading-none">{importing ? t('Import...') : t('Importer un juge')}</span>
            </button>
          </HoverTextTooltip>
        )}
        {showJudgeExport && (
          <HoverTextTooltip text={judgeExportTooltip}>
            <button
              type="button"
              onClick={() => {
                if (!canExportJudge) return
                handleExport().catch(() => {})
              }}
              disabled={!canExportJudge}
              className="app-header-trigger gap-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={11} className="shrink-0" />
              <span className="leading-none">{t('Exporter')}</span>
            </button>
          </HoverTextTooltip>
        )}
        <LanguageSwitcher compact />
        {showProjectActions && <BaremeSelector />}
        {currentProject && <ProjectManager />}
        {hasUpdateAvailable && (
          <HoverTextTooltip text={updateButtonTooltip}>
            <button
              type="button"
              onClick={() => {
                applyUpdate().catch(() => {})
              }}
              disabled={updateBusy}
              aria-label={updateButtonTooltip}
              className="app-header-trigger gap-1 border border-blue-400/40 bg-blue-500/15 text-blue-200 transition-colors hover:bg-blue-500/25 hover:text-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {updateBusy ? (
                <Loader2 size={11} className="shrink-0 animate-spin" />
              ) : (
                <DownloadCloud size={11} className="shrink-0" />
              )}
              <span className="relative inline-grid leading-none tabular-nums">
                <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">
                  {widestUpdateLabel}
                </span>
                <span className="col-start-1 row-start-1 whitespace-nowrap text-center">
                  {updateButtonLabel}
                </span>
              </span>
            </button>
          </HoverTextTooltip>
        )}
        <HoverTextTooltip text={settingsTooltip}>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={hasUpdateAvailable ? t('Paramètres (mise à jour disponible)') : t('Paramètres')}
            className="app-header-trigger app-header-trigger-icon"
          >
            <SlidersHorizontal size={12} className="shrink-0" />
          </button>
        </HoverTextTooltip>
        <WindowControls className="-mr-3 ml-1 self-stretch" />
      </div>
    </header>
  )
}
