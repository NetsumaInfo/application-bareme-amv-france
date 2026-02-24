import { useCallback, useEffect, useRef } from 'react'
import { emit } from '@tauri-apps/api/event'
import { formatPreciseTimecode } from '@/utils/formatters'
import { normalizeShortcutFromEvent } from '@/utils/shortcuts'
import { snapToFrameSeconds } from '@/utils/timecodes'
import { parseNumericInputValue } from '@/utils/numberInput'
import { insertTextAtCursor } from '@/components/notes/insertTextAtCursor'
import { useNotationFocusNavigation } from '@/components/interfaces/notation/useNotationFocusNavigation'
import { useNotationMarkerFocusEffect } from '@/components/interfaces/notation/useNotationMarkerFocusEffect'
import type { Bareme, Criterion } from '@/types/bareme'
import type { Clip } from '@/types/project'
import * as tauri from '@/services/tauri'

interface UseNotationInteractionsOptions {
  currentClip: Clip | undefined
  currentBareme: Bareme | null
  flatCriteria: Criterion[]
  clipFps: number | null
  shortcutBindings: Record<string, string>
  inputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>
  categoryTextareaRefs: React.MutableRefObject<Map<string, HTMLTextAreaElement>>
  globalTextareaRef: React.MutableRefObject<HTMLTextAreaElement | null>
  activeNoteFieldRef: React.MutableRefObject<{ kind: 'category' | 'global'; category?: string } | null>
  updateCriterion: (clipId: string, criterionId: string, value: number | string | boolean) => void
  markDirty: () => void
  nextClip: () => void
  previousClip: () => void
  setShowPipVideo: (show: boolean) => void
  seek: (seconds: number) => Promise<void>
  pause: () => Promise<void>
  setTextNotes: (clipId: string, text: string) => void
  setCategoryNote: (clipId: string, category: string, text: string) => void
  setExpandedCategory: (category: string | null) => void
}

export function useNotationInteractions({
  currentClip,
  currentBareme,
  flatCriteria,
  clipFps,
  shortcutBindings,
  inputRefs,
  categoryTextareaRefs,
  globalTextareaRef,
  activeNoteFieldRef,
  updateCriterion,
  markDirty,
  nextClip,
  previousClip,
  setShowPipVideo,
  seek,
  pause,
  setTextNotes,
  setCategoryNote,
  setExpandedCategory,
}: UseNotationInteractionsOptions) {
  const navGuardRef = useRef(0)

  const handleValueChange = useCallback((criterionId: string, value: number | string) => {
    if (!currentClip) return
    const parsedValue =
      typeof value === 'number'
        ? (Number.isFinite(value) ? value : null)
        : parseNumericInputValue(value)
    if (parsedValue === null) return
    updateCriterion(currentClip.id, criterionId, parsedValue)
    markDirty()
  }, [currentClip, markDirty, updateCriterion])

  const { handleKeyDown } = useNotationFocusNavigation({
    flatCriteria,
    shortcutBindings,
    inputRefs,
  })

  const openPlayerAtFront = useCallback(() => {
    if (!currentClip?.filePath) return
    setShowPipVideo(true)
    tauri.playerShow()
      .then(() => tauri.playerSyncOverlay().catch(() => {}))
      .catch(() => {})
    setTimeout(() => {
      tauri.playerSyncOverlay().catch(() => {})
    }, 120)
  }, [currentClip?.filePath, setShowPipVideo])

  const navigateClip = useCallback((direction: 'next' | 'prev') => {
    const now = Date.now()
    if (now - navGuardRef.current < 120) return
    navGuardRef.current = now
    if (direction === 'next') {
      nextClip()
    } else {
      previousClip()
    }
  }, [nextClip, previousClip])

  const jumpToTimecode = useCallback(async (seconds: number, payload?: { category?: string; criterionId?: string }) => {
    if (!currentClip?.filePath || !Number.isFinite(seconds) || seconds < 0) return
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

  const insertCurrentTimecode = useCallback(async () => {
    if (!currentClip?.filePath) return
    const target = activeNoteFieldRef.current
    if (!target) return

    const status = await tauri.playerGetStatus().catch(() => null)
    if (!status) return
    const preciseSeconds = snapToFrameSeconds(status.current_time, clipFps)
    const timecode = formatPreciseTimecode(preciseSeconds)

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
  }, [activeNoteFieldRef, categoryTextareaRefs, clipFps, currentClip, globalTextareaRef, markDirty, setCategoryNote, setTextNotes])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const navEvent = event as KeyboardEvent & { __amvClipNavHandled?: boolean }

      const shortcut = normalizeShortcutFromEvent(event)
      if (!shortcut) return

      if (shortcut === shortcutBindings.insertTimecode) {
        event.preventDefault()
        event.stopPropagation()
        insertCurrentTimecode().catch(() => {})
        return
      }

      const isNextClip = shortcut === shortcutBindings.nextClip
      const isPrevClip = shortcut === shortcutBindings.prevClip
      if (!isNextClip && !isPrevClip) return
      if (navEvent.__amvClipNavHandled) return
      if (event.repeat) return

      const target = event.target as HTMLElement | null
      if (target) {
        if (target.tagName === 'TEXTAREA' || target.isContentEditable) return
        if (target.tagName === 'INPUT') {
          const input = target as HTMLInputElement
          const type = (input.type || 'text').toLowerCase()
          if (type !== 'number' && type !== 'range') return
        }
      }

      navEvent.__amvClipNavHandled = true
      event.preventDefault()
      event.stopPropagation()
      if (isNextClip) {
        navigateClip('next')
      } else {
        navigateClip('prev')
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [insertCurrentTimecode, navigateClip, shortcutBindings])

  useNotationMarkerFocusEffect({
    currentClip,
    currentBareme,
    categoryTextareaRefs,
    globalTextareaRef,
    setExpandedCategory,
  })

  return {
    handleValueChange,
    handleKeyDown,
    openPlayerAtFront,
    navigateClip,
    jumpToTimecode,
    insertCurrentTimecode,
  }
}
