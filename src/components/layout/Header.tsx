import { FileOutput, Settings, Home, Upload } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectMenuActions } from '@/components/project/useProjectMenuActions'
import ProjectManager from '@/components/project/ProjectManager'
import InterfaceSwitcher from '@/components/interfaces/InterfaceSwitcher'
import { BaremeSelector } from '@/components/layout/BaremeSelector'
import { NotationModeSwitcher } from '@/components/layout/NotationModeSwitcher'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { canExportJudgeNotation } from '@/utils/resultsVisibility'
import { UI_ICONS } from '@/components/ui/actionIcons'
import { useJudgeImport } from '@/components/project/useJudgeImport'

export default function Header({
  onOpenSettings,
}: {
  onOpenSettings: () => void
}) {
  const ShareIcon = UI_ICONS.share
  const { currentProject, isDirty, reset: resetProject } = useProjectStore()
  const clips = useProjectStore((state) => state.clips)
  const { reset: resetNotation, currentBareme, notes } = useNotationStore()
  const { handleExportJudgeNotes } = useProjectMenuActions()
  const { importing, handleImportJudgeJson } = useJudgeImport()
  const { t } = useI18n()
  const canShowJudgeExport = canExportJudgeNotation(clips, currentBareme, (clipId) => notes[clipId])
  const projectName = currentProject?.name?.trim() || 'AMV Notation'
  const judgeName = currentProject?.judgeName?.trim() || ''

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
    <header className="relative z-[60] grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 bg-surface px-3 py-px min-h-[28px]">
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
      <div className="relative z-10 col-start-1 flex min-w-0 items-center gap-1 justify-self-start">
        {currentProject && (
          <HoverTextTooltip text={t('Fermer le projet')}>
            <button
              onClick={handleCloseProject}
              aria-label={t('Fermer le projet')}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-surface-light hover:text-white"
            >
              <Home size={12} />
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
        {currentProject && (
          <HoverTextTooltip text={clips.length > 0 ? t('Importer un juge') : t('Aucun clip dans le projet')}>
            <button
              type="button"
              onClick={() => {
                handleImportJudgeJson().catch(() => {})
              }}
              disabled={clips.length === 0 || importing}
              className="app-header-trigger gap-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload size={12} />
              <span>{importing ? t('Import...') : t('Importer un juge')}</span>
            </button>
          </HoverTextTooltip>
        )}
        {currentProject && canShowJudgeExport && (
          <HoverTextTooltip text={t('Partager / exporter la notation')}>
            <button
              type="button"
              onClick={() => {
                handleExportJudgeNotes().catch(() => {})
              }}
              aria-label={t('Partager / exporter la notation')}
              className="app-header-trigger app-header-trigger-icon"
            >
              <ShareIcon size={12} />
            </button>
          </HoverTextTooltip>
        )}
        {currentProject && canShowJudgeExport && (
          <HoverTextTooltip text={t('Exporter notation (<concours>_<pseudo>.json)')}>
            <button
              type="button"
              onClick={() => {
                handleExportJudgeNotes().catch(() => {})
              }}
              className="app-header-trigger gap-1"
            >
              <FileOutput size={12} />
              {t('Exporter notation')}
            </button>
          </HoverTextTooltip>
        )}
        <LanguageSwitcher compact />
        {currentProject && <BaremeSelector />}
        {currentProject && <ProjectManager />}
        <HoverTextTooltip text={t('Paramètres')}>
          <button
            onClick={onOpenSettings}
            aria-label={t('Paramètres')}
            className="app-header-trigger app-header-trigger-icon"
          >
            <Settings size={14} className="shrink-0" />
          </button>
        </HoverTextTooltip>
      </div>
    </header>
  )
}
