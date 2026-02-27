import { useCallback, useEffect, useMemo, useRef, useState, type Ref } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { CATEGORY_COLOR_PRESETS, sanitizeColor, withAlpha } from '@/utils/colors'
import {
  COLOR_MEMORY_KEYS,
  readStoredColor,
  readStoredColorList,
  writeStoredColor,
  writeStoredColorList,
} from '@/utils/colorPickerStorage'

interface ColorSwatchPickerProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
  title?: string
  triggerSize?: 'md' | 'sm'
  presets?: string[]
  memoryKey?: string
  maxRemembered?: number
  triggerRef?: Ref<HTMLButtonElement>
}

interface HSVColor {
  h: number
  s: number
  v: number
}

const FALLBACK_MEMORY_KEY = COLOR_MEMORY_KEYS.recentGlobal
const FAVORITES_MEMORY_KEY = COLOR_MEMORY_KEYS.favoritesGlobal
const DEFAULT_COLOR_MEMORY_KEY = COLOR_MEMORY_KEYS.defaultColor

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hexToRgb(hex: string) {
  const normalized = sanitizeColor(hex).replace('#', '')
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function rgbToHsv(r: number, g: number, b: number): HSVColor {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0

  if (delta !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6)
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2)
    else h = 60 * ((rn - gn) / delta + 4)
  }
  if (h < 0) h += 360

  return {
    h,
    s: max === 0 ? 0 : delta / max,
    v: max,
  }
}

function hsvToRgb(h: number, s: number, v: number) {
  const hue = ((h % 360) + 360) % 360
  const c = v * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = v - c
  let rn = 0
  let gn = 0
  let bn = 0

  if (hue < 60) {
    rn = c
    gn = x
  } else if (hue < 120) {
    rn = x
    gn = c
  } else if (hue < 180) {
    gn = c
    bn = x
  } else if (hue < 240) {
    gn = x
    bn = c
  } else if (hue < 300) {
    rn = x
    bn = c
  } else {
    rn = c
    bn = x
  }

  return {
    r: (rn + m) * 255,
    g: (gn + m) * 255,
    b: (bn + m) * 255,
  }
}

function hexToHsv(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHsv(r, g, b)
}

function hsvToHex(h: number, s: number, v: number) {
  const { r, g, b } = hsvToRgb(h, s, v)
  return rgbToHex(r, g, b)
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return
  if (typeof ref === 'function') {
    ref(value)
    return
  }
  const objectRef = ref as { current: T | null }
  objectRef.current = value
}

