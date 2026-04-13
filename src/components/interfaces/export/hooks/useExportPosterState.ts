import { useCallback, useEffect, useMemo, useState } from 'react'
import { createDefaultPosterBlocks, EXPORT_POSTER_FONT_OPTIONS } from '@/components/interfaces/export/posterDefaults'
import type {
  ExportPosterBlock,
  ExportPosterBlockId,
  ExportPosterFontOption,
  ExportPosterImageLayer,
  ExportRow,
} from '@/components/interfaces/export/types'
import {
  clamp,
  getBackgroundHeightPctForWidthPct,
  getBackgroundWidthPctForHeightPct,
  getCoverBackgroundWidthPct,
  MAX_BG_SCALE,
  MAX_EXPORT_HEIGHT,
  MAX_EXPORT_WIDTH,
  MAX_PREVIEW_ZOOM,
  MAX_TOP_COUNT,
  MIN_BG_SCALE,
  MIN_EXPORT_HEIGHT,
  MIN_EXPORT_WIDTH,
  MIN_PREVIEW_ZOOM,
  MIN_TOP_COUNT,
  normalizeDimension,
  normalizeImageLayer,
  parseSizePreset,
  readImageDimensions,
  SIZE_PRESET_VALUES,
  toCssFontFamily,
} from '@/components/interfaces/export/exportInterfaceUtils'
import type { LocalFontsWindow } from '@/components/interfaces/export/exportInterfaceUtils'
import { PRIMARY_COLOR_OPTIONS, getAppThemeBackgroundColor } from '@/utils/appTheme'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { useI18n } from '@/i18n'

interface UseExportPosterStateOptions {
  currentProjectName?: string
  projectName: string
  appTheme: Parameters<typeof getAppThemeBackgroundColor>[0]
  displayRows: ExportRow[]
  formatScore: (value: number) => string
  getDisplayTotal: (row: ExportRow) => number
}

