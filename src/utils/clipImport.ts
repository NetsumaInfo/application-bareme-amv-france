import type { Clip } from '@/types/project'
import { generateId, parseClipName } from '@/utils/formatters'
import { findMatchingPlaceholderIndex } from '@/utils/clipImportTokens'
import {
  buildManualFileName,
  sanitizeManualPart,
  type ManualClipEntry,
} from '@/utils/manualClipParser'
export { parseManualClipLine } from '@/utils/manualClipParser'
export type { ManualClipEntry } from '@/utils/manualClipParser'

export interface ImportMergeResult {
  clips: Clip[]
  linkedCount: number
  addedCount: number
}

interface MergeOptions {
  appendUnmatched?: boolean
}

export function createManualClip(entry: ManualClipEntry, order: number): Clip {
  const author = sanitizeManualPart(entry.author)
  const displayName = sanitizeManualPart(entry.displayName)
  return {
    id: generateId(),
    fileName: buildManualFileName(entry),
    filePath: '',
    displayName,
    author: author || undefined,
    duration: 0,
    hasInternalSubtitles: false,
    audioTrackCount: 1,
    scored: false,
    order,
  }
}

export function createClipFromFilePath(filePath: string, order: number): Clip {
  const fileName = filePath.split(/[\\/]/).pop() || filePath
  const parsed = parseClipName(fileName)
  return {
    id: generateId(),
    fileName,
    filePath,
    displayName: parsed.displayName,
    author: parsed.author,
    duration: 0,
    hasInternalSubtitles: false,
    audioTrackCount: 1,
    scored: false,
    order,
  }
}

export function createClipFromVideoMeta(
  metadata: { file_name: string; file_path: string },
  order: number,
): Clip {
  const parsed = parseClipName(metadata.file_name)
  return {
    id: generateId(),
    fileName: metadata.file_name,
    filePath: metadata.file_path,
    displayName: parsed.displayName,
    author: parsed.author,
    duration: 0,
    hasInternalSubtitles: false,
    audioTrackCount: 1,
    scored: false,
    order,
  }
}

export function mergeImportedVideosWithClips(
  existingClips: Clip[],
  importedClips: Clip[],
  options?: MergeOptions,
): ImportMergeResult {
  const appendUnmatched = options?.appendUnmatched ?? true
  const current = [...existingClips]
  const matchedPlaceholderIds = new Set<string>()
  const seenPaths = new Set(
    current
      .map((clip) => clip.filePath)
      .filter((path) => Boolean(path)),
  )
  const queuedImports: Clip[] = []
  let linkedCount = 0
  let addedCount = 0

  for (const imported of importedClips) {
    const importedPath = imported.filePath?.trim()
    if (!importedPath || seenPaths.has(importedPath)) continue
    seenPaths.add(importedPath)
    queuedImports.push(imported)
  }

  for (const imported of queuedImports) {
    const matchIndex = findMatchingPlaceholderIndex(current, imported, matchedPlaceholderIds)

    if (matchIndex >= 0) {
      const placeholder = current[matchIndex]
      matchedPlaceholderIds.add(placeholder.id)
      linkedCount += 1
      current[matchIndex] = {
        ...placeholder,
        fileName: imported.fileName,
        filePath: imported.filePath,
        displayName: placeholder.displayName?.trim() ? placeholder.displayName : imported.displayName,
        author: placeholder.author?.trim() ? placeholder.author : imported.author,
        duration: imported.duration || placeholder.duration,
        hasInternalSubtitles: imported.hasInternalSubtitles,
        audioTrackCount: imported.audioTrackCount || placeholder.audioTrackCount || 1,
      }
      continue
    }

    if (appendUnmatched) {
      current.push({
        ...imported,
        order: current.length,
      })
      addedCount += 1
    }
  }

  const reordered = current.map((clip, index) => ({ ...clip, order: index }))
  return {
    clips: reordered,
    linkedCount,
    addedCount,
  }
}
