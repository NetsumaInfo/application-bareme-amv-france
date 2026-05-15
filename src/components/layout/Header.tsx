import { Download, Home, SlidersHorizontal, Upload } from 'lucide-react'
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

export default function Header({
  onOpenSettings,
}: {
  onOpenSettings: () => void
}) {
  const { currentProject, isDirty, reset: resetProject } = useProjectStore()
  const clips = useProjectStore((state) => state.clips)
  const { reset: resetNotation, currentBareme } = useNotationStore()
  const currentTab = useUIStore((state) => state.currentTab)
  const { handleExportJudgeNotes } = useProjectMenuActions()
  const { importing, handleImportJudgeJson } = useJudgeImport()
  const updateStatus = useAppUpdateStore((state) => state.status)
  const { t } = useI18n()
  const projectName = currentProject?.name?.trim() || 'AMV Notation'
  const judgeName = currentProject?.judgeName?.trim() || ''
  const showProjectActions = Boolean(currentProject) && currentTab !== 'export'
  const showJudgeImport = Boolean(currentProject) && currentTab === 'resultats'
  const showJudgeExport = Boolean(currentProject) && currentTab === 'notation'
  const canExportJudge = clips.length > 0 && Boolean(currentBareme)
  const judgeExportTooltip = clips.length === 0
    ? t('Aucun clip dans le projet')
    : currentBareme
      ? t('Exporter notation (<concours>_<pseudo>.json)')
      : t('Aucun barème sélectionné')
  const hasUpdateAvailable = updateStatus === 'update_available'
  const settingsTooltip = hasUpdateAvailable
    ? t('Mise à jour disponible (ouvrez les paramètres)')
    : t('Paramètres')

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
    <header className="relative z-[60] grid min-h-[22px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 bg-surface px-3 py-0">
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
                handleExportJudgeNotes().catch(() => {})
              }}
              disabled={!canExportJudge}
              className="app-header-trigger gap-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={11} className="shrink-0" />
              <span className="leading-none">{t('Exporter notation')}</span>
            </button>
          </HoverTextTooltip>
        )}
        <LanguageSwitcher compact />
        {showProjectActions && <BaremeSelector />}
        {currentProject && <ProjectManager />}
        <HoverTextTooltip text={settingsTooltip}>
          <button
            onClick={onOpenSettings}
            aria-label={hasUpdateAvailable ? t('Paramètres (mise à jour disponible)') : t('Paramètres')}
            className={`app-header-trigger app-header-trigger-icon relative ${hasUpdateAvailable ? 'ring-1 ring-inset ring-emerald-400/40' : ''}`}
          >
            <SlidersHorizontal size={12} className="shrink-0" />
            {hasUpdateAvailable ? (
              <span
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(0,0,0,0.6)]"
                aria-hidden
              />
            ) : null}
          </button>
        </HoverTextTooltip>
      </div>
    </header>
  )
}
