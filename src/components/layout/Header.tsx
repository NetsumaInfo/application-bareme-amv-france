import { Settings, Home, FileDown } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectMenuActions } from '@/components/project/useProjectMenuActions'
import ProjectManager from '@/components/project/ProjectManager'
import InterfaceSwitcher from '@/components/interfaces/InterfaceSwitcher'
import { BaremeSelector } from '@/components/layout/BaremeSelector'
import { NotationModeSwitcher } from '@/components/layout/NotationModeSwitcher'
import { isNoteComplete } from '@/utils/scoring'

export default function Header({
  onOpenSettings,
}: {
  onOpenSettings: () => void
}) {
  const { currentProject, isDirty, reset: resetProject } = useProjectStore()
  const { reset: resetNotation, currentBareme, notes } = useNotationStore()
  const clips = useProjectStore((state) => state.clips)
  const { handleExportJudgeNotes } = useProjectMenuActions()
  const allClipsScored = clips.length > 0 && clips.every((clip) => {
    if (clip.scored) return true
    if (!currentBareme) return false
    const clipNote = notes[clip.id]
    return clipNote ? isNoteComplete(clipNote, currentBareme) : false
  })

  const handleCloseProject = () => {
    if (isDirty) {
      const confirmed = confirm(
        'Le projet a des modifications non sauvegardées. Fermer quand même ?',
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
            title="Fermer le projet"
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
            title="Exporter notation (<concours>_<pseudo>.json)"
          >
            <FileDown size={14} />
            Exporter notation
          </button>
        )}
        {currentProject && <BaremeSelector />}
        {currentProject && <ProjectManager />}
        {currentProject && (
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded hover:bg-surface-light text-gray-500 hover:text-white transition-colors"
            title="Paramètres"
          >
            <Settings size={14} />
          </button>
        )}
      </div>
    </header>
  )
}