export function ColorSwatchPicker({
  value,
  onChange,
  disabled = false,
  title,
  triggerSize = 'md',
  presets = CATEGORY_COLOR_PRESETS,
  memoryKey = FALLBACK_MEMORY_KEY,
  maxRemembered = 10,
  triggerRef,
}: ColorSwatchPickerProps) {
  const [open, setOpen] = useState(false)
  const normalizedValue = sanitizeColor(value)
  const [draftHex, setDraftHex] = useState(normalizedValue)
  const [hsv, setHsv] = useState<HSVColor>(() => hexToHsv(normalizedValue))
  const [openBaseColor, setOpenBaseColor] = useState(normalizedValue)
  const [rememberedColors, setRememberedColors] = useState<string[]>(() => readStoredColorList(memoryKey))
  const [favoriteColors, setFavoriteColors] = useState<string[]>(() => readStoredColorList(FAVORITES_MEMORY_KEY))
  const [defaultColor, setDefaultColor] = useState<string | null>(() => readStoredColor(DEFAULT_COLOR_MEMORY_KEY))
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; color: string } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contextMenuRef = useRef<HTMLDivElement | null>(null)
  const pickerRef = useRef<HTMLDivElement | null>(null)
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null)
  const svAreaRef = useRef<HTMLDivElement | null>(null)
  const hueAreaRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<'sv' | 'hue' | null>(null)
  const [pickerStyle, setPickerStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 280,
  })

  const displayColor = useMemo(() => hsvToHex(hsv.h, hsv.s, hsv.v), [hsv])

  const rememberColor = useCallback(
    (rawColor: string) => {
      const next = sanitizeColor(rawColor)
      setRememberedColors((prev) => {
        const unique = [next, ...prev.filter((entry) => entry.toLowerCase() !== next.toLowerCase())]
        const clipped = unique.slice(0, Math.max(1, maxRemembered))
        writeStoredColorList(memoryKey, clipped)
        return clipped
      })
    },
    [maxRemembered, memoryKey],
  )

  const setFavorites = useCallback((colors: string[]) => {
    const cleaned = colors
      .map((entry) => sanitizeColor(entry, ''))
      .filter((entry) => entry.length > 0)
      .slice(0, Math.max(1, maxRemembered))
    setFavoriteColors(cleaned)
    writeStoredColorList(FAVORITES_MEMORY_KEY, cleaned)
  }, [maxRemembered])

  const addFavorite = useCallback((color: string) => {
    const normalized = sanitizeColor(color)
    setFavoriteColors((prev) => {
      const next = [normalized, ...prev.filter((entry) => entry.toLowerCase() !== normalized.toLowerCase())]
        .slice(0, Math.max(1, maxRemembered))
      writeStoredColorList(FAVORITES_MEMORY_KEY, next)
      return next
    })
  }, [maxRemembered])

  const removeFavorite = useCallback((color: string) => {
    const normalized = sanitizeColor(color)
    setFavoriteColors((prev) => {
      const next = prev.filter((entry) => entry.toLowerCase() !== normalized.toLowerCase())
      writeStoredColorList(FAVORITES_MEMORY_KEY, next)
      return next
    })
  }, [])

  const saveDefaultColor = useCallback((color: string | null) => {
    const normalized = color ? sanitizeColor(color) : null
    setDefaultColor(normalized)
    writeStoredColor(DEFAULT_COLOR_MEMORY_KEY, normalized)
  }, [])

  const commitHex = useCallback(
    (rawColor: string, remember = false) => {
      const next = sanitizeColor(rawColor, normalizedValue)
      const nextHsv = hexToHsv(next)
      setHsv(nextHsv)
      setDraftHex(next)
      onChange(next)
      if (remember) rememberColor(next)
    },
    [normalizedValue, onChange, rememberColor],
  )

  const commitHsv = useCallback(
    (next: HSVColor) => {
      const clamped = {
        h: clamp(next.h, 0, 360),
        s: clamp(next.s, 0, 1),
        v: clamp(next.v, 0, 1),
      }
      const hex = hsvToHex(clamped.h, clamped.s, clamped.v)
      setHsv(clamped)
      setDraftHex(hex)
      onChange(hex)
    },
    [onChange],
  )

  const applyFromSvPointer = useCallback(
    (clientX: number, clientY: number) => {
      const area = svAreaRef.current
      if (!area) return
      const rect = area.getBoundingClientRect()
      const relX = clamp(clientX - rect.left, 0, rect.width)
      const relY = clamp(clientY - rect.top, 0, rect.height)
      const nextS = rect.width > 0 ? relX / rect.width : hsv.s
      const nextV = rect.height > 0 ? 1 - relY / rect.height : hsv.v
      commitHsv({ ...hsv, s: nextS, v: nextV })
    },
    [commitHsv, hsv],
  )

  const applyFromHuePointer = useCallback(
    (clientX: number) => {
      const area = hueAreaRef.current
      if (!area) return
      const rect = area.getBoundingClientRect()
      const relX = clamp(clientX - rect.left, 0, rect.width)
      const nextH = rect.width > 0 ? (relX / rect.width) * 360 : hsv.h
      commitHsv({ ...hsv, h: nextH })
    },
    [commitHsv, hsv],
  )

  const closePicker = useCallback(() => {
    if (sanitizeColor(displayColor) !== sanitizeColor(openBaseColor)) {
      rememberColor(displayColor)
    }
    setContextMenu(null)
    setOpen(false)
  }, [displayColor, openBaseColor, rememberColor])

  const setTriggerButtonNode = useCallback((node: HTMLButtonElement | null) => {
    triggerButtonRef.current = node
    assignRef(triggerRef, node)
  }, [triggerRef])

  const updatePickerPosition = useCallback(() => {
    const trigger = triggerButtonRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const width = 280
    const viewportPadding = 8
    const measuredHeight = pickerRef.current?.offsetHeight ?? 360
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
    const spaceAbove = rect.top - viewportPadding
    const openUpwards = spaceBelow < measuredHeight && spaceAbove > spaceBelow

    const rawTop = openUpwards ? (rect.top - measuredHeight - 8) : (rect.bottom + 8)
    const top = clamp(rawTop, viewportPadding, window.innerHeight - measuredHeight - viewportPadding)
    const left = clamp(rect.left, viewportPadding, window.innerWidth - width - viewportPadding)

    setPickerStyle({ top, left, width })
  }, [])

  useEffect(() => {
    if (!open) return
    const onOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current?.contains(target)) return
      if (pickerRef.current?.contains(target)) return
      if (contextMenuRef.current?.contains(target)) return
      if (!containerRef.current) return
      closePicker()
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [closePicker, open])

  useEffect(() => {
    if (!open) return
    updatePickerPosition()

    const animationFrame = window.requestAnimationFrame(() => {
      updatePickerPosition()
    })
    window.addEventListener('resize', updatePickerPosition)
    window.addEventListener('scroll', updatePickerPosition, true)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', updatePickerPosition)
      window.removeEventListener('scroll', updatePickerPosition, true)
    }
  }, [open, updatePickerPosition])

  useEffect(() => {
    if (!open) return
    const onMove = (event: MouseEvent) => {
      if (dragStateRef.current === 'sv') applyFromSvPointer(event.clientX, event.clientY)
      if (dragStateRef.current === 'hue') applyFromHuePointer(event.clientX)
    }
    const onUp = () => {
      dragStateRef.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [applyFromHuePointer, applyFromSvPointer, open])

  useEffect(() => {
    if (!contextMenu) return
    const onPointerDownOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (contextMenuRef.current?.contains(target)) return
      setContextMenu(null)
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContextMenu(null)
    }
    const onViewportChange = () => setContextMenu(null)

    document.addEventListener('mousedown', onPointerDownOutside)
    window.addEventListener('keydown', onEscape)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)

    return () => {
      document.removeEventListener('mousedown', onPointerDownOutside)
      window.removeEventListener('keydown', onEscape)
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [contextMenu])

  const togglePicker = () => {
    if (open) {
      closePicker()
      return
    }
    setHsv(hexToHsv(normalizedValue))
    setDraftHex(normalizedValue)
    setOpenBaseColor(normalizedValue)
    setOpen(true)
  }

  const openColorContextMenu = (event: React.MouseEvent, color: string) => {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      color: sanitizeColor(color),
    })
  }

  const contextColor = contextMenu?.color ? sanitizeColor(contextMenu.color) : null
  const contextIsFavorite = contextColor
    ? favoriteColors.some((entry) => entry.toLowerCase() === contextColor.toLowerCase())
    : false

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={setTriggerButtonNode}
        type="button"
        disabled={disabled}
        onClick={togglePicker}
        onContextMenu={(event) => openColorContextMenu(event, normalizedValue)}
        className={`${triggerSize === 'sm' ? 'h-[28px] px-2 gap-1.5' : 'h-8 px-2 gap-1.5'} rounded border border-gray-700 bg-surface-dark/80 hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center`}
        title={title}
      >
        <span
          className={`${triggerSize === 'sm' ? 'w-4 h-4' : 'w-4 h-4'} inline-block rounded border border-white/20`}
          style={{ backgroundColor: normalizedValue }}
        />
        <ChevronDown size={triggerSize === 'sm' ? 11 : 12} className="text-gray-400" />
      </button>

      {open && !disabled && createPortal(
        <div
          ref={pickerRef}
          className="fixed rounded-xl border border-gray-700 bg-surface-dark shadow-2xl z-[140] p-2.5"
          style={{ width: pickerStyle.width, top: pickerStyle.top, left: pickerStyle.left }}
        >
          <div
            ref={svAreaRef}
            onMouseDown={(event) => {
              event.preventDefault()
              dragStateRef.current = 'sv'
              applyFromSvPointer(event.clientX, event.clientY)
            }}
            className="relative rounded-lg border border-gray-700 overflow-hidden cursor-crosshair"
            style={{ height: 140, backgroundColor: `hsl(${hsv.h.toFixed(0)}, 100%, 50%)` }}
          >
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #ffffff, rgba(255,255,255,0))' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000000, rgba(0,0,0,0))' }} />
            <div
              className="absolute w-3 h-3 rounded-full border-2 border-white pointer-events-none shadow"
              style={{
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: displayColor,
              }}
            />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-4 w-14 rounded-full border border-white/20 shrink-0"
              style={{ backgroundColor: displayColor }}
              title={displayColor}
              onContextMenu={(event) => openColorContextMenu(event, displayColor)}
            />
            <div className="flex-1">
              <div
                ref={hueAreaRef}
                onMouseDown={(event) => {
                  event.preventDefault()
                  dragStateRef.current = 'hue'
                  applyFromHuePointer(event.clientX)
                }}
                className="relative h-3 rounded-full border border-gray-700 overflow-hidden cursor-pointer"
                style={{
                  background:
                    'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                }}
              >
                <div
                  className="absolute top-1/2 w-3 h-3 rounded-full border-2 border-white pointer-events-none"
                  style={{
                    left: `${(hsv.h / 360) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: displayColor,
                  }}
                />
              </div>
            </div>
          </div>

          {defaultColor && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Par défaut</div>
              <button
                type="button"
                onClick={() => commitHex(defaultColor, true)}
                onContextMenu={(event) => openColorContextMenu(event, defaultColor)}
                className="h-6 w-full rounded border border-gray-700 hover:border-gray-500"
                style={{ backgroundColor: defaultColor }}
                title={`${defaultColor} (couleur par défaut)`}
              />
            </div>
          )}

          {favoriteColors.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Favoris</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 6 }}>
                {favoriteColors.map((preset) => {
                  const color = sanitizeColor(preset)
                  const active = color === normalizedValue
                  const isDefault = defaultColor?.toLowerCase() === color.toLowerCase()
                  return (
                    <button
                      key={`favorite-${color}`}
                      type="button"
                      onClick={() => commitHex(color, true)}
                      onContextMenu={(event) => openColorContextMenu(event, color)}
                      className={`h-5 rounded border transition-colors relative ${
                        active ? 'border-white' : 'border-gray-700 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: color }}
                      title={isDefault ? `${color} (défaut)` : color}
                    >
                      {isDefault && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary-400 border border-surface-dark" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {rememberedColors.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Récents</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 6 }}>
                {rememberedColors.map((preset) => {
                  const color = sanitizeColor(preset)
                  const active = color === normalizedValue
                  return (
                    <button
                      key={`recent-${color}`}
                      type="button"
                      onClick={() => commitHex(color, true)}
                      onContextMenu={(event) => openColorContextMenu(event, color)}
                      className={`h-5 rounded border transition-colors ${
                        active ? 'border-white' : 'border-gray-700 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-2">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 6 }}>
              {presets.map((preset) => {
                const color = sanitizeColor(preset)
                const active = color === normalizedValue
                return (
                <button
                  key={color}
                  type="button"
                  onClick={() => commitHex(color, true)}
                  onContextMenu={(event) => openColorContextMenu(event, color)}
                  className={`h-5 rounded border transition-colors ${
                    active ? 'border-white' : 'border-gray-700 hover:border-gray-500'
                  }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                )
              })}
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">HEX</div>
            <div className="flex items-center gap-1.5">
              <input
                value={draftHex}
                onChange={(event) => setDraftHex(event.target.value)}
                onBlur={() => commitHex(draftHex, true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    commitHex(draftHex, true)
                  }
                }}
                className="w-full h-8 px-2 rounded border border-gray-700 bg-surface text-xs text-gray-200 focus:outline-none focus:border-primary-500"
                placeholder="#6366f1"
              />
              <button
                type="button"
                onClick={() => commitHex(draftHex, true)}
                className="h-8 px-2 rounded border border-gray-700 text-[11px] text-gray-200 hover:border-gray-500"
                style={{ backgroundColor: withAlpha(displayColor, 0.14) }}
              >
                OK
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {contextMenu && !disabled && (
        <div
          ref={contextMenuRef}
          className="fixed z-[70] w-52 rounded-lg border border-gray-700 bg-surface-dark shadow-2xl p-1"
          style={{
            left: clamp(contextMenu.x, 8, window.innerWidth - 220),
            top: clamp(contextMenu.y, 8, window.innerHeight - 180),
          }}
        >
          <button
            type="button"
            className="w-full text-left px-2 py-1.5 text-xs text-gray-200 hover:bg-surface rounded"
            onClick={() => {
              if (!contextColor) return
              if (contextIsFavorite) removeFavorite(contextColor)
              else addFavorite(contextColor)
              setContextMenu(null)
            }}
          >
            {contextIsFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          </button>

          <button
            type="button"
            className="w-full text-left px-2 py-1.5 text-xs text-gray-200 hover:bg-surface rounded"
            onClick={() => {
              if (!contextColor) return
              saveDefaultColor(contextColor)
              setContextMenu(null)
            }}
          >
            Définir comme couleur par défaut
          </button>

          {defaultColor && (
            <button
              type="button"
              className="w-full text-left px-2 py-1.5 text-xs text-gray-200 hover:bg-surface rounded"
              onClick={() => {
                saveDefaultColor(null)
                setContextMenu(null)
              }}
            >
              Retirer la couleur par défaut
            </button>
          )}

          {defaultColor && (
            <button
              type="button"
              className="w-full text-left px-2 py-1.5 text-xs text-gray-200 hover:bg-surface rounded"
              onClick={() => {
                commitHex(defaultColor, true)
                setContextMenu(null)
              }}
            >
              Appliquer la couleur par défaut
            </button>
          )}

          {favoriteColors.length > 0 && (
            <button
              type="button"
              className="w-full text-left px-2 py-1.5 text-xs text-red-300 hover:bg-surface rounded"
              onClick={() => {
                setFavorites([])
                setContextMenu(null)
              }}
            >
              Vider les favoris
            </button>
          )}
        </div>
      )}
    </div>
  )
}
