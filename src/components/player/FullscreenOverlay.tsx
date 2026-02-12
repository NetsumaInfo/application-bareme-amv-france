import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react'
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Minimize2, Maximize2, X,
  ChevronLeft, ChevronRight,
  Subtitles, Headphones,
} from 'lucide-react'
import * as tauri from '@/services/tauri'
import { formatTime } from '@/utils/formatters'
import { emit, listen } from '@tauri-apps/api/event'
import { appWindow } from '@tauri-apps/api/window'
import type { TrackItem } from '@/services/tauri'

interface ClipInfo {
  name: string
  index: number
  total: number
}

export default function FullscreenOverlay() {
  const [showControls, setShowControls] = useState(true)
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(true)
  const [clipInfo, setClipInfo] = useState<ClipInfo>({ name: '', index: 0, total: 0 })
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refocusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasFullscreenRef = useRef(false)

  // Track selection state
  const [subtitleTracks, setSubtitleTracks] = useState<TrackItem[]>([])
  const [audioTracks, setAudioTracks] = useState<TrackItem[]>([])
  const [currentSubtitleId, setCurrentSubtitleId] = useState<number | null>(null)
  const [currentAudioId, setCurrentAudioId] = useState<number | null>(null)
  const [subMenuOpen, setSubMenuOpen] = useState(false)
  const [audioMenuOpen, setAudioMenuOpen] = useState(false)
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  })
  const subRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLDivElement | null>(null)
  const compactControls = viewport.width < 760 || viewport.height < 430
  const tinyControls = viewport.width < 620 || viewport.height < 360

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    window.addEventListener('resize', updateViewport)
    updateViewport()
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  const refreshTracks = useCallback(() => {
    tauri.playerGetTracks().then((tracks) => {
      setSubtitleTracks(tracks.subtitle_tracks)
      setAudioTracks(tracks.audio_tracks)

      setCurrentAudioId((prev) => {
        if (tracks.audio_tracks.length === 0) return null
        if (prev !== null && tracks.audio_tracks.some((track) => track.id === prev)) {
          return prev
        }
        return tracks.audio_tracks[0].id
      })

      setCurrentSubtitleId((prev) => {
        if (prev === null) return null
        if (tracks.subtitle_tracks.some((track) => track.id === prev)) return prev
        return null
      })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    refreshTracks()
    const interval = setInterval(refreshTracks, 1200)
    return () => clearInterval(interval)
  }, [refreshTracks])

  // Close popups on outside click
  useEffect(() => {
    if (!subMenuOpen && !audioMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (subMenuOpen && subRef.current && !subRef.current.contains(e.target as Node)) {
        setSubMenuOpen(false)
      }
      if (audioMenuOpen && audioRef.current && !audioRef.current.contains(e.target as Node)) {
        setAudioMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [subMenuOpen, audioMenuOpen])

  // Poll player status
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
        if (fullscreen && !wasFullscreenRef.current) {
          setShowControls(true)
        }
        wasFullscreenRef.current = fullscreen
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
      refreshTracks()
    }).then(fn => { unlisten = fn })

    // Request initial clip info
    emit('overlay:request-clip-info').catch(() => {})

    return () => { if (unlisten) unlisten() }
  }, [refreshTracks])

  // Ensure overlay window keeps keyboard focus in fullscreen mode
  useEffect(() => {
    if (!isPlayerFullscreen) return
    appWindow.setFocus().catch(() => {})
    refocusTimerRef.current = setInterval(() => {
      appWindow.setFocus().catch(() => {})
    }, 1500)
    return () => {
      if (refocusTimerRef.current) clearInterval(refocusTimerRef.current)
    }
  }, [isPlayerFullscreen])

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    if (!isPlayerFullscreen) {
      return
    }
    setShowControls(true)
    appWindow.setFocus().catch(() => {})
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000)
  }, [isPlayerFullscreen])

  useEffect(() => {
    if (!isPlayerFullscreen) return
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000)
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [isPlayerFullscreen])

  const controlsVisible = !isPlayerFullscreen || showControls

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

  const handleToggleFullscreen = () => {
    tauri.playerSetFullscreen(!isPlayerFullscreen).catch(() => {})
    resetHideTimer()
  }

  const handleClosePlayerWindow = () => {
    tauri.playerSetFullscreen(false).catch(() => {})
    tauri.playerHide().catch(() => {})
    emit('overlay:close-player').catch(() => {})
  }

  const handleNextClip = () => {
    emit('overlay:next-clip').catch(() => {})
    resetHideTimer()
  }

  const handlePrevClip = () => {
    emit('overlay:prev-clip').catch(() => {})
    resetHideTimer()
  }

  const handleSelectSubtitle = async (id: number | null) => {
    try {
      await tauri.playerSetSubtitleTrack(id)
      setCurrentSubtitleId(id)
    } catch (e) {
      console.error('Failed to set subtitle track:', e)
    }
    setSubMenuOpen(false)
    resetHideTimer()
  }

  const handleSelectAudio = async (id: number) => {
    try {
      await tauri.playerSetAudioTrack(id)
      setCurrentAudioId(id)
    } catch (e) {
      console.error('Failed to set audio track:', e)
    }
    setAudioMenuOpen(false)
    resetHideTimer()
  }

  return (
    <div
      className="fixed inset-0"
      onMouseMove={resetHideTimer}
      onMouseEnter={resetHideTimer}
      onMouseDown={resetHideTimer}
      style={{ cursor: isPlayerFullscreen && !controlsVisible ? 'none' : 'default' }}
    >
      {/* Top gradient with clip info */}
      <div
        className={`absolute top-0 left-0 right-0 ${compactControls ? 'px-3 py-2' : 'px-6 py-4'} ${
          isPlayerFullscreen
            ? 'bg-gradient-to-b from-black/55 via-slate-950/25 to-transparent'
            : 'bg-slate-950/52 border-b border-white/10 backdrop-blur-[3px]'
        } transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`${compactControls ? 'text-base' : 'text-lg'} text-white font-medium drop-shadow-lg truncate`}>
              {clipInfo.name || 'Video'}
            </p>
            {clipInfo.total > 0 && (
              <p className={`${compactControls ? 'text-xs' : 'text-sm'} text-gray-300 drop-shadow`}>
                Clip {clipInfo.index + 1} / {clipInfo.total}
              </p>
            )}
          </div>
          <button
            onClick={handleClosePlayerWindow}
            className={`${compactControls ? 'p-1.5' : 'p-2'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0`}
            title="Fermer le lecteur"
          >
            <X size={compactControls ? 14 : 18} />
          </button>
        </div>
      </div>

      {/* Bottom control bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 ${compactControls ? 'px-3 pb-2 pt-10' : 'px-6 pb-4 pt-14'} ${
          isPlayerFullscreen
            ? 'bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent'
            : 'bg-gradient-to-t from-slate-950/88 via-slate-950/62 to-slate-950/15 border-t border-white/10 backdrop-blur-[3px]'
        } transition-all duration-300 ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Seek bar */}
        <div className={`flex items-center ${compactControls ? 'gap-2 mb-2' : 'gap-3 mb-4'}`}>
          <span className={`${compactControls ? 'text-xs w-10' : 'text-sm w-14'} text-white font-mono text-right select-none`}>
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className={`flex-1 ${compactControls ? 'h-1' : 'h-1.5'} bg-white/30 rounded-full appearance-none cursor-pointer accent-primary-500
              [&::-webkit-slider-thumb]:appearance-none ${compactControls ? '[&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3' : '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4'}
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500
              [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
            `}
          />
          <span className={`${compactControls ? 'text-xs w-10' : 'text-sm w-14'} text-white font-mono select-none`}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls row */}
        <div className={`flex items-center justify-between ${tinyControls ? 'gap-1' : 'gap-2'}`}>
          <div className={`flex items-center ${compactControls ? 'gap-1' : 'gap-2'}`}>
            {/* Previous clip */}
            <button
              onClick={handlePrevClip}
              className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-default`}
              disabled={clipInfo.index <= 0}
              title="Clip precedent (P)"
            >
              <ChevronLeft size={compactControls ? 18 : 24} />
            </button>

            {/* Seek -5s */}
            <button
              onClick={() => handleSeekRelative(-5)}
              className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors`}
              title="Reculer 5s"
            >
              <SkipBack size={compactControls ? 16 : 22} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={handleTogglePause}
              className={`${compactControls ? 'p-2 mx-0.5' : 'p-3.5 mx-1'} rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors`}
              title={isPlaying ? 'Pause (Espace)' : 'Lecture (Espace)'}
            >
              {isPlaying ? <Pause size={compactControls ? 20 : 28} /> : <Play size={compactControls ? 20 : 28} />}
            </button>

            {/* Seek +5s */}
            <button
              onClick={() => handleSeekRelative(5)}
              className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors`}
              title="Avancer 5s"
            >
              <SkipForward size={compactControls ? 16 : 22} />
            </button>

            {/* Next clip */}
            <button
              onClick={handleNextClip}
              className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-default`}
              disabled={clipInfo.total > 0 && clipInfo.index >= clipInfo.total - 1}
              title="Clip suivant (N)"
            >
              <ChevronRight size={compactControls ? 18 : 24} />
            </button>
          </div>

          <div className={`flex items-center ${compactControls ? 'gap-1' : 'gap-2'}`}>
            {/* Volume */}
            <button
              onClick={handleToggleMute}
              className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors`}
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted || volume === 0 ? <VolumeX size={compactControls ? 16 : 22} /> : <Volume2 size={compactControls ? 16 : 22} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleSetVolume}
              className={`${compactControls ? 'w-16 h-1' : 'w-28 h-1.5'} bg-white/30 rounded-full appearance-none cursor-pointer accent-primary-500
                [&::-webkit-slider-thumb]:appearance-none ${compactControls ? '[&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5' : '[&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5'}
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              `}
            />

            {/* Subtitles */}
            <div ref={subRef} className="relative">
              <button
                onClick={() => subtitleTracks.length > 0 && setSubMenuOpen(!subMenuOpen)}
                className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 transition-colors ${
                  subtitleTracks.length > 0
                    ? currentSubtitleId !== null
                      ? 'text-primary-400'
                      : 'text-white/80 hover:text-white'
                    : 'text-white/30 cursor-default'
                }`}
                title={subtitleTracks.length > 0 ? 'Sous-titres' : 'Pas de sous-titres'}
              >
                <Subtitles size={compactControls ? 16 : 22} />
              </button>
              {subMenuOpen && subtitleTracks.length > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[180px] bg-black/90 border border-white/20 rounded-lg shadow-xl py-1 z-50 backdrop-blur-sm">
                  <button
                    onClick={() => handleSelectSubtitle(null)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors ${
                      currentSubtitleId === null ? 'text-primary-400 font-medium' : 'text-white/80'
                    }`}
                  >
                    Pas de sous-titres
                  </button>
                  {subtitleTracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handleSelectSubtitle(track.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors ${
                        currentSubtitleId === track.id ? 'text-primary-400 font-medium' : 'text-white/80'
                      }`}
                    >
                      {track.title || track.lang || `Piste ${track.id}`}
                      {track.codec ? ` (${track.codec})` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Audio tracks */}
            <div ref={audioRef} className="relative">
              <button
                onClick={() => audioTracks.length > 1 && setAudioMenuOpen(!audioMenuOpen)}
                className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 transition-colors ${
                  audioTracks.length > 1
                    ? currentAudioId !== null && currentAudioId !== audioTracks[0]?.id
                      ? 'text-primary-400'
                      : 'text-white/80 hover:text-white'
                    : 'text-white/30 cursor-default'
                }`}
                title={audioTracks.length > 1 ? 'Pistes audio' : 'Audio unique'}
              >
                <Headphones size={compactControls ? 16 : 22} />
              </button>
              {audioMenuOpen && audioTracks.length > 1 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[180px] bg-black/90 border border-white/20 rounded-lg shadow-xl py-1 z-50 backdrop-blur-sm">
                  {audioTracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handleSelectAudio(track.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors ${
                        currentAudioId === track.id ? 'text-primary-400 font-medium' : 'text-white/80'
                      }`}
                    >
                      {track.title || track.lang || `Audio ${track.id}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen toggle */}
            <button
              onClick={isPlayerFullscreen ? handleExitFullscreen : handleToggleFullscreen}
              className={`${compactControls ? 'p-1.5 ml-1' : 'p-2.5 ml-2'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors`}
              title={isPlayerFullscreen ? 'Quitter le plein ecran (Echap)' : 'Plein ecran'}
            >
              {isPlayerFullscreen
                ? <Minimize2 size={compactControls ? 16 : 22} />
                : <Maximize2 size={compactControls ? 16 : 22} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
