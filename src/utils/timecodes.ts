import type { Bareme } from '@/types/bareme'
import type { Note } from '@/types/notation'
import { CATEGORY_COLOR_PRESETS, sanitizeColor } from '@/utils/colors'
import { formatPreciseTimecode } from '@/utils/formatters'

export interface ParsedTimecode {
  raw: string
  seconds: number
  index: number
}

export interface NoteTimecodeMarker {
  key: string
  raw: string
  label: string
  seconds: number
  color: string
  previewText: string
  source: 'global' | 'category' | 'criterion'
  category?: string
  criterionId?: string
}

const TIMECODE_REGEX = /\b(?:\d{1,2}:){1,3}\d{1,2}(?:[.,]\d{1,3})?\b/g

export function snapToFrameSeconds(seconds: number, fps?: number | null): number {
  if (!Number.isFinite(seconds) || seconds < 0) return 0
  const parsedFps = Number(fps)
  if (!Number.isFinite(parsedFps) || parsedFps <= 0) {
    return seconds
  }
  const snapped = Math.round(seconds * parsedFps) / parsedFps
  return Number(snapped.toFixed(6))
}

function parseTimecodeRaw(raw: string, fpsHint?: number): number {
  const normalized = raw.replace(',', '.')
  const segments = normalized.split(':')
  if (segments.length < 2 || segments.length > 4) return NaN

  if (segments.length === 4) {
    const [hoursRaw, minutesRaw, secondsRaw, framesRaw] = segments
    const hours = Number(hoursRaw)
    const minutes = Number(minutesRaw)
    const seconds = Number(secondsRaw)
    const frames = Number(framesRaw)
    const fps = Number.isFinite(fpsHint) && Number(fpsHint) > 0 ? Number(fpsHint) : 30

    if (![hours, minutes, seconds, frames].every(Number.isFinite)) return NaN
    if (hours < 0 || minutes < 0 || seconds < 0 || frames < 0) return NaN
    if (minutes > 59 || seconds > 59) return NaN

    return hours * 3600 + minutes * 60 + seconds + (frames / fps)
  }

  const hasFraction = segments[segments.length - 1].includes('.')
  if (hasFraction && segments.length > 3) return NaN

  if (segments.length === 3) {
    const [hoursRaw, minutesRaw, secondsRaw] = segments
    const hours = Number(hoursRaw)
    const minutes = Number(minutesRaw)
    const seconds = Number(secondsRaw)
    if (![hours, minutes, seconds].every(Number.isFinite)) return NaN
    if (hours < 0 || minutes < 0 || seconds < 0) return NaN
    if (minutes > 59 || seconds >= 60) return NaN
    return hours * 3600 + minutes * 60 + seconds
  }

  const [minutesRaw, secondsRaw] = segments
  const minutes = Number(minutesRaw)
  const seconds = Number(secondsRaw)
  if (![minutes, seconds].every(Number.isFinite)) return NaN
  if (minutes < 0 || seconds < 0 || seconds >= 60) return NaN
  return minutes * 60 + seconds
}

function categoryColorMap(bareme: Bareme | null | undefined): Map<string, string> {
  const map = new Map<string, string>()
  if (!bareme) return map
  const orderedCategories: string[] = []
  for (const criterion of bareme.criteria) {
    const category = criterion.category || 'General'
    if (!orderedCategories.includes(category)) orderedCategories.push(category)
  }
  orderedCategories.forEach((category, index) => {
    const fallback = CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length]
    map.set(category, sanitizeColor(bareme.categoryColors?.[category], fallback))
  })
  return map
}

export function extractTimecodesFromText(
  text: string,
  maxSeconds?: number,
  fpsHint?: number,
): ParsedTimecode[] {
  if (!text.trim()) return []
  const output: ParsedTimecode[] = []
  TIMECODE_REGEX.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = TIMECODE_REGEX.exec(text)) !== null) {
    const seconds = parseTimecodeRaw(match[0], fpsHint)
    if (!Number.isFinite(seconds) || seconds < 0) continue
    if (typeof maxSeconds === 'number' && Number.isFinite(maxSeconds) && maxSeconds > 0 && seconds > maxSeconds) {
      continue
    }
    output.push({
      raw: match[0],
      seconds,
      index: match.index,
    })
  }
  return output
}

function pushMarkers(
  list: NoteTimecodeMarker[],
  text: string | undefined,
  source: 'global' | 'category' | 'criterion',
  color: string,
  category: string | undefined,
  criterionId: string | undefined,
  maxSeconds: number | undefined,
  fpsHint: number | undefined,
) {
  if (!text) return
  const parsed = extractTimecodesFromText(text, maxSeconds, fpsHint)
  for (let i = 0; i < parsed.length; i += 1) {
    const item = parsed[i]
    const nextStart = parsed[i + 1]?.index ?? text.length
    const previewText = text
      .slice(item.index + item.raw.length, nextStart)
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 10)
      .join(' ')

    list.push({
      key: `${source}:${category ?? ''}:${criterionId ?? ''}:${Math.round(item.seconds * 1000)}:${item.index}`,
      raw: item.raw,
      label: formatPreciseTimecode(item.seconds),
      seconds: item.seconds,
      color,
      previewText,
      source,
      category,
      criterionId,
    })
  }
}

export function buildNoteTimecodeMarkers(
  note: Note | null | undefined,
  bareme: Bareme | null | undefined,
  maxSeconds?: number,
  fpsHint?: number,
): NoteTimecodeMarker[] {
  if (!note) return []

  const markers: NoteTimecodeMarker[] = []
  const categoryColors = categoryColorMap(bareme)
  const criterionCategoryMap = new Map<string, string>()
  for (const criterion of bareme?.criteria ?? []) {
    criterionCategoryMap.set(criterion.id, criterion.category || 'General')
  }

  pushMarkers(markers, note.textNotes, 'global', '#60a5fa', undefined, undefined, maxSeconds, fpsHint)

  for (const [category, text] of Object.entries(note.categoryNotes || {})) {
    pushMarkers(
      markers,
      text,
      'category',
      categoryColors.get(category) ?? '#818cf8',
      category,
      undefined,
      maxSeconds,
      fpsHint,
    )
  }

  for (const [criterionId, text] of Object.entries(note.criterionNotes || {})) {
    const category = criterionCategoryMap.get(criterionId)
    pushMarkers(
      markers,
      text,
      'criterion',
      category ? (categoryColors.get(category) ?? '#22d3ee') : '#22d3ee',
      category,
      criterionId,
      maxSeconds,
      fpsHint,
    )
  }

  return markers.sort((a, b) => a.seconds - b.seconds)
}
