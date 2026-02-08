import { useState, useRef, useEffect } from 'react'
import { Settings, Home, ChevronDown, Pencil, Plus } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import ProjectManager from '@/components/project/ProjectManager'
import InterfaceSwitcher from '@/components/interfaces/InterfaceSwitcher'

function BaremeSelector() {
  const { currentBareme, availableBaremes, setBareme } = useNotationStore()
  const { updateProject } = useProjectStore()
  const { setShowBaremeEditor } = useUIStore()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSelectBareme = (bareme: typeof currentBareme) => {
    if (!bareme) return
    setBareme(bareme)
    updateProject({ baremeId: bareme.id })
    setOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors border border-gray-700/50"
      >
        <span className="max-w-[100px] truncate">
          {currentBareme?.name || 'Barème'}
        </span>
        <ChevronDown
          size={10}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-surface border border-gray-700 rounded-lg shadow-xl z-50 py-1">
          {availableBaremes.map((b) => (
            <button
              key={b.id}
              onClick={() => handleSelectBareme(b)}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-light transition-colors ${
                b.id === currentBareme?.id
                  ? 'text-primary-400 bg-primary-600/10'
                  : 'text-gray-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="truncate font-medium">{b.name}</span>
                {b.isOfficial && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-primary-600/30 text-primary-300 shrink-0">
                    Officiel
                  </span>
                )}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {b.criteria.length} critères — {b.totalPoints} pts
              </div>
            </button>
          ))}

          <div className="border-t border-gray-700 mt-1 pt-1">
            <button
              onClick={() => {
                setOpen(false)
                setShowBaremeEditor(true)
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-surface-light transition-colors flex items-center gap-2"
            >
              <Pencil size={11} />
              Gérer les barèmes
            </button>
            <button
              onClick={() => {
                setOpen(false)
                setShowBaremeEditor(true)
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-primary-400 hover:text-primary-300 hover:bg-surface-light transition-colors flex items-center gap-2"
            >
              <Plus size={11} />
              Créer un barème
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

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
    <header className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-gray-700 min-h-[40px]">
      {/* Left: Home + title */}
      <div className="flex items-center gap-2">
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
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            {currentProject.name}
            {currentProject.judgeName && (
              <span className="text-gray-500 ml-1">
                — {currentProject.judgeName}
              </span>
            )}
            {isDirty && <span className="text-accent ml-1">*</span>}
          </span>
        )}
      </div>

      {/* Center: Interface switcher */}
      {currentProject && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <InterfaceSwitcher />
        </div>
      )}

      {/* Right: Barème + File menu + Settings */}
      <div className="flex items-center gap-1">
        {currentProject && <BaremeSelector />}
        <ProjectManager />
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
