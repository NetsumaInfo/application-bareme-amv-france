import { useCallback, useEffect, useMemo, useState } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
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
import { ResultatsJudgeNotesView } from '@/components/interfaces/resultats/ResultatsJudgeNotesView'
import { ResultatsNotesPanel } from '@/components/interfaces/resultats/ResultatsNotesPanel'
import { ResultatsContextMenus } from '@/components/interfaces/resultats/ResultatsContextMenus'
import { ResultatsRenameJudgeModal } from '@/components/interfaces/resultats/ResultatsRenameJudgeModal'
import { useResultatsComputedData } from '@/components/interfaces/resultats/hooks/useResultatsComputedData'
import { useResultatsInteractions } from '@/components/interfaces/resultats/hooks/useResultatsInteractions'
import { DetachedFramePreview } from '@/components/notes/DetachedFramePreview'
import { useDetachedFramePreview } from '@/components/notes/detached/useDetachedFramePreview'
import type {
  ResultatsGlobalVariant,
  ResultatsMainView,
} from '@/components/interfaces/resultats/types'
import { isNoteComplete } from '@/utils/scoring'
import { CATEGORY_COLOR_PRESETS, sanitizeColor } from '@/utils/colors'
import { COLOR_MEMORY_KEYS, readStoredColor } from '@/utils/colorPickerStorage'

type SortMode = 'folder' | 'score'
type RenameJudgeDialog = {
  judgeKey: string
  title: string
}

