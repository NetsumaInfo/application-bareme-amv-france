import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { ExportContextMenu } from '@/components/interfaces/export/ExportContextMenu'
import { ExportLayoutSwitcher } from '@/components/interfaces/export/ExportLayoutSwitcher'
import { ExportOptionsPanel } from '@/components/interfaces/export/ExportOptionsPanel'
import { ExportPosterOptionsPanel } from '@/components/interfaces/export/ExportPosterOptionsPanel'
import { ExportPreviewPanel } from '@/components/interfaces/export/ExportPreviewPanel'
import { ExportPosterPreviewPanel } from '@/components/interfaces/export/ExportPosterPreviewPanel'
import { ExportDiscordOptionsPanel } from '@/components/interfaces/export/ExportDiscordOptionsPanel'
import { ExportDiscordPreviewPanel } from '@/components/interfaces/export/ExportDiscordPreviewPanel'
import { ResultatsHeader } from '@/components/interfaces/resultats/ResultatsHeader'
import { ResultatsViewModeControls } from '@/components/interfaces/resultats/ResultatsViewModeControls'
import { useResultatsComputedData } from '@/components/interfaces/resultats/hooks/useResultatsComputedData'
import type {
  ExportDensity,
  ExportJsonMode,
  ExportLayout,
  ExportMode,
  ExportNotesPdfMode,
  ExportPngMode,
  ExportTableView,
  ExportTheme,
} from '@/components/interfaces/export/types'
import type {
  ResultatsGlobalVariant,
  ResultatsMainView,
} from '@/components/interfaces/resultats/types'
import { useExportActions } from '@/components/interfaces/export/hooks/useExportActions'
import { useExportData } from '@/components/interfaces/export/hooks/useExportData'
import { useExportPosterState } from '@/components/interfaces/export/hooks/useExportPosterState'
import { buildResultatsSpreadsheetSheets } from '@/components/interfaces/export/resultatsSpreadsheetExport'
import { CATEGORY_COLOR_PRESETS, sanitizeColor } from '@/utils/colors'
import { COLOR_MEMORY_KEYS, readStoredColor } from '@/utils/colorPickerStorage'
import { shouldHideResultsUntilAllScored } from '@/utils/resultsVisibility'
import { useI18n } from '@/i18n'
import {
  ALL_CONTEST_CATEGORY_KEY,
  getClipContestCategory,
  matchesContestCategoryKey,
  normalizeContestCategoryPresets,
} from '@/utils/contestCategory'
import {
  clamp,
  MAX_PNG_SCALE,
  MAX_ROWS_PER_IMAGE,
  MIN_PNG_SCALE,
  MIN_ROWS_PER_IMAGE,
  normalizeOptionalText,
  sanitizeExportFilePart,
} from '@/components/interfaces/export/exportInterfaceUtils'
import {
  buildDefaultDiscordAnnouncementSettings,
  buildDiscordAnnouncementContent,
  serializeDiscordResultAnnouncement,
  splitDiscordMessages,
  type DiscordAnnouncementContent,
  type DiscordAnnouncementFavoriteRow,
  type DiscordAnnouncementResultRow,
  type DiscordAnnouncementSettings,
} from '@/components/interfaces/export/discordAnnouncementTemplate'

async function writeClipboardText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!copied) throw new Error('Clipboard copy failed')
}

