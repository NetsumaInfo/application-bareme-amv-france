import { create } from 'zustand'
import type { Note, CriterionScore } from '@/types/notation'
import type { Bareme } from '@/types/bareme'
import type { NoteData, CriterionScoreData } from '@/types/project'
import { OFFICIAL_BAREME } from '@/types/bareme'
import { validateCriterionValue, calculateScore, isNoteComplete } from '@/utils/scoring'

interface NotationStore {
  notes: Record<string, Note>
  currentBareme: Bareme | null
  availableBaremes: Bareme[]

  setBareme: (bareme: Bareme) => void
  addBareme: (bareme: Bareme) => void
  removeBareme: (baremeId: string) => void
  updateCriterion: (clipId: string, criterionId: string, value: number | string | boolean) => void
  setTextNotes: (clipId: string, text: string) => void
  getScoreForClip: (clipId: string) => number
  isClipComplete: (clipId: string) => boolean
  getNoteForClip: (clipId: string) => Note | undefined
  loadNotes: (notesData: Record<string, NoteData>) => void
  getNotesData: () => Record<string, NoteData>
  reset: () => void
}

function noteDataToNote(data: NoteData): Note {
  const scores: Record<string, CriterionScore> = {}
  for (const [key, scoreData] of Object.entries(data.scores)) {
    scores[key] = {
      criterionId: scoreData.criterionId,
      value: scoreData.value,
      isValid: scoreData.isValid,
      validationErrors: [],
    }
  }
  return {
    clipId: data.clipId,
    baremeId: data.baremeId,
    scores,
    textNotes: data.textNotes,
    finalScore: data.finalScore,
    scoredAt: data.scoredAt,
  }
}

function noteToNoteData(note: Note): NoteData {
  const scores: Record<string, CriterionScoreData> = {}
  for (const [key, score] of Object.entries(note.scores)) {
    scores[key] = {
      criterionId: score.criterionId,
      value: score.value,
      isValid: score.isValid,
    }
  }
  return {
    clipId: note.clipId,
    baremeId: note.baremeId,
    scores,
    textNotes: note.textNotes,
    finalScore: note.finalScore,
    scoredAt: note.scoredAt,
  }
}

export const useNotationStore = create<NotationStore>((set, get) => ({
  notes: {},
  currentBareme: OFFICIAL_BAREME,
  availableBaremes: [OFFICIAL_BAREME],

  setBareme: (bareme: Bareme) => {
    set({ currentBareme: bareme })
  },

  addBareme: (bareme: Bareme) => {
    const { availableBaremes } = get()
    const exists = availableBaremes.some((b) => b.id === bareme.id)
    if (exists) {
      set({
        availableBaremes: availableBaremes.map((b) => (b.id === bareme.id ? bareme : b)),
      })
    } else {
      set({ availableBaremes: [...availableBaremes, bareme] })
    }
  },

  removeBareme: (baremeId: string) => {
    const { availableBaremes } = get()
    set({
      availableBaremes: availableBaremes.filter((b) => b.id !== baremeId || b.isOfficial),
    })
  },

  updateCriterion: (clipId: string, criterionId: string, value: number | string | boolean) => {
    const { notes, currentBareme } = get()
    if (!currentBareme) return

    const criterion = currentBareme.criteria.find((c) => c.id === criterionId)
    if (!criterion) return

    const validation = validateCriterionValue(value, criterion)

    const existingNote = notes[clipId] || {
      clipId,
      baremeId: currentBareme.id,
      scores: {},
      textNotes: '',
    }

    const updatedScore: CriterionScore = {
      criterionId,
      value,
      isValid: validation.isValid,
      validationErrors: validation.errors,
    }

    const updatedNote: Note = {
      ...existingNote,
      scores: {
        ...existingNote.scores,
        [criterionId]: updatedScore,
      },
    }

    updatedNote.finalScore = calculateScore(updatedNote, currentBareme)

    set({
      notes: { ...notes, [clipId]: updatedNote },
    })
  },

  setTextNotes: (clipId: string, text: string) => {
    const { notes, currentBareme } = get()
    if (!currentBareme) return

    const existingNote = notes[clipId] || {
      clipId,
      baremeId: currentBareme.id,
      scores: {},
      textNotes: '',
    }

    set({
      notes: {
        ...notes,
        [clipId]: { ...existingNote, textNotes: text },
      },
    })
  },

  getScoreForClip: (clipId: string): number => {
    const { notes, currentBareme } = get()
    const note = notes[clipId]
    if (!note || !currentBareme) return 0
    return calculateScore(note, currentBareme)
  },

  isClipComplete: (clipId: string): boolean => {
    const { notes, currentBareme } = get()
    const note = notes[clipId]
    if (!note || !currentBareme) return false
    return isNoteComplete(note, currentBareme)
  },

  getNoteForClip: (clipId: string) => {
    return get().notes[clipId]
  },

  loadNotes: (notesData: Record<string, NoteData>) => {
    const notes: Record<string, Note> = {}
    for (const [key, data] of Object.entries(notesData)) {
      notes[key] = noteDataToNote(data)
    }
    set({ notes })
  },

  getNotesData: (): Record<string, NoteData> => {
    const { notes } = get()
    const data: Record<string, NoteData> = {}
    for (const [key, note] of Object.entries(notes)) {
      data[key] = noteToNoteData(note)
    }
    return data
  },

  reset: () => {
    set({
      notes: {},
      currentBareme: OFFICIAL_BAREME,
      availableBaremes: [OFFICIAL_BAREME],
    })
  },
}))
