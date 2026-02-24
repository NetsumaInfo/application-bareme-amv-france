import { useState } from 'react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { ResultatsHeader } from '@/components/interfaces/resultats/ResultatsHeader'
import { ResultatsJudgeTable } from '@/components/interfaces/resultats/ResultatsJudgeTable'
import { ResultatsGlobalDetailedTable } from '@/components/interfaces/resultats/ResultatsGlobalDetailedTable'
import { ResultatsGlobalCategoryTable } from '@/components/interfaces/resultats/ResultatsGlobalCategoryTable'
import { ResultatsTopLists } from '@/components/interfaces/resultats/ResultatsTopLists'
import { ResultatsViewModeControls } from '@/components/interfaces/resultats/ResultatsViewModeControls'
import { ResultatsNotesPanel } from '@/components/interfaces/resultats/ResultatsNotesPanel'
import { ResultatsContextMenus } from '@/components/interfaces/resultats/ResultatsContextMenus'
import { useResultatsComputedData } from '@/components/interfaces/resultats/hooks/useResultatsComputedData'
import { useResultatsInteractions } from '@/components/interfaces/resultats/hooks/useResultatsInteractions'
import type {
  ResultatsGlobalVariant,
  ResultatsMainView,
} from '@/components/interfaces/resultats/types'
import { isNoteComplete } from '@/utils/scoring'
import { CATEGORY_COLOR_PRESETS, sanitizeColor } from '@/utils/colors'
import { COLOR_MEMORY_KEYS, readStoredColor } from '@/utils/colorPickerStorage'

type SortMode = 'folder' | 'score'

