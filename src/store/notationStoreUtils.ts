import type { Bareme, Criterion } from '@/types/bareme'
import type { CriterionScoreData, NoteData } from '@/types/project'
import type { CriterionScore, Note } from '@/types/notation'

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
    ? row.options.map((value) => String(value)).filter(Boolean)
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

export function parseBareme(raw: unknown): Bareme | null {
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

export function noteDataToNote(data: NoteData): Note {
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

export function noteToNoteData(note: Note): NoteData {
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

export function buildDefaultNote(clipId: string, baremeId: string): Note {
  return {
    clipId,
    baremeId,
    scores: {},
    textNotes: '',
    criterionNotes: {},
    categoryNotes: {},
  }
}

export function cloneNotes(notes: Record<string, Note>): Record<string, Note> {
  return JSON.parse(JSON.stringify(notes))
}

export function pushHistory(
  history: Record<string, Note>[],
  snapshot: Record<string, Note>,
): Record<string, Note>[] {
  return [...history, snapshot].slice(-100)
}
