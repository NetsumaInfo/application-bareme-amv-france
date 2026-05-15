import { useCallback, useEffect, useMemo, useState } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useClipDeletionStore } from '@/store/useClipDeletionStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { ResultatsHeader } from '@/components/interfaces/resultats/ResultatsHeader'
import { ResultatsJudgeTable } from '@/components/interfaces/resultats/ResultatsJudgeTable'
import { ResultatsGlobalDetailedTable } from '@/components/interfaces/resultats/ResultatsGlobalDetailedTable'
import { ResultatsGlobalCategoryTable } from '@/components/interfaces/resultats/ResultatsGlobalCategoryTable'
import { ResultatsTopLists } from '@/components/interfaces/resultats/ResultatsTopLists'
import { ResultatsViewModeControls } from '@/components/interfaces/resultats/ResultatsViewModeControls'
import { ResultatsContestCategoryFilter } from '@/components/interfaces/resultats/ResultatsContestCategoryFilter'
import { ResultatsJudgeNotesView } from '@/components/interfaces/resultats/ResultatsJudgeNotesView'
import { ResultatsNotesPanel, type FavoriteJudgeEntry } from '@/components/interfaces/resultats/ResultatsNotesPanel'
import { ResultatsContextMenus } from '@/components/interfaces/resultats/ResultatsContextMenus'
import { ResultatsRenameJudgeModal } from '@/components/interfaces/resultats/ResultatsRenameJudgeModal'
import { useResultatsComputedData } from '@/components/interfaces/resultats/hooks/useResultatsComputedData'
import { useResultatsInteractions } from '@/components/interfaces/resultats/hooks/useResultatsInteractions'
import { DetachedFramePreview } from '@/components/notes/DetachedFramePreview'
import { useDetachedFramePreview } from '@/components/notes/detached/useDetachedFramePreview'
import type {
  ResultatsGlobalVariant,
  ResultatsMainView,
  ResultatsContestCategoryOption,
} from '@/components/interfaces/resultats/types'
import { CATEGORY_COLOR_PRESETS, sanitizeColor } from '@/utils/colors'
import { COLOR_MEMORY_KEYS, readStoredColor } from '@/utils/colorPickerStorage'
import { shouldHideResultsUntilAllScored } from '@/utils/resultsVisibility'
import {
  ALL_CONTEST_CATEGORY_KEY,
  getClipContestCategory,
  matchesContestCategoryKey,
} from '@/utils/contestCategory'
import { useI18n } from '@/i18n'
import type { ImportedJudgeNote } from '@/types/project'

type SortMode = 'folder' | 'score'
type RenameJudgeDialog = {
  judgeKey: string
  title: string
}

interface ResultatsViewState {
  mainView: ResultatsMainView
  globalVariant: ResultatsGlobalVariant
  selectedJudgeKey: string
  isJudgeNotesDetached: boolean
}

interface RenameJudgeState {
  dialog: RenameJudgeDialog | null
  value: string
  error: string | null
}

