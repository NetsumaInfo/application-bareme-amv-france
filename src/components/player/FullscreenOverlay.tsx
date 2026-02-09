import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react'
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Minimize2,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import * as tauri from '@/services/tauri'
import { formatTime } from '@/utils/formatters'
import { emit, listen } from '@tauri-apps/api/event'
import { appWindow } from '@tauri-apps/api/window'

interface ClipInfo {
  name: string
  index: number
  total: number
}

export default function FullscreenOverlay() {
  const [showControls, setShowControls] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(true)
  const [clipInfo, setClipInfo] = useState<ClipInfo>({ name: '', index: 0, total: 0 })
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refocusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Poll player status
  useEffect(() => {
    const poll = async () => {
      try {
        const status = await tauri.playerGetStatus()
        setIsPlaying(status.is_playing)
        setCurrentTime(status.current_time)
        setDuration(status.duration)
      } catch {
        // Player not available
      }
    }
    const interval = setInterval(poll, 250)
    poll()
    return () => clearInterval(interval)
  }, [])

  // Listen for clip info from main window
  useEffect(() => {
    let unlisten: (() => void) | null = null
    listen<ClipInfo>('main:clip-changed', (event) => {
      setClipInfo(event.payload)
    }).then(fn => { unlisten = fn })

    // Request initial clip info
    emit('overlay:request-clip-info').catch(() => {})

    return () => { if (unlisten) unlisten() }
  }, [])

  // Ensure overlay window keeps keyboard focus in fullscreen mode
  useEffect(() => {
    appWindow.setFocus().catch(() => {})
    refocusTimerRef.current = setInterval(() => {
      appWindow.setFocus().catch(() => {})
    }, 1500)
    return () => {
      if (refocusTimerRef.current) clearInterval(refocusTimerRef.current)
    }
  }, [])

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    appWindow.setFocus().catch(() => {})
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  useEffect(() => {
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000)
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
        case 'Esc':
        case 'F11':
          e.preventDefault()
          e.stopPropagation()
          tauri.playerSetFullscreen(false).catch(() => {})
          break
        case ' ':
          e.preventDefault()
          e.stopPropagation()
          tauri.playerTogglePause().catch(() => {})
          resetHideTimer()
          break
        case 'ArrowRight':
          e.preventDefault()
          e.stopPropagation()
          tauri.playerSeekRelative(e.shiftKey ? 30 : 5).catch(() => {})
          resetHideTimer()
          break
        case 'ArrowLeft':
          e.preventDefault()
          e.stopPropagation()
          tauri.playerSeekRelative(e.shiftKey ? -30 : -5).catch(() => {})
          resetHideTimer()
          break
        case 'n':
        case 'N':
          e.preventDefault()
          e.stopPropagation()
          emit('overlay:next-clip').catch(() => {})
          resetHideTimer()
          break
        case 'p':
        case 'P':
          e.preventDefault()
          e.stopPropagation()
          emit('overlay:prev-clip').catch(() => {})
          resetHideTimer()
          break
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.key === 'F11') {
        e.preventDefault()
        e.stopPropagation()
        tauri.playerSetFullscreen(false).catch(() => {})
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)
    document.addEventListener('keyup', handleKeyUp, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
      document.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [resetHideTimer])

  const handleTogglePause = () => {
    tauri.playerTogglePause().catch(() => {})
    resetHideTimer()
  }

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const pos = Number(e.target.value)
    tauri.playerSeek(pos).catch(() => {})
    setCurrentTime(pos)
    resetHideTimer()
  }

  const handleSeekRelative = (offset: number) => {
    tauri.playerSeekRelative(offset).catch(() => {})
    resetHideTimer()
  }

  const handleSetVolume = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setVolume(v)
    setIsMuted(false)
    tauri.playerSetVolume(v).catch(() => {})
    resetHideTimer()
  }

  const handleToggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    tauri.playerSetVolume(next ? 0 : volume).catch(() => {})
    resetHideTimer()
  }

  const handleExitFullscreen = () => {
    tauri.playerSetFullscreen(false).catch(() => {})
  }

  const handleNextClip = () => {
    emit('overlay:next-clip').catch(() => {})
    resetHideTimer()
  }

  const handlePrevClip = () => {
    emit('overlay:prev-clip').catch(() => {})
    resetHideTimer()
  }

  return (
    <div
      className="fixed inset-0 bg-black/[0.01]"
      onMouseMove={resetHideTimer}
      onMouseEnter={resetHideTimer}
      onMouseDown={resetHideTimer}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {/* Top gradient with clip info */}
      <div
        className={`absolute top-0 left-0 right-0 px-6 py-4 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <p className="text-white text-lg font-medium drop-shadow-lg">
          {clipInfo.name || 'Vidéo'}
        </p>
        {clipInfo.total > 0 && (
          <p className="text-gray-300 text-sm drop-shadow">
            Clip {clipInfo.index + 1} / {clipInfo.total}
          </p>
        )}
      </div>

      {/* Bottom control bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-6 pb-5 pt-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Seek bar */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-white text-sm font-mono w-14 text-right select-none">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer accent-primary-500
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500
              [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-white text-sm font-mono w-14 select-none">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Previous clip */}
            <button
              onClick={handlePrevClip}
              className="p-2.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-default"
              disabled={clipInfo.index <= 0}
              title="Clip précédent (P)"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Seek -5s */}
            <button
              onClick={() => handleSeekRelative(-5)}
              className="p-2.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Reculer 5s (←)"
            >
              <SkipBack size={22} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={handleTogglePause}
              className="p-3.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors mx-1"
              title={isPlaying ? 'Pause (Espace)' : 'Lecture (Espace)'}
            >
              {isPlaying ? <Pause size={30} /> : <Play size={30} />}
            </button>

            {/* Seek +5s */}
            <button
              onClick={() => handleSeekRelative(5)}
              className="p-2.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Avancer 5s (→)"
            >
              <SkipForward size={22} />
            </button>

            {/* Next clip */}
            <button
              onClick={handleNextClip}
              className="p-2.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-default"
              disabled={clipInfo.total > 0 && clipInfo.index >= clipInfo.total - 1}
              title="Clip suivant (N)"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Volume */}
            <button
              onClick={handleToggleMute}
              className="p-2.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleSetVolume}
              className="w-28 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer accent-primary-500
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
            />

            {/* Exit fullscreen */}
            <button
              onClick={handleExitFullscreen}
              className="p-2.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors ml-2"
              title="Quitter le plein écran (Échap)"
            >
              <Minimize2 size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
