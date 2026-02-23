import { useCallback } from 'react'
import { useResultatsContextMenus } from '@/components/interfaces/resultats/hooks/useResultatsContextMenus'
import { useResultatsSelectedClip } from '@/components/interfaces/resultats/hooks/useResultatsSelectedClip'
import { useResultatsDraftCells } from '@/components/interfaces/resultats/hooks/useResultatsDraftCells'
import { useResultatsJudgeImport } from '@/components/interfaces/resultats/hooks/useResultatsJudgeImport'
import { useResultatsClipActions } from '@/components/interfaces/resultats/hooks/useResultatsClipActions'
import { useResultatsCategoryValue } from '@/components/interfaces/resultats/hooks/useResultatsCategoryValue'
import type { Bareme } from '@/types/bareme'
import type { Note } from '@/types/notation'
import type {
  Clip,
  ImportedJudgeData,
} from '@/types/project'
import type { CategoryGroup, JudgeSource } from '@/utils/results'

interface UseResultatsInteractionsParams {
  currentBareme: Bareme | null
  notes: Record<string, Note>
  clips: Clip[]
  sortedClips: Clip[]
  judges: JudgeSource[]
  categoryGroups: CategoryGroup[]
  importedJudges: ImportedJudgeData[]
  setImportedJudges: (judges: ImportedJudgeData[]) => void
  updateCriterion: (clipId: string, criterionId: string, value: number | string | boolean) => void
  markDirty: () => void
  setCurrentClip: (index: number) => void
  setShowPipVideo: (show: boolean) => void
  switchInterface: (next: 'spreadsheet' | 'modern') => void
  switchTab: (tab: 'notation' | 'resultats' | 'export') => void
}

export function useResultatsInteractions({
  currentBareme,
  notes,
  clips,
  sortedClips,
  judges,
  categoryGroups,
  importedJudges,
  setImportedJudges,
  updateCriterion,
  markDirty,
  setCurrentClip,
  setShowPipVideo,
  switchInterface,
  switchTab,
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
    memberContextMenuRef,
    clipContextMenuRef,
    setMemberContextMenu,
    setClipContextMenu,
  } = useResultatsContextMenus()

  const { openClipInNotation, jumpToTimecodeInNotation } = useResultatsClipActions({
    clips,
    setCurrentClip,
    setShowPipVideo,
    switchInterface,
    switchTab,
  })

  const {
    importing,
    handleImportJudgeJson,
    removeImportedJudge: removeImportedJudgeRaw,
  } = useResultatsJudgeImport({
    clips,
    importedJudges,
    setImportedJudges,
  })

  const { applyCategoryValue } = useResultatsCategoryValue({
    currentBareme,
    notes,
    categoryGroups,
    importedJudges,
    judges,
    updateCriterion,
    markDirty,
    setImportedJudges,
  })

  const {
    draftCells,
    getCellKey,
    commitDraftCell,
    setDraftCell,
    clearDraftCell,
  } = useResultatsDraftCells({
    applyCategoryValue,
  })

  const removeImportedJudge = useCallback((index: number) => {
    removeImportedJudgeRaw(index)
    setMemberContextMenu(null)
  }, [removeImportedJudgeRaw, setMemberContextMenu])

  return {
    importing,
    draftCells,
    selectedClipId,
    selectedClip,
    selectedClipFps,
    memberContextMenu,
    clipContextMenu,
    memberContextMenuRef,
    clipContextMenuRef,
    setSelectedClipId,
    setMemberContextMenu,
    setClipContextMenu,
    setDraftCell,
    clearDraftCell,
    commitDraftCell,
    getCellKey,
    handleImportJudgeJson,
    removeImportedJudge,
    openClipInNotation,
    jumpToTimecodeInNotation,
  }
}
