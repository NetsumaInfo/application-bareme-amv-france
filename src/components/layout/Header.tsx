import { Settings, Home } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import ProjectManager from '@/components/project/ProjectManager'
import InterfaceSwitcher from '@/components/interfaces/InterfaceSwitcher'
import { BaremeSelector } from '@/components/layout/BaremeSelector'
import { NotationModeSwitcher } from '@/components/layout/NotationModeSwitcher'

export default function Header({
  onOpenSettings,
}: {
  onOpenSettings: () => void
}) {
  const { currentProject, isDirty, reset: resetProject } = useProjectStore()
  const { reset: resetNotation } = useNotationStore()

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
