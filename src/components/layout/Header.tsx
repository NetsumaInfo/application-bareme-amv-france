import { Settings, PanelLeftClose, PanelLeft, ClipboardList } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import ProjectManager from '@/components/project/ProjectManager'
import InterfaceSwitcher from '@/components/interfaces/InterfaceSwitcher'

export default function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { currentProject, isDirty } = useProjectStore()
  const { sidebarCollapsed, toggleSidebar, currentInterface, setShowBaremeEditor } = useUIStore()

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-surface border-b border-gray-700 min-h-[44px]">
      <div className="flex items-center gap-3">
        {currentProject && currentInterface !== 'notation' && (
          <button
            onClick={toggleSidebar}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            title={sidebarCollapsed ? 'Afficher la sidebar' : 'Masquer la sidebar'}
          >
            {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
        <h1 className="text-sm font-bold text-white tracking-tight">
          AMV Notation
        </h1>
        {currentProject && (
          <span className="text-xs text-gray-400">
            {currentProject.name}
            {isDirty && <span className="text-accent ml-1">*</span>}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {currentProject && <InterfaceSwitcher />}
        <ProjectManager />
        <button
          onClick={() => setShowBaremeEditor(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded hover:bg-surface-light text-gray-300 hover:text-white transition-colors"
          title="Gérer les barèmes"
        >
          <ClipboardList size={14} />
          <span className="hidden sm:inline">Barèmes</span>
        </button>
        {currentProject && (
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            title="Paramètres"
          >
            <Settings size={15} />
          </button>
        )}
      </div>
    </header>
  )
}