function downloadTextFile(fileName: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function MissingBaremeMessage() {
  const { t } = useI18n()

  return (
    <div className="flex h-full items-center justify-center text-sm text-gray-500">
      {t('Aucun barème chargé')}
    </div>
  )
}

function useExportInterfaceController() {
  const { t } = useI18n()
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const notes = useNotationStore((state) => state.notes)
  const getNotesData = useNotationStore((state) => state.getNotesData)
  const { currentProject, clips, importedJudges, updateSettings } = useProjectStore()
  const getProjectData = useProjectStore((state) => state.getProjectData)
  const appTheme = useUIStore((state) => state.appTheme)

  const [layoutMode, setLayoutMode] = useState<ExportLayout>('discord')
  const [theme] = useState<ExportTheme>('dark')
  const [density] = useState<ExportDensity>('comfortable')
  const [exportMode, setExportMode] = useState<ExportMode>('grouped')
  const [tableView, setTableView] = useState<ExportTableView>('detailed')
  const [resultatsMainView, setResultatsMainView] = useState<ResultatsMainView>('global')
  const [resultatsGlobalVariant, setResultatsGlobalVariant] = useState<ResultatsGlobalVariant>('detailed')
  const [pngExportMode, setPngExportMode] = useState<ExportPngMode>('single')
  const [notesPdfMode, setNotesPdfMode] = useState<ExportNotesPdfMode>('both')
  const [jsonExportMode, setJsonExportMode] = useState<ExportJsonMode>('full_project')
  const [jsonJudgeKey, setJsonJudgeKey] = useState<string>('current')
  const [pngScale, setPngScale] = useState(3)
  const [selectedJudgeKey, setSelectedJudgeKey] = useState<string>('current')
  const [contestCategoryKey, setContestCategoryKey] = useState<string>(ALL_CONTEST_CATEGORY_KEY)
  const accent = '#3b82f6'
  const decimals = 1
  const [rowsPerImage, setRowsPerImage] = useState(20)
  const [discordContent, setDiscordContent] = useState<DiscordAnnouncementContent>(() =>
    buildDiscordAnnouncementContent(t),
  )
  const [discordSettings, setDiscordSettings] = useState<DiscordAnnouncementSettings>(() =>
    buildDefaultDiscordAnnouncementSettings(20),
  )
  const [discordRowOverrides, setDiscordRowOverrides] = useState<Record<string, string>>({})
  const [discordSelectedChunkIndex, setDiscordSelectedChunkIndex] = useState(0)
  const [discordCopyState, setDiscordCopyState] = useState<'all' | 'chunk' | 'download' | 'error' | null>(null)
  const title = `${currentProject?.name || t('Projet')} - ${t('Résultats')}`

  const previewRef = useRef<HTMLDivElement | null>(null)
  const exportPageRefs = useRef<Array<HTMLDivElement | null>>([])
  const exportContextMenuRef = useRef<HTMLDivElement | null>(null)
  const [exportContextMenu, setExportContextMenu] = useState<{ x: number; y: number } | null>(null)

  const contestCategoryOptions = useMemo(() => {
    const presetCategories = normalizeContestCategoryPresets(currentProject?.settings.contestCategoryPresets ?? [])
    const usedCategories: string[] = []
    const seen = new Set<string>(presetCategories)
    for (const clip of clips) {
      const category = getClipContestCategory(clip)
      if (!category || seen.has(category)) continue
      seen.add(category)
      usedCategories.push(category)
    }
    return [
      { key: ALL_CONTEST_CATEGORY_KEY, label: t('Toutes catégories') },
      ...presetCategories.map((category) => ({ key: category, label: category })),
      ...usedCategories.map((category) => ({ key: category, label: category })),
    ]
  }, [clips, currentProject?.settings.contestCategoryPresets, t])

  const effectiveContestCategoryKey = useMemo(
    () => contestCategoryOptions.some((option) => option.key === contestCategoryKey)
      ? contestCategoryKey
      : ALL_CONTEST_CATEGORY_KEY,
    [contestCategoryKey, contestCategoryOptions],
  )

  const exportClips = useMemo(
    () => clips.filter((clip) => matchesContestCategoryKey(clip, effectiveContestCategoryKey)),
    [clips, effectiveContestCategoryKey],
  )

  const {
    categoryGroups,
    judges,
    selectedJudge,
    selectedJudgeIndex,
    displayRows,
    rankByClipId,
  } = useExportData({
    currentBareme,
    notes,
    currentProject,
    clips: exportClips,
    importedJudges,
    exportMode,
    selectedJudgeKey,
    onSelectedJudgeKeyChange: setSelectedJudgeKey,
  })

  const hideTotalsSetting = Boolean(currentProject?.settings.hideTotals)
  const hideTotalsUntilAllScored = shouldHideResultsUntilAllScored(
    currentProject,
    exportClips,
    currentBareme,
    (clipId) => notes[clipId],
  )
  const canSortByScore = !hideTotalsSetting && !hideTotalsUntilAllScored
  const {
    categoryGroups: resultatsCategoryGroups,
    judges: resultatsJudges,
    rows: resultatsRows,
  } = useResultatsComputedData({
    currentBareme,
    currentJudgeName: currentProject?.judgeName,
    notes,
    importedJudges,
    clips: exportClips,
    sortMode: 'score',
    canSortByScore,
  })
  const resultatsSelectedJudgeIndex = useMemo(() => {
    const index = resultatsJudges.findIndex((judge) => judge.key === selectedJudgeKey)
    return index >= 0 ? index : 0
  }, [resultatsJudges, selectedJudgeKey])
  const defaultPickerColor = readStoredColor(COLOR_MEMORY_KEYS.defaultColor)
  const judgeColors = useMemo(() => (
    resultatsJudges.reduce<Record<string, string>>((acc, judge, index) => {
      const configured = currentProject?.settings.judgeColors?.[judge.key]
      acc[judge.key] = sanitizeColor(
        configured,
        defaultPickerColor ?? CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length],
      )
      return acc
    }, {})
  ), [currentProject?.settings.judgeColors, defaultPickerColor, resultatsJudges])
  const resultatsSpreadsheetSheets = useMemo(() => (
    buildResultatsSpreadsheetSheets({
      mainView: resultatsMainView,
      globalVariant: resultatsGlobalVariant,
      currentBaremeTotalPoints: currentBareme?.totalPoints ?? 0,
      categoryGroups: resultatsCategoryGroups,
      judges: resultatsJudges,
      rows: resultatsRows,
      selectedJudgeIndex: resultatsSelectedJudgeIndex,
      translate: t,
    })
  ), [
    currentBareme?.totalPoints,
    resultatsCategoryGroups,
    resultatsGlobalVariant,
    resultatsJudges,
    resultatsMainView,
    resultatsRows,
    resultatsSelectedJudgeIndex,
    t,
  ])

  const projectName = currentProject?.name || 'resultats'
  const favoriteClips = useMemo(
    () => exportClips.filter((clip) => clip.favorite),
    [exportClips],
  )
  const notesData = useMemo(() => getNotesData(), [getNotesData])
  const exportClipIdSet = useMemo(
    () => new Set(exportClips.map((clip) => clip.id)),
    [exportClips],
  )
  const filteredNotesData = useMemo(
    () => Object.fromEntries(
      Object.entries(notesData).filter(([clipId]) => exportClipIdSet.has(clipId)),
    ),
    [exportClipIdSet, notesData],
  )
  const filteredImportedJudges = useMemo(
    () => importedJudges.map((judge) => ({
      ...judge,
      notes: Object.fromEntries(
        Object.entries(judge.notes).filter(([clipId]) => exportClipIdSet.has(clipId)),
      ),
    })),
    [exportClipIdSet, importedJudges],
  )
  const fullProjectData = useMemo(
    () => getProjectData(notesData, currentBareme),
    [currentBareme, getProjectData, notesData],
  )
  const fullProjectDataFiltered = useMemo(() => {
    if (!fullProjectData) return null
    return {
      ...fullProjectData,
      project: {
        ...fullProjectData.project,
        resultNotes: Object.fromEntries(
          Object.entries(fullProjectData.project.resultNotes ?? {})
            .filter(([clipId]) => exportClipIdSet.has(clipId)),
        ),
      },
      clips: exportClips,
      notes: filteredNotesData,
      importedJudges: filteredImportedJudges,
    }
  }, [
    exportClipIdSet,
    exportClips,
    filteredImportedJudges,
    filteredNotesData,
    fullProjectData,
  ])
  const formatScore = useCallback((value: number) => value.toFixed(decimals), [decimals])
  const discordResultRows = useMemo<DiscordAnnouncementResultRow[]>(() => (
    resultatsRows.map((row, index) => ({
      clipId: row.clip.id,
      rank: index + 1,
      participant: getClipPrimaryLabel(row.clip),
      clipName: getClipSecondaryLabel(row.clip) ?? '',
      score: row.averageTotal,
      totalPoints: currentBareme?.totalPoints ?? 0,
    }))
  ), [currentBareme?.totalPoints, resultatsRows])
  const discordFavoriteRows = useMemo<DiscordAnnouncementFavoriteRow[]>(() => (
    favoriteClips.map((clip) => ({
      clipId: clip.id,
      participant: getClipPrimaryLabel(clip),
      clipName: getClipSecondaryLabel(clip) ?? '',
      comment: clip.favoriteComment ?? '',
    }))
  ), [favoriteClips])
  const discordText = useMemo(() => (
    serializeDiscordResultAnnouncement({
      content: discordContent,
      rows: discordResultRows,
      favoriteRows: discordFavoriteRows,
      rowOverrides: discordRowOverrides,
      settings: discordSettings,
    })
  ), [discordContent, discordFavoriteRows, discordResultRows, discordRowOverrides, discordSettings])
  const discordChunks = useMemo(() => splitDiscordMessages(discordText), [discordText])
  const safeDiscordSelectedChunkIndex = Math.min(
    Math.max(discordSelectedChunkIndex, 0),
    Math.max(discordChunks.length - 1, 0),
  )

  const patchDiscordContent = useCallback((patch: Partial<DiscordAnnouncementContent>) => {
    setDiscordContent((current) => ({ ...current, ...patch }))
  }, [])

  const patchDiscordSettings = useCallback((patch: Partial<DiscordAnnouncementSettings>) => {
    setDiscordSettings((current) => {
      const next = { ...current, ...patch }
      const maxRows = Math.max(discordResultRows.length, 1)
      next.topCount = clamp(next.topCount, 1, maxRows)
      next.scoreDecimals = clamp(Math.round(next.scoreDecimals), 0, 2)
      return next
    })
  }, [discordResultRows.length])

  const setDiscordRowOverride = useCallback((clipId: string, value: string) => {
    setDiscordRowOverrides((current) => ({ ...current, [clipId]: value }))
  }, [])

  useEffect(() => {
    if (!discordCopyState) return
    const timeoutId = window.setTimeout(() => setDiscordCopyState(null), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [discordCopyState])

  const copyDiscordText = useCallback((value: string, state: 'all' | 'chunk') => {
    writeClipboardText(value)
      .then(() => setDiscordCopyState(state))
      .catch(() => setDiscordCopyState('error'))
  }, [])

  const resetDiscordAnnouncement = useCallback(() => {
    setDiscordContent(buildDiscordAnnouncementContent(t, currentProject?.name))
    setDiscordSettings(buildDefaultDiscordAnnouncementSettings(discordResultRows.length))
    setDiscordRowOverrides({})
    setDiscordSelectedChunkIndex(0)
  }, [currentProject?.name, discordResultRows.length, t])

  const downloadDiscordAnnouncement = useCallback(() => {
    const safeProjectName = sanitizeExportFilePart(currentProject?.name || 'annonce')
    downloadTextFile(`${safeProjectName}_discord.txt`, discordText)
    setDiscordCopyState('download')
  }, [currentProject?.name, discordText])

  const getDisplayTotal = useCallback((row: (typeof displayRows)[number]) => {
    return exportMode === 'individual'
      ? (row.judgeTotals[selectedJudgeIndex] ?? 0)
      : row.averageTotal
  }, [exportMode, selectedJudgeIndex])

  const {
    safePosterWidth,
    safePosterHeight,
    selectedSizePreset,
    posterBackgroundColor,
    effectivePosterBackgroundColor,
    posterBackgroundColorPresets,
    posterBackgroundImage,
    backgroundImageSizeLabel,
    backgroundRenderedSizeLabel,
    posterBackgroundPositionXPct,
    posterBackgroundPositionYPct,
    posterBackgroundDragEnabled,
    posterBackgroundScaleXPct,
    posterBackgroundScaleYPct,
    posterOverlayOpacity,
    posterBlocks,
    activePosterBlockId,
    posterImages,
    activePosterImageId,
    normalizedTopCount,
    includeClipNameInTop,
    includeScoreInTop,
    generatedTopText,
    copiedTop,
    filteredFontOptions,
    fontSearch,
    loadingSystemFonts,
    fontLoadMessage,
    posterPreviewZoomPct,
    activeImageSizeLabel,
    setActivePosterBlockId,
    setActivePosterImageId,
    setPosterBackgroundColor,
    setPosterBackgroundDragEnabled,
    setPosterOverlayOpacity,
    setIncludeClipNameInTop,
    setIncludeScoreInTop,
    setFontSearch,
    loadSystemFonts,
    patchPosterBlock,
    movePosterBlock,
    patchPosterImage,
    reorderPosterImage,
    movePosterImage,
    removePosterImage,
    resetPosterLayout,
    handleUploadBackground,
    handleUploadOverlayImage,
    generateTopIntoBlock,
    copyTopToClipboard,
    applySizePreset,
    clearBackground,
    setPosterWidthSafe,
    setPosterHeightSafe,
    setBackgroundPositionXPctSafe,
    setBackgroundPositionYPctSafe,
    setBackgroundScaleXPctSafe,
    setBackgroundScaleYPctSafe,
    setBackgroundScaleUniformSafe,
    setPreviewZoomPctSafe,
    setTopCountSafe,
    moveBackground,
  } = useExportPosterState({
    currentProjectName: currentProject?.name,
    projectName,
    appTheme,
    displayRows,
    formatScore,
    getDisplayTotal,
  })

  const notesPdfPayload = useMemo(() => {
    const criterionNameById = new Map(
      (currentBareme?.criteria ?? []).map((criterion) => [criterion.id, criterion.name]),
    )

    return {
      mode: notesPdfMode,
      title: title.trim() || `${projectName} - Notes`,
      entries: displayRows.map((row) => {
        const generalNote = normalizeOptionalText(currentProject?.resultNotes?.[row.clip.id])

        const judgesEntries = judges.map((judge) => {
          const note = judge.notes[row.clip.id] as {
            textNotes?: string
            categoryNotes?: Record<string, string>
            criterionNotes?: Record<string, string>
          } | undefined

          const judgeGeneral = normalizeOptionalText(note?.textNotes)
          const categoryNotes = Object.entries(note?.categoryNotes ?? {})
            .map(([category, text]) => ({ category, text: normalizeOptionalText(text) }))
            .filter((item) => item.text.length > 0)
          const criterionNotes = Object.entries(note?.criterionNotes ?? {})
            .map(([criterionId, text]) => ({
              criterion: criterionNameById.get(criterionId) ?? criterionId,
              text: normalizeOptionalText(text),
            }))
            .filter((item) => item.text.length > 0)

          const hasAnyText = judgeGeneral.length > 0 || categoryNotes.length > 0 || criterionNotes.length > 0
          if (!hasAnyText) return null

          return {
            judgeName: judge.judgeName,
            generalNote: judgeGeneral,
            categoryNotes,
            criterionNotes,
          }
        }).filter((entry): entry is {
          judgeName: string
          generalNote: string
          categoryNotes: Array<{ category: string; text: string }>
          criterionNotes: Array<{ criterion: string; text: string }>
        } => Boolean(entry))

        return {
          primary: getClipPrimaryLabel(row.clip),
          secondary: getClipSecondaryLabel(row.clip) ?? '',
          generalNote,
          judges: judgesEntries,
        }
      }),
    }
  }, [currentBareme?.criteria, currentProject?.resultNotes, displayRows, judges, notesPdfMode, projectName, title])

  const jsonJudgeOptions = useMemo(
    () => judges.map((judge) => ({ key: judge.key, judgeName: judge.judgeName })),
    [judges],
  )

  const exportCaptureOptions = useMemo(() => {
    if (layoutMode === 'poster') {
      return {
        scale: 1,
        backgroundColor: effectivePosterBackgroundColor,
        pngMode: 'single' as ExportPngMode,
        fileNameStem: `${sanitizeExportFilePart(projectName)}_affiche`,
      }
    }
    return {
      scale: clamp(pngScale, MIN_PNG_SCALE, MAX_PNG_SCALE),
      backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
      pngMode: pngExportMode,
      fileNameStem: `${sanitizeExportFilePart(projectName)}_resultats`,
    }
  }, [effectivePosterBackgroundColor, layoutMode, pngExportMode, pngScale, projectName, theme])

  const exportSnapshot = useMemo(() => ({
    exportedAt: new Date().toISOString(),
    projectName: currentProject?.name || '',
    judgeCount: judges.length,
    exportOptions: {
      layoutMode,
      exportMode,
      tableView,
      resultatsMainView,
      resultatsGlobalVariant,
      contestCategory: effectiveContestCategoryKey === ALL_CONTEST_CATEGORY_KEY ? null : effectiveContestCategoryKey,
      exportedClipCount: exportClips.length,
      selectedJudge: selectedJudge?.judgeName ?? null,
      notesPdfMode,
      jsonExportMode,
      jsonJudge: judges.find((judge) => judge.key === jsonJudgeKey)?.judgeName ?? null,
      theme,
      density,
      decimals,
      accent,
      pngScale,
      pngExportMode,
      rowsPerImage,
    },
    poster: {
      width: safePosterWidth,
      height: safePosterHeight,
      backgroundColor: effectivePosterBackgroundColor,
      backgroundColorMode: posterBackgroundColor ? 'custom' : 'theme',
      hasBackgroundImage: Boolean(posterBackgroundImage),
      backgroundPositionXPct: posterBackgroundPositionXPct,
      backgroundPositionYPct: posterBackgroundPositionYPct,
      backgroundDragEnabled: posterBackgroundDragEnabled,
      backgroundScaleXPct: posterBackgroundScaleXPct,
      backgroundScaleYPct: posterBackgroundScaleYPct,
      backgroundScalePct: (posterBackgroundScaleXPct + posterBackgroundScaleYPct) / 2,
      overlayOpacity: posterOverlayOpacity,
      topCount: normalizedTopCount,
      includeClipNameInTop,
      includeScoreInTop,
      generatedTopText,
      blocks: posterBlocks,
      imageLayers: posterImages,
    },
    rows: displayRows.map((row) => ({
      clipId: row.clip.id,
      rank: rankByClipId.get(row.clip.id) ?? null,
      pseudo: getClipPrimaryLabel(row.clip),
      clipName: getClipSecondaryLabel(row.clip),
      favorite: Boolean(row.clip.favorite),
      favoriteComment: row.clip.favoriteComment ?? '',
      categoryAverages: row.categoryAverages,
      averageTotal: row.averageTotal,
      displayedTotal:
        exportMode === 'individual'
          ? (row.judgeTotals[selectedJudgeIndex] ?? 0)
          : row.averageTotal,
      categoryByJudge: categoryGroups.reduce<Record<string, Record<string, number>>>((acc, group) => {
        acc[group.category] = judges.reduce<Record<string, number>>((judgeMap, judge, judgeIndex) => {
          judgeMap[judge.judgeName] = row.categoryJudgeScores[group.category][judgeIndex] ?? 0
          return judgeMap
        }, {})
        return acc
      }, {}),
      judgeTotals: judges.reduce<Record<string, number>>((acc, judge, index) => {
        acc[judge.judgeName] = row.judgeTotals[index] ?? 0
        return acc
      }, {}),
    })),
  }), [
    accent,
    categoryGroups,
    effectiveContestCategoryKey,
    currentProject?.name,
    decimals,
    density,
    displayRows,
    exportClips.length,
    exportMode,
    jsonExportMode,
    jsonJudgeKey,
    tableView,
    notesPdfMode,
    generatedTopText,
    includeClipNameInTop,
    includeScoreInTop,
    judges,
    layoutMode,
    normalizedTopCount,
    pngScale,
    pngExportMode,
    posterBackgroundColor,
    posterBackgroundImage,
    posterBackgroundPositionXPct,
    posterBackgroundPositionYPct,
    posterBackgroundDragEnabled,
    posterBackgroundScaleXPct,
    posterBackgroundScaleYPct,
    effectivePosterBackgroundColor,
    posterBlocks,
    posterImages,
    posterOverlayOpacity,
    rankByClipId,
    safePosterHeight,
    safePosterWidth,
    selectedJudge?.judgeName,
    selectedJudgeIndex,
    rowsPerImage,
    resultatsGlobalVariant,
    resultatsMainView,
    theme,
  ])

  const jsonPayload = useMemo(() => {
    const exportedAt = new Date().toISOString()
    const clipEntries = exportClips.map((clip) => ({
      id: clip.id,
      fileName: clip.fileName,
      displayName: clip.displayName,
      author: clip.author,
      contestCategory: getClipContestCategory(clip) || null,
      filePath: clip.filePath,
      duration: clip.duration,
      order: clip.order,
      scored: clip.scored,
      thumbnailTime: clip.thumbnailTime ?? null,
      favorite: Boolean(clip.favorite),
      favoriteComment: clip.favoriteComment ?? '',
    }))

    if (jsonExportMode === 'full_project') {
      return {
        version: '1.0',
        type: 'full-project-export',
        exportedAt,
        projectName,
        bareme: currentBareme,
        projectData: fullProjectDataFiltered,
        exportSnapshot,
      }
    }

    if (jsonExportMode === 'single_judge') {
      const targetJudge = judges.find((judge) => judge.key === jsonJudgeKey) ?? judges[0]
      const judgeNotes = targetJudge?.isCurrentJudge
        ? filteredNotesData
        : (
            filteredImportedJudges[Number((targetJudge?.key ?? '').replace('imported-', ''))]?.notes
            ?? {}
          )

      return {
        version: '1.0',
        type: 'judge-export',
        exportedAt,
        projectName,
        judgeName: targetJudge?.judgeName ?? currentProject?.judgeName ?? 'juge',
        judgeKey: targetJudge?.key ?? 'current',
        baremeId: currentProject?.baremeId ?? currentBareme?.id ?? null,
        bareme: currentBareme,
        clips: clipEntries,
        notes: judgeNotes,
        exportSnapshot,
      }
    }

    return {
      version: '1.0',
      type: 'notes-only-export',
      exportedAt,
      projectName,
      baremeId: currentProject?.baremeId ?? currentBareme?.id ?? null,
      bareme: currentBareme,
      clips: clipEntries,
      notes: {
        currentJudge: {
          judgeName: currentProject?.judgeName ?? 'juge',
          notes: filteredNotesData,
        },
        importedJudges: filteredImportedJudges,
      },
      exportSnapshot,
    }
  }, [
    currentBareme,
    currentProject?.baremeId,
    currentProject?.judgeName,
    exportClips,
    exportSnapshot,
    filteredImportedJudges,
    filteredNotesData,
    fullProjectDataFiltered,
    jsonExportMode,
    jsonJudgeKey,
    judges,
    projectName,
  ])

  const jsonDefaultFileName = useMemo(() => {
    const safeProjectName = sanitizeExportFilePart(projectName)
    if (jsonExportMode === 'full_project') return `${safeProjectName}_projet_complet.json`
    if (jsonExportMode === 'notes_only') return `${safeProjectName}_notes.json`
    const judgeName = judges.find((judge) => judge.key === jsonJudgeKey)?.judgeName ?? 'juge'
    const safeJudge = sanitizeExportFilePart(judgeName)
    return `${safeProjectName}_${safeJudge}.json`
  }, [jsonExportMode, jsonJudgeKey, judges, projectName])

  const {
    exporting,
    exportContainer,
    exportJson,
    exportSpreadsheet,
    exportHtml,
    exportNotesPdf,
  } = useExportActions({
    previewRef,
    exportPageRefs,
    theme,
    projectName,
    jsonPayload,
    jsonDefaultFileName,
    notesPdfPayload,
    spreadsheetSheets: resultatsSpreadsheetSheets,
  })

  // Listen for the screenshot shortcut event (Ctrl+Shift+G) so the keyboard
  // shortcut handler can trigger the real PNG export pipeline without needing
  // access to exportContainer or exportCaptureOptions through the component tree.
  useEffect(() => {
    const handleScreenshot = () => {
      if (layoutMode === 'discord') return
      exportContainer('png', exportCaptureOptions).catch(() => {})
    }
    window.addEventListener('amv:export-screenshot', handleScreenshot)
    return () => {
      window.removeEventListener('amv:export-screenshot', handleScreenshot)
    }
  }, [exportCaptureOptions, exportContainer, layoutMode])

  useEffect(() => {
    if (!exportContextMenu) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (target && exportContextMenuRef.current?.contains(target)) return
      setExportContextMenu(null)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExportContextMenu(null)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [exportContextMenu])

  const renderContent = () => (
    <div
      className="relative flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden"
      onContextMenu={(event) => {
        const target = event.target as HTMLElement
        if (
          target.closest('input, textarea, select, button, a, [contenteditable="true"]')
          || target.closest('[data-native-context="true"]')
        ) {
          return
        }
        event.preventDefault()
        event.stopPropagation()
        setExportContextMenu({ x: event.clientX, y: event.clientY })
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3 gap-y-0 border-b border-gray-700/50 py-0">
        <div className="min-w-0 justify-self-start">
          <ExportLayoutSwitcher layoutMode={layoutMode} onSetLayoutMode={setLayoutMode} />
        </div>
        {layoutMode === 'table' ? (
          <div className="min-w-0 justify-self-center">
            <ResultatsViewModeControls
              mainView={resultatsMainView}
              onMainViewChange={(view) => {
                setResultatsMainView(view)
                setExportMode(view === 'judge' ? 'individual' : 'grouped')
              }}
              globalVariant={resultatsGlobalVariant}
              onGlobalVariantChange={(variant) => {
                setResultatsGlobalVariant(variant)
                setTableView(variant === 'detailed' ? 'detailed' : 'summary')
              }}
              notesPanelHidden
              onToggleNotesPanel={() => {}}
              showMiniatures={Boolean(currentProject?.settings.showMiniatures)}
              hasAnyLinkedVideo={false}
              onToggleMiniatures={() => {}}
              showJudgeNotesView={false}
              showNotesPanelToggle={false}
            />
          </div>
        ) : (
          <div aria-hidden="true" />
        )}
        {layoutMode === 'table' ? (
          <div className="min-w-0 justify-self-end">
            <ResultatsHeader
              judges={resultatsJudges}
              selectedJudgeKey={selectedJudgeKey}
              judgeColors={judgeColors}
              onSelectJudge={setSelectedJudgeKey}
              onJudgeColorChange={(judgeKey, color) => {
                const next = {
                  ...(currentProject?.settings.judgeColors ?? {}),
                  [judgeKey]: sanitizeColor(color),
                }
                updateSettings({ judgeColors: next })
              }}
              onOpenMemberContextMenu={() => {}}
            />
          </div>
        ) : (
          <div aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-[300px] shrink-0 min-h-0 flex flex-col gap-0 overflow-y-auto border-r border-gray-700/40 py-2">

        {layoutMode === 'discord' ? (
          <ExportDiscordOptionsPanel
            mention={discordContent.mention}
            textLength={discordText.length}
            chunks={discordChunks}
            selectedChunkIndex={safeDiscordSelectedChunkIndex}
            copyState={discordCopyState}
            resultCount={discordResultRows.length}
            favoriteCount={discordFavoriteRows.length}
            settings={discordSettings}
            contestCategoryKey={effectiveContestCategoryKey}
            contestCategoryOptions={contestCategoryOptions}
            onSetMention={(mention) => patchDiscordContent({ mention })}
            onSelectChunk={setDiscordSelectedChunkIndex}
            onPatchSettings={patchDiscordSettings}
            onSetContestCategoryKey={setContestCategoryKey}
            onCopyAll={() => copyDiscordText(discordText, 'all')}
            onCopySelectedChunk={() => copyDiscordText(discordChunks[safeDiscordSelectedChunkIndex] ?? discordText, 'chunk')}
            onDownloadText={downloadDiscordAnnouncement}
            onResetAnnouncement={resetDiscordAnnouncement}
          />
        ) : layoutMode === 'table' ? (
          currentBareme ? (
          <div className="px-3">
          <ExportOptionsPanel
            exportMode={exportMode}
            tableView={tableView}
            selectedJudgeKey={selectedJudgeKey}
            pngExportMode={pngExportMode}
            pngScale={pngScale}
            rowsPerImage={rowsPerImage}
            judges={judges}
            exporting={exporting}
            notesPdfMode={notesPdfMode}
            jsonExportMode={jsonExportMode}
            jsonJudgeKey={jsonJudgeKey}
            jsonJudgeOptions={jsonJudgeOptions}
            contestCategoryKey={effectiveContestCategoryKey}
            contestCategoryOptions={contestCategoryOptions}
            onSetExportMode={(mode) => {
              setExportMode(mode)
              setResultatsMainView(mode === 'individual' ? 'judge' : 'global')
            }}
            onSetTableView={(view) => {
              setTableView(view)
              setResultatsMainView('global')
              setResultatsGlobalVariant(view === 'detailed' ? 'detailed' : 'category')
            }}
            onSetSelectedJudgeKey={setSelectedJudgeKey}
            onSetPngExportMode={setPngExportMode}
            onSetPngScale={(value) => {
              const safe = Number.isFinite(value) ? value : MIN_PNG_SCALE
              setPngScale(clamp(safe, MIN_PNG_SCALE, MAX_PNG_SCALE))
            }}
            onSetNotesPdfMode={setNotesPdfMode}
            onSetRowsPerImage={(value) => {
              const safe = Number.isFinite(value) ? value : MIN_ROWS_PER_IMAGE
              setRowsPerImage(clamp(safe, MIN_ROWS_PER_IMAGE, MAX_ROWS_PER_IMAGE))
            }}
            onSetJsonExportMode={setJsonExportMode}
            onSetJsonJudgeKey={setJsonJudgeKey}
            onSetContestCategoryKey={setContestCategoryKey}
            onExportPng={() => { exportContainer('png', exportCaptureOptions).catch(() => {}) }}
            onExportPdf={() => { exportContainer('pdf', exportCaptureOptions).catch(() => {}) }}
            onExportNotesPdf={() => { exportNotesPdf().catch(() => {}) }}
            onExportJson={() => { exportJson().catch(() => {}) }}
            onExportSpreadsheet={() => { exportSpreadsheet().catch(() => {}) }}
            onExportHtml={() => { exportHtml().catch(() => {}) }}
          />
          </div>
          ) : (
            <div className="px-3"><MissingBaremeMessage /></div>
          )
        ) : currentBareme ? (
          <ExportPosterOptionsPanel
            blocks={posterBlocks}
            activeBlockId={activePosterBlockId}
            images={posterImages}
            activeImageId={activePosterImageId}
            activeImageSizeLabel={activeImageSizeLabel}
            fontOptions={filteredFontOptions}
            fontSearch={fontSearch}
            loadingSystemFonts={loadingSystemFonts}
            fontLoadMessage={fontLoadMessage}
            selectedSizePreset={selectedSizePreset}
            posterWidth={safePosterWidth}
            posterHeight={safePosterHeight}
            backgroundColor={posterBackgroundColor}
            effectiveBackgroundColor={effectivePosterBackgroundColor}
            backgroundColorPresets={posterBackgroundColorPresets}
            backgroundImage={posterBackgroundImage}
            backgroundImageSizeLabel={backgroundImageSizeLabel}
            backgroundRenderedSizeLabel={backgroundRenderedSizeLabel}
            backgroundPositionXPct={posterBackgroundPositionXPct}
            backgroundPositionYPct={posterBackgroundPositionYPct}
            backgroundDragEnabled={posterBackgroundDragEnabled}
            backgroundScaleXPct={posterBackgroundScaleXPct}
            backgroundScaleYPct={posterBackgroundScaleYPct}
            overlayOpacity={posterOverlayOpacity}
            previewZoomPct={posterPreviewZoomPct}
            topCount={normalizedTopCount}
            includeClipNameInTop={includeClipNameInTop}
            includeScoreInTop={includeScoreInTop}
            generatedTopText={generatedTopText}
            exporting={exporting}
            copiedTop={copiedTop}
            jsonExportMode={jsonExportMode}
            jsonJudgeKey={jsonJudgeKey}
            jsonJudgeOptions={jsonJudgeOptions}
            contestCategoryKey={effectiveContestCategoryKey}
            contestCategoryOptions={contestCategoryOptions}
            onSelectBlock={(id) => {
              setActivePosterBlockId(id)
              setActivePosterImageId(null)
            }}
            onPatchBlock={patchPosterBlock}
            onSetFontSearch={setFontSearch}
            onLoadSystemFonts={() => { loadSystemFonts().catch(() => {}) }}
            onUploadBackground={handleUploadBackground}
            onClearBackground={clearBackground}
            onSetBackgroundColor={setPosterBackgroundColor}
            onResetBackgroundColor={() => setPosterBackgroundColor(null)}
            onSetPosterWidth={setPosterWidthSafe}
            onSetPosterHeight={setPosterHeightSafe}
            onSetSizePreset={(preset) => {
              if (preset === 'custom') return
              applySizePreset(preset)
            }}
            onSetBackgroundPositionXPct={setBackgroundPositionXPctSafe}
            onSetBackgroundPositionYPct={setBackgroundPositionYPctSafe}
            onToggleBackgroundDrag={() => setPosterBackgroundDragEnabled((prev) => !prev)}
            onSetBackgroundScaleXPct={setBackgroundScaleXPctSafe}
            onSetBackgroundScaleYPct={setBackgroundScaleYPctSafe}
            onSetBackgroundScaleUniform={setBackgroundScaleUniformSafe}
            onSetOverlayOpacity={(value) => setPosterOverlayOpacity(clamp(value, 0, 90))}
            onSetPreviewZoomPct={setPreviewZoomPctSafe}
            onSetTopCount={setTopCountSafe}
            onSetJsonExportMode={setJsonExportMode}
            onSetJsonJudgeKey={setJsonJudgeKey}
            onSetContestCategoryKey={setContestCategoryKey}
            onToggleClipNameInTop={() => setIncludeClipNameInTop((prev) => !prev)}
            onToggleScoreInTop={() => setIncludeScoreInTop((prev) => !prev)}
            onGenerateTopIntoBlock={generateTopIntoBlock}
            onCopyTop={() => { copyTopToClipboard().catch(() => {}) }}
            onUploadOverlayImage={handleUploadOverlayImage}
            onSelectOverlayImage={(id) => {
              setActivePosterImageId(id)
              if (id) setActivePosterBlockId(null)
            }}
            onPatchOverlayImage={patchPosterImage}
            onReorderOverlayImage={reorderPosterImage}
            onRemoveOverlayImage={removePosterImage}
            onResetPosterLayout={resetPosterLayout}
            onExportPng={() => { exportContainer('png', exportCaptureOptions).catch(() => {}) }}
            onExportPdf={() => { exportContainer('pdf', exportCaptureOptions).catch(() => {}) }}
            onExportJson={() => { exportJson().catch(() => {}) }}
          />
        ) : (
          <div className="px-3"><MissingBaremeMessage /></div>
        )}
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {layoutMode === 'discord' ? (
        <ExportDiscordPreviewPanel
          content={discordContent}
          settings={discordSettings}
          rows={discordResultRows}
          favoriteRows={discordFavoriteRows}
          rowOverrides={discordRowOverrides}
          selectedChunkIndex={safeDiscordSelectedChunkIndex}
          chunks={discordChunks}
          onPatchContent={patchDiscordContent}
          onSetRowOverride={setDiscordRowOverride}
        />
      ) : layoutMode === 'table' ? (
        currentBareme ? (
          <ExportPreviewPanel
            previewRef={previewRef}
            exportPageRefs={exportPageRefs}
            mainView={resultatsMainView}
            globalVariant={resultatsGlobalVariant}
            canSortByScore={canSortByScore}
            currentBaremeTotalPoints={currentBareme.totalPoints}
            categoryGroups={resultatsCategoryGroups}
            judges={resultatsJudges}
            rows={resultatsRows}
            favoriteClips={favoriteClips}
            judgeColors={judgeColors}
            selectedJudgeIndex={resultatsSelectedJudgeIndex}
            rowsPerImage={rowsPerImage}
            showMiniatures={Boolean(currentProject?.settings.showMiniatures)}
            thumbnailDefaultSeconds={currentProject?.settings.thumbnailDefaultTimeSec ?? 10}
          />
        ) : <MissingBaremeMessage />
      ) : currentBareme ? (
        <ExportPosterPreviewPanel
          previewRef={previewRef}
          accent={accent}
          posterWidth={safePosterWidth}
          posterHeight={safePosterHeight}
          backgroundColor={effectivePosterBackgroundColor}
          backgroundImage={posterBackgroundImage}
          backgroundPositionXPct={posterBackgroundPositionXPct}
          backgroundPositionYPct={posterBackgroundPositionYPct}
          backgroundDragEnabled={posterBackgroundDragEnabled}
          backgroundScaleXPct={posterBackgroundScaleXPct}
          backgroundScaleYPct={posterBackgroundScaleYPct}
          overlayOpacity={posterOverlayOpacity}
          previewZoomPct={posterPreviewZoomPct}
          blocks={posterBlocks}
          images={posterImages}
          activeBlockId={activePosterBlockId}
          activeImageId={activePosterImageId}
          onSelectBlock={setActivePosterBlockId}
          onSelectImage={setActivePosterImageId}
          onSetPreviewZoomPct={setPreviewZoomPctSafe}
          onPatchBlock={patchPosterBlock}
          onPatchImage={patchPosterImage}
          onAddImage={handleUploadOverlayImage}
          onRemoveImage={removePosterImage}
          onReorderImage={reorderPosterImage}
          onClearBackground={clearBackground}
          onToggleBackgroundDrag={() => setPosterBackgroundDragEnabled((prev) => !prev)}
          onMoveBlock={movePosterBlock}
          onMoveImage={movePosterImage}
          onMoveBackground={moveBackground}
        />
      ) : <MissingBaremeMessage />}
      </div>
      </div>

      {exportContextMenu ? (
        <ExportContextMenu
          panelRef={exportContextMenuRef}
          position={exportContextMenu}
          layoutMode={layoutMode}
          resultatsMainView={resultatsMainView}
          resultatsGlobalVariant={resultatsGlobalVariant}
          exportCaptureOptions={exportCaptureOptions}
          onSetLayoutMode={setLayoutMode}
          onSetExportMode={setExportMode}
          onSetTableView={setTableView}
          onSetResultatsMainView={setResultatsMainView}
          onSetResultatsGlobalVariant={setResultatsGlobalVariant}
          onClose={() => setExportContextMenu(null)}
          exportContainer={exportContainer}
          exportSpreadsheet={exportSpreadsheet}
          exportHtml={exportHtml}
          exportNotesPdf={exportNotesPdf}
          exportJson={exportJson}
        />
      ) : null}
    </div>
  )

  return { renderContent }
}

export default function ExportInterface() {
  const { renderContent } = useExportInterfaceController()
  return renderContent()
}
