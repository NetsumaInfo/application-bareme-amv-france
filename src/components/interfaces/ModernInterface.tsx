import { useCallback } from 'react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { ModernCategorySection } from '@/components/interfaces/modern/ModernCategorySection'
import { ScoreRing } from '@/components/interfaces/modern/ScoreRing'
import { useModernCategories } from '@/components/interfaces/modern/useModernCategories'
import { isNoteComplete } from '@/utils/scoring'

export default function ModernInterface() {
  const { currentBareme, updateCriterion, getNoteForClip, getScoreForClip } = useNotationStore()
  const { clips, currentClipIndex, currentProject, markDirty } = useProjectStore()
  const { hideFinalScore, hideTextNotes } = useUIStore()
  const currentClip = clips[currentClipIndex]
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

  const note = currentClip ? getNoteForClip(currentClip.id) : undefined
  const totalScore = currentClip ? getScoreForClip(currentClip.id) : 0

  const handleValueChange = useCallback(
    (criterionId: string, value: number) => {
      if (!currentClip) return
      updateCriterion(currentClip.id, criterionId, value)
      markDirty()
    },
    [currentClip, updateCriterion, markDirty],
  )

  const categories = useModernCategories(currentBareme)

  if (!currentBareme) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Aucun barème sélectionné
      </div>
    )
  }

  if (!currentClip) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Sélectionnez une vidéo pour commencer la notation
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-gray-700 bg-surface/70">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Clip courant</p>
        <p className="text-sm font-semibold text-primary-300 truncate">{getClipPrimaryLabel(currentClip)}</p>
        {getClipSecondaryLabel(currentClip) && (
          <p className="text-[11px] text-gray-500 truncate">{getClipSecondaryLabel(currentClip)}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {categories.map(({ category, criteria, color }) => (
          <ModernCategorySection
            key={category}
            category={category}
            criteria={criteria}
            note={note}
            onValueChange={handleValueChange}
            color={color}
          />
        ))}
      </div>

      <div className="border-t border-gray-700">
        {!shouldHideTotals && (
          <div className="flex items-center justify-between px-4 py-3 bg-surface">
            <span className="text-sm font-medium text-gray-300">Score total</span>
            <div className="flex items-center gap-3">
              <ScoreRing value={totalScore} max={currentBareme.totalPoints} size={40} />
              <span className="text-lg font-bold text-white">
                {totalScore}
                <span className="text-sm text-gray-400 font-normal">/{currentBareme.totalPoints}</span>
              </span>
            </div>
          </div>
        )}

        {!hideTextNotes && (
          <div className="px-4 py-2 border-t border-gray-700">
            <textarea
              placeholder="Notes libres..."
              value={note?.textNotes ?? ''}
              onChange={(e) => {
                if (currentClip) {
                  useNotationStore.getState().setTextNotes(currentClip.id, e.target.value)
                  markDirty()
                }
              }}
              className="w-full px-3 py-2 text-xs bg-surface-dark border border-gray-700 rounded-lg text-gray-300 placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-y min-h-[42px]"
              rows={2}
            />
          </div>
        )}
      </div>
    </div>
  )
}
