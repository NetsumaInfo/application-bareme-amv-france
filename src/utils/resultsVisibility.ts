import type { Bareme } from '@/types/bareme'
import type { Clip, Project } from '@/types/project'
import type { Note } from '@/types/notation'
import { isNoteComplete } from '@/utils/scoring'

type NoteGetter = (clipId: string) => Note | null | undefined

export function areAllClipsScored(
  clips: Clip[],
  currentBareme: Bareme | null,
  getNoteForClip: NoteGetter,
): boolean {
  return clips.length > 0 && clips.every((clip) => {
    if (clip.scored) return true
    if (!currentBareme) return false
    const note = getNoteForClip(clip.id)
    return note ? isNoteComplete(note, currentBareme) : false
  })
}

export function shouldHideResultsUntilAllScored(
  project: Project | null,
  clips: Clip[],
  currentBareme: Bareme | null,
  getNoteForClip: NoteGetter,
): boolean {
  return Boolean(project?.settings.hideFinalScoreUntilEnd)
    && !areAllClipsScored(clips, currentBareme, getNoteForClip)
}
