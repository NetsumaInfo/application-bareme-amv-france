import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock3, ExternalLink } from 'lucide-react'
import { emit } from '@tauri-apps/api/event'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import { usePlayer } from '@/hooks/usePlayer'
import { getClipPrimaryLabel, getClipSecondaryLabel, formatTime } from '@/utils/formatters'
import { CATEGORY_COLOR_PRESETS, sanitizeColor, withAlpha } from '@/utils/colors'
import { normalizeShortcutFromEvent } from '@/utils/shortcuts'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import * as tauri from '@/services/tauri'

export default function NotationInterface() {
  const { currentBareme, updateCriterion, setCategoryNote, setTextNotes, getNoteForClip, getScoreForClip } = useNotationStore()
  const { clips, currentClipIndex, nextClip, previousClip, currentProject, markDirty } = useProjectStore()
  const { hideFinalScore, hideTextNotes, setShowPipVideo, isNotesDetached, setNotesDetached, shortcutBindings } = useUIStore()
  const { seek, pause } = usePlayer()

  const currentClip = clips[currentClipIndex]
  const note = currentClip ? getNoteForClip(currentClip.id) : undefined
  const totalScore = currentClip ? getScoreForClip(currentClip.id) : 0

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
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

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const categoryTextareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map())
  const globalTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const activeNoteFieldRef = useRef<{ kind: 'category' | 'global'; category?: string } | null>(null)
  const framePreviewCacheRef = useRef<Map<string, string>>(new Map())
  const hoverRequestRef = useRef(0)

  const allClipsScored = clips.length > 0 && clips.every((clip) => clip.scored)
  const hideTotalsUntilAllScored = Boolean(currentProject?.settings.hideFinalScoreUntilEnd) && !allClipsScored
  const hideTotalsSetting = Boolean(currentProject?.settings.hideTotals)
  const shouldHideTotals = hideFinalScore || hideTotalsSetting || hideTotalsUntilAllScored

  const categories = useMemo(() => {
    if (!currentBareme) return []
    const map = new Map<string, typeof currentBareme.criteria>()
    for (const criterion of currentBareme.criteria) {
      const category = criterion.category || 'General'
      if (!map.has(category)) map.set(category, [])
      map.get(category)!.push(criterion)
    }
    return Array.from(map.entries()).map(([category, criteria], index) => ({
      category,
      criteria,
      color: sanitizeColor(
        currentBareme.categoryColors?.[category],
        CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length],
      ),
      totalMax: criteria.reduce((sum, c) => sum + (c.max ?? 10), 0),
    }))
  }, [currentBareme])

  const flatCriteria = useMemo(
    () => categories.flatMap((group) => group.criteria),
    [categories],
  )

  const effectiveExpandedCategory = useMemo(() => {
    if (expandedCategory && categories.some((item) => item.category === expandedCategory)) {
      return expandedCategory
    }
    return categories[0]?.category ?? null
  }, [categories, expandedCategory])

  const getCategoryScore = useCallback((cat: { criteria: typeof flatCriteria }): number => {
    if (!note) return 0
    let total = 0
    for (const c of cat.criteria) {
      const score = note.scores[c.id]
      if (score && score.isValid && typeof score.value === 'number') {
        total += score.value
      }
    }
    return Math.round(total * 100) / 100
  }, [note])

  const handleValueChange = useCallback((criterionId: string, value: number | string) => {
    if (!currentClip) return
    const numValue = value === '' ? '' : Number(value)
    if (typeof numValue === 'number' && isNaN(numValue)) return
    updateCriterion(currentClip.id, criterionId, numValue as number)
    markDirty()
  }, [currentClip, updateCriterion, markDirty])

  const moveFocus = useCallback((fromIndex: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'next' ? fromIndex + 1 : fromIndex - 1
    if (targetIndex < 0 || targetIndex >= flatCriteria.length) return
    const targetId = flatCriteria[targetIndex].id
    const input = inputRefs.current.get(targetId)
    if (input) {
      input.focus()
      input.select()
    }
  }, [flatCriteria])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
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
  }, [moveFocus, shortcutBindings])

  const openPlayerAtFront = useCallback(() => {
    setShowPipVideo(true)
    tauri.playerShow()
      .then(() => tauri.playerSyncOverlay().catch(() => {}))
      .catch(() => {})
    setTimeout(() => {
      tauri.playerSyncOverlay().catch(() => {})
    }, 120)
  }, [setShowPipVideo])

  const jumpToTimecode = useCallback(async (seconds: number, payload?: { category?: string; criterionId?: string }) => {
    if (!currentClip || !Number.isFinite(seconds) || seconds < 0) return
    openPlayerAtFront()
    await seek(seconds)
    await pause()

    const detail = {
      clipId: currentClip.id,
      seconds,
      category: payload?.category ?? null,
      criterionId: payload?.criterionId ?? null,
    }
    window.dispatchEvent(new CustomEvent('amv:focus-note-marker', { detail }))
    emit('main:focus-note-marker', detail).catch(() => {})
  }, [currentClip, openPlayerAtFront, pause, seek])

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
    if (!currentClip) return
    const target = activeNoteFieldRef.current
    if (!target) return

    const status = await tauri.playerGetStatus().catch(() => null)
    if (!status) return
    const timecode = formatTime(status.current_time)

    if (target.kind === 'global') {
      const textarea = globalTextareaRef.current
      if (!textarea) return
      const { nextValue, caret } = insertTextAtCursor(textarea, timecode)
      setTextNotes(currentClip.id, nextValue)
      markDirty()
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
    setCategoryNote(currentClip.id, category, nextValue)
    markDirty()
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(caret, caret)
    })
  }, [currentClip, insertTextAtCursor, markDirty, setCategoryNote, setTextNotes])

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

  const showFramePreview = useCallback(async (params: { seconds: number; anchorRect: DOMRect }) => {
    if (!currentClip?.filePath) return
    const left = Math.min(window.innerWidth - 250, Math.max(12, params.anchorRect.left))
    const top = Math.max(12, params.anchorRect.top - 186)
    const cacheKey = `${currentClip.filePath}|${params.seconds.toFixed(3)}`
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

    const image = await tauri.playerGetFramePreview(currentClip.filePath, params.seconds, 236).catch(() => null)
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
  }, [currentClip])

  useEffect(() => {
    const onFocusMarker = (event: Event) => {
      const custom = event as CustomEvent<{
        clipId?: string
        category?: string | null
        criterionId?: string | null
      }>
      if (!currentClip) return
      if (!custom.detail?.clipId || custom.detail.clipId !== currentClip.id) return

      let targetCategory = custom.detail.category ?? null
      if (!targetCategory && custom.detail.criterionId) {
        targetCategory = currentBareme?.criteria.find((criterion) => criterion.id === custom.detail.criterionId)?.category ?? null
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
    }

    window.addEventListener('amv:focus-note-marker', onFocusMarker as EventListener)
    return () => {
      window.removeEventListener('amv:focus-note-marker', onFocusMarker as EventListener)
    }
  }, [currentBareme?.criteria, currentClip])

  if (!currentBareme || !currentClip) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Selectionnez une video
      </div>
    )
  }

  if (isNotesDetached) {
    return (
      <div className="flex h-full items-center justify-center text-center px-4">
        <div>
          <ExternalLink size={24} className="mx-auto mb-2 text-primary-400" />
          <p className="text-sm text-gray-400">Notes detachees</p>
          <p className="text-xs text-gray-600 mt-1">Editez dans la fenetre externe</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full text-gray-200" style={{ background: '#0f0f23' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0" style={{ background: '#1a1a2e' }}>
        <button
          onClick={previousClip}
          disabled={currentClipIndex === 0}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div
          className="text-center min-w-0 flex-1 px-2"
          onDoubleClick={openPlayerAtFront}
          title="Double clic pour ouvrir le lecteur"
        >
          <div className="text-xs font-medium text-white truncate">
            {getClipPrimaryLabel(currentClip)}
          </div>
          {getClipSecondaryLabel(currentClip) && (
            <div className="text-[10px] text-primary-400 truncate">{getClipSecondaryLabel(currentClip)}</div>
          )}
          <div className="text-[10px] text-gray-500">
            {currentClipIndex + 1} / {clips.length}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setNotesDetached(true)
              tauri.openNotesWindow().catch((err) => {
                console.error(err)
                setNotesDetached(false)
              })
            }}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            title="Detacher les notes"
          >
            <ExternalLink size={14} />
          </button>
          <button
            onClick={nextClip}
            disabled={currentClipIndex >= clips.length - 1}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700/50 shrink-0" style={{ background: '#12122a' }}>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Score total</span>
        {!shouldHideTotals ? (
          <span className="text-sm font-bold text-white">
            {totalScore}
            <span className="text-xs text-gray-400 font-normal">/{currentBareme.totalPoints}</span>
          </span>
        ) : (
          <span className="text-sm font-bold text-gray-600">-</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {categories.map(({ category, criteria, color, totalMax }) => {
          const isExpanded = effectiveExpandedCategory === category
          const catScore = getCategoryScore({ criteria })

          return (
            <div key={category} className="border-b border-gray-800/60">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:brightness-110"
                style={{
                  backgroundColor: isExpanded ? withAlpha(color, 0.18) : withAlpha(color, 0.08),
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
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
                    v
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-2 py-1.5 space-y-1" style={{ backgroundColor: withAlpha(color, 0.04) }}>
                  {criteria.map((criterion) => {
                    const flatIndex = flatCriteria.findIndex((item) => item.id === criterion.id)
                    const score = note?.scores[criterion.id]
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
                          ref={(el) => {
                            if (el) inputRefs.current.set(criterion.id, el)
                          }}
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

                  <TimecodeTextarea
                    textareaRef={(el) => {
                      if (el) categoryTextareaRefs.current.set(category, el)
                      else categoryTextareaRefs.current.delete(category)
                    }}
                    placeholder={`Notes "${category}"...`}
                    value={note?.categoryNotes?.[category] ?? ''}
                    onChange={(nextValue) => {
                      if (!currentClip) return
                      setCategoryNote(currentClip.id, category, nextValue)
                      markDirty()
                    }}
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
                      jumpToTimecode(item.seconds, { category })
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

      {!hideTextNotes && (
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

          <div className="px-3 py-2">
            <TimecodeTextarea
              textareaRef={(el) => {
                globalTextareaRef.current = el
              }}
              placeholder="Notes generales..."
              value={note?.textNotes ?? ''}
              onChange={(nextValue) => {
                if (!currentClip) return
                setTextNotes(currentClip.id, nextValue)
                markDirty()
              }}
              onFocus={() => {
                activeNoteFieldRef.current = { kind: 'global' }
              }}
              textareaClassName="min-h-[36px]"
              color="#60a5fa"
              onTimecodeSelect={(item) => {
                jumpToTimecode(item.seconds)
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
      )}

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
