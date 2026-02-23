import type { Clip } from '@/types/project'
import { getClipPrimaryLabel } from '@/utils/formatters'

export function getSortedClipIndices(clips: Clip[]): number[] {
  const indices = clips.map((_, index) => index)
  indices.sort((indexA, indexB) => {
    const clipA = clips[indexA]
    const clipB = clips[indexB]
    const labelA = getClipPrimaryLabel(clipA)
    const labelB = getClipPrimaryLabel(clipB)
    const compare = labelA.localeCompare(labelB, 'fr', { sensitivity: 'base' })
    if (compare !== 0) return compare
    return indexA - indexB
  })
  return indices
}

export function getSortedClipPosition(clips: Clip[], currentIndex: number): number {
  if (currentIndex < 0 || currentIndex >= clips.length) return -1
  const sortedIndices = getSortedClipIndices(clips)
  return sortedIndices.indexOf(currentIndex)
}

