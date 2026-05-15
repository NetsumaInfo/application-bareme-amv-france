import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Subtitles } from 'lucide-react'
import { usePlayerStore } from '@/store/usePlayerStore'
import * as tauri from '@/services/tauri'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import { useZoomScale } from '@/hooks/useZoomScale'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function SubtitleSelector() {
  const { t } = useI18n()
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

  const zoomScale = useZoomScale()

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const normalizedRect = {
      left: rect.left / zoomScale,
      right: rect.right / zoomScale,
      top: rect.top / zoomScale,
      bottom: rect.bottom / zoomScale,
      width: rect.width / zoomScale,
    }
    const width = 220
    const viewportPadding = 8
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const menuHeight = menuRef.current?.offsetHeight ?? Math.min(360, Math.max(96, (subtitleTracks.length + 1) * 30 + 8))
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

    setMenuStyle({ top, left, width })
  }, [subtitleTracks.length, zoomScale])

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
        className="fixed min-w-[220px] bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-120"
        style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
      >
        <button
          onClick={() => handleSelect(null)}
          className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-800 transition-colors ${
            currentSubtitleId === null ? 'text-primary-400 font-medium' : 'text-gray-300'
          }`}
        >
          {t('Pas de sous-titres')}
        </button>
        {subtitleTracks.map((track) => (
          <button
            key={track.id}
            onClick={() => handleSelect(track.id)}
            className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-800 transition-colors ${
              currentSubtitleId === track.id ? 'text-primary-400 font-medium' : 'text-gray-300'
            }`}
          >
            {track.title || track.lang || t('Piste {id}', { id: track.id })}
            {track.codec ? ` (${track.codec})` : ''}
          </button>
        ))}
      </div>,
      document.body,
    )
    : null

  return (
    <div ref={containerRef} className="relative">
      <HoverTextTooltip text={hasTracks ? t('Sous-titres') : t('Pas de sous-titres')}>
        <button
          ref={buttonRef}
          onClick={() => {
            if (!hasTracks) return
            if (!open) updateMenuPosition()
            setOpen(!open)
          }}
          aria-label={hasTracks ? t('Sous-titres') : t('Pas de sous-titres')}
          className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
            hasTracks
              ? isActive
                ? 'text-primary-400 hover:bg-white/20'
                : 'text-gray-400 hover:bg-white/20 hover:text-white'
              : 'text-gray-600 cursor-default'
          }`}
        >
          <Subtitles size={14} />
        </button>
      </HoverTextTooltip>
      {menu}
    </div>
  )
}
