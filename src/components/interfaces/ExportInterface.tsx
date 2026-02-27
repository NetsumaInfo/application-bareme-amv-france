import { useCallback, useMemo, useRef, useState } from 'react'
import { LayoutTemplate } from 'lucide-react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { ExportOptionsPanel } from '@/components/interfaces/export/ExportOptionsPanel'
import { ExportPosterOptionsPanel } from '@/components/interfaces/export/ExportPosterOptionsPanel'
import { ExportPreviewPanel } from '@/components/interfaces/export/ExportPreviewPanel'
import { ExportPosterPreviewPanel } from '@/components/interfaces/export/ExportPosterPreviewPanel'
import { createDefaultPosterBlocks, EXPORT_POSTER_FONT_OPTIONS } from '@/components/interfaces/export/posterDefaults'
import type {
  ExportDensity,
  ExportLayout,
  ExportMode,
  ExportNotesPdfMode,
  ExportPngMode,
  ExportRankBadgeStyle,
  ExportTableView,
  ExportPosterBlock,
  ExportPosterBlockId,
  ExportPosterFontOption,
  ExportPosterImageLayer,
  ExportTheme,
} from '@/components/interfaces/export/types'
import { useExportActions } from '@/components/interfaces/export/hooks/useExportActions'
import { useExportData } from '@/components/interfaces/export/hooks/useExportData'

const ACCENT_PRESETS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4']
const MIN_TOP_COUNT = 1
const MAX_TOP_COUNT = 20
const MIN_PNG_SCALE = 2
const MAX_PNG_SCALE = 5
const MIN_ROWS_PER_IMAGE = 5
const MAX_ROWS_PER_IMAGE = 80
const MIN_TABLE_CLIP_COLUMN_WIDTH = 260
const MAX_TABLE_CLIP_COLUMN_WIDTH = 560
const MIN_TABLE_SCORE_COLUMN_WIDTH = 88
const MAX_TABLE_SCORE_COLUMN_WIDTH = 180
const MIN_TABLE_ROW_HEIGHT = 44
const MAX_TABLE_ROW_HEIGHT = 88
const MIN_TABLE_NUMBER_FONT_SIZE = 11
const MAX_TABLE_NUMBER_FONT_SIZE = 20
const MIN_TABLE_PRIMARY_FONT_SIZE = 12
const MAX_TABLE_PRIMARY_FONT_SIZE = 24
const MIN_TABLE_SECONDARY_FONT_SIZE = 10
const MAX_TABLE_SECONDARY_FONT_SIZE = 18
const MIN_EXPORT_WIDTH = 320
const MAX_EXPORT_WIDTH = 8000
const MIN_EXPORT_HEIGHT = 240
const MAX_EXPORT_HEIGHT = 8000
const MIN_BG_SCALE = 20
const MAX_BG_SCALE = 250
const MIN_PREVIEW_ZOOM = 25
const MAX_PREVIEW_ZOOM = 250
const SIZE_PRESET_VALUES = ['1920x1080', '1080x1920', '1080x1350', '2048x1152'] as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function normalizeDimension(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.round(clamp(value, min, max))
}

function parseSizePreset(raw: string): { width: number; height: number } | null {
  const [wRaw, hRaw] = raw.split('x')
  const width = Number(wRaw)
  const height = Number(hRaw)
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null
  return { width, height }
}

function readImageDimensions(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      })
    }
    image.onerror = () => resolve(null)
    image.src = src
  })
}

function normalizeImageLayer(layer: ExportPosterImageLayer): ExportPosterImageLayer {
  const widthPct = clamp(layer.widthPct, 4, 95)
  const maxX = Math.max(0, 100 - widthPct)
  return {
    ...layer,
    widthPct,
    xPct: clamp(layer.xPct, 0, maxX),
    yPct: clamp(layer.yPct, 0, 94),
    opacity: clamp(layer.opacity, 0, 100),
    rotationDeg: clamp(layer.rotationDeg, -180, 180),
  }
}

