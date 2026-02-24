import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'
import * as tauri from '@/services/tauri'
import { formatPreciseTimecode } from '@/utils/formatters'
import { normalizeShortcutFromEvent } from '@/utils/shortcuts'
import { computeFramePreviewPlacement } from '@/utils/framePreviewPosition'
import { snapToFrameSeconds } from '@/utils/timecodes'
import type { Clip } from '@/types/project'
import type { ShortcutAction } from '@/utils/shortcuts'

interface UseSpreadsheetFrameToolsParams {
  currentClip?: Clip
  markDirty: () => void
  setTextNotes: (clipId: string, text: string) => void
  notesTextareaRef: MutableRefObject<HTMLTextAreaElement | null>
  shortcutBindings: Record<ShortcutAction, string>
}

interface FramePreviewState {
  visible: boolean
  left: number
  top: number
  image: string | null
  loading: boolean
}

const EMPTY_PREVIEW: FramePreviewState = {
  visible: false,
  left: 0,
  top: 0,
  image: null,
  loading: false,
}

export function useSpreadsheetFrameTools({
  currentClip,
  markDirty,
  setTextNotes,
  notesTextareaRef,
  shortcutBindings,
}: UseSpreadsheetFrameToolsParams) {
  const [clipFps, setClipFps] = useState<number | null>(null)
  const [framePreview, setFramePreview] = useState<FramePreviewState>(EMPTY_PREVIEW)

  const framePreviewCacheRef = useRef<Map<string, string>>(new Map())
  const hoverRequestRef = useRef(0)

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
    const textarea = notesTextareaRef.current
    if (!textarea) return

    const status = await tauri.playerGetStatus().catch(() => null)
    if (!status) return
    const preciseSeconds = snapToFrameSeconds(status.current_time, clipFps ?? undefined)
    const timecode = formatPreciseTimecode(preciseSeconds)
    const { nextValue, caret } = insertTextAtCursor(textarea, timecode)
    setTextNotes(currentClip.id, nextValue)
    markDirty()
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(caret, caret)
    })
  }, [clipFps, currentClip, insertTextAtCursor, markDirty, notesTextareaRef, setTextNotes])

  const hideFramePreview = useCallback(() => {
    setFramePreview((prev) => ({ ...prev, visible: false }))
  }, [])

  const showFramePreview = useCallback(async (params: { seconds: number; anchorRect: DOMRect }) => {
    if (!currentClip?.filePath) return

    const placement = computeFramePreviewPlacement({
      anchorRect: params.anchorRect,
      previewWidth: 236,
      previewHeight: 136,
    })
    const cacheKey = `${currentClip.filePath}|${params.seconds.toFixed(3)}`
    const requestId = ++hoverRequestRef.current

    const cached = framePreviewCacheRef.current.get(cacheKey)
    if (cached) {
      setFramePreview({
        visible: true,
        left: placement.left,
        top: placement.top,
        image: cached,
        loading: false,
      })
      return
    }

    setFramePreview({
      visible: true,
      left: placement.left,
      top: placement.top,
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
      left: placement.left,
      top: placement.top,
      image,
      loading: false,
    })
  }, [currentClip])

  useEffect(() => {
    let active = true
    if (!currentClip?.filePath) {
      return () => {
        active = false
      }
    }

    tauri.playerGetMediaInfo(currentClip.filePath)
      .then((info) => {
        if (!active) return
        const fps = Number(info?.fps)
        setClipFps(Number.isFinite(fps) && fps > 0 ? fps : null)
      })
      .catch(() => {
        if (!active) return
        setClipFps(null)
      })

    return () => {
      active = false
    }
  }, [currentClip?.id, currentClip?.filePath])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = normalizeShortcutFromEvent(event)
      if (!shortcut || shortcut !== shortcutBindings.insertTimecode) return
      event.preventDefault()
      event.stopPropagation()
      insertCurrentTimecode().catch(() => { })
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [insertCurrentTimecode, shortcutBindings])

  return {
    clipFps,
    framePreview,
    showFramePreview,
    hideFramePreview,
  }
}
