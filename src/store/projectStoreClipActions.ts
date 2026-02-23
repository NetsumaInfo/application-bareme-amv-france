import type { Clip } from '@/types/project'

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

export function removeClipAndAdjustSelection(
  clips: Clip[],
  currentClipIndex: number,
  clipId: string,
): { clips: Clip[]; currentClipIndex: number } {
  const nextClips = clips.filter((clip) => clip.id !== clipId)
  const removedIndex = clips.findIndex((clip) => clip.id === clipId)
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
  }
}
