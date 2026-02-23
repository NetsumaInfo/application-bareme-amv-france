import { getCriterionNumericScore, type NoteLike } from '@/utils/results'
import type { ImportedJudgeNote } from '@/types/project'
import type { Criterion } from '@/types/bareme'

export function getGroupStep(criteria: Criterion[]): number {
  const steps = criteria
    .map((criterion) => Number(criterion.step))
    .filter((value) => Number.isFinite(value) && value > 0)
  if (steps.length === 0) return 0.5
  return Math.min(...steps)
}

function roundToStep(value: number, step: number): number {
  if (!Number.isFinite(step) || step <= 0) return value
  return Math.round(value / step) * step
}

export function distributeCategoryScore(
  criteria: Criterion[],
  note: NoteLike | undefined,
  targetRaw: number,
): Record<string, number> {
  const totalMax = criteria.reduce((sum, criterion) => sum + Number(criterion.max ?? 10), 0)
  if (totalMax <= 0) {
    return criteria.reduce<Record<string, number>>((acc, criterion) => {
      acc[criterion.id] = 0
      return acc
    }, {})
  }
  const target = Math.max(0, Math.min(totalMax, Number.isFinite(targetRaw) ? targetRaw : 0))
  const step = getGroupStep(criteria)

  const currentValues = criteria.map((criterion) => getCriterionNumericScore(note, criterion))
  const currentTotal = currentValues.reduce((sum, value) => sum + value, 0)

  const values = criteria.map((criterion, index) => {
    const max = Number(criterion.max ?? 10)
    if (max <= 0) return 0

    if (currentTotal > 0) {
      return Math.min(max, (currentValues[index] / currentTotal) * target)
    }

    return Math.min(max, (max / totalMax) * target)
  })

  const rounded = values.map((value, index) => {
    const max = Number(criteria[index].max ?? 10)
    return Math.max(0, Math.min(max, roundToStep(value, step)))
  })

  let delta = target - rounded.reduce((sum, value) => sum + value, 0)
  const minStep = step > 0 ? step : 0.5
  let guard = 0
  while (Math.abs(delta) >= minStep / 2 && guard < 1200) {
    let adjusted = false
    const direction = delta > 0 ? 1 : -1

    for (let index = 0; index < criteria.length; index += 1) {
      const max = Number(criteria[index].max ?? 10)
      const nextValue = rounded[index] + direction * minStep
      if (nextValue < 0 || nextValue > max) continue
      rounded[index] = roundToStep(nextValue, minStep)
      delta -= direction * minStep
      adjusted = true
      if (Math.abs(delta) < minStep / 2) break
    }

    if (!adjusted) break
    guard += 1
  }

  return criteria.reduce<Record<string, number>>((acc, criterion, index) => {
    acc[criterion.id] = Math.round(rounded[index] * 1000) / 1000
    return acc
  }, {})
}

export function computeNoteTotalForBareme(
  baremeCriteria: Criterion[],
  note: ImportedJudgeNote | undefined,
): number {
  const total = baremeCriteria.reduce((sum, criterion) => {
    const score = note?.scores[criterion.id]
    if (!score || score.isValid === false) return sum
    const value = Number(score.value)
    if (!Number.isFinite(value)) return sum
    return sum + Math.max(0, Math.min(Number(criterion.max ?? 10), value))
  }, 0)
  return Math.round(total * 100) / 100
}
