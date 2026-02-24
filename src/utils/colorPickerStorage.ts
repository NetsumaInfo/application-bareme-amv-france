import { sanitizeColor } from '@/utils/colors'

export const COLOR_MEMORY_KEYS = {
  defaultColor: 'amv-notation-color-default',
  favoritesGlobal: 'amv-notation-color-favorites',
  recentGlobal: 'amv-notation-color-memory',
  recentJudgeColors: 'amv-notation-color-memory-judge',
  recentBaremeColors: 'amv-notation-color-memory-bareme',
} as const

export function readStoredColor(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const normalized = sanitizeColor(raw, '')
    return normalized || null
  } catch {
    return null
  }
}

export function writeStoredColor(key: string, color: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (!color) {
      window.localStorage.removeItem(key)
      return
    }
    window.localStorage.setItem(key, sanitizeColor(color))
  } catch {
    // ignore storage errors
  }
}

export function readStoredColorList(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((entry) => (typeof entry === 'string' ? sanitizeColor(entry, '') : ''))
      .filter((entry) => entry.length > 0)
  } catch {
    return []
  }
}

export function writeStoredColorList(key: string, colors: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(colors))
  } catch {
    // ignore storage errors
  }
}

