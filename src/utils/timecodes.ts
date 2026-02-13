import type { Bareme } from '@/types/bareme'
import type { Note } from '@/types/notation'
import { CATEGORY_COLOR_PRESETS, sanitizeColor } from '@/utils/colors'
import { formatTime } from '@/utils/formatters'

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

const TIMECODE_REGEX = /\b(?:(\d{1,2}):)?([0-5]?\d):([0-5]\d(?:[.,]\d{1,3})?)\b/g

function toSeconds(hours: string | undefined, minutes: string, seconds: string): number {
  const h = hours ? Number(hours) : 0
  const m = Number(minutes)
  const s = Number(seconds.replace(',', '.'))
  if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(s)) return NaN
  return h * 3600 + m * 60 + s
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

export function extractTimecodesFromText(text: string, maxSeconds?: number): ParsedTimecode[] {
  if (!text.trim()) return []
  const output: ParsedTimecode[] = []
  TIMECODE_REGEX.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = TIMECODE_REGEX.exec(text)) !== null) {
    const seconds = toSeconds(match[1], match[2], match[3])
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
) {
  if (!text) return
  const parsed = extractTimecodesFromText(text, maxSeconds)
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
      label: formatTime(item.seconds),
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
): NoteTimecodeMarker[] {
  if (!note) return []

  const markers: NoteTimecodeMarker[] = []
  const categoryColors = categoryColorMap(bareme)
  const criterionCategoryMap = new Map<string, string>()
  for (const criterion of bareme?.criteria ?? []) {
    criterionCategoryMap.set(criterion.id, criterion.category || 'General')
  }

  pushMarkers(markers, note.textNotes, 'global', '#60a5fa', undefined, undefined, maxSeconds)

  for (const [category, text] of Object.entries(note.categoryNotes || {})) {
    pushMarkers(
      markers,
      text,
      'category',
      categoryColors.get(category) ?? '#818cf8',
      category,
      undefined,
      maxSeconds,
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
    )
  }

  const dedup = new Map<string, NoteTimecodeMarker>()
  for (const marker of markers) {
    const bucket = Math.round(marker.seconds * 10) / 10
    const key = `${marker.source}:${marker.category ?? ''}:${marker.criterionId ?? ''}:${bucket}`
    if (!dedup.has(key)) dedup.set(key, marker)
  }

  return Array.from(dedup.values()).sort((a, b) => a.seconds - b.seconds)
}
