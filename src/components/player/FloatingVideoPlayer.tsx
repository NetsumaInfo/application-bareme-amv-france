import React, { useEffect, useRef, useCallback, useState } from 'react'
import { Play, Pause, SkipForward, Volume2, VolumeX, X } from 'lucide-react'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useProjectStore } from '@/store/useProjectStore'
import { usePlayer } from '@/hooks/usePlayer'
import * as tauri from '@/services/tauri'

interface FloatingVideoPlayerProps {
  onClose: () => void
}

export function FloatingVideoPlayer({ onClose }: FloatingVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoAreaRef = useRef<HTMLDivElement | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null)

  const [position, setPosition] = useState({
    left: typeof window !== 'undefined' ? window.innerWidth - 340 : 0,
    top: typeof window !== 'undefined' ? window.innerHeight - 260 : 0,
  })

  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const { isPlaying, muted, togglePause, seekRelative, setMuted } = usePlayer()
  const clips = useProjectStore((state) => state.clips)
  const currentClipIndex = useProjectStore((state) => state.currentClipIndex)
  const currentClip = clips[currentClipIndex]

  const updateGeometry = useCallback(() => {
    const el = videoAreaRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const x = Math.round(rect.left * dpr)
    const y = Math.round(rect.top * dpr)
    const w = Math.round(rect.width * dpr)
    const h = Math.round(rect.height * dpr)

    if (w > 0 && h > 0) {
      tauri.playerSetGeometry(x, y, w, h).catch(() => {})
    }
  }, [])

  // Geometry tracking
  useEffect(() => {
    const el = videoAreaRef.current
    if (!el) return

    const observer = new ResizeObserver(() => updateGeometry())
    observer.observe(el)
    window.addEventListener('resize', updateGeometry)
    updateGeometry()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateGeometry)
    }
  }, [updateGeometry])

  // Periodic geometry refresh
  useEffect(() => {
    if (!currentClip) return
    const timer = setInterval(updateGeometry, 200)
    return () => clearInterval(timer)
  }, [currentClip, updateGeometry])

  // Show/load mpv window
  useEffect(() => {
    if (!currentClip?.filePath) {
      tauri.playerHide().catch(() => {})
      return () => {}
    }

    const { isLoaded, currentFilePath } = usePlayerStore.getState()
    if (isLoaded && currentFilePath === currentClip.filePath) {
      tauri.playerShow().catch(() => {})
      updateGeometry()
    } else {
      usePlayerStore.getState().setLoaded(false)
      tauri.playerLoad(currentClip.filePath)
        .then(() => {
          usePlayerStore.getState().setLoaded(true, currentClip.filePath)
          tauri.playerShow().catch(() => {})
          tauri.playerPlay().catch(() => {})
          setTimeout(updateGeometry, 50)
        })
        .catch(console.error)
    }

    return () => {
      tauri.playerHide().catch(() => {})
    }
  }, [currentClip?.filePath, updateGeometry])

  // Update geometry when position changes (drag)
  useEffect(() => {
    updateGeometry()
  }, [position.left, position.top, updateGeometry])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    dragStartRef.current = {
      x: position.left,
      y: position.top,
      startX: e.clientX,
      startY: e.clientY,
    }
    setIsDragging(true)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartRef.current) return

    const deltaX = e.clientX - dragStartRef.current.startX
    const deltaY = e.clientY - dragStartRef.current.startY

    setPosition({
      left: dragStartRef.current.x + deltaX,
      top: dragStartRef.current.y + deltaY,
    })
  }, [])

  const handleMouseUp = useCallback(() => {
    dragStartRef.current = null
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleClose = () => {
    tauri.playerHide().catch(() => {})
    onClose()
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: '320px',
        zIndex: 50,
      }}
      className="flex flex-col rounded-lg border border-gray-700 bg-black shadow-2xl overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Header Bar - Draggable */}
      <div
        onMouseDown={handleMouseDown}
        className={`flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 px-3 py-1.5 cursor-move select-none ${
          isDragging ? 'opacity-100' : 'opacity-90 hover:opacity-100'
        }`}
      >
        <span className="text-[10px] font-medium text-gray-400">
          {currentClip?.displayName || currentClip?.fileName || 'Vidéo'}
        </span>
        {isHovering && (
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-4 h-4 rounded hover:bg-gray-700 transition-colors"
            title="Fermer"
          >
            <X size={12} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Video Container - mpv renders here */}
      <div
        ref={videoAreaRef}
        className="bg-black"
        style={{ width: '320px', height: '180px' }}
      />

      {/* Mini Controls */}
      <div className="flex items-center justify-center gap-1 bg-gray-900/90 px-2 py-1.5">
        <button
          onClick={togglePause}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
          title={isPlaying ? 'Pause' : 'Lecture'}
        >
          {isPlaying ? (
            <Pause size={14} className="text-gray-300" />
          ) : (
            <Play size={14} className="text-gray-300" />
          )}
        </button>

        <button
          onClick={() => seekRelative(5)}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
          title="Avancer 5s"
        >
          <SkipForward size={14} className="text-gray-300" />
        </button>

        <button
          onClick={() => setMuted(!muted)}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
          title={muted ? 'Activer le son' : 'Couper le son'}
        >
          {muted ? (
            <VolumeX size={14} className="text-gray-300" />
          ) : (
            <Volume2 size={14} className="text-gray-300" />
          )}
        </button>
      </div>
    </div>
  )
}
