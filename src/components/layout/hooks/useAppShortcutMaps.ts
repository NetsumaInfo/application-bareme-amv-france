import { useMemo } from 'react'
import type { RefObject } from 'react'
import { buildScreenshotName, captureElementToPngFile } from '@/utils/screenshot'
import { useProjectStore } from '@/store/useProjectStore'

interface UseAppShortcutMapsOptions {
  shortcutBindings: Record<string, string>
  togglePause: () => void
  seekRelative: (seconds: number) => void
  switchTab: (tab: 'notation' | 'resultats' | 'export') => void
  lockResultsUntilScored: boolean
  frameStep: () => void
  frameBackStep: () => void
  save: () => Promise<void>
  saveAs: () => Promise<void>
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  toggleFullscreen: () => Promise<void>
  handleEscapeFullscreen: () => void
  setShowProjectModal: (value: boolean) => void
  handleCtrlO: () => void
  toggleMiniatures: () => void
  setCurrentClipMiniatureFrame: () => Promise<void>
  undoLastChange: () => void
  currentTab: 'notation' | 'resultats' | 'export'
  currentInterface: 'spreadsheet' | 'modern' | 'notation' | 'dual'
  appRootRef: RefObject<HTMLDivElement | null>
}

export function useAppShortcutMaps({
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
}: UseAppShortcutMapsOptions) {
  const regularShortcuts = useMemo(() => {
    const map: Record<string, () => void> = {}
    map[shortcutBindings.togglePause] = togglePause
    map[shortcutBindings.seekForward] = () => seekRelative(5)
    map[shortcutBindings.seekBack] = () => seekRelative(-5)
    map[shortcutBindings.seekForwardLong] = () => seekRelative(30)
    map[shortcutBindings.seekBackLong] = () => seekRelative(-30)
    map[shortcutBindings.tabNotation] = () => switchTab('notation')
    map[shortcutBindings.tabResultats] = () => {
      if (!lockResultsUntilScored) switchTab('resultats')
    }
    map[shortcutBindings.tabExport] = () => {
      if (!lockResultsUntilScored) switchTab('export')
    }
    map[shortcutBindings.frameForward] = frameStep
    map[shortcutBindings.frameBack] = frameBackStep
    return map
  }, [
    shortcutBindings,
    togglePause,
    seekRelative,
    switchTab,
    lockResultsUntilScored,
    frameStep,
    frameBackStep,
  ])

  const globalShortcuts = useMemo(() => {
    const map: Record<string, () => void> = {}
    map[shortcutBindings.save] = () => { save().catch(console.error) }
    map[shortcutBindings.saveAs] = () => { saveAs().catch(console.error) }
    map[shortcutBindings.zoomIn] = zoomIn
    map[shortcutBindings.zoomOut] = zoomOut
    map[shortcutBindings.resetZoom] = resetZoom
    map[shortcutBindings.fullscreen] = () => {
      toggleFullscreen().catch(() => {})
    }
    map[shortcutBindings.exitFullscreen] = handleEscapeFullscreen
    map[shortcutBindings.newProject] = () => setShowProjectModal(true)
    map[shortcutBindings.openProject] = () => { handleCtrlO() }
    map[shortcutBindings.toggleMiniatures] = toggleMiniatures
    map[shortcutBindings.setMiniatureFrame] = () => {
      setCurrentClipMiniatureFrame().catch(() => {})
    }
    map[shortcutBindings.screenshot] = () => {
      if (appRootRef.current) {
        if (currentTab === 'resultats') {
          captureElementToPngFile(appRootRef.current, buildScreenshotName('resultats-page'))
            .catch(() => {})
          return
        }
        if (currentTab === 'export') {
          captureElementToPngFile(appRootRef.current, buildScreenshotName('export-page'))
            .catch(() => {})
          return
        }
        if (currentTab === 'notation' && currentInterface === 'notation') {
          captureElementToPngFile(appRootRef.current, buildScreenshotName('notation-page'))
            .catch(() => {})
          return
        }
        if (currentTab === 'notation') {
          captureElementToPngFile(appRootRef.current, buildScreenshotName('tableur-page'))
            .catch(() => {})
          return
        }
      }
      captureElementToPngFile(document.documentElement, buildScreenshotName('app-page'))
        .catch(() => {})
    }
    map[shortcutBindings.undo] = () => {
      undoLastChange()
      useProjectStore.getState().markDirty()
    }
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
    toggleMiniatures,
    setCurrentClipMiniatureFrame,
    undoLastChange,
    currentTab,
    currentInterface,
    appRootRef,
  ])

  return { regularShortcuts, globalShortcuts }
}
