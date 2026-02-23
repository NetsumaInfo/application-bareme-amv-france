import { useMemo } from 'react'
import type { Bareme, Criterion } from '@/types/bareme'
import { CATEGORY_COLOR_PRESETS, sanitizeColor } from '@/utils/colors'

interface ModernCategory {
  category: string
  criteria: Criterion[]
  color: string
}

export function useModernCategories(currentBareme: Bareme | null): ModernCategory[] {
  return useMemo(() => {
    if (!currentBareme) return []
    const map = new Map<string, Criterion[]>()
    for (const criterion of currentBareme.criteria) {
      const category = criterion.category || 'Général'
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
    }))
  }, [currentBareme])
}
