import { useCallback, useMemo } from 'react'
import { CATEGORY_COLOR_PRESETS, sanitizeColor } from '@/utils/colors'
import type { NotationCategory } from '@/components/interfaces/notation/types'
import type { Bareme } from '@/types/bareme'
import type { Note } from '@/types/notation'

type UseNotationCategoriesParams = {
  currentBareme: Bareme | null
  note: Note | undefined
  expandedCategory: string | null
}

export function useNotationCategories({
  currentBareme,
  note,
  expandedCategory,
}: UseNotationCategoriesParams) {
  const categories = useMemo<NotationCategory[]>(() => {
    if (!currentBareme) return []
    const map = new Map<string, typeof currentBareme.criteria>()
    for (const criterion of currentBareme.criteria) {
      const category = criterion.category || 'General'
      if (!map.has(category)) map.set(category, [])
      map.get(category)!.push(criterion)
    }
    return Array.from(map.entries()).map(([category, criteria], index) => ({
      category,
      criteria,
      color: sanitizeColor(
        currentBareme.categoryColors?.[category],
        CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length],
      ),
      totalMax: criteria.reduce((sum, c) => sum + (c.max ?? 10), 0),
    }))
  }, [currentBareme])

  const flatCriteria = useMemo(
    () => categories.flatMap((group) => group.criteria),
    [categories],
  )

  const effectiveExpandedCategory = useMemo(() => {
    if (expandedCategory && categories.some((item) => item.category === expandedCategory)) {
      return expandedCategory
    }
    return categories[0]?.category ?? null
  }, [categories, expandedCategory])

  const getCategoryScore = useCallback(
    (cat: { criteria: typeof flatCriteria }): number => {
      if (!note) return 0
      let total = 0
      for (const c of cat.criteria) {
        const score = note.scores[c.id]
        if (score && score.isValid && typeof score.value === 'number') {
          total += score.value
        }
      }
      return Math.round(total * 100) / 100
    },
    [note],
  )

  return {
    categories,
    flatCriteria,
    effectiveExpandedCategory,
    getCategoryScore,
  }
}
