import { useState, useEffect, useCallback, useRef } from 'react'
import { AppMainContent } from '@/components/layout/AppMainContent'
import { AppFloatingLayers } from '@/components/layout/AppFloatingLayers'
import { useAutoDetachNotesWindow } from '@/components/layout/hooks/useAutoDetachNotesWindow'
import { useOverlayBridge } from '@/components/layout/hooks/useOverlayBridge'
import { useAppShortcutMaps } from '@/components/layout/hooks/useAppShortcutMaps'
import { useNotesBridge } from '@/components/layout/hooks/useNotesBridge'
import { useClipNavigationShortcut } from '@/components/layout/hooks/useClipNavigationShortcut'
import { useBootstrapSettings } from '@/components/layout/hooks/useBootstrapSettings'
import { useLayoutContextMenu } from '@/components/layout/hooks/useLayoutContextMenu'
import { useMiniatureActions } from '@/components/layout/hooks/useMiniatureActions'
import { useOpenProjectShortcut } from '@/components/layout/hooks/useOpenProjectShortcut'
import { usePlayerWindowLifecycle } from '@/components/layout/hooks/usePlayerWindowLifecycle'
import { useZoomStyles } from '@/components/layout/hooks/useZoomStyles'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { usePlayer } from '@/hooks/usePlayer'
import { useSaveProject } from '@/hooks/useSaveProject'

export default function AppLayout() {
  const { currentProject, clips, currentClipIndex } = useProjectStore()
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const notes = useNotationStore((state) => state.notes)
  const loadCustomBaremes = useNotationStore((state) => state.loadCustomBaremes)
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
    hideFinalScore,
    zoomIn,
    zoomOut,
    resetZoom,
    setShowProjectModal,
    shortcutBindings,
    isNotesDetached,
    setNotesDetached,
  } = useUIStore()
  const { togglePause, seekRelative, toggleFullscreen, exitFullscreen, pause, frameStep, frameBackStep } = usePlayer()
  const isPlayerLoaded = usePlayerStore((state) => state.isLoaded)
  const isFullscreen = usePlayerStore((state) => state.isFullscreen)
  const isDetached = usePlayerStore((state) => state.isDetached)
  const { save, saveAs } = useSaveProject()
  const undoLastChange = useNotationStore((state) => state.undoLastChange)
  const [showSettings, setShowSettings] = useState(false)
  const appRootRef = useRef<HTMLDivElement | null>(null)
  const allClipsScored = clips.length > 0 && clips.every((clip) => clip.scored)
  const lockResultsUntilScored = Boolean(currentProject?.settings.hideFinalScoreUntilEnd) && !allClipsScored

  const { toggleMiniatures, setCurrentClipMiniatureFrame } = useMiniatureActions()
  const { contextMenu, setContextMenu, handleContextMenu } = useLayoutContextMenu()
  const { isNavigableZoom, zoomStyle, navigableCanvasStyle, zoomOverflow } = useZoomStyles(zoomMode, zoomLevel)
  const handleCtrlO = useOpenProjectShortcut()

  useAutoSave()

  useAutoDetachNotesWindow({
    hasProject: Boolean(currentProject),
    isNotationTab: currentTab === 'notation',
    isDualInterface: currentInterface === 'dual',
    isNotesDetached,
    setNotesDetached,
  })

  useEffect(() => {
    if (!lockResultsUntilScored) return
    if (currentTab === 'resultats' || currentTab === 'export') {
      switchTab('notation')
    }
  }, [lockResultsUntilScored, currentTab, switchTab])

  useBootstrapSettings({ loadCustomBaremes })

  useOverlayBridge({
    clips,
    currentClipIndex,
    currentProject,
    notes,
    currentBareme,
    isFullscreen,
    isDetached,
    onUndo: undoLastChange,
    onSetCurrentClipMiniatureFrame: setCurrentClipMiniatureFrame,
    onToggleMiniatures: toggleMiniatures,
  })

  useClipNavigationShortcut({
    nextClipShortcut: shortcutBindings.nextClip,
    prevClipShortcut: shortcutBindings.prevClip,
    enabled: !(currentTab === 'notation' && currentInterface === 'notation' && !isNotesDetached),
  })

  useNotesBridge({
    isNotesDetached,
    clips,
    currentClipIndex,
    notes,
    currentProject,
    hideFinalScore,
    onUndo: undoLastChange,
    onSetCurrentClipMiniatureFrame: setCurrentClipMiniatureFrame,
    onToggleMiniatures: toggleMiniatures,
  })

  const handleEscapeFullscreen = useCallback(() => {
    if (usePlayerStore.getState().isFullscreen) {
      exitFullscreen().catch(() => {})
    }
  }, [exitFullscreen])

  usePlayerWindowLifecycle({
    currentProject,
    isAnyModalOpen: showSettings || showProjectModal || showBaremeEditor,
    currentTab,
    currentInterface,
    showPipVideo,
    isPlayerLoaded,
    isFullscreen,
    isDetached,
    clips,
    currentClipIndex,
    pause,
    onEscapeFullscreen: handleEscapeFullscreen,
  })

  const { regularShortcuts, globalShortcuts } = useAppShortcutMaps({
    shortcutBindings,
    togglePause,
    seekRelative,
    switchTab,
    lockResultsUntilScored,
    frameStep,
    frameBackStep,
    save,
    saveAs,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleFullscreen,
    handleEscapeFullscreen,
    setShowProjectModal,
    handleCtrlO,
    toggleMiniatures,
    setCurrentClipMiniatureFrame,
    undoLastChange,
    currentTab,
    currentInterface,
    appRootRef,
  })

  useKeyboardShortcuts(regularShortcuts, globalShortcuts)

  return (
    <div
      ref={appRootRef}
      className={`flex flex-col h-screen w-full bg-surface-dark text-gray-200 ${zoomOverflow}`}
      style={zoomStyle}
      onContextMenu={currentProject && currentTab === 'notation' ? handleContextMenu : undefined}
    >
      {isNavigableZoom ? (
        <div className="flex flex-col min-h-screen min-w-full" style={navigableCanvasStyle}>
          <AppMainContent
            currentProject={currentProject}
            currentTab={currentTab}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>
      ) : (
        <AppMainContent
          currentProject={currentProject}
          currentTab={currentTab}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      <AppFloatingLayers
        contextMenu={contextMenu}
        onCloseContextMenu={() => setContextMenu(null)}
        showSettings={showSettings}
        onCloseSettings={() => setShowSettings(false)}
        currentProject={currentProject}
        currentTab={currentTab}
        currentInterface={currentInterface}
        showPipVideo={showPipVideo}
        setShowPipVideo={setShowPipVideo}
        isDetached={isDetached}
      />
    </div>
  )
}
