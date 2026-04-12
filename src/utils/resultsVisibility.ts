import type { Bareme } from '@/types/bareme'
import type { Clip, Project } from '@/types/project'
import type { Note } from '@/types/notation'
import { isNoteComplete } from '@/utils/scoring'

type NoteGetter = (clipId: string) => Note | null | undefined

function noteHasAnyJudgeContent(note: Note | null | undefined): boolean {
  if (!note) return false

  if (Object.keys(note.scores || {}).length > 0) return true
  if ((note.textNotes || '').trim().length > 0) return true
  if (Object.values(note.categoryNotes || {}).some((value) => value.trim().length > 0)) return true
  if (Object.values(note.criterionNotes || {}).some((value) => value.trim().length > 0)) return true

  return false
}

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

export function canExportJudgeNotation(
  clips: Clip[],
  currentBareme: Bareme | null,
  getNoteForClip: NoteGetter,
): boolean {
  return clips.length > 0 && clips.every((clip) => {
    if (clip.scored) return true

    const note = getNoteForClip(clip.id)
    if (!noteHasAnyJudgeContent(note)) return false
    if (!note) return false

    if (!currentBareme) return true
    return isNoteComplete(note, currentBareme)
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
