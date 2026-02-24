import type { Bareme, Criterion } from '@/types/bareme'
import type { CriterionScore, Note } from '@/types/notation'
import { calculateScore, validateCriterionValue } from '@/utils/scoring'
import { buildDefaultNote } from '@/store/notationStoreUtils'

function normalizeCriterionValue(
  criterion: Criterion,
  value: number | string | boolean,
): number | string | boolean {
  if (
    (criterion.type === 'numeric' || criterion.type === 'slider')
    && value !== undefined
    && value !== null
    && value !== ''
  ) {
    const numeric =
      typeof value === 'string'
        ? Number(value.replace(',', '.'))
        : Number(value)
    if (Number.isFinite(numeric)) {
      const min = Number.isFinite(criterion.min) ? Number(criterion.min) : numeric
      const max = Number.isFinite(criterion.max) ? Number(criterion.max) : numeric
      return Math.max(min, Math.min(max, numeric))
    }
  }
  return value
}

export function buildCriterionUpdatedNote({
  notes,
  currentBareme,
  clipId,
  criterionId,
  rawValue,
}: {
  notes: Record<string, Note>
  currentBareme: Bareme
  clipId: string
  criterionId: string
  rawValue: number | string | boolean
}): Note | null {
  const criterion = currentBareme.criteria.find((item) => item.id === criterionId)
  if (!criterion) return null

  const value = normalizeCriterionValue(criterion, rawValue)
  const validation = validateCriterionValue(value, criterion)
  const existingNote = notes[clipId] || buildDefaultNote(clipId, currentBareme.id)

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
  return updatedNote
}

export function buildTextNotesUpdatedNote({
  notes,
  currentBareme,
  clipId,
  text,
}: {
  notes: Record<string, Note>
  currentBareme: Bareme
  clipId: string
  text: string
}): Note | null {
  const existingNote = notes[clipId] || buildDefaultNote(clipId, currentBareme.id)
  if (existingNote.textNotes === text) return null
  return { ...existingNote, textNotes: text }
}

export function buildCriterionNoteUpdatedNote({
  notes,
  currentBareme,
  clipId,
  criterionId,
  text,
}: {
  notes: Record<string, Note>
  currentBareme: Bareme
  clipId: string
  criterionId: string
  text: string
}): Note | null {
  const existingNote = notes[clipId] || buildDefaultNote(clipId, currentBareme.id)
  const prevValue = existingNote.criterionNotes?.[criterionId] ?? ''
  if (prevValue === text) return null
  return {
    ...existingNote,
    criterionNotes: {
      ...(existingNote.criterionNotes || {}),
      [criterionId]: text,
    },
  }
}

export function buildCategoryNoteUpdatedNote({
  notes,
  currentBareme,
  clipId,
  category,
  text,
}: {
  notes: Record<string, Note>
  currentBareme: Bareme
  clipId: string
  category: string
  text: string
}): Note | null {
  const existingNote = notes[clipId] || buildDefaultNote(clipId, currentBareme.id)
  const prevValue = existingNote.categoryNotes?.[category] ?? ''
  if (prevValue === text) return null
  return {
    ...existingNote,
    categoryNotes: {
      ...(existingNote.categoryNotes || {}),
      [category]: text,
    },
  }
}
