import type { Clip } from '@/types/project'

function normalizeImportToken(value: string | undefined): string {
  if (!value) return ''
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getClipAuthorToken(clip: Clip): string {
  return normalizeImportToken(clip.author)
}

function getClipDisplayToken(clip: Clip): string {
  return normalizeImportToken(clip.displayName || clip.fileName)
}

function getClipFullToken(clip: Clip): string {
  const author = getClipAuthorToken(clip)
  const display = getClipDisplayToken(clip)
  if (author && display) return `${author} ${display}`.trim()
  return display || author
}

function getImportAuthorToken(clip: Clip): string {
  return normalizeImportToken(clip.author)
}

function getImportDisplayToken(clip: Clip): string {
  return normalizeImportToken(clip.displayName || clip.fileName)
}

function getImportFullToken(clip: Clip): string {
  const author = getImportAuthorToken(clip)
  const display = getImportDisplayToken(clip)
  if (author && display) return `${author} ${display}`.trim()
  return display || author
}

export function findMatchingPlaceholderIndex(
  current: Clip[],
  imported: Clip,
  matchedPlaceholderIds: Set<string>,
): number {
  const importedFull = getImportFullToken(imported)
  const importedDisplay = getImportDisplayToken(imported)
  const importedAuthor = getImportAuthorToken(imported)

  const fullMatchIndex = current.findIndex((clip) => {
    if (clip.filePath?.trim()) return false
    if (matchedPlaceholderIds.has(clip.id)) return false
    const clipFull = getClipFullToken(clip)
    return Boolean(importedFull) && clipFull === importedFull
  })
  if (fullMatchIndex >= 0) return fullMatchIndex

  return current.findIndex((clip) => {
    if (clip.filePath?.trim()) return false
    if (matchedPlaceholderIds.has(clip.id)) return false
    const clipDisplay = getClipDisplayToken(clip)
    if (!importedDisplay || clipDisplay !== importedDisplay) return false
    const clipAuthor = getClipAuthorToken(clip)
    return !importedAuthor || !clipAuthor || clipAuthor === importedAuthor
  })
}

export function findMatchingLinkedClipIndex(
  current: Clip[],
  imported: Clip,
  matchedClipIds: Set<string>,
): number {
  const importedFull = getImportFullToken(imported)
  const importedDisplay = getImportDisplayToken(imported)
  const importedAuthor = getImportAuthorToken(imported)

  const fullMatchIndex = current.findIndex((clip) => {
    if (!clip.filePath?.trim()) return false
    if (matchedClipIds.has(clip.id)) return false
    const clipFull = getClipFullToken(clip)
    return Boolean(importedFull) && clipFull === importedFull
  })
  if (fullMatchIndex >= 0) return fullMatchIndex

  return current.findIndex((clip) => {
    if (!clip.filePath?.trim()) return false
    if (matchedClipIds.has(clip.id)) return false
    const clipDisplay = getClipDisplayToken(clip)
    if (!importedDisplay || clipDisplay !== importedDisplay) return false
    const clipAuthor = getClipAuthorToken(clip)
    return !importedAuthor || !clipAuthor || clipAuthor === importedAuthor
  })
}
