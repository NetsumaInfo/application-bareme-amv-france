import { useEffect, useRef, useState } from 'react'
import { appWindow } from '@tauri-apps/api/window'
import * as tauri from '@/services/tauri'

export function useOverlayPlayerStatus() {
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const wasFullscreenRef = useRef(false)

  useEffect(() => {
    const timer = setInterval(() => {
      tauri.playerSyncOverlay().catch(() => {})
    }, 120)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const poll = async () => {
      try {
        const [status, fullscreen] = await Promise.all([
          tauri.playerGetStatus(),
          tauri.playerIsFullscreen().catch(() => false),
        ])
        setIsPlaying(status.is_playing)
        setCurrentTime(status.current_time)
        setDuration(status.duration)
        setIsPlayerFullscreen(fullscreen)
        wasFullscreenRef.current = fullscreen
      } catch {
        // Player not available
      }
    }
    const interval = setInterval(poll, 250)
    poll()
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isPlayerFullscreen) return
    appWindow.setFocus().catch(() => {})
    const refocusTimer = setInterval(() => {
      appWindow.setFocus().catch(() => {})
    }, 1500)
    return () => clearInterval(refocusTimer)
  }, [isPlayerFullscreen])

  return {
    isPlayerFullscreen,
    isPlaying,
    currentTime,
    duration,
    setCurrentTime,
  }
}
