import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import { currentMonitor, getCurrentWindow } from '@tauri-apps/api/window'
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi'
import * as tauri from '@/services/tauri'
import { useWindowUiSettingsSync } from '@/hooks/useWindowUiSettingsSync'
import { formatPreciseTimecode } from '@/utils/formatters'
import { PlayerMenuContent } from '@/components/player/menu/PlayerMenuContent'

interface OpenPayload {
  x: number
  y: number
  clipName?: string | null
}

interface MenuState {
  isPlaying: boolean
  speed: number
  loopFile: boolean
  abA: number | null
  abB: number | null
  isPlayerFullscreen: boolean
  clipName: string
}

const DEFAULT_STATE: MenuState = {
  isPlaying: false,
  speed: 1,
  loopFile: false,
  abA: null,
  abB: null,
  isPlayerFullscreen: false,
  clipName: 'clip',
}

export default function PlayerContextMenuWindow() {
  useWindowUiSettingsSync()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<MenuState>(DEFAULT_STATE)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const pendingPos = useRef<{ x: number; y: number } | null>(null)

  const closeMenu = useCallback(() => {
    setOpen(false)
    emit('player-menu:visibility', false).catch(() => {})
    getCurrentWindow().hide().catch(() => {})
  }, [])

  // Listen for open requests broadcast from the player overlay.
  useEffect(() => {
    let unlisten: (() => void) | null = null
    listen<OpenPayload>('player-menu:open', async (event) => {
      const payload = event.payload
      const clipName = (payload.clipName || 'clip').trim() || 'clip'
      pendingPos.current = { x: payload.x, y: payload.y }

      const [status, loopState, fullscreen] = await Promise.all([
        tauri.playerGetStatus().catch(() => null),
        tauri.playerGetLoopState().catch(() => null),
        tauri.playerIsFullscreen().catch(() => false),
      ])

      setState({
        isPlaying: status?.is_playing ?? false,
        speed: status && Number.isFinite(status.speed) && status.speed > 0 ? status.speed : 1,
        loopFile: loopState?.loop_file ?? false,
        abA: loopState?.ab_a ?? null,
        abB: loopState?.ab_b ?? null,
        isPlayerFullscreen: fullscreen,
        clipName,
      })
      emit('player-menu:visibility', true).catch(() => {})
      setOpen(true)
    })
      .then((off) => {
        unlisten = off
      })
      .catch(() => {})
    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  // Size + position the window to the rendered content, then show it.
  useLayoutEffect(() => {
    if (!open) return
    const node = contentRef.current
    const pos = pendingPos.current
    if (!node || !pos) return

    let cancelled = false
    const place = async () => {
      const rect = node.getBoundingClientRect()
      const width = Math.ceil(rect.width)
      const height = Math.ceil(rect.height)
      const win = getCurrentWindow()
      try {
        await win.setSize(new LogicalSize(width, height))

        let x = pos.x
        let y = pos.y
        try {
          const monitor = await currentMonitor()
          if (monitor) {
            const scale = monitor.scaleFactor || 1
            const left = monitor.position.x / scale
            const top = monitor.position.y / scale
            const right = left + monitor.size.width / scale
            const bottom = top + monitor.size.height / scale
            if (x + width > right) x = right - width
            if (y + height > bottom) y = bottom - height
            if (x < left) x = left
            if (y < top) y = top
          }
        } catch {
          // monitor lookup failed — use raw cursor coords
        }

        await win.setPosition(new LogicalPosition(Math.round(x), Math.round(y)))
        if (cancelled) return
        await win.show()
        await win.setFocus()
      } catch {
        // window ops failed — ignore
      }
    }
    void place()
    return () => {
      cancelled = true
    }
  }, [open, state])

  // Close when the window loses focus (click elsewhere) or Escape is pressed.
  useEffect(() => {
    let unlisten: (() => void) | null = null
    getCurrentWindow()
      .onFocusChanged(({ payload: focused }) => {
        if (!focused) closeMenu()
      })
      .then((off) => {
        unlisten = off
      })
      .catch(() => {})
    return () => {
      if (unlisten) unlisten()
    }
  }, [closeMenu])

  const onEscape = useEffectEvent(() => closeMenu())

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Actions — run then close.
  const runAndClose = useCallback((action: () => void) => () => {
    action()
    closeMenu()
  }, [closeMenu])

  const handleScreenshot = useCallback(async (clipName: string) => {
    const status = await tauri.playerGetStatus().catch(() => null)
    const stamp = status ? formatPreciseTimecode(status.current_time).replace(/[:.]/g, '-') : 'frame'
    const safeName = clipName.replace(/[^\w-]+/g, '_')
    const path = await tauri.saveScreenshotDialog(`${safeName}-${stamp}.png`).catch(() => null)
    if (path) {
      await tauri.playerScreenshot(path).catch(() => {})
    }
  }, [])

  // Actions that keep the menu open (multi-step adjustments).
  const applySpeed = useCallback((value: number) => {
    setState((prev) => ({ ...prev, speed: value }))
    tauri.playerSetSpeed(value).catch(() => {})
  }, [])

  const toggleLoopFile = useCallback(() => {
    setState((prev) => {
      const next = !prev.loopFile
      tauri.playerSetLoopFile(next).catch(() => {})
      return { ...prev, loopFile: next }
    })
  }, [])

  const markLoopA = useCallback(async () => {
    const status = await tauri.playerGetStatus().catch(() => null)
    if (!status) return
    await tauri.playerAbLoopMarkA(status.current_time).catch(() => {})
    setState((prev) => ({ ...prev, abA: status.current_time }))
  }, [])

  const markLoopB = useCallback(async () => {
    const status = await tauri.playerGetStatus().catch(() => null)
    if (!status) return
    await tauri.playerAbLoopMarkB(status.current_time).catch(() => {})
    setState((prev) => ({ ...prev, abB: status.current_time }))
  }, [])

  const clearLoop = useCallback(() => {
    tauri.playerAbLoopClear().catch(() => {})
    setState((prev) => ({ ...prev, abA: null, abB: null }))
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 flex items-start justify-start bg-transparent">
      <PlayerMenuContent
        ref={contentRef}
        isPlaying={state.isPlaying}
        speed={state.speed}
        loopFile={state.loopFile}
        abA={state.abA}
        abB={state.abB}
        isPlayerFullscreen={state.isPlayerFullscreen}
        onTogglePause={runAndClose(() => {
          tauri.playerTogglePause().catch(() => {})
        })}
        onPrevClip={runAndClose(() => {
          emit('overlay:prev-clip').catch(() => {})
        })}
        onNextClip={runAndClose(() => {
          emit('overlay:next-clip').catch(() => {})
        })}
        onFrameBack={runAndClose(() => {
          tauri.playerFrameBackStep().catch(() => {})
        })}
        onFrameStep={runAndClose(() => {
          tauri.playerFrameStep().catch(() => {})
        })}
        onScreenshot={runAndClose(() => {
          handleScreenshot(state.clipName).catch(() => {})
        })}
        onToggleFullscreen={runAndClose(() => {
          tauri.playerSetFullscreen(!state.isPlayerFullscreen).catch(() => {})
        })}
        onApplySpeed={applySpeed}
        onToggleLoopFile={toggleLoopFile}
        onMarkLoopA={() => {
          markLoopA().catch(() => {})
        }}
        onMarkLoopB={() => {
          markLoopB().catch(() => {})
        }}
        onClearLoop={clearLoop}
      />
    </div>
  )
}
