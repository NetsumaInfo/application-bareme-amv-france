import type { Clip } from '@/types/project'
import { CATEGORY_COLOR_PRESETS, sanitizeColor } from '@/utils/colors'

export const UNCATEGORIZED_CONTEST_CATEGORY_KEY = '__uncategorized__'
export const ALL_CONTEST_CATEGORY_KEY = '__all__'

const MAX_CATEGORY_LENGTH = 80
const MAX_PRESET_COUNT = 24
const FALLBACK_CATEGORY_COLOR = '#6f6f86'

export interface ContestCategoryEditorItem {
  name: string
  color: string
}

export function normalizeContestCategory(value: unknown): string {
  if (typeof value !== 'string') return ''
  const normalized = value
    .replace(/\s+/g, ' ')
    .trim()
  if (!normalized) return ''
  return normalized.slice(0, MAX_CATEGORY_LENGTH)
}

export function getClipContestCategory(clip: Pick<Clip, 'contestCategory'>): string {
  return normalizeContestCategory(clip.contestCategory)
}

export function normalizeContestCategoryPresets(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const unique = new Set<string>()
  for (const item of value) {
    const normalized = normalizeContestCategory(item)
    if (!normalized) continue
    unique.add(normalized)
    if (unique.size >= MAX_PRESET_COUNT) break
  }
  return Array.from(unique)
}

export function parseContestCategoryPresetsText(value: string): string[] {
  if (typeof value !== 'string') return []
  const tokens = value
    .split(/[\n,;|]+/g)
    .map((item) => normalizeContestCategory(item))
    .filter((item) => item.length > 0)
  return normalizeContestCategoryPresets(tokens)
}

export function formatContestCategoryPresetsText(values: string[]): string {
  return normalizeContestCategoryPresets(values).join('\n')
}

export function normalizeContestCategoryColorMap(
  value: unknown,
  categories: string[] = [],
): Record<string, string> {
  const raw = (value && typeof value === 'object') ? value as Record<string, unknown> : {}
  const normalizedCategories = normalizeContestCategoryPresets(categories)
  const result: Record<string, string> = {}

  for (const [index, category] of normalizedCategories.entries()) {
    const colorValue = raw[category]
    const fallback = CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length] ?? FALLBACK_CATEGORY_COLOR
    result[category] = sanitizeColor(typeof colorValue === 'string' ? colorValue : '', fallback)
  }

  if (normalizedCategories.length > 0) return result

  for (const [rawCategory, rawColor] of Object.entries(raw)) {
    const category = normalizeContestCategory(rawCategory)
    if (!category) continue
    if (typeof rawColor !== 'string') continue
    result[category] = sanitizeColor(rawColor, FALLBACK_CATEGORY_COLOR)
  }
  return result
}

export function getContestCategoryColor(
  category: string,
  categoryColors: Record<string, string> | null | undefined,
  fallbackIndex: number,
): string {
  const normalizedCategory = normalizeContestCategory(category)
  const fallback = CATEGORY_COLOR_PRESETS[fallbackIndex % CATEGORY_COLOR_PRESETS.length] ?? FALLBACK_CATEGORY_COLOR
  if (!normalizedCategory) return fallback
  const configuredColor = categoryColors?.[normalizedCategory]
  return sanitizeColor(configuredColor, fallback)
}

export function buildContestCategoryEditorItems(
  presets: string[],
  categoryColors: Record<string, string> | null | undefined,
): ContestCategoryEditorItem[] {
  const normalizedPresets = normalizeContestCategoryPresets(presets)
  return normalizedPresets.map((name, index) => ({
    name,
    color: getContestCategoryColor(name, categoryColors, index),
  }))
}

export function normalizeContestCategoryEditorItems(
  items: ContestCategoryEditorItem[],
): {
  presets: string[]
  colors: Record<string, string>
} {
  const presets: string[] = []
  const colors: Record<string, string> = {}
  const seen = new Set<string>()

  for (const item of items) {
    const name = normalizeContestCategory(item.name)
    if (!name) continue
    const dedupKey = name.toLowerCase()
    if (seen.has(dedupKey)) continue
    seen.add(dedupKey)
    presets.push(name)
    colors[name] = sanitizeColor(item.color, getContestCategoryColor(name, {}, presets.length - 1))
    if (presets.length >= MAX_PRESET_COUNT) break
  }

  return { presets, colors }
}

export function matchesContestCategoryKey(
  clip: Pick<Clip, 'contestCategory'>,
  categoryKey: string,
): boolean {
  if (categoryKey === ALL_CONTEST_CATEGORY_KEY) return true
  const clipCategory = getClipContestCategory(clip)
  if (categoryKey === UNCATEGORIZED_CONTEST_CATEGORY_KEY) return clipCategory.length === 0
  return clipCategory === categoryKey
}
