import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { ResultatsHeader } from '@/components/interfaces/resultats/ResultatsHeader'
import { ResultatsTable } from '@/components/interfaces/resultats/ResultatsTable'
import { ResultatsNotesPanel } from '@/components/interfaces/resultats/ResultatsNotesPanel'
import { ResultatsContextMenus } from '@/components/interfaces/resultats/ResultatsContextMenus'
import { useResultatsComputedData } from '@/components/interfaces/resultats/hooks/useResultatsComputedData'
import { useResultatsInteractions } from '@/components/interfaces/resultats/hooks/useResultatsInteractions'

type SortMode = 'folder' | 'score'

export default function ResultatsInterface() {
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const notes = useNotationStore((state) => state.notes)
  const updateCriterion = useNotationStore((state) => state.updateCriterion)
  const setTextNotes = useNotationStore((state) => state.setTextNotes)
  const { switchTab, switchInterface, setShowPipVideo, hideTextNotes, setNotesDetached } = useUIStore()

  const {
    currentProject,
    clips,
    importedJudges,
    setImportedJudges,
    markDirty,
    setClipScored,
    setCurrentClip,
    removeClip,
  } = useProjectStore()
  const allClipsScored = clips.length > 0 && clips.every((clip) => clip.scored)
  const hideTotalsSetting = Boolean(currentProject?.settings.hideTotals)
  const hideTotalsUntilAllScored = Boolean(currentProject?.settings.hideFinalScoreUntilEnd) && !allClipsScored
  const canSortByScore = !hideTotalsSetting && !hideTotalsUntilAllScored

  const sortMode: SortMode = 'score'
  const {
    categoryGroups,
    judges,
    currentJudge,
    sortedClips,
    rows,
  } = useResultatsComputedData({
    currentBareme,
    currentJudgeName: currentProject?.judgeName,
    notes,
    importedJudges,
    clips,
    sortMode,
    canSortByScore,
  })

  const {
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
  } = useResultatsInteractions({
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
  })

  if (!currentBareme) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Aucun barème chargé
      </div>
    )
  }

  if (clips.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Aucun clip dans le projet
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      <ResultatsHeader
        importing={importing}
        judges={judges}
        currentJudgeName={currentJudge?.judgeName}
        importedJudges={importedJudges}
        onImportJudgeJson={() => { handleImportJudgeJson().catch(() => {}) }}
        onOpenMemberContextMenu={(index, x, y) => setMemberContextMenu({ index, x, y })}
      />

      <ResultatsTable
        canSortByScore={canSortByScore}
        currentBaremeTotalPoints={currentBareme.totalPoints}
        categoryGroups={categoryGroups}
        judges={judges}
        rows={rows}
        selectedClipId={selectedClipId}
        draftCells={draftCells}
        onSelectClip={setSelectedClipId}
        onOpenClipInNotation={openClipInNotation}
        onOpenClipContextMenu={(clipId, x, y) => setClipContextMenu({ clipId, x, y })}
        getCellKey={getCellKey}
        onSetDraftCell={setDraftCell}
        onCommitDraftCell={commitDraftCell}
        onClearDraftCell={clearDraftCell}
      />

      <ResultatsNotesPanel
        hidden={hideTextNotes}
        selectedClip={selectedClip}
        judges={judges}
        selectedClipFps={selectedClipFps}
        onSetCurrentJudgeText={(clipId, text) => {
          setTextNotes(clipId, text)
          markDirty()
        }}
        onJumpToTimecode={(clipId, seconds) => {
          jumpToTimecodeInNotation(clipId, seconds).catch(() => {})
        }}
      />

      <ResultatsContextMenus
        memberContextMenu={memberContextMenu}
        clipContextMenu={clipContextMenu}
        clips={clips}
        memberContextMenuRef={memberContextMenuRef}
        clipContextMenuRef={clipContextMenuRef}
        onCloseMemberMenu={() => setMemberContextMenu(null)}
        onCloseClipMenu={() => setClipContextMenu(null)}
        onRemoveImportedJudge={removeImportedJudge}
        onToggleClipScored={(clip) => setClipScored(clip.id, !clip.scored)}
        onOpenClipNotes={(clip) => {
          const index = clips.findIndex((item) => item.id === clip.id)
          if (index >= 0) setCurrentClip(index)
          tauri.openNotesWindow().then(() => setNotesDetached(true)).catch(() => {})
        }}
        onRemoveClip={removeClip}
      />
    </div>
  )
}
