import { useMemo } from 'react'
import { CATEGORY_COLOR_PRESETS, sanitizeColor } from '@/utils/colors'
import type { Criterion, Bareme } from '@/types/bareme'
import type { Note } from '@/types/notation'

export function useDetachedNotesComputed(bareme: Bareme | null, localNote: Note | null) {
  const categories = useMemo(() => {
    if (!bareme) return []
    const map = new Map<string, Criterion[]>()
    for (const criterion of bareme.criteria) {
      const category = criterion.category || 'Général'
      if (!map.has(category)) map.set(category, [])
      map.get(category)?.push(criterion)
    }
    return Array.from(map.entries()).map(([category, criteria], index) => ({
      category,
      criteria,
      color: sanitizeColor(
        bareme.categoryColors?.[category],
        CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length],
      ),
      totalMax: criteria.reduce((sum, criterion) => sum + (criterion.max ?? 10), 0),
    }))
  }, [bareme])

  const flatCriteria = useMemo(
    () => categories.flatMap((group) => group.criteria),
    [categories],
  )

  const totalScore = useMemo(() => {
    if (!localNote || !bareme) return 0
    let total = 0
    for (const criterion of bareme.criteria) {
      const score = localNote.scores[criterion.id]
      if (score && score.isValid && typeof score.value === 'number') {
        total += score.value
      }
    }
    return Math.round(total * 100) / 100
  }, [localNote, bareme])

  return {
    categories,
    flatCriteria,
    totalScore,
  }
}
