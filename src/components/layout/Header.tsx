import { Settings, Home, FileDown } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectMenuActions } from '@/components/project/useProjectMenuActions'
import ProjectManager from '@/components/project/ProjectManager'
import InterfaceSwitcher from '@/components/interfaces/InterfaceSwitcher'
import { BaremeSelector } from '@/components/layout/BaremeSelector'
import { NotationModeSwitcher } from '@/components/layout/NotationModeSwitcher'
import { useI18n } from '@/i18n'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { areAllClipsScored } from '@/utils/resultsVisibility'

export default function Header({
  onOpenSettings,
}: {
  onOpenSettings: () => void
}) {
  const { currentProject, isDirty, reset: resetProject } = useProjectStore()
  const { reset: resetNotation, currentBareme, notes } = useNotationStore()
  const clips = useProjectStore((state) => state.clips)
  const { handleExportJudgeNotes } = useProjectMenuActions()
  const { t } = useI18n()
  const allClipsScored = areAllClipsScored(clips, currentBareme, (clipId) => notes[clipId])

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
    <header className="flex flex-wrap items-center gap-2 px-3 py-1.5 bg-surface border-b border-gray-700 min-h-[40px]">
      {/* Left: Home + title */}
      <div className="flex items-center gap-2 min-w-0">
        {currentProject && (
          <button
            onClick={handleCloseProject}
            className="p-1 rounded hover:bg-surface-light text-gray-500 hover:text-white transition-colors"
            title={t('Fermer le projet')}
          >
            <Home size={14} />
          </button>
        )}
        <h1 className="text-xs font-bold text-white tracking-tight">
          AMV Notation
        </h1>
        {currentProject && (
          <span className="text-[11px] text-gray-400 hidden md:inline truncate">
            {currentProject.name}
            {currentProject.judgeName && (
              <span className="text-gray-500 ml-1">
                — {currentProject.judgeName}
              </span>
            )}
            <span
              className={`ml-1 inline-block w-2 text-accent transition-opacity ${
                isDirty ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden={!isDirty}
            >
              *
            </span>
          </span>
        )}
      </div>

      {/* Mode: Tableur / Notation */}
      {currentProject && (
        <div className="order-3 w-full flex justify-center sm:order-none sm:w-auto sm:flex-1 sm:justify-center">
          <div className="flex items-center gap-2">
            <NotationModeSwitcher />
            <InterfaceSwitcher />
          </div>
        </div>
      )}

      {/* Right: Barème + File menu + Settings */}
      <div className="flex items-center gap-1 ml-auto">
        {currentProject && allClipsScored && (
          <button
            type="button"
            onClick={() => {
              handleExportJudgeNotes().catch(() => {})
            }}
            className="h-8 px-2 rounded-md border border-gray-700 bg-surface-dark text-gray-300 hover:text-white hover:border-gray-600 text-xs font-medium transition-colors flex items-center gap-1.5"
            title={t('Exporter notation (<concours>_<pseudo>.json)')}
          >
            <FileDown size={14} />
            {t('Exporter notation')}
          </button>
        )}
        <LanguageSwitcher compact />
        {currentProject && <BaremeSelector />}
        {currentProject && <ProjectManager />}
        {currentProject && (
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded hover:bg-surface-light text-gray-500 hover:text-white transition-colors"
            title={t('Paramètres')}
          >
            <Settings size={14} />
          </button>
        )}
      </div>
    </header>
  )
}
