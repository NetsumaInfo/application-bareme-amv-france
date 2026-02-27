import { useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import { usePlayer } from '@/hooks/usePlayer'
import { DetachedFramePreview } from '@/components/notes/DetachedFramePreview'
import { useDetachedFramePreview } from '@/components/notes/detached/useDetachedFramePreview'
import { useDetachedClipFps } from '@/components/notes/detached/useDetachedClipFps'
import { NotationClipHeader } from '@/components/interfaces/notation/NotationClipHeader'
import { NotationCategoriesAccordion } from '@/components/interfaces/notation/NotationCategoriesAccordion'
import { NotationNotesFooter } from '@/components/interfaces/notation/NotationNotesFooter'
import { useNotationCategories } from '@/components/interfaces/notation/useNotationCategories'
import { useNotationInteractions } from '@/components/interfaces/notation/useNotationInteractions'
import { isNoteComplete } from '@/utils/scoring'

export default function NotationInterface() {
  const { currentBareme, updateCriterion, setCategoryNote, setCriterionNote, setTextNotes, getNoteForClip, getScoreForClip } = useNotationStore()
  const { clips, currentClipIndex, nextClip, previousClip, currentProject, markDirty } = useProjectStore()
  const { hideFinalScore, hideTextNotes, setShowPipVideo, isNotesDetached, shortcutBindings } = useUIStore()
  const { seek, pause } = usePlayer()

  const currentClip = clips[currentClipIndex]
  const note = currentClip ? getNoteForClip(currentClip.id) : undefined
  const totalScore = currentClip ? getScoreForClip(currentClip.id) : 0

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const clipFps = useDetachedClipFps(currentClip ?? null)
  const { framePreview, hideFramePreview, showFramePreview } = useDetachedFramePreview(currentClip?.filePath)

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const [expandedCriterionNotes, setExpandedCriterionNotes] = useState<Record<string, boolean>>({})
  const categoryTextareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map())
  const globalTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const activeNoteFieldRef = useRef<{ kind: 'category' | 'global'; category?: string } | null>(null)

  const allClipsScored = clips.length > 0 && clips.every((clip) => {
    if (clip.scored) return true
    if (!currentBareme) return false
    const clipNote = getNoteForClip(clip.id)
    return clipNote ? isNoteComplete(clipNote, currentBareme) : false
  })
  const hasAnyLinkedVideo = clips.some((clip) => Boolean(clip.filePath))
  const hideTotalsUntilAllScored = Boolean(currentProject?.settings.hideFinalScoreUntilEnd)
    && hasAnyLinkedVideo
    && !allClipsScored
  const hideTotalsSetting = Boolean(currentProject?.settings.hideTotals)
  const shouldHideTotals = hideFinalScore || hideTotalsSetting || hideTotalsUntilAllScored

  const {
    categories,
    flatCriteria,
    effectiveExpandedCategory,
    getCategoryScore,
  } = useNotationCategories({
    currentBareme,
    note,
    expandedCategory,
  })

  const {
    handleValueChange,
    handleKeyDown,
    openPlayerAtFront,
    navigateClip,
    jumpToTimecode,
    insertCurrentTimecode,
  } = useNotationInteractions({
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
  })

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
      <NotationClipHeader
        clip={currentClip}
        currentClipIndex={currentClipIndex}
        totalClips={clips.length}
        hasVideo={Boolean(currentClip.filePath)}
        totalScore={totalScore}
        totalPoints={currentBareme.totalPoints}
        shouldHideTotals={shouldHideTotals}
        onNavigate={navigateClip}
        onOpenPlayer={openPlayerAtFront}
      />

      <NotationCategoriesAccordion
        categories={categories}
        effectiveExpandedCategory={effectiveExpandedCategory}
        flatCriteria={flatCriteria}
        note={note}
        currentClipId={currentClip.id}
        shouldHideTotals={shouldHideTotals}
        clipFps={clipFps}
        expandedCriterionNotes={expandedCriterionNotes}
        inputRefs={inputRefs}
        categoryTextareaRefs={categoryTextareaRefs}
        onToggleCategory={(category, isExpanded) => setExpandedCategory(isExpanded ? null : category)}
        onToggleCriterionNote={(criterionId) => {
          setExpandedCriterionNotes((prev) => ({
            ...prev,
            [criterionId]: !prev[criterionId],
          }))
        }}
        onExpandCriterionNote={(criterionId) => {
          setExpandedCriterionNotes((prev) => ({
            ...prev,
            [criterionId]: true,
          }))
        }}
        onValueChange={handleValueChange}
        onKeyDown={handleKeyDown}
        onSetCriterionNote={setCriterionNote}
        onSetCategoryNote={setCategoryNote}
        onSetActiveCategoryField={(category) => {
          activeNoteFieldRef.current = { kind: 'category', category }
        }}
        onJumpToTimecode={(seconds, payload) => {
          jumpToTimecode(seconds, payload).catch(() => {})
        }}
        onTimecodeHover={({ seconds, anchorRect }) => {
          showFramePreview({ seconds, anchorRect }).catch(() => {})
        }}
        onTimecodeLeave={hideFramePreview}
        onMarkDirty={markDirty}
        getCategoryScore={getCategoryScore}
      />

      <NotationNotesFooter
        hidden={hideTextNotes}
        hasVideo={Boolean(currentClip.filePath)}
        noteText={note?.textNotes ?? ''}
        clipFps={clipFps}
        globalTextareaRef={globalTextareaRef}
        onInsertTimecode={() => {
          insertCurrentTimecode().catch(() => {})
        }}
        onChangeText={(nextValue) => {
          setTextNotes(currentClip.id, nextValue)
          markDirty()
        }}
        onFocus={() => {
          activeNoteFieldRef.current = { kind: 'global' }
        }}
        onJumpToTimecode={(seconds) => {
          jumpToTimecode(seconds).catch(() => {})
        }}
        onTimecodeHover={({ seconds, anchorRect }) => {
          showFramePreview({ seconds, anchorRect }).catch(() => {})
        }}
        onTimecodeLeave={hideFramePreview}
      />

      <DetachedFramePreview framePreview={framePreview} />
    </div>
  )
}