type LocalFontsWindow = Window & {
  queryLocalFonts?: () => Promise<Array<{ family?: string | null }>>
}

function toCssFontFamily(family: string): string {
  const cleaned = family.trim()
  if (!cleaned) return ''
  const escaped = cleaned.replace(/"/g, '\\"')
  return `"${escaped}", sans-serif`
}

function normalizeOptionalText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export default function ExportInterface() {
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const notes = useNotationStore((state) => state.notes)
  const { currentProject, clips, importedJudges } = useProjectStore()

  const [layoutMode, setLayoutMode] = useState<ExportLayout>('poster')
  const [theme, setTheme] = useState<ExportTheme>('dark')
  const [density, setDensity] = useState<ExportDensity>('comfortable')
  const [exportMode, setExportMode] = useState<ExportMode>('grouped')
  const [tableView, setTableView] = useState<ExportTableView>('summary')
  const [pngExportMode, setPngExportMode] = useState<ExportPngMode>('single')
  const [notesPdfMode, setNotesPdfMode] = useState<ExportNotesPdfMode>('both')
  const [pngScale, setPngScale] = useState(3)
  const [selectedJudgeKey, setSelectedJudgeKey] = useState<string>('current')
  const [accent, setAccent] = useState(ACCENT_PRESETS[0])
  const [decimals, setDecimals] = useState(1)
  const [rowsPerImage, setRowsPerImage] = useState(20)
  const [showTopBanner, setShowTopBanner] = useState(true)
  const [showJudgeColumns, setShowJudgeColumns] = useState(true)
  const [showRank, setShowRank] = useState(true)
  const [useCollabMepLabels, setUseCollabMepLabels] = useState(false)
  const [tableClipColumnWidth, setTableClipColumnWidth] = useState(330)
  const [tableScoreColumnWidth, setTableScoreColumnWidth] = useState(112)
  const [tableRowHeight, setTableRowHeight] = useState(58)
  const [tableNumberFontSize, setTableNumberFontSize] = useState(13)
  const [tablePrimaryFontSize, setTablePrimaryFontSize] = useState(15)
  const [tableSecondaryFontSize, setTableSecondaryFontSize] = useState(11)
  const [rankBadgeStyle, setRankBadgeStyle] = useState<ExportRankBadgeStyle>('filled')
  const [title, setTitle] = useState(() => `${currentProject?.name || 'Projet'} - Resultats`)

  const [posterWidth, setPosterWidth] = useState(1920)
  const [posterHeight, setPosterHeight] = useState(1080)
  const [posterBackgroundImage, setPosterBackgroundImage] = useState<string | null>(null)
  const [posterBackgroundImageDimensions, setPosterBackgroundImageDimensions] = useState<{
    width: number
    height: number
  } | null>(null)
  const [posterBackgroundPositionXPct, setPosterBackgroundPositionXPct] = useState(50)
  const [posterBackgroundPositionYPct, setPosterBackgroundPositionYPct] = useState(50)
  const [posterBackgroundDragEnabled, setPosterBackgroundDragEnabled] = useState(false)
  const [posterBackgroundScaleXPct, setPosterBackgroundScaleXPct] = useState(100)
  const [posterBackgroundScaleYPct, setPosterBackgroundScaleYPct] = useState(100)
  const [posterOverlayOpacity, setPosterOverlayOpacity] = useState(40)
  const [posterBlocks, setPosterBlocks] = useState<ExportPosterBlock[]>(() => (
    createDefaultPosterBlocks(`${currentProject?.name || 'Concours AMV'} - Resultats`)
  ))
  const [activePosterBlockId, setActivePosterBlockId] = useState<ExportPosterBlockId | null>('top')
  const [posterImages, setPosterImages] = useState<ExportPosterImageLayer[]>([])
  const [activePosterImageId, setActivePosterImageId] = useState<string | null>(null)

  const [topCount, setTopCount] = useState(3)
  const [includeClipNameInTop, setIncludeClipNameInTop] = useState(true)
  const [includeScoreInTop, setIncludeScoreInTop] = useState(true)
  const [copiedTop, setCopiedTop] = useState(false)

  const [systemFontOptions, setSystemFontOptions] = useState<ExportPosterFontOption[]>([])
  const [fontSearch, setFontSearch] = useState('')
  const [loadingSystemFonts, setLoadingSystemFonts] = useState(false)
  const [fontLoadMessage, setFontLoadMessage] = useState<string | null>(null)
  const [posterPreviewZoomPct, setPosterPreviewZoomPct] = useState(100)

  const previewRef = useRef<HTMLDivElement | null>(null)
  const exportPageRefs = useRef<Array<HTMLDivElement | null>>([])

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
    clips,
    importedJudges,
    exportMode,
    selectedJudgeKey,
    onSelectedJudgeKeyChange: setSelectedJudgeKey,
  })

  const projectName = currentProject?.name || 'resultats'
  const formatScore = useCallback((value: number) => value.toFixed(decimals), [decimals])
  const safePosterWidth = normalizeDimension(posterWidth, MIN_EXPORT_WIDTH, MAX_EXPORT_WIDTH, 1920)
  const safePosterHeight = normalizeDimension(posterHeight, MIN_EXPORT_HEIGHT, MAX_EXPORT_HEIGHT, 1080)
  const selectedSizePreset = useMemo(() => {
    const key = `${safePosterWidth}x${safePosterHeight}`
    return SIZE_PRESET_VALUES.includes(key as (typeof SIZE_PRESET_VALUES)[number]) ? key : 'custom'
  }, [safePosterHeight, safePosterWidth])

  const getDisplayTotal = useCallback((row: (typeof displayRows)[number]) => {
    return exportMode === 'individual'
      ? (row.judgeTotals[selectedJudgeIndex] ?? 0)
      : row.averageTotal
  }, [exportMode, selectedJudgeIndex])

  const normalizedTopCount = clamp(topCount, MIN_TOP_COUNT, MAX_TOP_COUNT)
  const topRows = useMemo(
    () => displayRows.slice(0, normalizedTopCount),
    [displayRows, normalizedTopCount],
  )

  const generatedTopText = useMemo(() => {
    return topRows.map((row, index) => {
      const primary = getClipPrimaryLabel(row.clip)
      const secondary = getClipSecondaryLabel(row.clip)
      const withClip = includeClipNameInTop && secondary
        ? `${primary} - ${secondary}`
        : primary
      const withScore = includeScoreInTop
        ? `${withClip} (${formatScore(getDisplayTotal(row))})`
        : withClip
      return `${index + 1}. ${withScore}`
    }).join('\n')
  }, [formatScore, getDisplayTotal, includeClipNameInTop, includeScoreInTop, topRows])

  const allFontOptions = useMemo(() => {
    const map = new Map<string, ExportPosterFontOption>()
    for (const option of [...EXPORT_POSTER_FONT_OPTIONS, ...systemFontOptions]) {
      const key = option.value.trim().toLowerCase()
      if (!key) continue
      if (!map.has(key)) map.set(key, option)
    }
    return Array.from(map.values())
  }, [systemFontOptions])

  const filteredFontOptions = useMemo(() => {
    const query = fontSearch.trim().toLowerCase()
    if (!query) return allFontOptions
    return allFontOptions.filter((option) => (
      option.label.toLowerCase().includes(query)
      || option.value.toLowerCase().includes(query)
    ))
  }, [allFontOptions, fontSearch])

  const backgroundImageSizeLabel = useMemo(() => {
    if (!posterBackgroundImageDimensions) return null
    return `${Math.round(posterBackgroundImageDimensions.width)}x${Math.round(posterBackgroundImageDimensions.height)} px`
  }, [posterBackgroundImageDimensions])

  const activeImageSizeLabel = useMemo(() => {
    if (!activePosterImageId) return null
    const activeImage = posterImages.find((image) => image.id === activePosterImageId)
    if (!activeImage?.sourceWidth || !activeImage?.sourceHeight) return null
    return `${Math.round(activeImage.sourceWidth)}x${Math.round(activeImage.sourceHeight)} px`
  }, [activePosterImageId, posterImages])

  const backgroundRenderedSizeLabel = useMemo(() => {
    const widthPx = Math.round((safePosterWidth * posterBackgroundScaleXPct) / 100)
    const heightPx = Math.round((safePosterHeight * posterBackgroundScaleYPct) / 100)
    return `${widthPx}x${heightPx} px`
  }, [posterBackgroundScaleXPct, posterBackgroundScaleYPct, safePosterHeight, safePosterWidth])

  const notesPdfPayload = useMemo(() => {
    const currentJudge = judges.find((judge) => judge.isCurrentJudge) ?? judges[0]
    const criterionNameById = new Map(
      (currentBareme?.criteria ?? []).map((criterion) => [criterion.id, criterion.name]),
    )

    return {
      mode: notesPdfMode,
      title: title.trim() || `${projectName} - Notes`,
      entries: displayRows.map((row) => {
        const generalNoteSource = currentJudge?.notes[row.clip.id] as { textNotes?: string } | undefined
        const generalNote = normalizeOptionalText(generalNoteSource?.textNotes)

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
  }, [currentBareme?.criteria, displayRows, judges, notesPdfMode, projectName, title])

  const loadSystemFonts = useCallback(async () => {
    if (loadingSystemFonts) return
    setLoadingSystemFonts(true)
    setFontLoadMessage(null)

    try {
      const fontsApi = (window as LocalFontsWindow).queryLocalFonts
      if (!fontsApi) {
        setFontLoadMessage('API polices système indisponible dans cet environnement.')
        return
      }

      const entries = await fontsApi()
      const families = Array.from(
        new Set(
          entries
            .map((entry) => (typeof entry.family === 'string' ? entry.family.trim() : ''))
            .filter((family) => family.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b, 'fr'))

      const next = families.map((family) => ({
        label: family,
        value: toCssFontFamily(family),
      }))
      setSystemFontOptions(next)
      setFontLoadMessage(`${next.length} police(s) système chargée(s).`)
    } catch {
      setFontLoadMessage('Impossible de lire les polices système (permission refusée ou non supportée).')
    } finally {
      setLoadingSystemFonts(false)
    }
  }, [loadingSystemFonts])

  const patchPosterBlock = useCallback((blockId: ExportPosterBlockId, patch: Partial<ExportPosterBlock>) => {
    setPosterBlocks((prev) => prev.map((block) => {
      if (block.id !== blockId) return block
      const next = { ...block, ...patch }
      const maxX = Math.max(0, 100 - next.widthPct)
      next.xPct = clamp(next.xPct, 0, maxX)
      next.yPct = clamp(next.yPct, 0, 94)
      next.widthPct = clamp(next.widthPct, 20, 95)
      next.fontSize = clamp(next.fontSize, 12, 180)
      return next
    }))
  }, [])

  const movePosterBlock = useCallback((blockId: ExportPosterBlockId, xPct: number, yPct: number) => {
    setPosterBlocks((prev) => prev.map((block) => {
      if (block.id !== blockId) return block
      const maxX = Math.max(0, 100 - block.widthPct)
      return {
        ...block,
        xPct: clamp(xPct, 0, maxX),
        yPct: clamp(yPct, 0, 94),
      }
    }))
  }, [])

  const patchPosterImage = useCallback((imageId: string, patch: Partial<ExportPosterImageLayer>) => {
    setPosterImages((prev) => prev.map((image) => {
      if (image.id !== imageId) return image
      return normalizeImageLayer({ ...image, ...patch })
    }))
  }, [])

  const movePosterImage = useCallback((imageId: string, xPct: number, yPct: number) => {
    setPosterImages((prev) => prev.map((image) => {
      if (image.id !== imageId) return image
      return normalizeImageLayer({
        ...image,
        xPct,
        yPct,
      })
    }))
  }, [])

  const removePosterImage = useCallback((imageId: string) => {
    setPosterImages((prev) => prev.filter((image) => image.id !== imageId))
    setActivePosterImageId((prev) => (prev === imageId ? null : prev))
  }, [])

  const resetPosterLayout = useCallback(() => {
    setPosterBlocks(createDefaultPosterBlocks(`${currentProject?.name || 'Concours AMV'} - Resultats`))
    setPosterImages([])
    setActivePosterBlockId('top')
    setActivePosterImageId(null)
    setPosterBackgroundDragEnabled(false)
    setPosterOverlayOpacity(40)
    setPosterBackgroundPositionXPct(50)
    setPosterBackgroundPositionYPct(50)
    setPosterBackgroundScaleXPct(100)
    setPosterBackgroundScaleYPct(100)
    setPosterPreviewZoomPct(100)
  }, [currentProject?.name])

  const handleUploadBackground = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null
      if (!dataUrl) return
      setPosterBackgroundImage(dataUrl)
      setPosterBackgroundDragEnabled(false)
      void readImageDimensions(dataUrl).then((dimensions) => {
        setPosterBackgroundImageDimensions(dimensions)
      })
    }
    reader.readAsDataURL(file)
  }, [])

  const handleUploadOverlayImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null
      if (!dataUrl) return
      const dimensions = await readImageDimensions(dataUrl)
      const layer: ExportPosterImageLayer = normalizeImageLayer({
        id: `overlay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label: file.name || `Image ${posterImages.length + 1}`,
        src: dataUrl,
        sourceWidth: dimensions?.width,
        sourceHeight: dimensions?.height,
        xPct: 58,
        yPct: 48,
        widthPct: 24,
        opacity: 100,
        rotationDeg: 0,
        visible: true,
      })
      setPosterImages((prev) => [...prev, layer])
      setActivePosterImageId(layer.id)
      setActivePosterBlockId(null)
    }
    reader.readAsDataURL(file)
  }, [posterImages.length])

  const generateTopIntoBlock = useCallback(() => {
    patchPosterBlock('top', { text: generatedTopText })
    setActivePosterBlockId('top')
    setActivePosterImageId(null)
  }, [generatedTopText, patchPosterBlock])

  const copyTopToClipboard = useCallback(async () => {
    if (!generatedTopText.trim()) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedTopText)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = generatedTopText
        textarea.style.position = 'fixed'
        textarea.style.left = '-10000px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopiedTop(true)
      window.setTimeout(() => setCopiedTop(false), 1400)
    } catch {
      setCopiedTop(false)
    }
  }, [generatedTopText])

  const applySizePreset = useCallback((preset: string) => {
    const parsed = parseSizePreset(preset)
    if (!parsed) return
    setPosterWidth(normalizeDimension(parsed.width, MIN_EXPORT_WIDTH, MAX_EXPORT_WIDTH, 1920))
    setPosterHeight(normalizeDimension(parsed.height, MIN_EXPORT_HEIGHT, MAX_EXPORT_HEIGHT, 1080))
  }, [])

  const exportCaptureOptions = useMemo(() => {
    if (layoutMode === 'poster') {
      return {
        scale: 1,
        backgroundColor: null as string | null,
        pngMode: 'single' as ExportPngMode,
      }
    }
    return {
      scale: clamp(pngScale, MIN_PNG_SCALE, MAX_PNG_SCALE),
      backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
      pngMode: pngExportMode,
    }
  }, [layoutMode, pngExportMode, pngScale, theme])

  const jsonPayload = useMemo(() => ({
    exportedAt: new Date().toISOString(),
    projectName: currentProject?.name || '',
    judgeCount: judges.length,
    exportOptions: {
      layoutMode,
      exportMode,
      tableView,
      selectedJudge: selectedJudge?.judgeName ?? null,
      notesPdfMode,
      theme,
      density,
      decimals,
      accent,
      pngScale,
      pngExportMode,
      rowsPerImage,
      showTopBanner,
      showJudgeColumns,
      showRank,
      useCollabMepLabels,
      tableClipColumnWidth,
      tableScoreColumnWidth,
      tableRowHeight,
      tableNumberFontSize,
      tablePrimaryFontSize,
      tableSecondaryFontSize,
      rankBadgeStyle,
    },
    poster: {
      width: safePosterWidth,
      height: safePosterHeight,
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
    currentProject?.name,
    decimals,
    density,
    displayRows,
    exportMode,
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
    posterBackgroundImage,
    posterBackgroundPositionXPct,
    posterBackgroundPositionYPct,
    posterBackgroundDragEnabled,
    posterBackgroundScaleXPct,
    posterBackgroundScaleYPct,
    posterBlocks,
    posterImages,
    posterOverlayOpacity,
    rankByClipId,
    safePosterHeight,
    safePosterWidth,
    selectedJudge?.judgeName,
    selectedJudgeIndex,
    rowsPerImage,
    rankBadgeStyle,
    showJudgeColumns,
    showTopBanner,
    tableClipColumnWidth,
    tableNumberFontSize,
    tablePrimaryFontSize,
    tableRowHeight,
    tableScoreColumnWidth,
    tableSecondaryFontSize,
    useCollabMepLabels,
    showRank,
    theme,
  ])

  const { exporting, exportContainer, exportJson, exportNotesPdf } = useExportActions({
    previewRef,
    exportPageRefs,
    theme,
    projectName,
    jsonPayload,
    notesPdfPayload,
  })

  if (!currentBareme) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Aucun barème chargé
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-3 p-3 overflow-hidden">
      <div className="w-full lg:w-[380px] shrink-0 min-h-0 flex flex-col gap-2">
        <div className="rounded-lg border border-gray-700 bg-surface p-2.5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <LayoutTemplate size={14} />
            Studio Export
          </h3>
          <p className="text-[11px] text-gray-500 mt-1 mb-2">
            Choisis une sortie classique (tableau) ou créative (affiche).
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLayoutMode('poster')}
              className={`px-2 py-1.5 rounded border text-xs transition-colors ${
                layoutMode === 'poster'
                  ? 'border-primary-500 text-primary-300 bg-primary-600/10'
                  : 'border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              Affiche créative
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('table')}
              className={`px-2 py-1.5 rounded border text-xs transition-colors ${
                layoutMode === 'table'
                  ? 'border-primary-500 text-primary-300 bg-primary-600/10'
                  : 'border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              Tableau complet
            </button>
          </div>
        </div>

        {layoutMode === 'table' ? (
          <ExportOptionsPanel
            title={title}
            exportMode={exportMode}
            tableView={tableView}
            selectedJudgeKey={selectedJudgeKey}
            decimals={decimals}
            theme={theme}
            density={density}
            pngExportMode={pngExportMode}
            pngScale={pngScale}
            rowsPerImage={rowsPerImage}
            accent={accent}
            showTopBanner={showTopBanner}
            showJudgeColumns={showJudgeColumns}
            showRank={showRank}
            tableClipColumnWidth={tableClipColumnWidth}
            tableScoreColumnWidth={tableScoreColumnWidth}
            tableRowHeight={tableRowHeight}
            tableNumberFontSize={tableNumberFontSize}
            tablePrimaryFontSize={tablePrimaryFontSize}
            tableSecondaryFontSize={tableSecondaryFontSize}
            rankBadgeStyle={rankBadgeStyle}
            useCollabMepLabels={useCollabMepLabels}
            judges={judges}
            accentPresets={ACCENT_PRESETS}
            exporting={exporting}
            notesPdfMode={notesPdfMode}
            onSetTitle={setTitle}
            onSetExportMode={setExportMode}
            onSetTableView={setTableView}
            onSetSelectedJudgeKey={setSelectedJudgeKey}
            onSetDecimals={setDecimals}
            onSetTheme={setTheme}
            onSetDensity={setDensity}
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
            onSetAccent={setAccent}
            onSetTableClipColumnWidth={(value) => {
              const safe = Number.isFinite(value) ? value : MIN_TABLE_CLIP_COLUMN_WIDTH
              setTableClipColumnWidth(clamp(safe, MIN_TABLE_CLIP_COLUMN_WIDTH, MAX_TABLE_CLIP_COLUMN_WIDTH))
            }}
            onSetTableScoreColumnWidth={(value) => {
              const safe = Number.isFinite(value) ? value : MIN_TABLE_SCORE_COLUMN_WIDTH
              setTableScoreColumnWidth(clamp(safe, MIN_TABLE_SCORE_COLUMN_WIDTH, MAX_TABLE_SCORE_COLUMN_WIDTH))
            }}
            onSetTableRowHeight={(value) => {
              const safe = Number.isFinite(value) ? value : MIN_TABLE_ROW_HEIGHT
              setTableRowHeight(clamp(safe, MIN_TABLE_ROW_HEIGHT, MAX_TABLE_ROW_HEIGHT))
            }}
            onSetTableNumberFontSize={(value) => {
              const safe = Number.isFinite(value) ? value : MIN_TABLE_NUMBER_FONT_SIZE
              setTableNumberFontSize(clamp(safe, MIN_TABLE_NUMBER_FONT_SIZE, MAX_TABLE_NUMBER_FONT_SIZE))
            }}
            onSetTablePrimaryFontSize={(value) => {
              const safe = Number.isFinite(value) ? value : MIN_TABLE_PRIMARY_FONT_SIZE
              setTablePrimaryFontSize(clamp(safe, MIN_TABLE_PRIMARY_FONT_SIZE, MAX_TABLE_PRIMARY_FONT_SIZE))
            }}
            onSetTableSecondaryFontSize={(value) => {
              const safe = Number.isFinite(value) ? value : MIN_TABLE_SECONDARY_FONT_SIZE
              setTableSecondaryFontSize(clamp(safe, MIN_TABLE_SECONDARY_FONT_SIZE, MAX_TABLE_SECONDARY_FONT_SIZE))
            }}
            onSetRankBadgeStyle={setRankBadgeStyle}
            onToggleShowTopBanner={() => setShowTopBanner((prev) => !prev)}
            onToggleShowJudgeColumns={() => setShowJudgeColumns((prev) => !prev)}
            onToggleShowRank={() => setShowRank((prev) => !prev)}
            onToggleUseCollabMepLabels={() => setUseCollabMepLabels((prev) => !prev)}
            onExportPng={() => { exportContainer('png', exportCaptureOptions).catch(() => {}) }}
            onExportPdf={() => { exportContainer('pdf', exportCaptureOptions).catch(() => {}) }}
            onExportNotesPdf={() => { exportNotesPdf().catch(() => {}) }}
            onExportJson={() => { exportJson().catch(() => {}) }}
          />
        ) : (
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
            onSelectBlock={(id) => {
              setActivePosterBlockId(id)
              setActivePosterImageId(null)
            }}
            onPatchBlock={patchPosterBlock}
            onSetFontSearch={setFontSearch}
            onLoadSystemFonts={() => { loadSystemFonts().catch(() => {}) }}
            onUploadBackground={handleUploadBackground}
            onClearBackground={() => {
              setPosterBackgroundImage(null)
              setPosterBackgroundImageDimensions(null)
              setPosterBackgroundDragEnabled(false)
            }}
            onSetPosterWidth={(value) => setPosterWidth(normalizeDimension(value, MIN_EXPORT_WIDTH, MAX_EXPORT_WIDTH, 1920))}
            onSetPosterHeight={(value) => setPosterHeight(normalizeDimension(value, MIN_EXPORT_HEIGHT, MAX_EXPORT_HEIGHT, 1080))}
            onSetSizePreset={(preset) => {
              if (preset === 'custom') return
              applySizePreset(preset)
            }}
            onSetBackgroundPositionXPct={(value) => setPosterBackgroundPositionXPct(clamp(value, 0, 100))}
            onSetBackgroundPositionYPct={(value) => setPosterBackgroundPositionYPct(clamp(value, 0, 100))}
            onToggleBackgroundDrag={() => setPosterBackgroundDragEnabled((prev) => !prev)}
            onSetBackgroundScaleXPct={(value) => setPosterBackgroundScaleXPct(clamp(value, MIN_BG_SCALE, MAX_BG_SCALE))}
            onSetBackgroundScaleYPct={(value) => setPosterBackgroundScaleYPct(clamp(value, MIN_BG_SCALE, MAX_BG_SCALE))}
            onSetBackgroundScaleUniform={(value) => {
              const safe = clamp(value, MIN_BG_SCALE, MAX_BG_SCALE)
              setPosterBackgroundScaleXPct(safe)
              setPosterBackgroundScaleYPct(safe)
            }}
            onSetOverlayOpacity={(value) => setPosterOverlayOpacity(clamp(value, 0, 90))}
            onSetPreviewZoomPct={(value) => setPosterPreviewZoomPct(clamp(value, MIN_PREVIEW_ZOOM, MAX_PREVIEW_ZOOM))}
            onSetTopCount={(count) => setTopCount(clamp(Number.isFinite(count) ? count : MIN_TOP_COUNT, MIN_TOP_COUNT, MAX_TOP_COUNT))}
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
            onRemoveOverlayImage={removePosterImage}
            onResetPosterLayout={resetPosterLayout}
            onExportPng={() => { exportContainer('png', exportCaptureOptions).catch(() => {}) }}
            onExportPdf={() => { exportContainer('pdf', exportCaptureOptions).catch(() => {}) }}
            onExportJson={() => { exportJson().catch(() => {}) }}
          />
        )}
      </div>

      {layoutMode === 'table' ? (
        <ExportPreviewPanel
          previewRef={previewRef}
          exportPageRefs={exportPageRefs}
          theme={theme}
          exportMode={exportMode}
          tableView={tableView}
          accent={accent}
          title={title}
          showTopBanner={showTopBanner}
          clipColumnWidth={tableClipColumnWidth}
          scoreColumnWidth={tableScoreColumnWidth}
          rowHeight={tableRowHeight}
          numberFontSize={tableNumberFontSize}
          primaryFontSize={tablePrimaryFontSize}
          secondaryFontSize={tableSecondaryFontSize}
          rankBadgeStyle={rankBadgeStyle}
          showRank={showRank}
          showJudgeColumns={showJudgeColumns}
          useCollabMepLabels={useCollabMepLabels}
          selectedJudgeIndex={selectedJudgeIndex}
          selectedJudgeName={selectedJudge?.judgeName}
          judges={judges}
          categoryGroups={categoryGroups}
          displayRows={displayRows}
          rankByClipId={rankByClipId}
          rowsPerImage={rowsPerImage}
          formatScore={formatScore}
        />
      ) : (
        <ExportPosterPreviewPanel
          previewRef={previewRef}
          accent={accent}
          posterWidth={safePosterWidth}
          posterHeight={safePosterHeight}
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
          onMoveBlock={movePosterBlock}
          onMoveImage={movePosterImage}
          onMoveBackground={(xPct, yPct) => {
            setPosterBackgroundPositionXPct(clamp(xPct, 0, 100))
            setPosterBackgroundPositionYPct(clamp(yPct, 0, 100))
          }}
        />
      )}
    </div>
  )
}