export function useExportPosterState({
  currentProjectName,
  projectName,
  appTheme,
  displayRows,
  formatScore,
  getDisplayTotal,
}: UseExportPosterStateOptions) {
  const { t } = useI18n()
  const createLocalizedPosterBlocks = useCallback((baseTitle: string) => (
    createDefaultPosterBlocks(baseTitle).map((block) => {
      if (block.id === 'title') return { ...block, label: t('Titre') }
      if (block.id === 'subtitle') return { ...block, label: t('Sous-titre'), text: t('Résultats officiels') }
      if (block.id === 'top') return { ...block, label: t('Bloc TOP') }
      if (block.id === 'footer') return { ...block, label: t('Pied de page'), text: t('Merci à tous les participants') }
      return block
    })
  ), [t])

  const [posterWidth, setPosterWidth] = useState(1920)
  const [posterHeight, setPosterHeight] = useState(1080)
  const [posterBackgroundColor, setPosterBackgroundColor] = useState<string | null>(null)
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
    createLocalizedPosterBlocks(`${currentProjectName || t('Concours AMV')} - ${t('Résultats')}`)
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

  const safePosterWidth = normalizeDimension(posterWidth, MIN_EXPORT_WIDTH, MAX_EXPORT_WIDTH, 1920)
  const safePosterHeight = normalizeDimension(posterHeight, MIN_EXPORT_HEIGHT, MAX_EXPORT_HEIGHT, 1080)

  const selectedSizePreset = useMemo(() => {
    const key = `${safePosterWidth}x${safePosterHeight}`
    return SIZE_PRESET_VALUES.includes(key as (typeof SIZE_PRESET_VALUES)[number]) ? key : 'custom'
  }, [safePosterHeight, safePosterWidth])

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

  const themePosterBackgroundColor = useMemo(
    () => getAppThemeBackgroundColor(appTheme),
    [appTheme],
  )

  const effectivePosterBackgroundColor = useMemo(
    () => posterBackgroundColor ?? themePosterBackgroundColor,
    [posterBackgroundColor, themePosterBackgroundColor],
  )

  const posterBackgroundColorPresets = useMemo(() => (
    Array.from(new Set([
      themePosterBackgroundColor,
      '#000000',
      '#05070c',
      '#0f172a',
      '#111827',
      '#1f2937',
      '#334155',
      '#e7edf4',
      '#dfe7f0',
      '#ece6d9',
      ...PRIMARY_COLOR_OPTIONS.map((option) => option.color),
    ]))
  ), [themePosterBackgroundColor])

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

  useEffect(() => {
    if (!posterBackgroundImageDimensions) return
    const nextHeightPct = clamp(
      getBackgroundHeightPctForWidthPct(
        posterBackgroundScaleXPct,
        safePosterWidth,
        safePosterHeight,
        posterBackgroundImageDimensions.width,
        posterBackgroundImageDimensions.height,
      ),
      MIN_BG_SCALE,
      MAX_BG_SCALE,
    )
    setPosterBackgroundScaleYPct((prev) => (Math.abs(prev - nextHeightPct) < 0.01 ? prev : nextHeightPct))
  }, [
    posterBackgroundImageDimensions,
    posterBackgroundScaleXPct,
    safePosterHeight,
    safePosterWidth,
  ])

  const loadSystemFonts = useCallback(async () => {
    if (loadingSystemFonts) return
    setLoadingSystemFonts(true)
    setFontLoadMessage(null)

    try {
      const fontsApi = (window as LocalFontsWindow).queryLocalFonts
      if (!fontsApi) {
        setFontLoadMessage(t('API polices système indisponible dans cet environnement.'))
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
      setFontLoadMessage(t('{count} police(s) système chargée(s).', { count: next.length }))
    } catch {
      setFontLoadMessage(t('Impossible de lire les polices système (permission refusée ou non supportée).'))
    } finally {
      setLoadingSystemFonts(false)
    }
  }, [loadingSystemFonts, t])

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

  const reorderPosterImage = useCallback((imageId: string, direction: 'front' | 'back' | 'forward' | 'backward') => {
    setPosterImages((prev) => {
      const ordered = [...prev].sort((a, b) => a.zIndex - b.zIndex)
      const currentIndex = ordered.findIndex((image) => image.id === imageId)
      if (currentIndex < 0) return prev

      const targetIndex = (() => {
        switch (direction) {
          case 'front':
            return ordered.length - 1
          case 'back':
            return 0
          case 'forward':
            return Math.min(ordered.length - 1, currentIndex + 1)
          case 'backward':
            return Math.max(0, currentIndex - 1)
          default:
            return currentIndex
        }
      })()

      if (targetIndex === currentIndex) return prev

      const [moved] = ordered.splice(currentIndex, 1)
      ordered.splice(targetIndex, 0, moved)

      return ordered.map((image, index) => normalizeImageLayer({
        ...image,
        zIndex: index,
      }))
    })
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
    setPosterBlocks(createLocalizedPosterBlocks(`${currentProjectName || t('Concours AMV')} - ${t('Résultats')}`))
    setPosterImages([])
    setActivePosterBlockId('top')
    setActivePosterImageId(null)
    setPosterBackgroundColor(null)
    setPosterBackgroundDragEnabled(false)
    setPosterOverlayOpacity(40)
    setPosterBackgroundPositionXPct(50)
    setPosterBackgroundPositionYPct(50)
    setPosterBackgroundScaleXPct(100)
    setPosterBackgroundScaleYPct(100)
    setPosterPreviewZoomPct(100)
  }, [createLocalizedPosterBlocks, currentProjectName, t])

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
        if (!dimensions) return
        const nextWidthPct = clamp(
          getCoverBackgroundWidthPct(
            safePosterWidth,
            safePosterHeight,
            dimensions.width,
            dimensions.height,
          ),
          MIN_BG_SCALE,
          MAX_BG_SCALE,
        )
        const nextHeightPct = clamp(
          getBackgroundHeightPctForWidthPct(
            nextWidthPct,
            safePosterWidth,
            safePosterHeight,
            dimensions.width,
            dimensions.height,
          ),
          MIN_BG_SCALE,
          MAX_BG_SCALE,
        )
        setPosterBackgroundScaleXPct(nextWidthPct)
        setPosterBackgroundScaleYPct(nextHeightPct)
        setPosterBackgroundPositionXPct(50)
        setPosterBackgroundPositionYPct(50)
      })
    }
    reader.readAsDataURL(file)
  }, [safePosterHeight, safePosterWidth])

  const handleUploadOverlayImage = useCallback((file: File, placement?: { xPct: number; yPct: number }) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null
      if (!dataUrl) return
      const dimensions = await readImageDimensions(dataUrl)
      const widthPct = 24
      const layer: ExportPosterImageLayer = normalizeImageLayer({
        id: `overlay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label: file.name || `Image ${posterImages.length + 1}`,
        src: dataUrl,
        sourceWidth: dimensions?.width,
        sourceHeight: dimensions?.height,
        zIndex: posterImages.length,
        xPct: placement ? placement.xPct - widthPct / 2 : 58,
        yPct: placement ? placement.yPct - widthPct / 2 : 48,
        widthPct,
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

  const clearBackground = useCallback(() => {
    setPosterBackgroundImage(null)
    setPosterBackgroundImageDimensions(null)
    setPosterBackgroundDragEnabled(false)
  }, [])

  const setPosterWidthSafe = useCallback((value: number) => {
    setPosterWidth(normalizeDimension(value, MIN_EXPORT_WIDTH, MAX_EXPORT_WIDTH, 1920))
  }, [])

  const setPosterHeightSafe = useCallback((value: number) => {
    setPosterHeight(normalizeDimension(value, MIN_EXPORT_HEIGHT, MAX_EXPORT_HEIGHT, 1080))
  }, [])

  const setBackgroundPositionXPctSafe = useCallback((value: number) => {
    setPosterBackgroundPositionXPct(clamp(value, 0, 100))
  }, [])

  const setBackgroundPositionYPctSafe = useCallback((value: number) => {
    setPosterBackgroundPositionYPct(clamp(value, 0, 100))
  }, [])

  const setBackgroundScaleXPctSafe = useCallback((value: number) => {
    const safe = clamp(value, MIN_BG_SCALE, MAX_BG_SCALE)
    if (posterBackgroundImageDimensions) {
      const nextHeightPct = clamp(
        getBackgroundHeightPctForWidthPct(
          safe,
          safePosterWidth,
          safePosterHeight,
          posterBackgroundImageDimensions.width,
          posterBackgroundImageDimensions.height,
        ),
        MIN_BG_SCALE,
        MAX_BG_SCALE,
      )
      setPosterBackgroundScaleXPct(safe)
      setPosterBackgroundScaleYPct(nextHeightPct)
      return
    }
    setPosterBackgroundScaleXPct(safe)
  }, [posterBackgroundImageDimensions, safePosterHeight, safePosterWidth])

  const setBackgroundScaleYPctSafe = useCallback((value: number) => {
    const safe = clamp(value, MIN_BG_SCALE, MAX_BG_SCALE)
    if (posterBackgroundImageDimensions) {
      const nextWidthPct = clamp(
        getBackgroundWidthPctForHeightPct(
          safe,
          safePosterWidth,
          safePosterHeight,
          posterBackgroundImageDimensions.width,
          posterBackgroundImageDimensions.height,
        ),
        MIN_BG_SCALE,
        MAX_BG_SCALE,
      )
      const nextHeightPct = clamp(
        getBackgroundHeightPctForWidthPct(
          nextWidthPct,
          safePosterWidth,
          safePosterHeight,
          posterBackgroundImageDimensions.width,
          posterBackgroundImageDimensions.height,
        ),
        MIN_BG_SCALE,
        MAX_BG_SCALE,
      )
      setPosterBackgroundScaleXPct(nextWidthPct)
      setPosterBackgroundScaleYPct(nextHeightPct)
      return
    }
    setPosterBackgroundScaleYPct(safe)
  }, [posterBackgroundImageDimensions, safePosterHeight, safePosterWidth])

  const setBackgroundScaleUniformSafe = useCallback((value: number) => {
    const safe = clamp(value, MIN_BG_SCALE, MAX_BG_SCALE)
    if (posterBackgroundImageDimensions) {
      const nextHeightPct = clamp(
        getBackgroundHeightPctForWidthPct(
          safe,
          safePosterWidth,
          safePosterHeight,
          posterBackgroundImageDimensions.width,
          posterBackgroundImageDimensions.height,
        ),
        MIN_BG_SCALE,
        MAX_BG_SCALE,
      )
      setPosterBackgroundScaleXPct(safe)
      setPosterBackgroundScaleYPct(nextHeightPct)
      return
    }
    setPosterBackgroundScaleXPct(safe)
    setPosterBackgroundScaleYPct(safe)
  }, [posterBackgroundImageDimensions, safePosterHeight, safePosterWidth])

  const setPreviewZoomPctSafe = useCallback((value: number) => {
    setPosterPreviewZoomPct(clamp(value, MIN_PREVIEW_ZOOM, MAX_PREVIEW_ZOOM))
  }, [])

  const setTopCountSafe = useCallback((count: number) => {
    setTopCount(clamp(Number.isFinite(count) ? count : MIN_TOP_COUNT, MIN_TOP_COUNT, MAX_TOP_COUNT))
  }, [])

  const moveBackground = useCallback((xPct: number, yPct: number) => {
    setPosterBackgroundPositionXPct(clamp(xPct, 0, 100))
    setPosterBackgroundPositionYPct(clamp(yPct, 0, 100))
  }, [])

  return {
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
    projectName,
  }
}
