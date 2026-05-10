import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import * as tauri from '@/services/tauri'
import { usePlayerStatusPolling } from '@/hooks/usePlayerStatusPolling'

const SNAP_SYNC_MS = 16
const IDLE_SYNC_MS = 70
const SNAP_WARMUP_MS = 450
const SNAP_EXTENSION_MS = 220

export function useOverlayPlayerStatus() {
  const [isOverlayActive, setIsOverlayActive] = useState(false)
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0)

  useEffect(() => {
    let active = true
    let unlisten: (() => void) | null = null
    const currentWindow = getCurrentWindow()

    currentWindow.isVisible()
      .then((visible) => {
        if (active) setIsOverlayActive(visible)
      })
      .catch(() => {})

    listen<boolean>('overlay:visibility', (event) => {
      setIsOverlayActive(Boolean(event.payload))
    })
      .then((off) => {
        unlisten = off
      })
      .catch(() => {})

    tauri.playerSyncOverlay().catch(() => {})

    return () => {
      active = false
      if (unlisten) unlisten()
    }
  }, [])

  useEffect(() => {
    if (!isOverlayActive) return

    let stopped = false
    let inFlight = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let snapUntil = performance.now() + SNAP_WARMUP_MS

    const scheduleNext = (delayMs: number) => {
      if (stopped) return
      timer = setTimeout(() => {
        void syncOverlay()
      }, delayMs)
    }

    const syncOverlay = () => {
      if (stopped || inFlight) return
      inFlight = true
      tauri.playerSyncOverlay()
        .then((changed) => {
          if (changed) {
            snapUntil = performance.now() + SNAP_EXTENSION_MS
          }
        })
        .catch(() => {})
        .finally(() => {
          inFlight = false
          const nextDelay = performance.now() < snapUntil ? SNAP_SYNC_MS : IDLE_SYNC_MS
          scheduleNext(nextDelay)
        })
    }

    syncOverlay()
    return () => {
      stopped = true
      if (timer) {
        window.clearTimeout(timer)
      }
    }
  }, [isOverlayActive])

  usePlayerStatusPolling((status, fullscreen) => {
    setIsPlaying(status.is_playing)
    setCurrentTime(status.current_time)
    setDuration(status.duration)
    setVolume(status.volume)
    setIsPlayerFullscreen(fullscreen)
  }, { enabled: isOverlayActive, ultraSnap: true })

  useEffect(() => {
    if (!isOverlayActive || !isPlayerFullscreen) return
    const currentWindow = getCurrentWindow()
    currentWindow.setFocus().catch(() => {})
    const refocusTimer = setInterval(() => {
      currentWindow.setFocus().catch(() => {})
    }, 1500)
    return () => clearInterval(refocusTimer)
  }, [isOverlayActive, isPlayerFullscreen])

  return {
    isOverlayActive,
    isPlayerFullscreen: isOverlayActive && isPlayerFullscreen,
    isPlaying: isOverlayActive && isPlaying,
    currentTime,
    duration,
    volume,
    setCurrentTime,
  }
}