function useResultatsInterfaceController() {
  const { t } = useI18n()
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const notes = useNotationStore((state) => state.notes)
  const updateCriterion = useNotationStore((state) => state.updateCriterion)
  const { setShowPipVideo, shortcutBindings } = useUIStore()

  const {
    currentProject,
    clips,
    importedJudges,
    setImportedJudges,
    setResultNote,
    setClipFavorite,
    updateProject,
    updateSettings,
    markDirty,
    setCurrentClip,
  } = useProjectStore()
  const requestClipDeletion = useClipDeletionStore((state) => state.requestClipDeletion)
  const hideTotalsSetting = Boolean(currentProject?.settings.hideTotals)
  const hideTotalsUntilAllScored = shouldHideResultsUntilAllScored(
    currentProject,
    clips,
    currentBareme,
    (clipId) => notes[clipId],
  )
  const canSortByScore = !hideTotalsSetting && !hideTotalsUntilAllScored
  const showMiniatures = Boolean(currentProject?.settings.showMiniatures)
  const hasAnyLinkedVideo = clips.some((clip) => Boolean(clip.filePath))
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

  const [viewState, setViewState] = useState<ResultatsViewState>({
    mainView: 'global',
    globalVariant: 'detailed',
    selectedJudgeKey: 'current',
    isJudgeNotesDetached: false,
  })
  const [selectedContestCategoryKey, setSelectedContestCategoryKey] = useState<string>(ALL_CONTEST_CATEGORY_KEY)
  const [renameJudgeState, setRenameJudgeState] = useState<RenameJudgeState>({
    dialog: null,
    value: '',
    error: null,
  })
  const [hideResultNotes, setHideResultNotes] = useState(false)
  const [showFavoritesPanel, setShowFavoritesPanel] = useState(false)
  const {
    mainView,
    globalVariant,
    selectedJudgeKey,
    isJudgeNotesDetached,
  } = viewState
  const {
    dialog: renameJudgeDialog,
    value: renameJudgeValue,
    error: renameJudgeError,
  } = renameJudgeState
  const defaultPickerColor = readStoredColor(COLOR_MEMORY_KEYS.defaultColor)
  const judgeColors = judges.reduce<Record<string, string>>((acc, judge, index) => {
    const configured = currentProject?.settings.judgeColors?.[judge.key]
    acc[judge.key] = sanitizeColor(
      configured,
      defaultPickerColor ?? CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length],
    )
    return acc
  }, {})

  const contestCategoryOptions = useMemo<ResultatsContestCategoryOption[]>(() => {
    const options: ResultatsContestCategoryOption[] = [
      {
        key: ALL_CONTEST_CATEGORY_KEY,
        label: t('Toutes catégories'),
        count: sortedClips.length,
      },
    ]
    const categoryCounts = new Map<string, number>()

    for (const clip of sortedClips) {
      const category = getClipContestCategory(clip)
      if (!category) continue
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1)
    }

    for (const [category, count] of categoryCounts) {
      options.push({
        key: category,
        label: category,
        count,
      })
    }

    return options
  }, [sortedClips, t])

  const effectiveSelectedContestCategoryKey = useMemo(() => {
    if (contestCategoryOptions.some((option) => option.key === selectedContestCategoryKey)) {
      return selectedContestCategoryKey
    }
    return ALL_CONTEST_CATEGORY_KEY
  }, [contestCategoryOptions, selectedContestCategoryKey])

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesContestCategoryKey(row.clip, effectiveSelectedContestCategoryKey)),
    [effectiveSelectedContestCategoryKey, rows],
  )

  const filteredSortedClips = useMemo(
    () => sortedClips.filter((clip) => matchesContestCategoryKey(clip, effectiveSelectedContestCategoryKey)),
    [effectiveSelectedContestCategoryKey, sortedClips],
  )

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

    setRenameJudgeState({
      dialog: {
        judgeKey,
        title: judgeKey === 'current' ? t('Renommer le juge du projet') : t('Renommer le juge importé'),
      },
      value: targetJudge.judgeName,
      error: null,
    })
  }, [judges, t])
  const closeRenameJudgeDialog = useCallback(() => {
    setRenameJudgeState({
      dialog: null,
      value: '',
      error: null,
    })
  }, [])
  const setMainView = useCallback((nextMainView: ResultatsMainView) => {
    setViewState((current) => ({
      ...current,
      mainView: nextMainView,
    }))
  }, [])
  const setGlobalVariant = useCallback((nextGlobalVariant: ResultatsGlobalVariant) => {
    setViewState((current) => ({
      ...current,
      globalVariant: nextGlobalVariant,
    }))
  }, [])
  const setSelectedJudgeKey = useCallback((nextSelectedJudgeKey: string) => {
    setViewState((current) => ({
      ...current,
      selectedJudgeKey: nextSelectedJudgeKey,
    }))
  }, [])
  const setIsJudgeNotesDetached = useCallback((detached: boolean) => {
    setViewState((current) => ({
      ...current,
      isJudgeNotesDetached: detached,
    }))
  }, [])
  const openClipContextMenu = (clipId: string, x: number, y: number) => {
    setMemberContextMenu(null)
    setEmptyContextMenu(null)
    setClipContextMenu({ clipId, x, y })
  }

  const {
    criterionDraftCells,
    selectedClipId,
    selectedClip,
    selectedClipFps,
    isJsonDragOver,
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
    sortedClips: filteredSortedClips,
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
      setRenameJudgeState((current) => ({
        ...current,
        error: 'Le nom du juge ne peut pas être vide.',
      }))
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
      setRenameJudgeState((current) => ({
        ...current,
        error: 'Un juge importé avec ce nom existe déjà.',
      }))
      return
    }

    const renamed = renameImportedJudge(importedIndex, nextName)
    if (!renamed) {
      setRenameJudgeState((current) => ({
        ...current,
        error: 'Impossible de renommer ce juge.',
      }))
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
    clips: filteredSortedClips,
    selectedClipId,
    judges,
    categoryGroups,
    judgeColors,
  }), [categoryGroups, filteredSortedClips, judgeColors, judges, selectedClipId])

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

    listen<{ clipId?: string }>('resultats-notes:open-player', (event) => {
      const clipId = event.payload?.clipId
      if (!clipId) return
      openClipInNotation(clipId).catch(() => {})
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
  }, [
    emitDetachedJudgeNotesData,
    jumpToTimecodeInNotation,
    openClipInNotation,
    setIsJudgeNotesDetached,
    setSelectedClipId,
  ])

  useEffect(() => {
    if (!isJudgeNotesDetached) return
    emitDetachedJudgeNotesData()
  }, [emitDetachedJudgeNotesData, isJudgeNotesDetached])

  const selectedResultNoteText = selectedClip
    ? (currentProject?.resultNotes?.[selectedClip.id] ?? '')
    : ''
  const handleToggleFavoritesPanel = useCallback(() => {
    setShowFavoritesPanel((current) => !current)
  }, [])
  const handleToggleMiniatures = useCallback(() => {
    if (!hasAnyLinkedVideo) return
    updateSettings({ showMiniatures: !showMiniatures })
  }, [hasAnyLinkedVideo, showMiniatures, updateSettings])
  const handleUpdateFavoriteComment = useCallback((clipId: string, judgeKey: string, comment: string) => {
    if (!clipId) return
    if (judgeKey === 'current') {
      setClipFavorite(clipId, true, comment)
      return
    }

    const importedIndex = resolveImportedJudgeIndex(judgeKey)
    if (importedIndex === null || importedIndex >= importedJudges.length) return

    const nextImported = importedJudges.map((judge, index) => {
      if (index !== importedIndex) return judge
      const previous = judge.notes[clipId] ?? { scores: {} }
      const nextNote: ImportedJudgeNote = {
        ...previous,
        favorite: true,
        favoriteComment: comment,
      }
      return {
        ...judge,
        notes: {
          ...judge.notes,
          [clipId]: nextNote,
        },
      }
    })

    setImportedJudges(nextImported)
  }, [importedJudges, resolveImportedJudgeIndex, setClipFavorite, setImportedJudges])
  const favoriteJudgesForSelectedClip = useMemo<FavoriteJudgeEntry[]>(() => {
    if (!selectedClip) return []

    const entries: FavoriteJudgeEntry[] = []
    const currentJudge = judges.find((judge) => judge.isCurrentJudge)
    if (selectedClip.favorite) {
      entries.push({
        judgeKey: currentJudge?.key ?? 'current',
        judgeName: currentJudge?.judgeName ?? (currentProject?.judgeName?.trim() || 'Juge courant'),
        comment: selectedClip.favoriteComment?.trim() || '',
      })
    }

    for (const judge of judges) {
      if (judge.isCurrentJudge) continue
      const note = judge.notes[selectedClip.id] as unknown as {
        favorite?: unknown
        isFavorite?: unknown
        is_favorite?: unknown
        favoriteComment?: unknown
        favorite_comment?: unknown
      } | undefined
      if (!note || typeof note !== 'object') continue

      const favoriteRaw = note.favorite ?? note.isFavorite ?? note.is_favorite
      const isFavorite = typeof favoriteRaw === 'boolean'
        ? favoriteRaw
        : favoriteRaw === 1
          ? true
          : favoriteRaw === 'true'
            ? true
            : false
      if (!isFavorite) continue

      const favoriteCommentRaw = note.favoriteComment ?? note.favorite_comment
      const favoriteComment = typeof favoriteCommentRaw === 'string' ? favoriteCommentRaw.trim() : ''
      entries.push({
        judgeKey: judge.key,
        judgeName: judge.judgeName,
        comment: favoriteComment,
      })
    }

    return entries
  }, [currentProject?.judgeName, judges, selectedClip])

  if (!currentBareme) {
    return {
      renderContent: () => (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          {t('Aucun barème chargé')}
        </div>
      ),
    }
  }

  if (clips.length === 0) {
    return {
      renderContent: () => (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          {t('Aucun clip dans le projet')}
        </div>
      ),
    }
  }

  const renderContent = () => (
    <div
      className="relative flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden"
      onContextMenu={(event) => {
        const target = event.target as HTMLElement
        if (
          target.closest('input, textarea, [contenteditable="true"]') ||
          target.closest('[data-resultats-allow-native-context="true"]')
        ) {
          return
        }
        event.preventDefault()
        event.stopPropagation()
        setMemberContextMenu(null)
        setClipContextMenu(null)
        setEmptyContextMenu({ x: event.clientX, y: event.clientY })
      }}
    >
      {isJsonDragOver && (
        <div className="pointer-events-none absolute inset-1.5 z-50 flex items-center justify-center rounded-lg border border-dashed border-primary-400/80 bg-black/45 backdrop-blur-sm">
          <div className="rounded-md border border-white/10 bg-surface-dark/95 px-4 py-3 text-center shadow-xl">
            <div className="text-sm font-semibold text-white">{t('Déposez vos fichiers JSON de juge')}</div>
            <div className="mt-1 text-[11px] text-gray-400">{t('Importer un juge')}</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-px border-b border-gray-700/50 py-px">
        <ResultatsViewModeControls
          mainView={mainView}
          onMainViewChange={setMainView}
          globalVariant={globalVariant}
          onGlobalVariantChange={setGlobalVariant}
          notesPanelHidden={hideResultNotes}
          onToggleNotesPanel={() => setHideResultNotes((current) => !current)}
          favoritesPanelVisible={showFavoritesPanel}
          onToggleFavoritesPanel={handleToggleFavoritesPanel}
          showMiniatures={showMiniatures}
          hasAnyLinkedVideo={hasAnyLinkedVideo}
          onToggleMiniatures={handleToggleMiniatures}
        />

        <ResultatsHeader
          judges={judges}
          selectedJudgeKey={effectiveSelectedJudgeKey}
          judgeColors={judgeColors}
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
      </div>

      <ResultatsContestCategoryFilter
        options={contestCategoryOptions}
        selectedKey={effectiveSelectedContestCategoryKey}
        onSelect={setSelectedContestCategoryKey}
      />

      {filteredRows.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-gray-500">
          {t('Aucun clip dans cette catégorie')}
        </div>
      ) : null}

      {filteredRows.length > 0 && mainView === 'judge' && selectedJudge && (
        <ResultatsJudgeTable
          currentBaremeTotalPoints={currentBareme.totalPoints}
          categoryGroups={categoryGroups}
          judge={selectedJudge}
          judgeIndex={effectiveJudgeIndex}
          rows={filteredRows}
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

      {filteredRows.length > 0 && mainView === 'global' && globalVariant === 'detailed' && (
        <ResultatsGlobalDetailedTable
          canSortByScore={canSortByScore}
          currentBaremeTotalPoints={currentBareme.totalPoints}
          categoryGroups={categoryGroups}
          judges={judges}
          rows={filteredRows}
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

      {filteredRows.length > 0 && mainView === 'global' && globalVariant === 'category' && (
        <ResultatsGlobalCategoryTable
          currentBaremeTotalPoints={currentBareme.totalPoints}
          categoryGroups={categoryGroups}
          judges={judges}
          judgeColors={judgeColors}
          rows={filteredRows}
          selectedClipId={selectedClipId}
          onSelectClip={setSelectedClipId}
          onOpenClipInNotation={openClipInNotation}
          onOpenClipContextMenu={openClipContextMenu}
          showMiniatures={showMiniatures}
          thumbnailDefaultSeconds={thumbnailDefaultSeconds}
        />
      )}

      {filteredRows.length > 0 && mainView === 'top' && (
        <ResultatsTopLists
          canSortByScore={canSortByScore}
          judges={judges}
          rows={filteredRows}
          judgeColors={judgeColors}
          selectedClipId={selectedClipId}
          onSelectClip={setSelectedClipId}
          onOpenClipInNotation={openClipInNotation}
          showMiniatures={showMiniatures}
          thumbnailDefaultSeconds={thumbnailDefaultSeconds}
        />
      )}

      {filteredRows.length > 0 && mainView === 'judgeNotes' && (
        <ResultatsJudgeNotesView
          clips={filteredSortedClips}
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
        key={selectedClip?.id ?? 'resultats-notes-panel'}
        hidden={hideResultNotes}
        selectedClip={selectedClip}
        noteText={selectedResultNoteText}
        selectedClipFps={selectedClipFps}
        shortcutBindings={shortcutBindings}
        favoriteJudges={favoriteJudgesForSelectedClip}
        judgeColors={judgeColors}
        favoritesPanelVisible={showFavoritesPanel}
        onToggleFavoritesPanel={handleToggleFavoritesPanel}
        onUpdateFavoriteComment={handleUpdateFavoriteComment}
        onChangeText={(clipId, text) => {
          setResultNote(clipId, text)
        }}
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
        onRemoveClip={requestClipDeletion}
        hideGeneralNotes={hideResultNotes}
        onToggleGeneralNotes={() => setHideResultNotes((current) => !current)}
        showMiniatures={showMiniatures}
        hasAnyLinkedVideo={hasAnyLinkedVideo}
        onToggleMiniatures={handleToggleMiniatures}
      />

      {renameJudgeDialog && (
        <ResultatsRenameJudgeModal
          title={renameJudgeDialog.title}
          value={renameJudgeValue}
          errorMessage={renameJudgeError}
          onChangeValue={(nextValue) => {
            setRenameJudgeState((current) => ({
              ...current,
              value: nextValue,
              error: null,
            }))
          }}
          onCancel={closeRenameJudgeDialog}
          onConfirm={submitRenameJudgeDialog}
        />
      )}

      <DetachedFramePreview framePreview={framePreview} />
    </div>
  )

  return { renderContent }
}

export default function ResultatsInterface() {
  const { renderContent } = useResultatsInterfaceController()
  return renderContent()
}
