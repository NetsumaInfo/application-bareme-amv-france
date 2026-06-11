import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { X } from 'lucide-react'
import { useI18n } from '@/i18n'
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

/**
 * On-brand autocomplete for the judge name field. Replaces the WebView2 native
 * autofill popup ("Informations enregistrées") with a styled, app-themed dropdown
 * sourced from previously saved judge names + existing project judges.
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
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [names, setNames] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

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

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
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

  const showMenu = open && suggestions.length > 0

  return (
    <div ref={rootRef} className="relative">
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
        aria-label={placeholder ?? t('Nom du juge')}
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

      {showMenu ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-lg bg-surface p-1.5 shadow-2xl ring-1 ring-inset ring-primary-400/10">
          <div className="px-1.5 pb-1 pt-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              {t('Noms enregistrés')}
            </span>
          </div>
          {/* react-doctor-disable-next-line react-doctor/prefer-tag-over-role -- custom ARIA listbox/combobox hosts interactive button children; native datalist/option cannot replace it without breaking the widget */}
          <div id={listboxId} role="listbox" className="max-h-56 overflow-y-auto">
            {suggestions.map((name, index) => {
              const active = index === activeIndex
              return (
                <div
                  key={name}
                  // react-doctor-disable-next-line react-doctor/prefer-tag-over-role -- custom ARIA listbox/combobox hosts interactive button children; native datalist/option cannot replace it without breaking the widget
                  role="option"
                  tabIndex={-1}
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
        </div>
      ) : null}
    </div>
  )
}