export default function ResultatsInterface() {
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const notes = useNotationStore((state) => state.notes)
  const updateCriterion = useNotationStore((state) => state.updateCriterion)
  const setTextNotes = useNotationStore((state) => state.setTextNotes)
  const { setShowPipVideo, hideTextNotes, toggleTextNotes } = useUIStore()

  const {
    currentProject,
    clips,
    importedJudges,
    setImportedJudges,
    updateProject,
    updateSettings,
    markDirty,
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
  const showMiniatures = Boolean(currentProject?.settings.showMiniatures)
  const thumbnailDefaultSeconds = currentProject?.settings.thumbnailDefaultTimeSec ?? 10

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
  const [isJudgeNotesDetached, setIsJudgeNotesDetached] = useState(false)
  const [renameJudgeDialog, setRenameJudgeDialog] = useState<RenameJudgeDialog | null>(null)
  const [renameJudgeValue, setRenameJudgeValue] = useState('')
  const [renameJudgeError, setRenameJudgeError] = useState<string | null>(null)
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
  const resolveImportedJudgeIndex = useCallback((judgeKey: string): number | null => {
    if (!judgeKey.startsWith('imported-')) return null
    const parsed = Number(judgeKey.replace('imported-', ''))
    if (!Number.isInteger(parsed) || parsed < 0 || parsed >= importedJudges.length) return null
    return parsed
  }, [importedJudges.length])
  const openRenameJudgeDialog = useCallback((judgeKey: string) => {
    const targetJudge = judges.find((judge) => judge.key === judgeKey)
    if (!targetJudge) return

    setRenameJudgeDialog({
      judgeKey,
      title: judgeKey === 'current' ? 'Renommer le juge du projet' : 'Renommer le juge importé',
    })
    setRenameJudgeValue(targetJudge.judgeName)
    setRenameJudgeError(null)
  }, [judges])
  const closeRenameJudgeDialog = useCallback(() => {
    setRenameJudgeDialog(null)
    setRenameJudgeValue('')
    setRenameJudgeError(null)
  }, [])
  const openClipContextMenu = (clipId: string, x: number, y: number) => {
    setMemberContextMenu(null)
    setEmptyContextMenu(null)
    setClipContextMenu({ clipId, x, y })
  }

  const {
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
  const submitRenameJudgeDialog = useCallback(() => {
    if (!renameJudgeDialog) return

    const nextName = renameJudgeValue.trim()
    if (!nextName) {
      setRenameJudgeError('Le nom du juge ne peut pas être vide.')
      return
    }

    if (renameJudgeDialog.judgeKey === 'current') {
      updateProject({ judgeName: nextName })
      closeRenameJudgeDialog()
      return
    }

    const importedIndex = resolveImportedJudgeIndex(renameJudgeDialog.judgeKey)
    if (importedIndex === null) {
      closeRenameJudgeDialog()
      return
    }

    const hasDuplicate = importedJudges.some((judge, judgeIndex) => (
      judgeIndex !== importedIndex && judge.judgeName.trim().toLowerCase() === nextName.toLowerCase()
    ))
    if (hasDuplicate) {
      setRenameJudgeError('Un juge importé avec ce nom existe déjà.')
      return
    }

    const renamed = renameImportedJudge(importedIndex, nextName)
    if (!renamed) {
      setRenameJudgeError('Impossible de renommer ce juge.')
      return
    }

    closeRenameJudgeDialog()
  }, [
    closeRenameJudgeDialog,
    importedJudges,
    renameImportedJudge,
    renameJudgeDialog,
    renameJudgeValue,
    resolveImportedJudgeIndex,
    updateProject,
  ])
  const { framePreview, hideFramePreview, showFramePreview } = useDetachedFramePreview(selectedClip?.filePath)

  const judgeNotesPayload = useMemo(() => ({
    clips,
    selectedClipId,
    judges,
    categoryGroups,
    judgeColors,
  }), [categoryGroups, clips, judgeColors, judges, selectedClipId])

  const emitDetachedJudgeNotesData = useCallback(() => {
    emit('main:resultats-judge-notes-data', judgeNotesPayload).catch(() => {})
  }, [judgeNotesPayload])

  useEffect(() => {
    const unlisteners: Array<() => void> = []
    let disposed = false
    const pushUnlisten = (unlisten: () => void) => {
      if (disposed) {
        unlisten()
        return
      }
      unlisteners.push(unlisten)
    }

    listen('resultats-notes:request-data', () => {
      emitDetachedJudgeNotesData()
    }).then(pushUnlisten)

    listen<{ clipId?: string }>('resultats-notes:select-clip', (event) => {
      const clipId = event.payload?.clipId
      if (!clipId) return
      setSelectedClipId(clipId)
    }).then(pushUnlisten)

    listen<{ clipId?: string; seconds?: number }>('resultats-notes:timecode-jump', (event) => {
      const clipId = event.payload?.clipId
      const seconds = Number(event.payload?.seconds ?? NaN)
      if (!clipId || !Number.isFinite(seconds) || seconds < 0) return
      jumpToTimecodeInNotation(clipId, seconds).catch(() => {})
    }).then(pushUnlisten)

    listen('resultats-notes:close', () => {
      setIsJudgeNotesDetached(false)
    }).then(pushUnlisten)

    return () => {
      disposed = true
      for (const unlisten of unlisteners) {
        unlisten()
      }
    }
  }, [emitDetachedJudgeNotesData, jumpToTimecodeInNotation, setSelectedClipId])

  useEffect(() => {
    if (!isJudgeNotesDetached) return
    emitDetachedJudgeNotesData()
  }, [emitDetachedJudgeNotesData, isJudgeNotesDetached])

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
    <div
      className="flex flex-col h-full p-3 gap-3"
      onContextMenu={(event) => {
        const target = event.target as HTMLElement
        if (
          target.closest('input, textarea, [contenteditable="true"]') ||
          target.closest('[data-resultats-allow-native-context="true"]')
        ) {
          return
        }
        event.preventDefault()
        const width = 230
        const height = selectedClip ? 210 : 58
        const x = Math.max(8, Math.min(event.clientX, window.innerWidth - width - 8))
        const y = Math.max(8, Math.min(event.clientY, window.innerHeight - height - 8))
        setMemberContextMenu(null)
        setClipContextMenu(null)
        setEmptyContextMenu({ x, y })
      }}
    >
      <ResultatsHeader
        importing={importing}
        judges={judges}
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
        onOpenMemberContextMenu={(judgeKey, x, y) => {
          setClipContextMenu(null)
          setEmptyContextMenu(null)
          setMemberContextMenu({ judgeKey, x, y })
        }}
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
          onOpenClipContextMenu={openClipContextMenu}
          getCriterionCellKey={getCriterionCellKey}
          onSetCriterionDraftCell={setCriterionDraftCell}
          onCommitCriterionDraftCell={commitCriterionDraftCell}
          onClearCriterionDraftCell={clearCriterionDraftCell}
          showMiniatures={showMiniatures}
          thumbnailDefaultSeconds={thumbnailDefaultSeconds}
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
          onOpenClipContextMenu={openClipContextMenu}
          getCriterionCellKey={getCriterionCellKey}
          onSetCriterionDraftCell={setCriterionDraftCell}
          onCommitCriterionDraftCell={commitCriterionDraftCell}
          onClearCriterionDraftCell={clearCriterionDraftCell}
          showMiniatures={showMiniatures}
          thumbnailDefaultSeconds={thumbnailDefaultSeconds}
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
          onOpenClipContextMenu={openClipContextMenu}
          showMiniatures={showMiniatures}
          thumbnailDefaultSeconds={thumbnailDefaultSeconds}
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
          showMiniatures={showMiniatures}
          thumbnailDefaultSeconds={thumbnailDefaultSeconds}
        />
      )}

      {mainView === 'judgeNotes' && (
        <ResultatsJudgeNotesView
          clips={sortedClips}
          selectedClipId={selectedClipId}
          judges={judges}
          categoryGroups={categoryGroups}
          judgeColors={judgeColors}
          onSelectClip={setSelectedClipId}
          onOpenPlayer={(clipId) => {
            openClipInNotation(clipId).catch(() => {})
          }}
          onJumpToTimecode={(clipId, seconds) => {
            jumpToTimecodeInNotation(clipId, seconds).catch(() => {})
          }}
          onTimecodeHover={({ seconds, anchorRect }) => {
            showFramePreview({ seconds, anchorRect }).catch(() => {})
          }}
          onTimecodeLeave={hideFramePreview}
          onDetach={() => {
            tauri.openResultatsJudgeNotesWindow()
              .then(() => {
                setIsJudgeNotesDetached(true)
                emitDetachedJudgeNotesData()
              })
              .catch(() => {})
          }}
        />
      )}

      <ResultatsNotesPanel
        hidden={hideTextNotes || mainView === 'judgeNotes'}
        selectedClip={selectedClip}
        judges={mainView === 'judge' && selectedJudge ? [selectedJudge] : judges}
        selectedClipFps={selectedClipFps}
        onSetCurrentJudgeText={(clipId, text) => {
          setTextNotes(clipId, text)
          markDirty()
        }}
        onClosePanel={toggleTextNotes}
        onJumpToTimecode={(clipId, seconds) => {
          jumpToTimecodeInNotation(clipId, seconds).catch(() => {})
        }}
        onTimecodeHover={({ seconds, anchorRect }) => {
          showFramePreview({ seconds, anchorRect }).catch(() => {})
        }}
        onTimecodeLeave={hideFramePreview}
      />

      <ResultatsContextMenus
        memberContextMenu={memberContextMenu}
        clipContextMenu={clipContextMenu}
        emptyContextMenu={emptyContextMenu}
        selectedClip={selectedClip}
        clips={clips}
        memberContextMenuRef={memberContextMenuRef}
        clipContextMenuRef={clipContextMenuRef}
        emptyContextMenuRef={emptyContextMenuRef}
        onCloseMemberMenu={() => setMemberContextMenu(null)}
        onCloseClipMenu={() => setClipContextMenu(null)}
        onCloseEmptyMenu={() => setEmptyContextMenu(null)}
        onRemoveImportedJudge={(judgeKey) => {
          const importedIndex = resolveImportedJudgeIndex(judgeKey)
          if (importedIndex === null) return
          removeImportedJudge(importedIndex)
        }}
        onRenameJudge={(judgeKey) => {
          openRenameJudgeDialog(judgeKey)
        }}
        onOpenClipInNotation={(clip) => {
          openClipInNotation(clip.id).catch(() => {})
        }}
        onOpenDetailedNotes={(clip) => {
          setSelectedClipId(clip.id)
          setMainView('judgeNotes')
        }}
        onImportJudgeJson={() => {
          handleImportJudgeJson().catch(() => {})
        }}
        onRemoveClip={removeClip}
      />

      {renameJudgeDialog && (
        <ResultatsRenameJudgeModal
          title={renameJudgeDialog.title}
          value={renameJudgeValue}
          errorMessage={renameJudgeError}
          onChangeValue={(nextValue) => {
            setRenameJudgeValue(nextValue)
            if (renameJudgeError) setRenameJudgeError(null)
          }}
          onCancel={closeRenameJudgeDialog}
          onConfirm={submitRenameJudgeDialog}
        />
      )}

      <DetachedFramePreview framePreview={framePreview} />
    </div>
  )
}
