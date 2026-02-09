export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'

  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatScore(score: number, maxScore: number): string {
  return `${score}/${maxScore}`
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function parseClipName(fileName: string): { displayName: string; author?: string } {
  const withoutExt = fileName.replace(/\.[^.]+$/, '')
  const dashIndex = withoutExt.indexOf('-')

  let author: string | undefined
  let rawName: string

  if (dashIndex > 0) {
    author = withoutExt.substring(0, dashIndex).replace(/_/g, ' ').trim()
    rawName = withoutExt.substring(dashIndex + 1)
  } else {
    rawName = withoutExt
  }

  const displayName = rawName.replace(/_/g, ' ').trim()

  return { displayName, author: author || undefined }
}

export function getClipPrimaryLabel(clip: {
  author?: string
  displayName?: string
  fileName: string
}): string {
  return clip.author?.trim() || clip.displayName?.trim() || clip.fileName
}

export function getClipSecondaryLabel(clip: {
  author?: string
  displayName?: string
}): string | null {
  if (!clip.author) return null
  const name = clip.displayName?.trim()
  return name ? name : null
}
