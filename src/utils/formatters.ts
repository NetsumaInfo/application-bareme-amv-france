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

export function formatPreciseTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00.000'

  const totalMilliseconds = Math.round(seconds * 1000)
  const hrs = Math.floor(totalMilliseconds / 3_600_000)
  const mins = Math.floor((totalMilliseconds % 3_600_000) / 60_000)
  const secs = Math.floor((totalMilliseconds % 60_000) / 1000)
  const millis = totalMilliseconds % 1000

  const timePart = hrs > 0
    ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins}:${secs.toString().padStart(2, '0')}`

  return `${timePart}.${millis.toString().padStart(3, '0')}`
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

export function splitAuthorPseudos(author?: string): string[] {
  if (!author) return []
  return author
    .split(/[,&]/)
    .map((pseudo) => pseudo.trim())
    .filter((pseudo) => pseudo.length > 0)
}

export function getAuthorCollabLabel(author?: string): 'colab' | 'mep' | null {
  const pseudos = splitAuthorPseudos(author)
  if (pseudos.length === 2) return 'colab'
  if (pseudos.length >= 3) return 'mep'
  return null
}
