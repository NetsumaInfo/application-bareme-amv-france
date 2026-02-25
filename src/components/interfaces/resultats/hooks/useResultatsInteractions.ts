import { useCallback } from 'react'
import { useResultatsContextMenus } from '@/components/interfaces/resultats/hooks/useResultatsContextMenus'
import { useResultatsSelectedClip } from '@/components/interfaces/resultats/hooks/useResultatsSelectedClip'
import { useResultatsCriterionDraftCells } from '@/components/interfaces/resultats/hooks/useResultatsCriterionDraftCells'
import { useResultatsJudgeImport } from '@/components/interfaces/resultats/hooks/useResultatsJudgeImport'
import { useResultatsClipActions } from '@/components/interfaces/resultats/hooks/useResultatsClipActions'
import { useResultatsCriterionValue } from '@/components/interfaces/resultats/hooks/useResultatsCriterionValue'
import type { Bareme } from '@/types/bareme'
import type {
  Clip,
  ImportedJudgeData,
} from '@/types/project'
import type { JudgeSource } from '@/utils/results'

interface UseResultatsInteractionsParams {
  currentBareme: Bareme | null
  clips: Clip[]
  sortedClips: Clip[]
  judges: JudgeSource[]
  importedJudges: ImportedJudgeData[]
  setImportedJudges: (judges: ImportedJudgeData[]) => void
  updateCriterion: (clipId: string, criterionId: string, value: number | string | boolean) => void
  markDirty: () => void
  setCurrentClip: (index: number) => void
  setShowPipVideo: (show: boolean) => void
}

export function useResultatsInteractions({
  currentBareme,
  clips,
  sortedClips,
  judges,
  importedJudges,
  setImportedJudges,
  updateCriterion,
  markDirty,
  setCurrentClip,
  setShowPipVideo,
}: UseResultatsInteractionsParams) {
  const {
    selectedClipId,
    selectedClip,
    selectedClipFps,
    setSelectedClipId,
  } = useResultatsSelectedClip({ sortedClips })

  const {
    memberContextMenu,
    clipContextMenu,
    emptyContextMenu,
    memberContextMenuRef,
    clipContextMenuRef,
    emptyContextMenuRef,
    setMemberContextMenu,
    setClipContextMenu,
    setEmptyContextMenu,
  } = useResultatsContextMenus()

  const { openClipInNotation, jumpToTimecodeInNotation } = useResultatsClipActions({
    clips,
    setCurrentClip,
    setShowPipVideo,
  })

  const {
    importing,
    handleImportJudgeJson,
    removeImportedJudge: removeImportedJudgeRaw,
    renameImportedJudge: renameImportedJudgeRaw,
  } = useResultatsJudgeImport({
    clips,
    importedJudges,
    setImportedJudges,
  })

  const { applyCriterionValue } = useResultatsCriterionValue({
    currentBareme,
    importedJudges,
    judges,
    updateCriterion,
    markDirty,
    setImportedJudges,
  })

  const {
    criterionDraftCells,
    getCriterionCellKey,
    commitCriterionDraftCell,
    setCriterionDraftCell,
    clearCriterionDraftCell,
  } = useResultatsCriterionDraftCells({
    applyCriterionValue,
  })

  const removeImportedJudge = useCallback((index: number) => {
    removeImportedJudgeRaw(index)
    setMemberContextMenu(null)
  }, [removeImportedJudgeRaw, setMemberContextMenu])

  const renameImportedJudge = useCallback((index: number, nextName: string) => {
    return renameImportedJudgeRaw(index, nextName)
  }, [renameImportedJudgeRaw])

  return {
    importing,
    criterionDraftCells,
    selectedClipId,
    selectedClip,
    selectedClipFps,
    memberContextMenu,
    clipContextMenu,
    emptyContextMenu,
    memberContextMenuRef,
    clipContextMenuRef,
    emptyContextMenuRef,
    setSelectedClipId,
    setMemberContextMenu,
    setClipContextMenu,
    setEmptyContextMenu,
    setCriterionDraftCell,
    clearCriterionDraftCell,
    commitCriterionDraftCell,
    getCriterionCellKey,
    handleImportJudgeJson,
    removeImportedJudge,
    renameImportedJudge,
    openClipInNotation,
    jumpToTimecodeInNotation,
  }
}
