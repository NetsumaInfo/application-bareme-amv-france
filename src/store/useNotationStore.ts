import { create } from 'zustand'
import type { Note, CriterionScore } from '@/types/notation'
import type { Bareme, Criterion } from '@/types/bareme'
import type { NoteData, CriterionScoreData } from '@/types/project'
import { OFFICIAL_BAREME } from '@/types/bareme'
import { validateCriterionValue, calculateScore, isNoteComplete } from '@/utils/scoring'
import * as tauri from '@/services/tauri'

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
    criterionNotes: data.criterionNotes ?? {},
    categoryNotes: data.categoryNotes ?? {},
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
    criterionNotes: note.criterionNotes,
    categoryNotes: note.categoryNotes,
    finalScore: note.finalScore,
    scoredAt: note.scoredAt,
  }
}

function cloneNotes(notes: Record<string, Note>): Record<string, Note> {
  return JSON.parse(JSON.stringify(notes))
}

function pushHistory(
  history: Record<string, Note>[],
  snapshot: Record<string, Note>,
): Record<string, Note>[] {
  return [...history, snapshot].slice(-100)
}

const CRITERION_TYPES = new Set(['numeric', 'slider', 'boolean', 'select', 'text'] as const)

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function toNumber(value: unknown): number | undefined {
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function parseCriterion(raw: unknown, index: number): Criterion | null {
  const row = asRecord(raw)
  if (!row) return null
  const name = typeof row.name === 'string' ? row.name.trim() : ''
  if (!name) return null

  const rawType = typeof row.type === 'string' ? row.type : 'numeric'
  const type = CRITERION_TYPES.has(rawType as Criterion['type'])
    ? (rawType as Criterion['type'])
    : 'numeric'

  const min = toNumber(row.min)
  const max = toNumber(row.max)
  const step = toNumber(row.step)
  const required = typeof row.required === 'boolean' ? row.required : true
  const description = typeof row.description === 'string' ? row.description : undefined
  const category = typeof row.category === 'string' && row.category.trim() ? row.category.trim() : undefined
  const options = Array.isArray(row.options)
    ? row.options.map((v) => String(v)).filter(Boolean)
    : undefined

  return {
    id: typeof row.id === 'string' && row.id.trim() ? row.id : `criterion-${index + 1}`,
    name,
    description,
    type,
    min,
    max,
    step: step && step > 0 ? step : 0.5,
    options: options && options.length > 0 ? options : undefined,
    required,
    category,
  }
}

function parseBareme(raw: unknown): Bareme | null {
  const row = asRecord(raw)
  if (!row) return null
  const id = typeof row.id === 'string' ? row.id.trim() : ''
  const name = typeof row.name === 'string' ? row.name.trim() : ''
  if (!id || !name) return null

  const criteriaRaw = Array.isArray(row.criteria) ? row.criteria : []
  const criteria = criteriaRaw
    .map((criterion, idx) => parseCriterion(criterion, idx))
    .filter((criterion): criterion is Criterion => Boolean(criterion))
  if (criteria.length === 0) return null

  const colorMap: Record<string, string> = {}
  const rawColors = asRecord(row.categoryColors)
  if (rawColors) {
    for (const [key, value] of Object.entries(rawColors)) {
      if (!key.trim()) continue
      if (typeof value === 'string' && value.trim()) {
        colorMap[key] = value
      }
    }
  }

  const fallbackTotal = criteria.reduce(
    (sum, criterion) => sum + (Number.isFinite(criterion.max) ? Number(criterion.max) : 0),
    0,
  )
  const totalPoints = toNumber(row.totalPoints) ?? fallbackTotal
  const now = new Date().toISOString()

  return {
    id,
    name,
    description: typeof row.description === 'string' && row.description.trim() ? row.description : undefined,
    isOfficial: false,
    hideTotalsUntilAllScored: Boolean(row.hideTotalsUntilAllScored),
    criteria,
    categoryColors: Object.keys(colorMap).length > 0 ? colorMap : undefined,
    totalPoints: totalPoints > 0 ? totalPoints : fallbackTotal,
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : now,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : now,
  }
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
    const exists = availableBaremes.some((b) => b.id === bareme.id)
    if (exists) {
      set({
        availableBaremes: availableBaremes.map((b) => (b.id === bareme.id ? bareme : b)),
      })
    } else {
      set({ availableBaremes: [...availableBaremes, bareme] })
    }
    if (!bareme.isOfficial) {
      tauri.saveBareme(bareme, bareme.id).catch(() => {})
    }
  },

  removeBareme: (baremeId: string) => {
    const { availableBaremes, currentBareme } = get()
    const shouldDeleteFile = availableBaremes.some((b) => b.id === baremeId && !b.isOfficial)
    const nextAvailable = availableBaremes.filter((b) => b.id !== baremeId || b.isOfficial)
    set({
      availableBaremes: nextAvailable,
      currentBareme: currentBareme?.id === baremeId ? OFFICIAL_BAREME : currentBareme,
    })
    if (shouldDeleteFile) {
      tauri.deleteBareme(baremeId).catch(() => {})
    }
  },

  loadCustomBaremes: (items: unknown[]) => {
    const customBaremes = items
      .map((item) => parseBareme(item))
      .filter((bareme): bareme is Bareme => Boolean(bareme))
      .filter((bareme) => bareme.id !== OFFICIAL_BAREME.id)

    const unique = new Map<string, Bareme>()
    for (const bareme of customBaremes) {
      unique.set(bareme.id, bareme)
    }

    const nextAvailable = [OFFICIAL_BAREME, ...Array.from(unique.values())]
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

    const criterion = currentBareme.criteria.find((c) => c.id === criterionId)
    if (!criterion) return

    let normalizedValue: number | string | boolean = value
    if (
      (criterion.type === 'numeric' || criterion.type === 'slider')
      && value !== undefined
      && value !== null
      && value !== ''
    ) {
      const numeric = Number(value)
      if (Number.isFinite(numeric)) {
        const min = Number.isFinite(criterion.min) ? Number(criterion.min) : numeric
        const max = Number.isFinite(criterion.max) ? Number(criterion.max) : numeric
        normalizedValue = Math.max(min, Math.min(max, numeric))
      }
    }

    const validation = validateCriterionValue(normalizedValue, criterion)

    const existingNote = notes[clipId] || {
      clipId,
      baremeId: currentBareme.id,
      scores: {},
      textNotes: '',
      criterionNotes: {},
      categoryNotes: {},
    }

    const updatedScore: CriterionScore = {
      criterionId,
      value: normalizedValue,
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

    set((state) => ({
      notes: { ...notes, [clipId]: updatedNote },
      history: pushHistory(state.history, cloneNotes(notes)),
    }))
  },

  setTextNotes: (clipId: string, text: string) => {
    const { notes, currentBareme } = get()
    if (!currentBareme) return

    const existingNote = notes[clipId] || {
      clipId,
      baremeId: currentBareme.id,
      scores: {},
      textNotes: '',
      criterionNotes: {},
      categoryNotes: {},
    }

    if (existingNote.textNotes === text) return

    set((state) => ({
      notes: {
        ...notes,
        [clipId]: { ...existingNote, textNotes: text },
      },
      history: pushHistory(state.history, cloneNotes(notes)),
    }))
  },

  setCriterionNote: (clipId: string, criterionId: string, text: string) => {
    const { notes, currentBareme } = get()
    if (!currentBareme) return

    const existingNote = notes[clipId] || {
      clipId,
      baremeId: currentBareme.id,
      scores: {},
      textNotes: '',
      criterionNotes: {},
      categoryNotes: {},
    }

    const prevValue = existingNote.criterionNotes?.[criterionId] ?? ''
    if (prevValue === text) return

    set((state) => ({
      notes: {
        ...notes,
        [clipId]: {
          ...existingNote,
          criterionNotes: {
            ...(existingNote.criterionNotes || {}),
            [criterionId]: text,
          },
        },
      },
      history: pushHistory(state.history, cloneNotes(notes)),
    }))
  },

  setCategoryNote: (clipId: string, category: string, text: string) => {
    const { notes, currentBareme } = get()
    if (!currentBareme) return

    const existingNote = notes[clipId] || {
      clipId,
      baremeId: currentBareme.id,
      scores: {},
      textNotes: '',
      criterionNotes: {},
      categoryNotes: {},
    }

    const prevValue = existingNote.categoryNotes?.[category] ?? ''
    if (prevValue === text) return

    set((state) => ({
      notes: {
        ...notes,
        [clipId]: {
          ...existingNote,
          categoryNotes: {
            ...(existingNote.categoryNotes || {}),
            [category]: text,
          },
        },
      },
      history: pushHistory(state.history, cloneNotes(notes)),
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
