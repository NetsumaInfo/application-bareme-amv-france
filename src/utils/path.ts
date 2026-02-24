export function normalizeFilePath(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return ''

  let normalized = trimmed
    .replace(/^\\\\\?\\/, '')
    .replace(/\\/g, '/')

  if (/^file:\/\//i.test(normalized)) {
    try {
      normalized = decodeURIComponent(normalized.replace(/^file:\/+/, ''))
    } catch {
      normalized = normalized.replace(/^file:\/+/, '')
    }
  }

  if (/^\/[a-z]:\//i.test(normalized)) {
    normalized = normalized.slice(1)
  }

  normalized = normalized.replace(/\/+$/, '')
  return normalized.toLowerCase()
}

export function hasSameFilePath(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeFilePath(a)
  const right = normalizeFilePath(b)
  return Boolean(left) && left === right
}
