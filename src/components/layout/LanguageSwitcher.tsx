import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import {
  APP_LANGUAGE_NATIVE_LABELS,
  APP_LANGUAGE_OPTIONS,
  APP_LANGUAGE_SHORT_LABELS,
  useI18n,
} from '@/i18n'
import { useUIStore } from '@/store/useUIStore'
import { LanguageFlagIcon } from '@/components/layout/LanguageFlagIcon'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useZoomScale } from '@/hooks/useZoomScale'

interface LanguageSwitcherProps {
  compact?: boolean
  align?: 'left' | 'right'
}

export function LanguageSwitcher({
  compact = false,
  align = 'right',
}: LanguageSwitcherProps) {
  const language = useUIStore((state) => state.language)
  const setLanguage = useUIStore((state) => state.setLanguage)
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const zoomScale = useZoomScale()
  const [menuPosition, setMenuPosition] = useState<{
    left: number
    top: number
    width: number
    placement: 'down' | 'up'
  }>({
    left: 0,
    top: 0,
    width: 240,
    placement: 'down',
  })

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const trigger = rootRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const width = compact ? 224 : Math.max(220, rect.width)
      // With CSS zoom, rect coords are zoomed but window.inner* are not → scale them.
      const viewportWidth = window.innerWidth * zoomScale
      const viewportHeight = window.innerHeight * zoomScale
      const estimatedHeight = 360
      const placeUp = rect.bottom + 12 + estimatedHeight > viewportHeight && rect.top > estimatedHeight * 0.45

      let left = align === 'right' ? rect.right - width : rect.left
      left = Math.max(12, Math.min(left, viewportWidth - width - 12))

      setMenuPosition({
        left,
        top: placeUp ? rect.top - 8 : rect.bottom + 8,
        width,
        placement: placeUp ? 'up' : 'down',
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    document.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      document.removeEventListener('scroll', updatePosition, true)
    }
  }, [align, compact, open, zoomScale])

  const currentNativeLabel = APP_LANGUAGE_NATIVE_LABELS[language]
  const currentOption = APP_LANGUAGE_OPTIONS.find((option) => option.value === language) ?? APP_LANGUAGE_OPTIONS[0]
  return (
    <div ref={rootRef} className="relative inline-flex items-center">
      <HoverTextTooltip text={`${t('Changer la langue')} · ${currentNativeLabel}`}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          data-open={open ? 'true' : 'false'}
          className={
            compact
              ? 'app-header-trigger gap-0.5 px-1.5'
              : 'inline-flex h-9 items-center gap-2.5 rounded-lg bg-black/18 px-3 text-xs text-gray-200 transition-colors ring-1 ring-inset ring-primary-400/10 hover:bg-white/[0.04] hover:text-white'
          }
          aria-label={`${t('Changer la langue')} · ${currentNativeLabel}`}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {compact ? (
            <span className="inline-flex min-w-[1.45rem] items-center justify-center text-[11px] font-semibold uppercase leading-none tracking-[0.06em] text-current">
              {APP_LANGUAGE_SHORT_LABELS[currentOption.value]}
            </span>
          ) : (
            <LanguageFlagIcon language={currentOption.value} size="md" />
          )}
          {!compact ? <span className="max-w-[8rem] truncate text-xs font-medium">{currentNativeLabel}</span> : null}
          <ChevronDown
            size={compact ? 10 : 12}
            className={`shrink-0 transition-transform ${compact ? 'app-header-trigger-chevron' : 'text-gray-500'} ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </HoverTextTooltip>

      {open ? createPortal(
        <div
          ref={menuRef}
          className="fixed z-[2000] rounded-xl bg-surface p-2 shadow-2xl ring-1 ring-inset ring-primary-400/10"
          style={{
            left: `${menuPosition.left}px`,
            top: `${menuPosition.top}px`,
            width: `${menuPosition.width}px`,
            transform: menuPosition.placement === 'up' ? 'translateY(-100%)' : undefined,
          }}
          role="menu"
        >
          <div className="mb-1 px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
            {t('Langue')}
          </div>
          <div className="space-y-1">
            {APP_LANGUAGE_OPTIONS.map((option) => {
              const selected = option.value === language
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setLanguage(option.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                    selected
                      ? 'bg-primary-600/15 text-white'
                      : 'text-gray-300 hover:bg-surface-light hover:text-white'
                  }`}
                  role="menuitemradio"
                  aria-checked={selected}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <LanguageFlagIcon language={option.value} size="md" />
                    <span className="block min-w-0 truncate text-xs font-semibold">{option.nativeLabel}</span>
                  </span>
                  {selected ? <Check size={14} className="shrink-0 text-primary-400" /> : null}
                </button>
              )
            })}
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  )
}
