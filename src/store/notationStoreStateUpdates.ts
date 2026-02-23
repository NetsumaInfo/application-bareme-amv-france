import type { Note } from '@/types/notation'
import { cloneNotes, pushHistory } from '@/store/notationStoreUtils'

interface NotationStateLike {
  history: Record<string, Note>[]
}

export function buildNoteUpdateState(
  state: NotationStateLike,
  notes: Record<string, Note>,
  clipId: string,
  updatedNote: Note,
) {
  return {
    notes: {
      ...notes,
      [clipId]: updatedNote,
    },
    history: pushHistory(state.history, cloneNotes(notes)),
  }
}
