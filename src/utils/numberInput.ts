export function parseNumericInputValue(raw: string): number | '' | null {
  const trimmed = raw.trim()
  if (trimmed === '') return ''

  const normalized = trimmed.replace(',', '.')
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