export default function ResultatsInterface() {
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const notes = useNotationStore((state) => state.notes)
  const updateCriterion = useNotationStore((state) => state.updateCriterion)
  const setTextNotes = useNotationStore((state) => state.setTextNotes)
  const { setShowPipVideo, hideTextNotes, setNotesDetached } = useUIStore()

  const {
    currentProject,
    clips,
    importedJudges,
    setImportedJudges,
    updateSettings,
    markDirty,
    setClipScored,
    setCurrentClip,
    removeClip,
  } = useProjectStore()
  const allClipsScored = clips.length > 0 && clips.every((clip) => {
    if (clip.scored) return true
    if (!currentBareme) return false
    const clipNote = notes[clip.id]
    return clipNote ? isNoteComplete(clipNote, currentBareme) : false
  })
  const hideTotalsSetting = Boolean(currentProject?.settings.hideTotals)
  const hideTotalsUntilAllScored = Boolean(currentProject?.settings.hideFinalScoreUntilEnd) && !allClipsScored
  const canSortByScore = !hideTotalsSetting && !hideTotalsUntilAllScored

  const sortMode: SortMode = 'score'
  const {
    categoryGroups,
    judges,
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

  const [mainView, setMainView] = useState<ResultatsMainView>('global')
  const [globalVariant, setGlobalVariant] = useState<ResultatsGlobalVariant>('detailed')
  const [selectedJudgeKey, setSelectedJudgeKey] = useState<string>('current')
  const defaultPickerColor = readStoredColor(COLOR_MEMORY_KEYS.defaultColor)
  const judgeColors = judges.reduce<Record<string, string>>((acc, judge, index) => {
    const configured = currentProject?.settings.judgeColors?.[judge.key]
    acc[judge.key] = sanitizeColor(
      configured,
      defaultPickerColor ?? CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length],
    )
    return acc
  }, {})

  const effectiveSelectedJudgeKey = judges.some((judge) => judge.key === selectedJudgeKey)
    ? selectedJudgeKey
    : (judges[0]?.key ?? '')

  const selectedJudgeIndex = judges.findIndex((judge) => judge.key === effectiveSelectedJudgeKey)
  const effectiveJudgeIndex = selectedJudgeIndex >= 0 ? selectedJudgeIndex : 0
  const selectedJudge = judges[effectiveJudgeIndex]

  const {
    importing,
    criterionDraftCells,
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
    setCriterionDraftCell,
    clearCriterionDraftCell,
    commitCriterionDraftCell,
    getCriterionCellKey,
    handleImportJudgeJson,
    removeImportedJudge,
    openClipInNotation,
    jumpToTimecodeInNotation,
  } = useResultatsInteractions({
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
        importedJudges={importedJudges}
        selectedJudgeKey={effectiveSelectedJudgeKey}
        judgeColors={judgeColors}
        onImportJudgeJson={() => { handleImportJudgeJson().catch(() => {}) }}
        onSelectJudge={setSelectedJudgeKey}
        onJudgeColorChange={(judgeKey, color) => {
          const next = {
            ...(currentProject?.settings.judgeColors ?? {}),
            [judgeKey]: sanitizeColor(color),
          }
          updateSettings({ judgeColors: next })
        }}
        onOpenMemberContextMenu={(index, x, y) => setMemberContextMenu({ index, x, y })}
      />

      <ResultatsViewModeControls
        mainView={mainView}
        onMainViewChange={setMainView}
        globalVariant={globalVariant}
        onGlobalVariantChange={setGlobalVariant}
      />

      {mainView === 'judge' && selectedJudge && (
        <ResultatsJudgeTable
          currentBaremeTotalPoints={currentBareme.totalPoints}
          categoryGroups={categoryGroups}
          judge={selectedJudge}
          judgeIndex={effectiveJudgeIndex}
          rows={rows}
          selectedClipId={selectedClipId}
          criterionDraftCells={criterionDraftCells}
          onSelectClip={setSelectedClipId}
          onOpenClipInNotation={openClipInNotation}
          onOpenClipContextMenu={(clipId, x, y) => setClipContextMenu({ clipId, x, y })}
          getCriterionCellKey={getCriterionCellKey}
          onSetCriterionDraftCell={setCriterionDraftCell}
          onCommitCriterionDraftCell={commitCriterionDraftCell}
          onClearCriterionDraftCell={clearCriterionDraftCell}
        />
      )}

      {mainView === 'global' && globalVariant === 'detailed' && (
        <ResultatsGlobalDetailedTable
          canSortByScore={canSortByScore}
          currentBaremeTotalPoints={currentBareme.totalPoints}
          categoryGroups={categoryGroups}
          judges={judges}
          rows={rows}
          judgeColors={judgeColors}
          selectedClipId={selectedClipId}
          criterionDraftCells={criterionDraftCells}
          onSelectClip={setSelectedClipId}
          onOpenClipInNotation={openClipInNotation}
          onOpenClipContextMenu={(clipId, x, y) => setClipContextMenu({ clipId, x, y })}
          getCriterionCellKey={getCriterionCellKey}
          onSetCriterionDraftCell={setCriterionDraftCell}
          onCommitCriterionDraftCell={commitCriterionDraftCell}
          onClearCriterionDraftCell={clearCriterionDraftCell}
        />
      )}

      {mainView === 'global' && globalVariant === 'category' && (
        <ResultatsGlobalCategoryTable
          currentBaremeTotalPoints={currentBareme.totalPoints}
          categoryGroups={categoryGroups}
          judges={judges}
          judgeColors={judgeColors}
          rows={rows}
          selectedClipId={selectedClipId}
          onSelectClip={setSelectedClipId}
          onOpenClipInNotation={openClipInNotation}
          onOpenClipContextMenu={(clipId, x, y) => setClipContextMenu({ clipId, x, y })}
        />
      )}

      {mainView === 'top' && (
        <ResultatsTopLists
          canSortByScore={canSortByScore}
          judges={judges}
          rows={rows}
          judgeColors={judgeColors}
          selectedClipId={selectedClipId}
          onSelectClip={setSelectedClipId}
          onOpenClipInNotation={openClipInNotation}
        />
      )}

      <ResultatsNotesPanel
        hidden={hideTextNotes}
        selectedClip={selectedClip}
        judges={mainView === 'judge' && selectedJudge ? [selectedJudge] : judges}
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
