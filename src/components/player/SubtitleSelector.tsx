import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Subtitles } from 'lucide-react'
import { usePlayerStore } from '@/store/usePlayerStore'
import * as tauri from '@/services/tauri'

export default function SubtitleSelector() {
  const { subtitleTracks, currentSubtitleId, setCurrentSubtitleId } = usePlayerStore()
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 220,
  })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const width = 220
    const viewportPadding = 8
    const left = Math.min(
      window.innerWidth - width - viewportPadding,
      Math.max(viewportPadding, rect.left + rect.width / 2 - width / 2),
    )
    const top = Math.min(window.innerHeight - viewportPadding, rect.bottom + 8)

    setMenuStyle({ top, left, width })
  }, [])

  useEffect(() => {
    if (!open) return
    updateMenuPosition()

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open, updateMenuPosition])

  const hasTracks = subtitleTracks.length > 0
  const isActive = currentSubtitleId !== null

  const handleSelect = async (id: number | null) => {
    try {
      await tauri.playerSetSubtitleTrack(id)
      setCurrentSubtitleId(id)
    } catch (e) {
      console.error('Failed to set subtitle track:', e)
    }
    setOpen(false)
  }

  const menu = open && hasTracks
    ? createPortal(
      <div
        ref={menuRef}
        className="fixed min-w-[220px] bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-[120]"
        style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
      >
        <button
          onClick={() => handleSelect(null)}
          className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-800 transition-colors ${
            currentSubtitleId === null ? 'text-primary-400 font-medium' : 'text-gray-300'
          }`}
        >
          Pas de sous-titres
        </button>
        {subtitleTracks.map((track) => (
          <button
            key={track.id}
            onClick={() => handleSelect(track.id)}
            className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-800 transition-colors ${
              currentSubtitleId === track.id ? 'text-primary-400 font-medium' : 'text-gray-300'
            }`}
          >
            {track.title || track.lang || `Piste ${track.id}`}
            {track.codec ? ` (${track.codec})` : ''}
          </button>
        ))}
      </div>,
      document.body,
    )
    : null

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          if (!hasTracks) return
          if (!open) updateMenuPosition()
          setOpen(!open)
        }}
        className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
          hasTracks
            ? isActive
              ? 'text-primary-400 hover:bg-white/20'
              : 'text-gray-400 hover:bg-white/20 hover:text-white'
            : 'text-gray-600 cursor-default'
        }`}
        title={hasTracks ? 'Sous-titres' : 'Pas de sous-titres'}
      >
        <Subtitles size={14} />
      </button>
      {menu}
    </div>
  )
}
