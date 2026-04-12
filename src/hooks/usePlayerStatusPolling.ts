import { useEffect, useRef } from 'react'
import * as tauri from '@/services/tauri'

type PlayerStatusSnapshot = Awaited<ReturnType<typeof tauri.playerGetStatus>>

const ACTIVE_POLL_MS = 120
const IDLE_POLL_MS = 320
const ERROR_POLL_MS = 500
const FULLSCREEN_POLL_EVERY = 3

export function usePlayerStatusPolling(
  onUpdate: (status: PlayerStatusSnapshot, fullscreen: boolean) => void,
) {
  const onUpdateRef = useRef(onUpdate)
  const lastFullscreenRef = useRef(false)
  const lastPlayingRef = useRef<boolean | null>(null)
  const fullscreenPollCounterRef = useRef(0)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | null = null

    const scheduleNextPoll = (delay: number) => {
      if (!active) return
      timer = setTimeout(() => {
        void poll()
      }, delay)
    }

    const poll = async () => {
      try {
        const status = await tauri.playerGetStatus()
        if (!active) return
        const shouldRefreshFullscreen =
          lastFullscreenRef.current
          || fullscreenPollCounterRef.current === 0
          || lastPlayingRef.current !== status.is_playing

        fullscreenPollCounterRef.current =
          (fullscreenPollCounterRef.current + 1) % FULLSCREEN_POLL_EVERY

        let fullscreen = lastFullscreenRef.current
        if (shouldRefreshFullscreen) {
          fullscreen = await tauri.playerIsFullscreen().catch(() => lastFullscreenRef.current)
          if (!active) return
          lastFullscreenRef.current = fullscreen
        }

        lastPlayingRef.current = status.is_playing
        if (!active) return
        onUpdateRef.current(status, fullscreen)
        scheduleNextPoll(status.is_playing || fullscreen ? ACTIVE_POLL_MS : IDLE_POLL_MS)
      } catch {
        scheduleNextPoll(ERROR_POLL_MS)
      }
    }

    void poll()

    return () => {
      active = false
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [])
}
