import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FilePlus, FolderOpen, Clock, Trash2 } from 'lucide-react'
import Header from './Header'
import Sidebar from './Sidebar'
import VideoPlayer from '@/components/player/VideoPlayer'
import SpreadsheetInterface from '@/components/interfaces/SpreadsheetInterface'
import ModernInterface from '@/components/interfaces/ModernInterface'
import NotationInterface from '@/components/interfaces/NotationInterface'
import CreateProjectModal from '@/components/project/CreateProjectModal'
import SettingsPanel from '@/components/settings/SettingsPanel'
import BaremeEditor from '@/components/scoring/BaremeEditor'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { usePlayer } from '@/hooks/usePlayer'
import {
  getRecentProjects,
  removeRecentProject,
  type RecentProject,
} from '@/utils/recentProjects'
import * as tauri from '@/services/tauri'

function WelcomeScreen() {
  const { setProjectFromData } = useProjectStore()
  const { loadNotes } = useNotationStore()
  const { setShowProjectModal } = useUIStore()
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>(
    getRecentProjects,
  )

  const handleOpenProject = async () => {
    try {
      const filePath = await tauri.openProjectDialog()
      if (!filePath) return

      const data = (await tauri.loadProjectFile(filePath)) as {
        project: Parameters<typeof setProjectFromData>[0]['project']
        clips: Parameters<typeof setProjectFromData>[0]['clips']
        notes: Record<string, Parameters<typeof loadNotes>[0][string]>
        baremeId: string
      }

      setProjectFromData({
        version: '1.0',
        project: { ...data.project, filePath },
        baremeId: data.baremeId,
        clips: data.clips,
        notes: data.notes,
      })
      if (data.notes) loadNotes(data.notes)
    } catch (e) {
      console.error('Failed to open project:', e)
      alert(`Erreur lors de l'ouverture: ${e}`)
    }
  }

  const handleOpenRecent = async (path: string) => {
    try {
      const data = (await tauri.loadProjectFile(path)) as {
        project: Parameters<typeof setProjectFromData>[0]['project']
        clips: Parameters<typeof setProjectFromData>[0]['clips']
        notes: Record<string, Parameters<typeof loadNotes>[0][string]>
        baremeId: string
      }

      setProjectFromData({
        version: '1.0',
        project: { ...data.project, filePath: path },
        baremeId: data.baremeId,
        clips: data.clips,
        notes: data.notes,
      })
      if (data.notes) loadNotes(data.notes)
    } catch (e) {
      console.error('Failed to open recent project:', e)
      removeRecentProject(path)
      setRecentProjects(getRecentProjects())
      alert(`Impossible d'ouvrir ce projet. Il a peut-être été déplacé.`)
    }
  }

  const handleRemoveRecent = (e: React.MouseEvent, path: string) => {
    e.stopPropagation()
    removeRecentProject(path)
    setRecentProjects(getRecentProjects())
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-1">AMV Notation</h2>
          <p className="text-gray-500 text-sm">
            Outil de notation pour compétitions AMV
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
          >
            <FilePlus size={16} />
            Nouveau projet
          </button>
          <button
            onClick={handleOpenProject}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface hover:bg-surface-light text-gray-300 hover:text-white text-sm font-medium transition-colors border border-gray-700"
          >
            <FolderOpen size={16} />
            Ouvrir un projet
          </button>
        </div>

        {/* Recent projects */}
        {recentProjects.length > 0 && (
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
              <Clock size={12} />
              Projets récents
            </h3>
            <div className="space-y-1">
              {recentProjects.map((project) => (
                <button
                  key={project.path}
                  onClick={() => handleOpenRecent(project.path)}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-surface/50 hover:bg-surface-light border border-gray-800 hover:border-gray-700 transition-colors group flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">
                      {project.name}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {project.judgeName && (
                        <span className="text-gray-400">
                          {project.judgeName} —{' '}
                        </span>
                      )}
                      {formatDate(project.lastOpened)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleRemoveRecent(e, project.path)}
                    className="p-1 rounded text-gray-600 hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
                    title="Retirer de la liste"
                  >
                    <Trash2 size={12} />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="mt-8 text-center space-y-1">
          <p className="text-[10px] text-gray-600">
            <kbd className="px-1 py-0.5 bg-surface rounded text-gray-500">
              Ctrl+N
            </kbd>{' '}
            Nouveau
            <span className="mx-2">|</span>
            <kbd className="px-1 py-0.5 bg-surface rounded text-gray-500">
              Ctrl+O
            </kbd>{' '}
            Ouvrir
          </p>
        </div>
      </div>
    </div>
  )
}

function ScoringInterface() {
  const { currentInterface } = useUIStore()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentInterface}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col h-full"
      >
        {currentInterface === 'modern' && <ModernInterface />}
        {currentInterface === 'notation' && <NotationInterface />}
      </motion.div>
    </AnimatePresence>
  )
}

export default function AppLayout() {
  const { currentProject, nextClip, previousClip } = useProjectStore()
  const { currentInterface, switchInterface, sidebarCollapsed } = useUIStore()
  const { togglePause, seekRelative } = usePlayer()
  const [showSettings, setShowSettings] = useState(false)

  useAutoSave()

  useKeyboardShortcuts({
    ' ': togglePause,
    arrowright: () => seekRelative(5),
    arrowleft: () => seekRelative(-5),
    'shift+arrowright': () => seekRelative(30),
    'shift+arrowleft': () => seekRelative(-30),
    n: nextClip,
    p: previousClip,
    'ctrl+1': () => switchInterface('spreadsheet'),
    'ctrl+2': () => switchInterface('modern'),
    'ctrl+3': () => switchInterface('notation'),
  })

  const isNotationMode = currentInterface === 'notation'
  const isSpreadsheetMode = currentInterface === 'spreadsheet'

  return (
    <div className="flex flex-col h-screen bg-surface-dark text-gray-200">
      <Header onOpenSettings={() => setShowSettings(true)} />

      {!currentProject ? (
        <WelcomeScreen />
      ) : isSpreadsheetMode ? (
        /* Spreadsheet mode: small video panel left, full-width table right */
        <div className="flex flex-1 overflow-hidden">
          <div className="w-72 shrink-0 border-r border-gray-700 flex flex-col p-2 gap-2 bg-surface">
            <VideoPlayer compact />
            {/* Clip counter */}
            <div className="text-center text-[10px] text-gray-500">
              {useProjectStore.getState().currentClipIndex + 1} /{' '}
              {useProjectStore.getState().clips.length} clips
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <SpreadsheetInterface />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - hidden in notation mode or when collapsed */}
          {!isNotationMode && !sidebarCollapsed && <Sidebar />}

          {/* Main content */}
          <div className="flex flex-1 overflow-hidden">
            {isNotationMode ? (
              /* Notation mode: large video + narrow panel */
              <>
                <div className="flex flex-col flex-1 p-2 gap-1 overflow-hidden">
                  <VideoPlayer />
                </div>
                <div className="flex flex-col w-72 border-l border-gray-700 overflow-hidden">
                  <ScoringInterface />
                </div>
              </>
            ) : (
              /* Modern mode: 50/50 split */
              <>
                <div className="flex flex-col w-1/2 p-2 gap-1 overflow-hidden">
                  <VideoPlayer />
                </div>
                <div className="flex flex-col w-1/2 border-l border-gray-700 overflow-hidden">
                  <ScoringInterface />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateProjectModal />
      <BaremeEditor />
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
