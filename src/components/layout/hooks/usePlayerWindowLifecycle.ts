import { useEffect } from 'react'
import * as tauri from '@/services/tauri'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import type { Clip, Project } from '@/types/project'

type UsePlayerWindowLifecycleParams = {
  currentProject: Project | null
  isAnyModalOpen: boolean
  currentTab: string
  currentInterface: string
  showPipVideo: boolean
  isPlayerLoaded: boolean
  isFullscreen: boolean
  isDetached: boolean
  clips: Clip[]
  currentClipIndex: number
  pause: () => Promise<void>
  onEscapeFullscreen: () => void
}

export function usePlayerWindowLifecycle({
  currentProject,
  isAnyModalOpen,
  currentTab,
  currentInterface,
  showPipVideo,
  isPlayerLoaded,
  isFullscreen,
  isDetached,
  clips,
  currentClipIndex,
  pause,
  onEscapeFullscreen,
}: UsePlayerWindowLifecycleParams) {
  const isPlayerTab = currentTab === 'notation' || currentTab === 'resultats'

  // Load clips during fullscreen or detached player window
  useEffect(() => {
    if (!isFullscreen && !isDetached) return
    const currentClip = clips[currentClipIndex]
    if (!currentClip?.filePath) {
      usePlayerStore.getState().setLoaded(false)
      pause().catch(() => {})
      tauri.playerStop().catch(() => {})
      return
    }

    const { isLoaded: loaded, currentFilePath } = usePlayerStore.getState()
    if (loaded && currentFilePath === currentClip.filePath) return

    usePlayerStore.getState().setLoaded(false)
    tauri.playerLoad(currentClip.filePath)
      .then(() => {
        usePlayerStore.getState().setLoaded(true, currentClip.filePath)
        tauri.playerPlay().catch(() => {})
      })
      .catch(console.error)
  }, [isFullscreen, isDetached, currentClipIndex, clips, pause])

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
      const currentClip = clips[currentClipIndex]
      const hasClipFile = Boolean(currentClip?.filePath)
      const shouldShowDetached =
        isPlayerTab &&
        !isAnyModalOpen &&
        showPipVideo &&
        Boolean(currentClip)

      if (shouldShowDetached) {
        tauri.playerShow().catch(() => {})
        if (!hasClipFile) {
          usePlayerStore.getState().setLoaded(false)
          pause().catch(() => {})
          tauri.playerStop().catch(() => {})
        }
      } else {
        pause().catch(() => {})
        tauri.playerHide().catch(() => {})
      }
      return
    }

    const currentClip = clips[currentClipIndex]
    if (!currentClip) {
      tauri.playerHide().catch(() => {})
      return
    }

    const shouldShowPlayer = isPlayerTab ? showPipVideo : false
    if (!shouldShowPlayer) {
      pause().catch(() => {})
      tauri.playerHide().catch(() => {})
      return
    }

    const hasClipFile = Boolean(currentClip.filePath)
    if (!hasClipFile) {
      usePlayerStore.getState().setLoaded(false)
      pause().catch(() => {})
      tauri.playerStop().catch(() => {})
      return
    }

    // Keep the player window shown during clip loading to avoid flicker.
    tauri.playerShow().catch(() => {})
  }, [
    currentProject,
    isAnyModalOpen,
    isPlayerTab,
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
          const store = useProjectStore.getState()
          const currentClip = store.clips[store.currentClipIndex]
          if (!currentClip?.filePath) {
            return
          }
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
      onEscapeFullscreen()
    }

    window.addEventListener('keydown', forceExitFullscreen, true)
    document.addEventListener('keydown', forceExitFullscreen, true)
    return () => {
      window.removeEventListener('keydown', forceExitFullscreen, true)
      document.removeEventListener('keydown', forceExitFullscreen, true)
    }
  }, [onEscapeFullscreen])
}
