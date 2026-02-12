import { useState, useEffect, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FilePlus, FolderOpen, Folder } from 'lucide-react'
import { emit, listen } from '@tauri-apps/api/event'
import Header from './Header'
import Sidebar from './Sidebar'
import ContextMenu from './ContextMenu'
import VideoPlayer from '@/components/player/VideoPlayer'
import { FloatingVideoPlayer } from '@/components/player/FloatingVideoPlayer'
import SpreadsheetInterface from '@/components/interfaces/SpreadsheetInterface'
import ModernInterface from '@/components/interfaces/ModernInterface'
import NotationInterface from '@/components/interfaces/NotationInterface'
import ResultatsInterface from '@/components/interfaces/ResultatsInterface'
import ExportInterface from '@/components/interfaces/ExportInterface'
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
import { getClipPrimaryLabel } from '@/utils/formatters'

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
        ...data,
        version: typeof data.version === 'string' ? data.version : '1.0',
        project: { ...data.project, filePath },
        baremeId: data.baremeId ?? data.project?.baremeId ?? '',
        clips: Array.isArray(data.clips) ? data.clips : [],
        notes: data.notes ?? {},
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="flex flex-col h-full"
      >
        {currentInterface === 'modern' && <ModernInterface />}
        {currentInterface === 'notation' && <NotationInterface />}
      </motion.div>
    </AnimatePresence>
  )
}

