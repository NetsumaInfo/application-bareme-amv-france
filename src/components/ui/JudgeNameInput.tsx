import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useI18n } from '@/i18n'
import { useZoomScale } from '@/hooks/useZoomScale'
import * as tauri from '@/services/tauri'
import type { ProjectSummary } from '@/services/tauri_api/persistence'
import {
  forgetJudgeName,
  listRecentJudgeNames,
  rememberJudgeName,
} from '@/services/recentJudgeNames'

const DEFAULT_INPUT_CLASS =
  'w-full rounded-lg border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-hidden'

const MAX_SUGGESTIONS = 8
const MAX_KEPT_NAMES = 30

interface JudgeNameInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  inputClassName?: string
  id?: string
  autoFocus?: boolean
  onEnter?: () => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/**
 * On-brand autocomplete for the judge name field. Replaces the WebView2 native
 * autofill popup ("Informations enregistrées") with a styled, app-themed dropdown
 * sourced from previously saved judge names + existing project judges. Mirrors the
 * portal positioning of BaremeCriterionCategoryField for visual harmony.
 */
export function JudgeNameInput({
  value,
  onChange,
  placeholder,
  inputClassName,
  id,
  autoFocus,
  onEnter,
}: JudgeNameInputProps) {
  const { t } = useI18n()
  const zoomScale = useZoomScale()
  const listboxId = useId()
  const fieldRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [names, setNames] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0, width: 240, maxHeight: 224 })

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const [stored, projects] = await Promise.all([
        listRecentJudgeNames().catch(() => [] as string[]),
        (async () => {
          try {
            const folder = await tauri.getDefaultProjectsFolder()
            return await tauri.listProjectsInFolder(folder)
          } catch {
            return [] as ProjectSummary[]
          }
        })(),
      ])
      if (cancelled) return

      const merged: string[] = []
      const seen = new Set<string>()
      for (const raw of [...stored, ...projects.map((project) => project.judge_name)]) {
        const name = (raw ?? '').trim()
        if (!name) continue
        const key = name.toLocaleLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        merged.push(name)
      }
      setNames(merged.slice(0, MAX_KEPT_NAMES))
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!autoFocus) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [autoFocus])

  const query = value.trim().toLocaleLowerCase()
  const suggestions = useMemo(() => {
    const filtered = query
      ? names.filter((name) => {
          const lower = name.toLocaleLowerCase()
          return lower.includes(query) && lower !== query
        })
      : names
    return filtered.slice(0, MAX_SUGGESTIONS)
  }, [names, query])

  const showMenu = open && suggestions.length > 0

  const updateMenuPosition = useCallback(() => {
    const anchor = fieldRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const viewportPadding = 8
    const viewportWidth = window.innerWidth * zoomScale
    const viewportHeight = window.innerHeight * zoomScale
    const width = Math.min(Math.max(rect.width, 200), Math.max(160, viewportWidth - viewportPadding * 2))
    const measuredHeight = menuRef.current?.offsetHeight ?? Math.min(224, suggestions.length * 32 + 40)
    const spaceBelow = viewportHeight - rect.bottom - viewportPadding
    const spaceAbove = rect.top - viewportPadding
    const openUpwards = spaceBelow < measuredHeight && spaceAbove > spaceBelow
    const maxHeight = Math.max(72, Math.min(224, (openUpwards ? spaceAbove : spaceBelow) - 8))
    const visibleHeight = Math.min(measuredHeight, maxHeight)
    const maxLeft = Math.max(viewportPadding, viewportWidth - width - viewportPadding)
    const left = clamp(rect.left, viewportPadding, maxLeft)
    const rawTop = openUpwards ? rect.top - visibleHeight - 6 : rect.bottom + 6
    const top = clamp(rawTop, viewportPadding, Math.max(viewportPadding, viewportHeight - visibleHeight - viewportPadding))

    setMenuPosition({ left, top, width, maxHeight })
  }, [suggestions.length, zoomScale])

  const handleReposition = useEffectEvent(() => updateMenuPosition())

  useLayoutEffect(() => {
    if (!showMenu) return

    const animationFrame = window.requestAnimationFrame(handleReposition)
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [showMenu])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (fieldRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
      setActiveIndex(-1)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const commitRemember = () => {
    const normalized = value.trim()
    if (normalized.length < 2) return

    void rememberJudgeName(normalized).catch(() => {})
    setNames((current) => {
      const rest = current.filter(
        (name) => name.toLocaleLowerCase() !== normalized.toLocaleLowerCase(),
      )
      return [normalized, ...rest].slice(0, MAX_KEPT_NAMES)
    })
  }

  const pick = (name: string) => {
    onChange(name)
    setOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const remove = (name: string) => {
    void forgetJudgeName(name).catch(() => {})
    setNames((current) =>
      current.filter((entry) => entry.toLocaleLowerCase() !== name.toLocaleLowerCase()),
    )
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && suggestions.length > 0) {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        setActiveIndex(0)
        return
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => {
        const base = current >= 0 ? current : 0
        return (base + direction + suggestions.length) % suggestions.length
      })
      return
    }

    if (event.key === 'Enter') {
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        event.preventDefault()
        pick(suggestions[activeIndex])
        return
      }
      onEnter?.()
      return
    }

    if (event.key === 'Escape' && open) {
      event.stopPropagation()
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  const suggestionsMenu = showMenu && typeof document !== 'undefined'
    ? createPortal(
      <div
        ref={menuRef}
        className="fixed z-2300 overflow-hidden rounded-lg bg-surface p-1.5 shadow-2xl ring-1 ring-inset ring-primary-400/10"
        style={{
          left: `${menuPosition.left}px`,
          top: `${menuPosition.top}px`,
          width: `${menuPosition.width}px`,
        }}
      >
        <div className="px-1.5 pb-1 pt-0.5">
          <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            {t('Noms enregistrés')}
          </span>
        </div>
        {/* react-doctor-disable-next-line react-doctor/prefer-tag-over-role -- custom ARIA listbox hosts interactive button rows with a per-item remove action; native datalist/option cannot replace it without breaking the widget */}
        <div
          id={listboxId}
          role="listbox"
          className="overflow-y-auto"
          style={{ maxHeight: `${menuPosition.maxHeight}px` }}
        >
          {suggestions.map((name, index) => {
            const active = index === activeIndex
            return (
              <div
                key={name}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setActiveIndex(index)}
                className={`group flex items-center justify-between gap-2 rounded-md text-left text-sm transition-colors ${
                  active ? 'bg-primary-600/15 text-white' : 'text-gray-300'
                }`}
              >
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    pick(name)
                  }}
                  className="min-w-0 flex-1 truncate px-2.5 py-1.5 text-left"
                >
                  {name}
                </button>
                <button
                  type="button"
                  aria-label={t('Oublier {name}', { name })}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    remove(name)
                  }}
                  className="mr-1 shrink-0 rounded-sm p-1 text-gray-500 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                >
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>
      </div>,
      document.body,
    )
    : null

  return (
    <div ref={fieldRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={placeholder}
        // react-doctor-disable-next-line react-doctor/no-redundant-roles -- role is the required ARIA combobox authoring pattern (anchors aria-expanded/controls); a plain input implicit role is textbox not combobox
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showMenu}
        aria-controls={showMenu ? listboxId : undefined}
        onChange={(event) => {
          onChange(event.target.value)
          setActiveIndex(-1)
          if (!open) setOpen(true)
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true)
        }}
        onBlur={commitRemember}
        onKeyDown={handleKeyDown}
        className={inputClassName ?? DEFAULT_INPUT_CLASS}
      />
      {suggestionsMenu}
    </div>
  )
}
