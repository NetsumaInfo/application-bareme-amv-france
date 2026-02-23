import { useCallback, useEffect, useRef, useState } from 'react'
import { appWindow } from '@tauri-apps/api/window'

interface UseOverlayControlVisibilityOptions {
  isPlayerFullscreen: boolean
}

export function useOverlayControlVisibility({ isPlayerFullscreen }: UseOverlayControlVisibilityOptions) {
  const [showControls, setShowControls] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (isPlayerFullscreen) {
      appWindow.setFocus().catch(() => {})
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }, [isPlayerFullscreen])

  useEffect(() => {
    if (!isPlayerFullscreen) return
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000)
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [isPlayerFullscreen])

  useEffect(() => {
    const onActivity = () => resetHideTimer()
    window.addEventListener('mousemove', onActivity, true)
    window.addEventListener('mousedown', onActivity, true)
    window.addEventListener('touchstart', onActivity, true)
    return () => {
      window.removeEventListener('mousemove', onActivity, true)
      window.removeEventListener('mousedown', onActivity, true)
      window.removeEventListener('touchstart', onActivity, true)
    }
  }, [resetHideTimer])

  return {
    showControls,
    controlsVisible: !isPlayerFullscreen || showControls,
    resetHideTimer,
  }
}
