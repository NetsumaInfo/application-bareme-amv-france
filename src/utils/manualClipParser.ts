export interface ManualClipEntry {
  author?: string
  displayName: string
}

export function sanitizeManualPart(value: string | undefined): string {
  if (!value) return ''
  return value
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildManualFileName(entry: ManualClipEntry): string {
  const author = sanitizeManualPart(entry.author)
  const display = sanitizeManualPart(entry.displayName)
  if (author && display) {
    return `${author} - ${display}`
  }
  if (author) return author
  return display
}

export function parseManualClipLine(line: string): ManualClipEntry | null {
  const raw = line.trim()
  if (!raw) return null

  const tabParts = raw.split('\t').map((part) => part.trim()).filter(Boolean)
  if (tabParts.length >= 2) {
    const author = sanitizeManualPart(tabParts[0])
    const displayName = sanitizeManualPart(tabParts.slice(1).join(' '))
    if (!displayName) return null
    return { author, displayName }
  }

  const withSeparator = raw.match(/^(.+?)\s*[-|;:]\s*(.+)$/)
  if (withSeparator) {
    const author = sanitizeManualPart(withSeparator[1])
    const displayName = sanitizeManualPart(withSeparator[2])
    if (!displayName) return null
    return { author, displayName }
  }

  return { displayName: sanitizeManualPart(raw) }
}
