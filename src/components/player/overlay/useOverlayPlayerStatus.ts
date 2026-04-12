import { useEffect, useState } from 'react'
import { appWindow } from '@tauri-apps/api/window'
import * as tauri from '@/services/tauri'
import { usePlayerStatusPolling } from '@/hooks/usePlayerStatusPolling'

export function useOverlayPlayerStatus() {
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0)

  useEffect(() => {
    tauri.playerSyncOverlay().catch(() => {})
  }, [])

  usePlayerStatusPolling((status, fullscreen) => {
    setIsPlaying(status.is_playing)
    setCurrentTime(status.current_time)
    setDuration(status.duration)
    setVolume(status.volume)
    setIsPlayerFullscreen(fullscreen)
  })

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
    volume,
    setCurrentTime,
  }
}
