import { useCallback, useEffect, useRef, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

interface UseOverlayControlVisibilityOptions {
  autoHideControls: boolean
}

export function useOverlayControlVisibility({ autoHideControls }: UseOverlayControlVisibilityOptions) {
  const [showControls, setShowControls] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (autoHideControls) {
      getCurrentWindow().setFocus().catch(() => {})
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }, [autoHideControls])

  useEffect(() => {
    if (!autoHideControls) return
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000)
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [autoHideControls])

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
    controlsVisible: !autoHideControls || showControls,
    resetHideTimer,
  }
}
