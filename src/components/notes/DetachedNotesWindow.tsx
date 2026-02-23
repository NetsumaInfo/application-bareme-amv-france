import { useState, useEffect, useCallback, useRef } from 'react'
import { emit } from '@tauri-apps/api/event'
import { useUIStore } from '@/store/useUIStore'
import { DetachedNotesLoading } from '@/components/notes/DetachedNotesLoading'
import { DetachedNotesHeader } from '@/components/notes/DetachedNotesHeader'
import { DetachedFramePreview } from '@/components/notes/DetachedFramePreview'
import { DetachedNotesCategories } from '@/components/notes/detached/DetachedNotesCategories'
import { DetachedNotesFooter } from '@/components/notes/detached/DetachedNotesFooter'
import { useDetachedFramePreview } from '@/components/notes/detached/useDetachedFramePreview'
import { useDetachedNotesDataBridge } from '@/components/notes/detached/useDetachedNotesDataBridge'
import { useDetachedNotesEditing } from '@/components/notes/detached/useDetachedNotesEditing'
import { useDetachedNotesComputed } from '@/components/notes/detached/useDetachedNotesComputed'
import { useDetachedClipFps } from '@/components/notes/detached/useDetachedClipFps'
import { useDetachedNotesWindowSetup } from '@/components/notes/detached/useDetachedNotesWindowSetup'
import { useDetachedNotesNavigation } from '@/components/notes/detached/useDetachedNotesNavigation'
import { useDetachedNotesWindowShortcuts } from '@/components/notes/detached/useDetachedNotesWindowShortcuts'
import type { ActiveNoteField, ClipPayload } from '@/components/notes/detached/types'
import type { Clip } from '@/types/project'
import type { Bareme, Criterion } from '@/types/bareme'
import type { Note } from '@/types/notation'

export default function DetachedNotesWindow() {
  const shortcutBindings = useUIStore((state) => state.shortcutBindings)
  const [clipData, setClipData] = useState<ClipPayload | null>(null)
  const [localNote, setLocalNote] = useState<Note | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const [expandedCriterionNotes, setExpandedCriterionNotes] = useState<Record<string, boolean>>({})
  const categoryTextareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map())
  const globalTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const activeNoteFieldRef = useRef<ActiveNoteField | null>(null)
  const clipRef = useRef<Clip | null>(null)
  const clipDataRef = useRef<ClipPayload | null>(null)
  const baremeRef = useRef<Bareme | null>(null)

  const clip = clipData?.clip ?? null
  const bareme = clipData?.bareme ?? null
  const clipFps = useDetachedClipFps(clip)
  const shouldHideTotals = Boolean(clipData?.hideTotals)
  useDetachedNotesWindowSetup()
  const {
    framePreview,
    hideFramePreview,
    showFramePreview,
  } = useDetachedFramePreview(clip?.filePath)

  useEffect(() => {
    clipRef.current = clip
    baremeRef.current = bareme
  }, [clip, bareme])

  useEffect(() => {
    clipDataRef.current = clipData
  }, [clipData])

  useDetachedNotesDataBridge({
    clipData,
    setClipData,
    setLocalNote,
    expandedCategory,
    setExpandedCategory,
    categoryTextareaRefs,
    globalTextareaRef,
    clipRef,
    baremeRef,
  })

  const { categories, flatCriteria, totalScore } = useDetachedNotesComputed(bareme, localNote)

  const {
    handleValueChange,
    handleTextChange,
    handleCategoryNoteChange,
    handleCriterionNoteChange,
    flushPendingNoteUpdates,
    insertCurrentTimecode,
  } = useDetachedNotesEditing({
    clip,
    clipFps,
    setLocalNote,
    categoryTextareaRefs,
    globalTextareaRef,
    activeNoteFieldRef,
  })

  const handleTimecodeJump = useCallback((seconds: number, payload?: { category?: string; criterionId?: string }) => {
    if (!clip) return
    emit('notes:timecode-jump', {
      clipId: clip.id,
      seconds,
      category: payload?.category ?? null,
      criterionId: payload?.criterionId ?? null,
    }).catch(() => {})
  }, [clip])

  useDetachedNotesWindowShortcuts({
    shortcutBindings,
    clipDataRef,
    clipRef,
    insertCurrentTimecode,
    flushPendingNoteUpdates,
  })

  const { handleInputKeyDown, handleNavigateClip } = useDetachedNotesNavigation({
    flatCriteria,
    shortcutBindings,
    inputRefs,
    clipDataRef,
    clipRef,
    flushPendingNoteUpdates,
  })

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

  if (!clip || !bareme || !clipData) {
    return <DetachedNotesLoading />
  }

  return (
    <div className="flex flex-col w-full h-screen text-gray-200" style={{ background: '#0f0f23' }}>
      <DetachedNotesHeader
        clip={clip}
        clipIndex={clipData.clipIndex}
        totalClips={clipData.totalClips}
        hasVideo={Boolean(clip.filePath)}
        shouldHideTotals={shouldHideTotals}
        totalScore={totalScore}
        totalPoints={bareme.totalPoints}
        onNavigate={handleNavigateClip}
        onOpenPlayer={() => {
          emit('notes:open-player').catch(() => {})
        }}
      />

      <DetachedNotesCategories
        categories={categories}
        expandedCategory={expandedCategory}
        setExpandedCategory={setExpandedCategory}
        shouldHideTotals={shouldHideTotals}
        getCategoryScore={getCategoryScore}
        flatCriteria={flatCriteria}
        localNote={localNote}
        expandedCriterionNotes={expandedCriterionNotes}
        setExpandedCriterionNotes={setExpandedCriterionNotes}
        inputRefs={inputRefs}
        categoryTextareaRefs={categoryTextareaRefs}
        activeNoteFieldRef={activeNoteFieldRef}
        clipFps={clipFps}
        onValueChange={handleValueChange}
        onInputKeyDown={handleInputKeyDown}
        onCriterionNoteChange={handleCriterionNoteChange}
        onCategoryNoteChange={handleCategoryNoteChange}
        onTimecodeJump={handleTimecodeJump}
        onTimecodeHover={showFramePreview}
        onTimecodeLeave={hideFramePreview}
      />

      <DetachedNotesFooter
        globalTextareaRef={globalTextareaRef}
        activeNoteFieldRef={activeNoteFieldRef}
        globalNotes={localNote?.textNotes ?? ''}
        hasVideo={Boolean(clip.filePath)}
        clipFps={clipFps}
        onInsertTimecode={() => {
          insertCurrentTimecode().catch(() => {})
        }}
        onTextChange={handleTextChange}
        onTimecodeJump={handleTimecodeJump}
        onTimecodeHover={showFramePreview}
        onTimecodeLeave={hideFramePreview}
      />

      <DetachedFramePreview framePreview={framePreview} />
    </div>
  )
}
