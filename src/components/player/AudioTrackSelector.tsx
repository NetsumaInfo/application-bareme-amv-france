import { useState, useRef, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Headphones } from 'lucide-react'
import { usePlayerStore } from '@/store/usePlayerStore'
import * as tauri from '@/services/tauri'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import { useZoomScale } from '@/hooks/useZoomScale'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function AudioTrackSelector() {
  const { t } = useI18n()
  const audioTracks = usePlayerStore((s) => s.audioTracks)
  const currentAudioId = usePlayerStore((s) => s.currentAudioId)
  const setCurrentAudioId = usePlayerStore((s) => s.setCurrentAudioId)
  const [open, setOpen] = useState(false)
  const MENU_WIDTH = 220
  const containerRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  // Hide the menu node until positioned; revealed imperatively once placed.
  const setMenuNode = useCallback((node: HTMLDivElement | null) => {
    menuRef.current = node
    if (node) node.style.visibility = 'hidden'
  }, [])

  const zoomScale = useZoomScale()

  // Write the position straight to the node before paint (like HoverTextTooltip),
  // so the menu is never painted at its default origin.
  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current
    const node = menuRef.current
    if (!button || !node) return

    const rect = button.getBoundingClientRect()
    const normalizedRect = {
      left: rect.left / zoomScale,
      right: rect.right / zoomScale,
      top: rect.top / zoomScale,
      bottom: rect.bottom / zoomScale,
      width: rect.width / zoomScale,
    }
    const width = MENU_WIDTH
    const viewportPadding = 8
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const menuHeight = node.offsetHeight || Math.min(320, Math.max(88, audioTracks.length * 30 + 8))
    const spaceBelow = viewportHeight - normalizedRect.bottom - viewportPadding
    const spaceAbove = normalizedRect.top - viewportPadding
    const openUpwards = spaceBelow < menuHeight && spaceAbove > spaceBelow
    const left = clamp(
      normalizedRect.left + normalizedRect.width / 2 - width / 2,
      viewportPadding,
      viewportWidth - width - viewportPadding,
    )
    const top = clamp(
      openUpwards ? normalizedRect.top - menuHeight - 8 : normalizedRect.bottom + 8,
      viewportPadding,
      viewportHeight - menuHeight - viewportPadding,
    )

    node.style.left = `${left}px`
    node.style.top = `${top}px`
    node.style.visibility = 'visible'
  }, [audioTracks.length, zoomScale])

  useLayoutEffect(() => {
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

  const hasTracks = audioTracks.length > 1
  const isActive = hasTracks && currentAudioId !== null && currentAudioId !== audioTracks[0]?.id

  const handleSelect = async (id: number) => {
    try {
      await tauri.playerSetAudioTrack(id)
      setCurrentAudioId(id)
    } catch (e) {
      console.error('Failed to set audio track:', e)
    }
    setOpen(false)
  }

  const menu = open && hasTracks
    ? createPortal(
      <div
        ref={setMenuNode}
        className="fixed min-w-[220px] bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-120"
        style={{ width: MENU_WIDTH }}
      >
        {audioTracks.map((track) => (
          <button
            key={track.id}
            type="button"
            onClick={() => handleSelect(track.id)}
            className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-800 transition-colors ${
              currentAudioId === track.id ? 'text-primary-400 font-medium' : 'text-gray-300'
            }`}
          >
            {track.title || track.lang || t('Audio {id}', { id: track.id })}
          </button>
        ))}
      </div>,
      document.body,
    )
    : null

  return (
    <div ref={containerRef} className="relative">
      <HoverTextTooltip text={hasTracks ? t('Pistes audio') : t('Audio unique')}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (!hasTracks) return
            setOpen(!open)
          }}
          aria-label={hasTracks ? t('Pistes audio') : t('Audio unique')}
          className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
            hasTracks
              ? isActive
                ? 'text-primary-400 hover:bg-white/20'
                : 'text-gray-400 hover:bg-white/20 hover:text-white'
              : 'text-gray-600 cursor-default'
          }`}
        >
          <Headphones size={14} />
        </button>
      </HoverTextTooltip>
      {menu}
    </div>
  )
}
