import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FilePlus, FolderOpen, Folder } from 'lucide-react'
import Header from './Header'
import Sidebar from './Sidebar'
import VideoPlayer from '@/components/player/VideoPlayer'
import { FloatingVideoPlayer } from '@/components/player/FloatingVideoPlayer'
import SpreadsheetInterface from '@/components/interfaces/SpreadsheetInterface'
import ModernInterface from '@/components/interfaces/ModernInterface'
import NotationInterface from '@/components/interfaces/NotationInterface'
import CreateProjectModal from '@/components/project/CreateProjectModal'
import SettingsPanel from '@/components/settings/SettingsPanel'
import BaremeEditor from '@/components/scoring/BaremeEditor'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { usePlayer } from '@/hooks/usePlayer'
import { useSaveProject } from '@/hooks/useSaveProject'
import * as tauri from '@/services/tauri'

interface ProjectListItem {
  name: string
  judgeName: string
  updatedAt: string
  filePath: string
}

function WelcomeScreen() {
  const { setProjectFromData } = useProjectStore()
  const { loadNotes } = useNotationStore()
  const { setShowProjectModal, setProjectsFolderPath } = useUIStore()
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [folderPath, setFolderPath] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const folder = await tauri.getDefaultProjectsFolder()
        setFolderPath(folder)
        setProjectsFolderPath(folder)

        const list = await tauri.listProjectsInFolder(folder)
        setProjects(
          list.map((p) => ({
            name: p.name,
            judgeName: p.judge_name,
            updatedAt: p.updated_at,
            filePath: p.file_path,
          })),
        )
      } catch (e) {
        console.error('Failed to load projects:', e)
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [setProjectsFolderPath])

  const openProjectFromFile = useCallback(async (filePath: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await tauri.loadProjectFile(filePath) as any

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
      alert(`Impossible d'ouvrir ce projet. Il a peut-être été déplacé ou supprimé.`)
    }
  }, [setProjectFromData, loadNotes])

  const handleOpenProject = async () => {
    try {
      const filePath = await tauri.openProjectDialog()
      if (!filePath) return
      await openProjectFromFile(filePath)
    } catch (e) {
      console.error('Failed to open project:', e)
      alert(`Erreur lors de l'ouverture: ${e}`)
    }
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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

        {/* Projects from folder */}
        {loading ? (
          <div className="text-center text-gray-500 text-sm py-4">
            Chargement des projets...
          </div>
        ) : projects.length > 0 ? (
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
              <Folder size={12} />
              Projets
            </h3>
            <div className="space-y-1">
              {projects.map((project) => (
                <button
                  key={project.filePath}
                  onClick={() => openProjectFromFile(project.filePath)}
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
                      {formatDate(project.updatedAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Folder indicator */}
        {folderPath && (
          <div className="mt-6 text-center">
            <p className="text-[9px] text-gray-600 truncate" title={folderPath}>
              Dossier : {folderPath}
            </p>
          </div>
        )}
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
  const {
    currentInterface,
    switchInterface,
    sidebarCollapsed,
    showPipVideo,
    setShowPipVideo,
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    setShowProjectModal,
  } = useUIStore()
  const { togglePause, seekRelative, toggleFullscreen } = usePlayer()
  const { save, saveAs } = useSaveProject()
  const [showSettings, setShowSettings] = useState(false)

  useAutoSave()

  const handleEscapeFullscreen = useCallback(() => {
    if (usePlayerStore.getState().isFullscreen) {
      toggleFullscreen()
    }
  }, [toggleFullscreen])

  const handleCtrlO = useCallback(async () => {
    try {
      const filePath = await tauri.openProjectDialog()
      if (!filePath) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await tauri.loadProjectFile(filePath) as any
      useProjectStore.getState().setProjectFromData({
        version: '1.0',
        project: { ...data.project, filePath },
        baremeId: data.baremeId,
        clips: data.clips,
        notes: data.notes,
      })
      if (data.notes) useNotationStore.getState().loadNotes(data.notes)
    } catch (e) {
      console.error('Failed to open project:', e)
    }
  }, [])

  // Regular shortcuts (blocked in inputs)
  useKeyboardShortcuts(
    {
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
    },
    // Global shortcuts (fire even in inputs)
    {
      'ctrl+s': () => { save().catch(console.error) },
      'ctrl+alt+s': () => { saveAs().catch(console.error) },
      'ctrl+=': zoomIn,
      'ctrl+-': zoomOut,
      'ctrl+0': resetZoom,
      f11: toggleFullscreen,
      escape: handleEscapeFullscreen,
      'ctrl+n': () => setShowProjectModal(true),
      'ctrl+o': () => { handleCtrlO() },
    },
  )

  const isNotationMode = currentInterface === 'notation'
  const isSpreadsheetMode = currentInterface === 'spreadsheet'

  return (
    <div
      className="flex flex-col h-screen bg-surface-dark text-gray-200"
      style={{ zoom: `${zoomLevel}%` }}
    >
      <Header onOpenSettings={() => setShowSettings(true)} />

      {!currentProject ? (
        <WelcomeScreen />
      ) : isSpreadsheetMode ? (
        /* Spreadsheet mode: full-width table + floating PiP video */
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <SpreadsheetInterface />
          </div>
          {showPipVideo && (
            <FloatingVideoPlayer onClose={() => setShowPipVideo(false)} />
          )}
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
