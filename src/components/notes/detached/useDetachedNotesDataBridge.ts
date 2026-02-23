import { useEffect } from 'react'
import { useRef } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import type { MutableRefObject } from 'react'
import type { Bareme } from '@/types/bareme'
import type { Note } from '@/types/notation'
import type { Clip } from '@/types/project'
import type { ClipPayload } from '@/components/notes/detached/types'

interface UseDetachedNotesDataBridgeOptions {
  clipData: ClipPayload | null
  setClipData: (payload: ClipPayload | null) => void
  setLocalNote: (note: Note | null) => void
  expandedCategory: string | null
  setExpandedCategory: (category: string | null) => void
  categoryTextareaRefs: MutableRefObject<Map<string, HTMLTextAreaElement>>
  globalTextareaRef: MutableRefObject<HTMLTextAreaElement | null>
  clipRef: MutableRefObject<Clip | null>
  baremeRef: MutableRefObject<Bareme | null>
}

export function useDetachedNotesDataBridge({
  clipData,
  setClipData,
  setLocalNote,
  expandedCategory,
  setExpandedCategory,
  categoryTextareaRefs,
  globalTextareaRef,
  clipRef,
  baremeRef,
}: UseDetachedNotesDataBridgeOptions) {
  const expandedCategoryRef = useRef<string | null>(expandedCategory)
  const lastClipIdRef = useRef<string | null>(clipData?.clip?.id ?? null)

  useEffect(() => {
    expandedCategoryRef.current = expandedCategory
  }, [expandedCategory])

  useEffect(() => {
    lastClipIdRef.current = clipData?.clip?.id ?? null
  }, [clipData?.clip?.id])

  useEffect(() => {
    emit('notes:request-data').catch(() => {})
  }, [])

  useEffect(() => {
    if (clipData) return
    const timer = setInterval(() => {
      emit('notes:request-data').catch(() => {})
    }, 500)
    return () => clearInterval(timer)
  }, [clipData])

  useEffect(() => {
    const unlisteners: (() => void)[] = []

    listen<ClipPayload>('main:clip-data', (event) => {
      setClipData(event.payload)
      setLocalNote(event.payload.note)

      const nextClipId = event.payload.clip?.id ?? null
      const clipChanged = nextClipId !== lastClipIdRef.current
      lastClipIdRef.current = nextClipId

      // Only set the default expanded category when switching clips.
      // Do not reset while typing notes on the same clip.
      if (clipChanged && event.payload.bareme?.criteria?.[0]) {
        const firstCat = event.payload.bareme.criteria[0].category || 'Général'
        if (!expandedCategoryRef.current) {
          setExpandedCategory(firstCat)
        }
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
}
