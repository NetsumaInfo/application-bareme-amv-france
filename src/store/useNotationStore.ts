import { create } from 'zustand'
import type { Note } from '@/types/notation'
import type { Bareme } from '@/types/bareme'
import type { NoteData } from '@/types/project'
import { OFFICIAL_BAREME } from '@/types/bareme'
import { calculateScore, isNoteComplete } from '@/utils/scoring'
import * as tauri from '@/services/tauri'
import {
  buildAvailableBaremesFromImportedItems,
  removeBaremeFromList,
  upsertBaremeList,
} from '@/store/notationStoreBaremeActions'
import {
  buildCategoryNoteUpdatedNote,
  buildCriterionNoteUpdatedNote,
  buildCriterionUpdatedNote,
  buildTextNotesUpdatedNote,
} from '@/store/notationStoreNoteActions'
import {
  cloneNotes,
  noteDataToNote,
  noteToNoteData,
} from '@/store/notationStoreUtils'
import { buildNoteUpdateState } from '@/store/notationStoreStateUpdates'

interface NotationStore {
  notes: Record<string, Note>
  history: Record<string, Note>[]
  currentBareme: Bareme | null
  availableBaremes: Bareme[]

  setBareme: (bareme: Bareme) => void
  addBareme: (bareme: Bareme) => void
  removeBareme: (baremeId: string) => void
  loadCustomBaremes: (items: unknown[]) => void
  updateCriterion: (clipId: string, criterionId: string, value: number | string | boolean) => void
  setTextNotes: (clipId: string, text: string) => void
  setCriterionNote: (clipId: string, criterionId: string, text: string) => void
  setCategoryNote: (clipId: string, category: string, text: string) => void
  getScoreForClip: (clipId: string) => number
  isClipComplete: (clipId: string) => boolean
  getNoteForClip: (clipId: string) => Note | undefined
  loadNotes: (notesData: Record<string, NoteData>) => void
  getNotesData: () => Record<string, NoteData>
  undoLastChange: () => void
  reset: () => void
}

export const useNotationStore = create<NotationStore>((set, get) => ({
  notes: {},
  history: [],
  currentBareme: OFFICIAL_BAREME,
  availableBaremes: [OFFICIAL_BAREME],

  setBareme: (bareme: Bareme) => {
    set({ currentBareme: bareme })
  },

  addBareme: (bareme: Bareme) => {
    const { availableBaremes } = get()
    set({ availableBaremes: upsertBaremeList(availableBaremes, bareme) })
    if (!bareme.isOfficial) {
      tauri.saveBareme(bareme, bareme.id).catch(() => {})
    }
  },

  removeBareme: (baremeId: string) => {
    const { availableBaremes, currentBareme } = get()
    const { nextAvailableBaremes, shouldDeleteFile } = removeBaremeFromList(
      availableBaremes,
      baremeId,
    )
    set({
      availableBaremes: nextAvailableBaremes,
      currentBareme: currentBareme?.id === baremeId ? OFFICIAL_BAREME : currentBareme,
    })
    if (shouldDeleteFile) {
      tauri.deleteBareme(baremeId).catch(() => {})
    }
  },

  loadCustomBaremes: (items: unknown[]) => {
    const nextAvailable = buildAvailableBaremesFromImportedItems(items, OFFICIAL_BAREME)
    const currentId = get().currentBareme?.id
    const nextCurrent = nextAvailable.find((bareme) => bareme.id === currentId) || OFFICIAL_BAREME

    set({
      availableBaremes: nextAvailable,
      currentBareme: nextCurrent,
    })
  },

  updateCriterion: (clipId: string, criterionId: string, value: number | string | boolean) => {
    const { notes, currentBareme } = get()
    if (!currentBareme) return
    const updatedNote = buildCriterionUpdatedNote({
      notes,
      currentBareme,
      clipId,
      criterionId,
      rawValue: value,
    })
    if (!updatedNote) return

    set((state) => ({
      ...buildNoteUpdateState(state, notes, clipId, updatedNote),
    }))
  },

  setTextNotes: (clipId: string, text: string) => {
    const { notes, currentBareme } = get()
    if (!currentBareme) return
    const updatedNote = buildTextNotesUpdatedNote({
      notes,
      currentBareme,
      clipId,
      text,
    })
    if (!updatedNote) return

    set((state) => ({
      ...buildNoteUpdateState(state, notes, clipId, updatedNote),
    }))
  },

  setCriterionNote: (clipId: string, criterionId: string, text: string) => {
    const { notes, currentBareme } = get()
    if (!currentBareme) return
    const updatedNote = buildCriterionNoteUpdatedNote({
      notes,
      currentBareme,
      clipId,
      criterionId,
      text,
    })
    if (!updatedNote) return

    set((state) => ({
      ...buildNoteUpdateState(state, notes, clipId, updatedNote),
    }))
  },

  setCategoryNote: (clipId: string, category: string, text: string) => {
    const { notes, currentBareme } = get()
    if (!currentBareme) return
    const updatedNote = buildCategoryNoteUpdatedNote({
      notes,
      currentBareme,
      clipId,
      category,
      text,
    })
    if (!updatedNote) return

    set((state) => ({
      ...buildNoteUpdateState(state, notes, clipId, updatedNote),
    }))
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
    set({ notes, history: [] })
  },

  getNotesData: (): Record<string, NoteData> => {
    const { notes } = get()
    const data: Record<string, NoteData> = {}
    for (const [key, note] of Object.entries(notes)) {
      data[key] = noteToNoteData(note)
    }
    return data
  },

  undoLastChange: () =>
    set((state) => {
      if (state.history.length === 0) return state
      const previous = state.history[state.history.length - 1]
      return {
        notes: cloneNotes(previous),
        history: state.history.slice(0, -1),
      }
    }),

  reset: () => {
    set({
      notes: {},
      history: [],
      currentBareme: OFFICIAL_BAREME,
      availableBaremes: [OFFICIAL_BAREME],
    })
  },
}))