function NotationTabContent() {
  const {
    currentInterface,
    sidebarCollapsed,
  } = useUIStore()

  const isNotationMode = currentInterface === 'notation'
  const isSpreadsheetMode = currentInterface === 'spreadsheet'

  if (isSpreadsheetMode) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <SpreadsheetInterface />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar - hidden in notation mode or when collapsed */}
      {!isNotationMode && !sidebarCollapsed && (
        <div className="hidden lg:flex">
          <Sidebar />
        </div>
      )}

      {/* Main content */}
      <div
        className={`flex flex-1 overflow-hidden ${
          isNotationMode ? 'flex-col lg:flex-row' : 'flex-col xl:flex-row'
        }`}
      >
        {isNotationMode ? (
          <>
            <div className="flex flex-col flex-1 p-2 gap-1 overflow-hidden min-h-[38vh]">
              <VideoPlayer />
            </div>
            <div className="flex flex-col w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-700 overflow-hidden">
              <ScoringInterface />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col w-full xl:w-1/2 p-2 gap-1 overflow-hidden min-h-[34vh]">
              <VideoPlayer />
            </div>
            <div className="flex flex-col w-full xl:w-1/2 border-t xl:border-t-0 xl:border-l border-gray-700 overflow-hidden">
              <ScoringInterface />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AppLayout() {
  const { currentProject, clips, currentClipIndex, nextClip, previousClip } = useProjectStore()
  const {
    currentTab,
    switchTab,
    currentInterface,
    showPipVideo,
    setShowPipVideo,
    showProjectModal,
    showBaremeEditor,
    zoomLevel,
    zoomMode,
    zoomIn,
    zoomOut,
    resetZoom,
    setShowProjectModal,
    shortcutBindings,
  } = useUIStore()
  const { togglePause, seekRelative, toggleFullscreen, exitFullscreen, pause } = usePlayer()
  const isPlayerLoaded = usePlayerStore((state) => state.isLoaded)
  const isFullscreen = usePlayerStore((state) => state.isFullscreen)
  const isDetached = usePlayerStore((state) => state.isDetached)
  const { save, saveAs } = useSaveProject()
  const undoLastChange = useNotationStore((state) => state.undoLastChange)
  const [showSettings, setShowSettings] = useState(false)

  useAutoSave()

  // Emit clip info to overlay window when fullscreen
  const emitClipInfo = useCallback(() => {
    const { clips: allClips, currentClipIndex: idx } = useProjectStore.getState()
    const clip = allClips[idx]
    emit('main:clip-changed', {
      name: clip ? getClipPrimaryLabel(clip) : '',
      index: idx,
      total: allClips.length,
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (isFullscreen || isDetached) {
      emitClipInfo()
    }
  }, [isFullscreen, isDetached, currentClipIndex, clips.length, emitClipInfo])

  // Listen for overlay commands (next/prev clip)
  useEffect(() => {
    let unlistenNext: (() => void) | null = null
    let unlistenPrev: (() => void) | null = null
    let unlistenRequest: (() => void) | null = null
    let unlistenClose: (() => void) | null = null

    listen('overlay:next-clip', () => {
      useProjectStore.getState().nextClip()
    }).then(fn => { unlistenNext = fn })

    listen('overlay:prev-clip', () => {
      useProjectStore.getState().previousClip()
    }).then(fn => { unlistenPrev = fn })

    listen('overlay:request-clip-info', () => {
      emitClipInfo()
    }).then(fn => { unlistenRequest = fn })

    listen('overlay:close-player', () => {
      useUIStore.getState().setShowPipVideo(false)
      tauri.playerHide().catch(() => {})
    }).then(fn => { unlistenClose = fn })

    return () => {
      if (unlistenNext) unlistenNext()
      if (unlistenPrev) unlistenPrev()
      if (unlistenRequest) unlistenRequest()
      if (unlistenClose) unlistenClose()
    }
  }, [emitClipInfo])

  // Load clips during fullscreen or detached player window
  useEffect(() => {
    if (!isFullscreen && !isDetached) return
    const currentClip = clips[currentClipIndex]
    if (!currentClip?.filePath) return

    const { isLoaded: loaded, currentFilePath } = usePlayerStore.getState()
    if (loaded && currentFilePath === currentClip.filePath) return

    usePlayerStore.getState().setLoaded(false)
    tauri.playerLoad(currentClip.filePath)
      .then(() => {
        usePlayerStore.getState().setLoaded(true, currentClip.filePath)
        tauri.playerPlay().catch(() => {})
        emitClipInfo()
      })
      .catch(console.error)
  }, [isFullscreen, isDetached, currentClipIndex, clips, emitClipInfo])

  useEffect(() => {
    if (!currentProject) return

    if (!(isDetached || isFullscreen)) {
      tauri.playerSyncOverlay().catch(() => {})
      return
    }

    tauri.playerSyncOverlay().catch(() => {})
    const timer = setInterval(() => {
      tauri.playerSyncOverlay().catch(() => {})
    }, 120)
    return () => clearInterval(timer)
  }, [currentProject, isDetached, isFullscreen, currentClipIndex, clips.length])

  const handleEscapeFullscreen = useCallback(() => {
    if (usePlayerStore.getState().isFullscreen) {
      exitFullscreen().catch(() => {})
    }
  }, [exitFullscreen])

  const handleCtrlO = useCallback(async () => {
    try {
      const filePath = await tauri.openProjectDialog()
      if (!filePath) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await tauri.loadProjectFile(filePath) as any
      useProjectStore.getState().setProjectFromData({
        ...data,
        version: typeof data.version === 'string' ? data.version : '1.0',
        project: { ...data.project, filePath },
        baremeId: data.baremeId ?? data.project?.baremeId ?? '',
        clips: Array.isArray(data.clips) ? data.clips : [],
        notes: data.notes ?? {},
      })
      if (data.notes) useNotationStore.getState().loadNotes(data.notes)
    } catch (e) {
      console.error('Failed to open project:', e)
    }
  }, [])

  const regularShortcuts = useMemo(() => {
    const map: Record<string, () => void> = {}
    map[shortcutBindings.togglePause] = togglePause
    map[shortcutBindings.seekForward] = () => seekRelative(5)
    map[shortcutBindings.seekBack] = () => seekRelative(-5)
    map[shortcutBindings.seekForwardLong] = () => seekRelative(30)
    map[shortcutBindings.seekBackLong] = () => seekRelative(-30)
    map[shortcutBindings.nextClip] = nextClip
    map[shortcutBindings.prevClip] = previousClip
    map[shortcutBindings.tabNotation] = () => switchTab('notation')
    map[shortcutBindings.tabResultats] = () => switchTab('resultats')
    map[shortcutBindings.tabExport] = () => switchTab('export')
    map[shortcutBindings.undo] = () => {
      undoLastChange()
      useProjectStore.getState().markDirty()
    }
    return map
  }, [
    shortcutBindings,
    togglePause,
    seekRelative,
    nextClip,
    previousClip,
    switchTab,
    undoLastChange,
  ])

  const globalShortcuts = useMemo(() => {
    const map: Record<string, () => void> = {}
    map[shortcutBindings.save] = () => { save().catch(console.error) }
    map[shortcutBindings.saveAs] = () => { saveAs().catch(console.error) }
    map[shortcutBindings.zoomIn] = zoomIn
    map[shortcutBindings.zoomOut] = zoomOut
    map[shortcutBindings.resetZoom] = resetZoom
    map[shortcutBindings.fullscreen] = toggleFullscreen
    map[shortcutBindings.exitFullscreen] = handleEscapeFullscreen
    map[shortcutBindings.newProject] = () => setShowProjectModal(true)
    map[shortcutBindings.openProject] = () => { handleCtrlO() }
    return map
  }, [
    shortcutBindings,
    save,
    saveAs,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleFullscreen,
    handleEscapeFullscreen,
    setShowProjectModal,
    handleCtrlO,
  ])

  useKeyboardShortcuts(regularShortcuts, globalShortcuts)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Keep native context menu on interactive elements
    const target = e.target as HTMLElement
    if (
      target.closest('input, textarea, select, button, a, [contenteditable="true"]')
      || target.closest('[data-native-context="true"]')
    ) {
      return
    }

    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const isAnyModalOpen = showSettings || showProjectModal || showBaremeEditor

  useEffect(() => {
    if (!currentProject) {
      pause().catch(() => {})
      tauri.playerHide().catch(() => {})
      return
    }

    if (isAnyModalOpen) {
      if (usePlayerStore.getState().isFullscreen) {
        usePlayerStore.getState().setFullscreen(false)
      }
      tauri.playerSetFullscreen(false).catch(() => {})
      pause().catch(() => {})
      tauri.playerHide().catch(() => {})
      return
    }

    if (isFullscreen) {
      tauri.playerShow().catch(() => {})
      return
    }

    if (isDetached) {
      const hasClip = Boolean(clips[currentClipIndex]?.filePath)
      const shouldShowDetached =
        currentTab === 'notation' &&
        !isAnyModalOpen &&
        showPipVideo &&
        hasClip &&
        isPlayerLoaded

      if (shouldShowDetached) {
        tauri.playerShow().catch(() => {})
      } else {
        pause().catch(() => {})
        tauri.playerHide().catch(() => {})
      }
      return
    }

    const hasClip = Boolean(clips[currentClipIndex]?.filePath)
    if (!hasClip || !isPlayerLoaded) {
      tauri.playerHide().catch(() => {})
      return
    }

    const shouldShowPlayer =
      currentTab === 'notation'
        ? currentInterface === 'spreadsheet'
          ? showPipVideo
          : true
        : false

    if (shouldShowPlayer) {
      tauri.playerShow().catch(() => {})
    } else {
      pause().catch(() => {})
      tauri.playerHide().catch(() => {})
    }
  }, [
    currentProject,
    isAnyModalOpen,
    currentTab,
    currentInterface,
    showPipVideo,
    isPlayerLoaded,
    isFullscreen,
    clips,
    currentClipIndex,
    pause,
    isDetached,
  ])

  useEffect(() => {
    if (!currentProject || !isDetached) return

    const timer = setInterval(() => {
      tauri.playerIsVisible()
        .then((visible) => {
          if (!visible && useUIStore.getState().showPipVideo) {
            useUIStore.getState().setShowPipVideo(false)
          }
        })
        .catch(() => {})
    }, 300)

    return () => clearInterval(timer)
  }, [currentProject, isDetached])

  useEffect(() => {
    const forceExitFullscreen = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (!usePlayerStore.getState().isFullscreen) return
      event.preventDefault()
      event.stopPropagation()
      exitFullscreen().catch(() => {})
    }

    window.addEventListener('keydown', forceExitFullscreen, true)
    document.addEventListener('keydown', forceExitFullscreen, true)
    return () => {
      window.removeEventListener('keydown', forceExitFullscreen, true)
      document.removeEventListener('keydown', forceExitFullscreen, true)
    }
  }, [exitFullscreen])

  const isNavigableZoom = zoomMode === 'navigable'
  const zoomScale = Math.max(0.5, zoomLevel / 100)
  const zoomStyle = isNavigableZoom ? undefined : { zoom: `${zoomLevel}%` }
  const navigableCanvasStyle = isNavigableZoom
    ? {
        transform: `scale(${zoomScale})`,
        transformOrigin: 'top left',
        width: `${100 / zoomScale}%`,
        minHeight: `${100 / zoomScale}vh`,
      }
    : undefined

  const zoomOverflow = zoomMode === 'fixed'
    ? 'overflow-x-hidden overflow-y-auto'
    : 'overflow-auto'

  const appContent = (
    <>
      <Header onOpenSettings={() => setShowSettings(true)} />

      {!currentProject ? (
        <WelcomeScreen />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {currentTab === 'notation' && <NotationTabContent />}
            {currentTab === 'resultats' && <ResultatsInterface />}
            {currentTab === 'export' && <ExportInterface />}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  )

  return (
    <div
      className={`flex flex-col h-screen w-full bg-surface-dark text-gray-200 ${zoomOverflow}`}
      style={zoomStyle}
      onContextMenu={currentProject && currentTab === 'notation' ? handleContextMenu : undefined}
    >
      {isNavigableZoom ? (
        <div className="flex flex-col min-h-screen min-w-full" style={navigableCanvasStyle}>
          {appContent}
        </div>
      ) : (
        appContent
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Modals */}
      <CreateProjectModal />
      <BaremeEditor />
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}

      {currentProject && currentTab === 'notation' && currentInterface === 'spreadsheet' && showPipVideo && !isDetached && (
        <FloatingVideoPlayer onClose={() => setShowPipVideo(false)} />
      )}
    </div>
  )
}
