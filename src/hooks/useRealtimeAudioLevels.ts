import { useEffect, useState } from 'react'
import * as tauri from '@/services/tauri'

const AUDIO_LEVEL_POLL_MS = 16
const DB_DELTA_THRESHOLD = 0.03

const DEFAULT_AUDIO_LEVELS: tauri.AudioLevels = {
  left_db: -90,
  right_db: -90,
  overall_db: -90,
  available: false,
}

const listeners = new Set<(levels: tauri.AudioLevels) => void>()
let currentLevels: tauri.AudioLevels = DEFAULT_AUDIO_LEVELS
let pollTimer: ReturnType<typeof setInterval> | null = null
let pollInFlight = false

function hasLevelsChanged(nextLevels: tauri.AudioLevels) {
  return (
    currentLevels.available !== nextLevels.available
    || Math.abs(currentLevels.left_db - nextLevels.left_db) >= DB_DELTA_THRESHOLD
    || Math.abs(currentLevels.right_db - nextLevels.right_db) >= DB_DELTA_THRESHOLD
    || Math.abs(currentLevels.overall_db - nextLevels.overall_db) >= DB_DELTA_THRESHOLD
  )
}

function notifyListeners(levels: tauri.AudioLevels) {
  for (const listener of listeners) {
    listener(levels)
  }
}

async function pollAudioLevels() {
  if (pollInFlight) return
  pollInFlight = true

  try {
    const nextLevels = await tauri.playerGetAudioLevels()
    if (!hasLevelsChanged(nextLevels)) return

    currentLevels = nextLevels
    notifyListeners(nextLevels)
  } catch {
    // Ignore polling failures to keep the meter lightweight.
  } finally {
    pollInFlight = false
  }
}

function ensurePollingStarted() {
  if (pollTimer || listeners.size === 0) return
  void pollAudioLevels()
  pollTimer = setInterval(() => {
    void pollAudioLevels()
  }, AUDIO_LEVEL_POLL_MS)
}

function stopPollingIfIdle() {
  if (listeners.size > 0 || !pollTimer) return
  clearInterval(pollTimer)
  pollTimer = null
  pollInFlight = false
}

export function useRealtimeAudioLevels(enabled: boolean) {
  const [levels, setLevels] = useState<tauri.AudioLevels>(currentLevels)

  useEffect(() => {
    if (!enabled) return

    const handleLevels = (nextLevels: tauri.AudioLevels) => {
      setLevels(nextLevels)
    }

    listeners.add(handleLevels)
    handleLevels(currentLevels)
    ensurePollingStarted()

    return () => {
      listeners.delete(handleLevels)
      stopPollingIfIdle()
    }
  }, [enabled])

  return enabled ? levels : DEFAULT_AUDIO_LEVELS
}
