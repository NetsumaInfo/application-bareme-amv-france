import type {
  ExportPosterImageLayer,
  ExportPngMode,
} from '@/components/interfaces/export/types'

export const MIN_TOP_COUNT = 1
export const MAX_TOP_COUNT = 20
export const MIN_PNG_SCALE = 2
export const MAX_PNG_SCALE = 5
export const MIN_ROWS_PER_IMAGE = 5
export const MAX_ROWS_PER_IMAGE = 80
export const MIN_EXPORT_WIDTH = 320
export const MAX_EXPORT_WIDTH = 8000
export const MIN_EXPORT_HEIGHT = 240
export const MAX_EXPORT_HEIGHT = 8000
export const MIN_BG_SCALE = 20
export const MAX_BG_SCALE = 250
export const MIN_PREVIEW_ZOOM = 25
export const MAX_PREVIEW_ZOOM = 250

export const SIZE_PRESET_VALUES = ['1920x1080', '1080x1920', '1080x1350', '2048x1152'] as const

export interface ExportCaptureOptions {
  scale: number
  backgroundColor: string
  pngMode: ExportPngMode
  fileNameStem: string
}

export type LocalFontsWindow = Window & {
  queryLocalFonts?: () => Promise<Array<{ family?: string | null }>>
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function normalizeDimension(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.round(clamp(value, min, max))
}

export function parseSizePreset(raw: string): { width: number; height: number } | null {
  const [wRaw, hRaw] = raw.split('x')
  const width = Number(wRaw)
  const height = Number(hRaw)
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null
  return { width, height }
}

export function getBackgroundHeightPctForWidthPct(
  widthPct: number,
  posterWidth: number,
  posterHeight: number,
  imageWidth: number,
  imageHeight: number,
): number {
  if (posterWidth <= 0 || posterHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) return widthPct
  const renderedWidthPx = (posterWidth * widthPct) / 100
  const renderedHeightPx = (renderedWidthPx * imageHeight) / imageWidth
  return (renderedHeightPx / posterHeight) * 100
}

export function getBackgroundWidthPctForHeightPct(
  heightPct: number,
  posterWidth: number,
  posterHeight: number,
  imageWidth: number,
  imageHeight: number,
): number {
  if (posterWidth <= 0 || posterHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) return heightPct
  const renderedHeightPx = (posterHeight * heightPct) / 100
  const renderedWidthPx = (renderedHeightPx * imageWidth) / imageHeight
  return (renderedWidthPx / posterWidth) * 100
}

export function getCoverBackgroundWidthPct(
  posterWidth: number,
  posterHeight: number,
  imageWidth: number,
  imageHeight: number,
): number {
  if (posterWidth <= 0 || posterHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) return 100
  const posterRatio = posterWidth / posterHeight
  const imageRatio = imageWidth / imageHeight
  if (imageRatio >= posterRatio) {
    return (posterHeight * imageRatio / posterWidth) * 100
  }
  return 100
}

export function readImageDimensions(src: string): Promise<{ width: number; height: number } | null> {
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

export function normalizeImageLayer(layer: ExportPosterImageLayer): ExportPosterImageLayer {
  const widthPct = clamp(layer.widthPct, 4, 95)
  const maxX = Math.max(0, 100 - widthPct)
  return {
    ...layer,
    zIndex: Number.isFinite(layer.zIndex) ? Math.max(0, Math.round(layer.zIndex)) : 0,
    widthPct,
    xPct: clamp(layer.xPct, 0, maxX),
    yPct: clamp(layer.yPct, 0, 94),
    opacity: clamp(layer.opacity, 0, 100),
    rotationDeg: clamp(layer.rotationDeg, -180, 180),
  }
}

export function toCssFontFamily(family: string): string {
  const cleaned = family.trim()
  if (!cleaned) return ''
  const escaped = cleaned.replace(/"/g, '\\"')
  return `"${escaped}", sans-serif`
}

export function normalizeOptionalText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function sanitizeExportFilePart(value: string): string {
  const safe = value
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .split('')
    .map((char) => (char.charCodeAt(0) < 32 ? '_' : char))
    .join('')
  return safe || 'export'
}
