import type { Clip } from '@/types/project'
import { normalizeContestCategory } from '@/utils/contestCategory'

export interface RemovedClipHistoryEntry {
  clip: Clip
  removedIndex: number
  previousCurrentClipIndex: number
}

export function normalizeThumbnailTime(seconds: number | null): number | null {
  const normalized = seconds === null ? null : Number(seconds)
  if (normalized === null) return null
  if (!Number.isFinite(normalized) || normalized < 0) return null
  return Math.round(normalized * 1000) / 1000
}

export function updateClipThumbnail(
  clips: Clip[],
  clipId: string,
  seconds: number | null,
): Clip[] {
  return clips.map((clip) => {
    if (clip.id !== clipId) return clip
    if (seconds === null) return { ...clip, thumbnailTime: undefined }
    return { ...clip, thumbnailTime: seconds }
  })
}

export function updateClipScoredState(
  clips: Clip[],
  clipId: string,
  scored: boolean,
): Clip[] {
  return clips.map((clip) => (clip.id === clipId ? { ...clip, scored } : clip))
}

export function updateClipFavoriteState(
  clips: Clip[],
  clipId: string,
  favorite: boolean,
  comment?: string,
): Clip[] {
  return clips.map((clip) => {
    if (clip.id !== clipId) return clip

    if (!favorite) {
      return {
        ...clip,
        favorite: false,
        favoriteComment: '',
      }
    }

    return {
      ...clip,
      favorite: true,
      favoriteComment: comment ?? clip.favoriteComment ?? '',
    }
  })
}

export function updateClipContestCategory(
  clips: Clip[],
  clipId: string,
  contestCategory: string,
): Clip[] {
  const normalized = normalizeContestCategory(contestCategory)
  return clips.map((clip) => {
    if (clip.id !== clipId) return clip
    return {
      ...clip,
      contestCategory: normalized || undefined,
    }
  })
}

export function removeClipAndAdjustSelection(
  clips: Clip[],
  currentClipIndex: number,
  clipId: string,
): { clips: Clip[]; currentClipIndex: number; removedEntry: RemovedClipHistoryEntry | null } {
  const removedIndex = clips.findIndex((clip) => clip.id === clipId)
  if (removedIndex < 0) {
    return {
      clips,
      currentClipIndex,
      removedEntry: null,
    }
  }

  const removedClip = clips[removedIndex]
  const nextClips = clips.filter((clip) => clip.id !== clipId)
  let nextIndex = currentClipIndex

  if (removedIndex <= currentClipIndex && currentClipIndex > 0) {
    nextIndex = Math.min(currentClipIndex - 1, nextClips.length - 1)
  }
  if (nextIndex >= nextClips.length) {
    nextIndex = Math.max(0, nextClips.length - 1)
  }

  return {
    clips: nextClips,
    currentClipIndex: nextIndex,
    removedEntry: {
      clip: removedClip,
      removedIndex,
      previousCurrentClipIndex: currentClipIndex,
    },
  }
}

export function restoreRemovedClip(
  clips: Clip[],
  entry: RemovedClipHistoryEntry,
): { clips: Clip[]; currentClipIndex: number } {
  const existingIndex = clips.findIndex((clip) => clip.id === entry.clip.id)
  if (existingIndex >= 0) {
    return {
      clips,
      currentClipIndex: existingIndex,
    }
  }

  const insertIndex = Math.max(0, Math.min(entry.removedIndex, clips.length))
  const nextClips = [...clips]
  nextClips.splice(insertIndex, 0, entry.clip)

  return {
    clips: nextClips,
    currentClipIndex: insertIndex,
  }
}
