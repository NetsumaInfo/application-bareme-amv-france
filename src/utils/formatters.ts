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

/**
 * Parse clip filename into author and display name.
 * Patterns:
 *   "pseudo-nom_du_clip.mp4" → { author: "pseudo", displayName: "nom du clip" }
 *   "nom_du_clip.mp4" → { author: undefined, displayName: "nom du clip" }
 */
export function parseClipName(fileName: string): { displayName: string; author?: string } {
  // Remove extension
  const withoutExt = fileName.replace(/\.[^.]+$/, '')

  // Check for "pseudo-rest_of_name" pattern (first dash is separator)
  const dashIndex = withoutExt.indexOf('-')

  let author: string | undefined
  let rawName: string

  if (dashIndex > 0) {
    author = withoutExt.substring(0, dashIndex).replace(/_/g, ' ').trim()
    rawName = withoutExt.substring(dashIndex + 1)
  } else {
    rawName = withoutExt
  }

  // Replace underscores with spaces for display
  const displayName = rawName.replace(/_/g, ' ').trim()

  return { displayName, author: author || undefined }
}
