import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import { ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import { CATEGORY_COLOR_PRESETS, sanitizeColor, withAlpha } from '@/utils/colors'
import { formatTime } from '@/utils/formatters'
import { DEFAULT_SHORTCUT_BINDINGS, normalizeShortcutFromEvent } from '@/utils/shortcuts'
import { useUIStore } from '@/store/useUIStore'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import type { Clip } from '@/types/project'
import type { Bareme, Criterion } from '@/types/bareme'
import type { Note, CriterionScore } from '@/types/notation'
import * as tauri from '@/services/tauri'

interface ClipPayload {
  clip: Clip | null
  bareme: Bareme | null
  note: Note | null
  clipIndex: number
  totalClips: number
}

export default function DetachedNotesWindow() {
  const shortcutBindings = useUIStore((state) => state.shortcutBindings)
  const [clipData, setClipData] = useState<ClipPayload | null>(null)
  const [localNote, setLocalNote] = useState<Note | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const textDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const categoryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const categoryTextareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map())
  const globalTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const activeNoteFieldRef = useRef<{ kind: 'category' | 'global'; category?: string } | null>(null)
  const clipRef = useRef<Clip | null>(null)
  const baremeRef = useRef<Bareme | null>(null)
  const framePreviewCacheRef = useRef<Map<string, string>>(new Map())
  const hoverRequestRef = useRef(0)
  const [framePreview, setFramePreview] = useState<{
    visible: boolean
    left: number
    top: number
    image: string | null
    loading: boolean
  }>({
    visible: false,
    left: 0,
    top: 0,
    image: null,
    loading: false,
  })

  const clip = clipData?.clip ?? null
  const bareme = clipData?.bareme ?? null

  useEffect(() => {
    clipRef.current = clip
    baremeRef.current = bareme
  }, [clip, bareme])

  // Set dark background immediately
  useEffect(() => {
    document.documentElement.style.background = '#0f0f23'
    document.body.style.background = '#0f0f23'
    document.body.style.color = '#e0e0e0'
    return () => {
      if (textDebounceRef.current) clearTimeout(textDebounceRef.current)
      if (categoryDebounceRef.current) clearTimeout(categoryDebounceRef.current)
    }
  }, [])

  useEffect(() => {
    tauri.loadUserSettings()
      .then((data) => {
        if (!data || typeof data !== 'object') return
        const settings = data as Record<string, unknown>
        const rawBindings = settings.shortcutBindings
        if (!rawBindings || typeof rawBindings !== 'object') return
        useUIStore.setState({
          shortcutBindings: {
            ...DEFAULT_SHORTCUT_BINDINGS,
            ...(rawBindings as Record<string, string>),
          },
        })
      })
      .catch(() => {})
  }, [])

  // Request data from main window on mount
  useEffect(() => {
    emit('notes:request-data').catch(() => {})
  }, [])

  // Keep asking data until first payload arrives
  useEffect(() => {
    if (clipData) return
    const timer = setInterval(() => {
      emit('notes:request-data').catch(() => {})
    }, 500)
    return () => clearInterval(timer)
  }, [clipData])

  // Listen for main window events
  useEffect(() => {
    const unlisteners: (() => void)[] = []

    listen<ClipPayload>('main:clip-data', (event) => {
      setClipData(event.payload)
      setLocalNote(event.payload.note)
      if (!expandedCategory && event.payload.bareme?.criteria?.[0]) {
        const firstCat = event.payload.bareme.criteria[0].category || 'Général'
        setExpandedCategory(firstCat)
      }
    }).then((fn) => unlisteners.push(fn))

    listen<{ note: Note }>('main:note-updated', (event) => {
      setLocalNote(event.payload.note)
    }).then((fn) => unlisteners.push(fn))

    listen<{
      clipId?: string
      category?: string | null
      criterionId?: string | null
    }>('main:focus-note-marker', (event) => {
      const currentClip = clipRef.current
      if (!currentClip || !event.payload?.clipId || event.payload.clipId !== currentClip.id) return

      let targetCategory = event.payload.category ?? null
      if (!targetCategory && event.payload.criterionId) {
        const currentBareme = baremeRef.current
        targetCategory = currentBareme?.criteria.find((criterion) => criterion.id === event.payload.criterionId)?.category ?? null
      }

      if (targetCategory) {
        setExpandedCategory(targetCategory)
        setTimeout(() => {
          categoryTextareaRefs.current.get(targetCategory || '')?.focus()
        }, 40)
        return
      }

      setTimeout(() => {
        globalTextareaRef.current?.focus()
      }, 40)
    }).then((fn) => unlisteners.push(fn))

    return () => unlisteners.forEach((fn) => fn())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const categories = useMemo(() => {
    if (!bareme) return []
    const map = new Map<string, Criterion[]>()
    for (const criterion of bareme.criteria) {
      const category = criterion.category || 'Général'
      if (!map.has(category)) map.set(category, [])
      map.get(category)!.push(criterion)
    }
    return Array.from(map.entries()).map(([category, criteria], index) => ({
      category,
      criteria,
      color: sanitizeColor(
        bareme.categoryColors?.[category],
        CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length],
      ),
      totalMax: criteria.reduce((sum, c) => sum + (c.max ?? 10), 0),
    }))
  }, [bareme])

  const flatCriteria = useMemo(
    () => categories.flatMap((group) => group.criteria),
    [categories],
  )

  const handleValueChange = useCallback(
    (criterionId: string, value: number | string) => {
      if (!clip) return
      const numValue = value === '' ? '' : Number(value)
      if (typeof numValue === 'number' && isNaN(numValue)) return

      setLocalNote((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          scores: {
            ...prev.scores,
            [criterionId]: {
              criterionId,
              value: numValue,
              isValid: true,
              validationErrors: [],
            } as CriterionScore,
          },
        }
      })

      emit('notes:criterion-updated', {
        clipId: clip.id,
        criterionId,
        value: numValue,
      }).catch(() => {})
    },
    [clip],
  )

  const handleTextChange = useCallback(
    (text: string) => {
      if (!clip) return

      setLocalNote((prev) => prev ? { ...prev, textNotes: text } : prev)

      if (textDebounceRef.current) clearTimeout(textDebounceRef.current)
      textDebounceRef.current = setTimeout(() => {
        emit('notes:text-notes-updated', {
          clipId: clip.id,
          text,
        }).catch(() => {})
      }, 300)
    },
    [clip],
  )

  const handleCategoryNoteChange = useCallback(
    (category: string, text: string) => {
      if (!clip) return

      setLocalNote((prev) => prev ? {
        ...prev,
        categoryNotes: {
          ...(prev.categoryNotes || {}),
          [category]: text,
        },
      } : prev)

      if (categoryDebounceRef.current) clearTimeout(categoryDebounceRef.current)
      categoryDebounceRef.current = setTimeout(() => {
        emit('notes:category-note-updated', {
          clipId: clip.id,
          category,
          text,
        }).catch(() => {})
      }, 250)
    },
    [clip],
  )

  const handleTimecodeJump = useCallback((seconds: number, payload?: { category?: string; criterionId?: string }) => {
    if (!clip) return
    emit('notes:timecode-jump', {
      clipId: clip.id,
      seconds,
      category: payload?.category ?? null,
      criterionId: payload?.criterionId ?? null,
    }).catch(() => {})
  }, [clip])

  const insertTextAtCursor = useCallback((textarea: HTMLTextAreaElement, insertion: string) => {
    const start = textarea.selectionStart ?? textarea.value.length
    const end = textarea.selectionEnd ?? start
    const value = textarea.value
    const before = value.slice(0, start)
    const after = value.slice(end)
    const needsSpaceBefore = before.length > 0 && !/\s$/.test(before)
    const needsSpaceAfter = after.length > 0 && !/^\s/.test(after)
    const insert = `${needsSpaceBefore ? ' ' : ''}${insertion}${needsSpaceAfter ? ' ' : ''}`
    const nextValue = `${before}${insert}${after}`
    const caret = before.length + insert.length
    return { nextValue, caret }
  }, [])

  const insertCurrentTimecode = useCallback(async () => {
    if (!clip) return
    const target = activeNoteFieldRef.current
    if (!target) return

    const status = await tauri.playerGetStatus().catch(() => null)
    if (!status) return
    const timecode = formatTime(status.current_time)

    if (target.kind === 'global') {
      const textarea = globalTextareaRef.current
      if (!textarea) return
      const { nextValue, caret } = insertTextAtCursor(textarea, timecode)
      handleTextChange(nextValue)
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(caret, caret)
      })
      return
    }

    const category = target.category
    if (!category) return
    const textarea = categoryTextareaRefs.current.get(category)
    if (!textarea) return
    const { nextValue, caret } = insertTextAtCursor(textarea, timecode)
    handleCategoryNoteChange(category, nextValue)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(caret, caret)
    })
  }, [clip, handleCategoryNoteChange, handleTextChange, insertTextAtCursor])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = normalizeShortcutFromEvent(event)
      if (shortcut && shortcut === shortcutBindings.insertTimecode) {
        event.preventDefault()
        event.stopPropagation()
        insertCurrentTimecode().catch(() => {})
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [insertCurrentTimecode, shortcutBindings])

  const hideFramePreview = useCallback(() => {
    setFramePreview((prev) => ({ ...prev, visible: false }))
  }, [])

  const showFramePreview = useCallback(async (params: {
    seconds: number
    anchorRect: DOMRect
  }) => {
    if (!clip?.filePath) return
    const left = Math.min(window.innerWidth - 250, Math.max(12, params.anchorRect.left))
    const top = Math.max(12, params.anchorRect.top - 186)
    const cacheKey = `${clip.filePath}|${params.seconds.toFixed(3)}`
    const requestId = ++hoverRequestRef.current

    const cached = framePreviewCacheRef.current.get(cacheKey)
    if (cached) {
      setFramePreview({
        visible: true,
        left,
        top,
        image: cached,
        loading: false,
      })
      return
    }

    setFramePreview({
      visible: true,
      left,
      top,
      image: null,
      loading: true,
    })

    const image = await tauri.playerGetFramePreview(clip.filePath, params.seconds, 320).catch(() => null)
    if (hoverRequestRef.current !== requestId) return
    if (image) {
      framePreviewCacheRef.current.set(cacheKey, image)
    }
    setFramePreview({
      visible: true,
      left,
      top,
      image,
      loading: false,
    })
  }, [clip?.filePath])

  const moveFocus = useCallback(
    (fromIndex: number, direction: 'prev' | 'next') => {
      const targetIndex = direction === 'next' ? fromIndex + 1 : fromIndex - 1
      if (targetIndex < 0 || targetIndex >= flatCriteria.length) return
      const targetId = flatCriteria[targetIndex].id
      const input = inputRefs.current.get(targetId)
      if (input) {
        input.focus()
        input.select()
      }
    },
    [flatCriteria],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const shortcut = normalizeShortcutFromEvent(e.nativeEvent)
      if (shortcut === shortcutBindings.notesNextField || shortcut === shortcutBindings.notesFieldDown) {
        e.preventDefault()
        moveFocus(index, 'next')
        return
      }
      if (shortcut === shortcutBindings.notesPrevField || shortcut === shortcutBindings.notesFieldUp) {
        e.preventDefault()
        moveFocus(index, 'prev')
        return
      }

      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        moveFocus(index, 'next')
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveFocus(index, 'prev')
      }
    },
    [moveFocus, shortcutBindings],
  )

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    emit('notes:navigate-clip', { direction }).catch(() => {})
  }, [])

  const getCategoryScore = useCallback((cat: { criteria: Criterion[] }): number => {
    if (!localNote) return 0
    let total = 0
    for (const c of cat.criteria) {
      const score = localNote.scores[c.id]
      if (score && score.isValid && typeof score.value === 'number') {
        total += score.value
      }
    }
    return Math.round(total * 100) / 100
  }, [localNote])

  const totalScore = useMemo(() => {
    if (!localNote || !bareme) return 0
    let total = 0
    for (const criterion of bareme.criteria) {
      const score = localNote.scores[criterion.id]
      if (score && score.isValid && typeof score.value === 'number') {
        total += score.value
      }
    }
    return Math.round(total * 100) / 100
  }, [localNote, bareme])

  // Loading state - use inline styles as fallback in case Tailwind isn't loaded
  if (!clip || !bareme || !clipData) {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#0f0f23', color: '#9ca3af' }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: 24, height: 24, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: 13 }}>En attente des données...</p>
          <p style={{ fontSize: 11, color: '#6b7280' }}>
            Ouvrez un projet et sélectionnez un clip
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-screen text-gray-200" style={{ background: '#0f0f23' }}>
      {/* Header - clip navigation */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0" style={{ background: '#1a1a2e' }}>
        <button
          onClick={() => handleNavigate('prev')}
          disabled={clipData.clipIndex === 0}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div
          className="text-center min-w-0 flex-1 px-2"
          onDoubleClick={() => {
            emit('notes:open-player').catch(() => {})
          }}
          title="Double clic pour ouvrir le lecteur"
        >
          <div className="text-xs font-medium text-white truncate">
            {clip.displayName}
          </div>
          {clip.author && (
            <div className="text-[10px] text-primary-400 truncate">{clip.author}</div>
          )}
          <div className="text-[10px] text-gray-500">
            {clipData.clipIndex + 1} / {clipData.totalClips}
          </div>
        </div>
        <button
          onClick={() => handleNavigate('next')}
          disabled={clipData.clipIndex >= clipData.totalClips - 1}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Score total en haut */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700/50 shrink-0" style={{ background: '#12122a' }}>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Score total</span>
        <span className="text-sm font-bold text-white">
          {totalScore}
          <span className="text-xs text-gray-400 font-normal">/{bareme.totalPoints}</span>
        </span>
      </div>

      {/* Categories - accordion style, click to expand */}
      <div className="flex-1 overflow-y-auto py-1">
        {categories.map(({ category, criteria, color, totalMax }) => {
          const isExpanded = expandedCategory === category
          const catScore = getCategoryScore({ criteria })

          return (
            <div key={category} className="border-b border-gray-800/60">
              {/* Category header - clickable */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:brightness-110"
                style={{
                  backgroundColor: isExpanded ? withAlpha(color, 0.18) : withAlpha(color, 0.08),
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
                    {category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold" style={{ color: catScore > 0 ? color : '#6b7280' }}>
                    {catScore}
                  </span>
                  <span className="text-[10px] text-gray-500">/{totalMax}</span>
                  <span
                    className="text-[10px] transition-transform"
                    style={{
                      color: withAlpha(color, 0.6),
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    ▼
                  </span>
                </div>
              </button>

              {/* Expanded criteria */}
              {isExpanded && (
                <div className="px-2 py-1.5 space-y-1" style={{ backgroundColor: withAlpha(color, 0.04) }}>
                  {criteria.map((criterion) => {
                    const flatIndex = flatCriteria.findIndex((item) => item.id === criterion.id)
                    const score = localNote?.scores[criterion.id]
                    const value = score?.value ?? ''
                    const hasError = score && !score.isValid

                    return (
                      <div
                        key={criterion.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
                        style={{
                          backgroundColor: hasError ? withAlpha('#ef4444', 0.12) : withAlpha(color, 0.07),
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-gray-200 truncate block" title={criterion.name}>
                            {criterion.name}
                          </span>
                          {criterion.description && (
                            <span className="text-[9px] text-gray-500 truncate block">
                              {criterion.description}
                            </span>
                          )}
                        </div>
                        <input
                          ref={(el) => { if (el) inputRefs.current.set(criterion.id, el) }}
                          type="number"
                          min={criterion.min}
                          max={criterion.max}
                          step={criterion.step || 0.5}
                          value={value === '' ? '' : String(value)}
                          onChange={(e) => handleValueChange(criterion.id, e.target.value === '' ? '' : Number(e.target.value))}
                          onKeyDown={(e) => handleKeyDown(e, flatIndex)}
                          className={`amv-soft-number w-16 px-2 py-1 text-center text-sm rounded-md border font-mono focus-visible:outline-none ${
                            hasError
                              ? 'border-accent bg-accent/10 text-accent-light'
                              : 'text-white focus:border-primary-500'
                          } focus:outline-none`}
                          style={!hasError ? {
                            borderColor: withAlpha(color, 0.42),
                            backgroundColor: withAlpha(color, 0.1),
                          } : undefined}
                        />
                        <span className="text-[10px] text-gray-500 w-7 text-right font-mono">/{criterion.max ?? 10}</span>
                      </div>
                    )
                  })}

                  {/* Category note */}
                  <TimecodeTextarea
                    textareaRef={(el) => {
                      if (el) categoryTextareaRefs.current.set(category, el)
                      else categoryTextareaRefs.current.delete(category)
                    }}
                    placeholder={`Notes "${category}"...`}
                    value={localNote?.categoryNotes?.[category] ?? ''}
                    onChange={(nextValue) => handleCategoryNoteChange(category, nextValue)}
                    onFocus={() => {
                      activeNoteFieldRef.current = { kind: 'category', category }
                    }}
                    className="mt-1"
                    textareaClassName="min-h-[36px]"
                    style={{
                      backgroundColor: withAlpha(color, 0.05),
                      borderColor: withAlpha(color, 0.2),
                    }}
                    color={color}
                    onTimecodeSelect={(item) => {
                      handleTimecodeJump(item.seconds, { category })
                    }}
                    onTimecodeHover={({ item, anchorRect }) => {
                      showFramePreview({
                        seconds: item.seconds,
                        anchorRect,
                      }).catch(() => {})
                    }}
                    onTimecodeLeave={hideFramePreview}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 shrink-0" style={{ background: '#1a1a2e' }}>
        <div className="px-3 py-1.5 border-b border-gray-700/60 flex items-center justify-end">
          <button
            type="button"
            onClick={() => insertCurrentTimecode().catch(() => {})}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border border-primary-500/40 bg-primary-500/10 text-primary-300 hover:bg-primary-500/20 transition-colors"
            title="Insérer le timecode courant"
          >
            <Clock3 size={12} />
            Timecode
          </button>
        </div>
        {/* Global notes */}
        <div className="px-3 py-2">
          <TimecodeTextarea
            textareaRef={(el) => {
              globalTextareaRef.current = el
            }}
            placeholder="Notes générales..."
            value={localNote?.textNotes ?? ''}
            onChange={handleTextChange}
            onFocus={() => {
              activeNoteFieldRef.current = { kind: 'global' }
            }}
            textareaClassName="min-h-[36px]"
            color="#60a5fa"
            onTimecodeSelect={(item) => {
              handleTimecodeJump(item.seconds)
            }}
            onTimecodeHover={({ item, anchorRect }) => {
              showFramePreview({
                seconds: item.seconds,
                anchorRect,
              }).catch(() => {})
            }}
            onTimecodeLeave={hideFramePreview}
          />
        </div>

      </div>

      {framePreview.visible && (
        <div
          className="fixed z-[120] pointer-events-none rounded-lg border border-gray-600 bg-surface shadow-2xl overflow-hidden"
          style={{ left: framePreview.left, top: framePreview.top, width: 236 }}
        >
          <div className="h-[132px] bg-black flex items-center justify-center">
            {framePreview.loading ? (
              <span className="text-[10px] text-gray-500">Chargement frame...</span>
            ) : framePreview.image ? (
              <img
                src={framePreview.image}
                alt="Frame preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[10px] text-gray-500">Preview indisponible</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
