import { useEffect, useRef, useCallback } from 'react'
import { Film } from 'lucide-react'
import PlayerControls from './PlayerControls'
import { useProjectStore } from '@/store/useProjectStore'
import { usePlayerStore } from '@/store/usePlayerStore'
import * as tauri from '@/services/tauri'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'

interface VideoPlayerProps {
  compact?: boolean
}

export default function VideoPlayer({ compact }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { clips, currentClipIndex } = useProjectStore()
  const currentClip = clips[currentClipIndex]

  // Update geometry of mpv child window to match container position
  const updateGeometry = useCallback(() => {
    const el = containerRef.current
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

  // Track container position/size with ResizeObserver + window resize
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver(() => {
      updateGeometry()
    })
    observer.observe(el)
    window.addEventListener('resize', updateGeometry)
    updateGeometry()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateGeometry)
    }
  }, [updateGeometry])

  // Show/load/hide mpv window based on current clip
  useEffect(() => {
    if (!currentClip?.filePath) {
      tauri.playerHide().catch(() => {})
      return () => {}
    }

    // Check if file is already loaded (avoids restart on interface switch)
    const { isLoaded, currentFilePath } = usePlayerStore.getState()
    if (isLoaded && currentFilePath === currentClip.filePath) {
      // Already loaded - just show and position
      tauri.playerShow().catch(() => {})
      updateGeometry()
    } else {
      // New file - load it
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
      if (!usePlayerStore.getState().isFullscreen) {
        tauri.playerHide().catch(() => {})
      }
    }
  }, [currentClip?.filePath, updateGeometry])

  // Periodic geometry refresh for window drag/move tracking
  useEffect(() => {
    if (!currentClip) return
    const timer = setInterval(updateGeometry, 200)
    return () => clearInterval(timer)
  }, [currentClip, updateGeometry])

  return (
    <div className="flex flex-col h-full gap-1">
      {/* Video area - mpv child window renders over this area */}
      <div
        ref={containerRef}
        className={`relative bg-black overflow-hidden flex items-center justify-center ${
          compact ? 'aspect-video' : 'flex-1 min-h-0'
        }`}
      >
        {!currentClip && (
          <div className="text-center p-3">
            <Film size={compact ? 18 : 24} className="mx-auto mb-1.5 text-gray-600" />
            <p className="text-gray-500 text-[11px]">Sélectionnez un clip</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <PlayerControls compact={compact} />

      {/* Clip info (non-compact only) */}
      {currentClip && !compact && (
        <div className="text-center px-2 pb-0.5">
          <p className="text-[11px] text-gray-300 font-medium truncate">
            {getClipPrimaryLabel(currentClip)}
          </p>
          {getClipSecondaryLabel(currentClip) && (
            <p className="text-[9px] text-primary-400 truncate">{getClipSecondaryLabel(currentClip)}</p>
          )}
        </div>
      )}
    </div>
  )
}
