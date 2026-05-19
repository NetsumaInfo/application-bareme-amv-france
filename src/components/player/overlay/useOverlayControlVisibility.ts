import { useCallback, useEffect, useRef, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { OVERLAY_AUTOHIDE_MS } from '@/components/player/overlay/overlayConstants'

interface UseOverlayControlVisibilityOptions {
  autoHideControls: boolean
}

export function useOverlayControlVisibility({ autoHideControls }: UseOverlayControlVisibilityOptions) {
  const [showControls, setShowControls] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pinnedRef = useRef(false)

  const clearTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const scheduleHide = useCallback(() => {
    clearTimer()
    if (!autoHideControls || pinnedRef.current) return
    hideTimerRef.current = setTimeout(() => setShowControls(false), OVERLAY_AUTOHIDE_MS)
  }, [autoHideControls])

  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (autoHideControls) {
      getCurrentWindow().setFocus().catch(() => {})
    }
    scheduleHide()
  }, [autoHideControls, scheduleHide])

  const pinControls = useCallback(() => {
    pinnedRef.current = true
    setShowControls(true)
    clearTimer()
  }, [])

  const unpinControls = useCallback(() => {
    pinnedRef.current = false
    scheduleHide()
  }, [scheduleHide])

  useEffect(() => {
    if (!autoHideControls) return
    scheduleHide()
    return clearTimer
  }, [autoHideControls, scheduleHide])

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
    pinControls,
    unpinControls,
  }
}
