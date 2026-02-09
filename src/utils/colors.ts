export const CATEGORY_COLOR_PRESETS = [
  '#fb923c',
  '#a78bfa',
  '#34d399',
  '#f59e0b',
  '#38bdf8',
  '#fb7185',
  '#2dd4bf',
  '#818cf8',
]

export function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace('#', '').trim()
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return `rgba(99, 102, 241, ${alpha})`
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`
}

export function sanitizeColor(color?: string, fallback = '#6366f1'): string {
  if (!color) return fallback
  const normalized = color.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return normalized
  return fallback
}

