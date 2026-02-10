import type { Criterion, Bareme } from '@/types/bareme'
import type { Note } from '@/types/notation'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateCriterionValue(
  value: number | string | boolean | undefined,
  criterion: Criterion,
): ValidationResult {
  const errors: string[] = []

  if (criterion.required && (value === undefined || value === null || value === '')) {
    errors.push('Ce champ est requis')
    return { isValid: false, errors }
  }

  if (value === undefined || value === null || value === '') {
    return { isValid: true, errors: [] }
  }

  if (criterion.type === 'numeric' || criterion.type === 'slider') {
    const numValue = Number(value)
    if (isNaN(numValue)) {
      errors.push('La valeur doit être un nombre')
    } else {
      if (criterion.min !== undefined && numValue < criterion.min) {
        errors.push(`Minimum : ${criterion.min}`)
      }
      if (criterion.max !== undefined && numValue > criterion.max) {
        errors.push(`Maximum : ${criterion.max}`)
      }
      if (criterion.step !== undefined) {
        const remainder = ((numValue - (criterion.min ?? 0)) * 1000) % (criterion.step * 1000)
        if (remainder !== 0) {
          errors.push(`Pas de ${criterion.step}`)
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function calculateScore(note: Note, bareme: Bareme): number {
  let total = 0

  for (const criterion of bareme.criteria) {
    const score = note.scores[criterion.id]
    if (!score || !score.isValid) continue

    let numericValue = 0

    switch (criterion.type) {
      case 'numeric':
      case 'slider':
        numericValue = Number(score.value) || 0
        break
      case 'boolean':
        numericValue = score.value ? (criterion.max ?? 1) : 0
        break
      case 'select':
        if (criterion.options) {
          const index = criterion.options.indexOf(String(score.value))
          if (index >= 0 && criterion.max !== undefined) {
            numericValue = (index / (criterion.options.length - 1)) * criterion.max
          }
        }
        break
      case 'text':
        break
    }

    total += numericValue
  }

  return Math.round(total * 100) / 100
}

export function isNoteComplete(note: Note, bareme: Bareme): boolean {
  for (const criterion of bareme.criteria) {
    if (!criterion.required) continue
    const score = note.scores[criterion.id]
    if (!score || !score.isValid) return false
    if (score.value === undefined || score.value === null || score.value === '') return false
  }
  return true
}

export function getProgressStats(
  clips: { id: string; scored: boolean }[],
) {
  const scored = clips.filter((c) => c.scored).length
  return {
    scored,
    total: clips.length,
    remaining: clips.length - scored,
    percentage: clips.length > 0 ? Math.round((scored / clips.length) * 100) : 0,
  }
}
