import type { ImportedJudgeNote } from '@/types/project'
import type { Criterion } from '@/types/bareme'

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
