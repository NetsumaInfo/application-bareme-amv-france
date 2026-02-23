import type { Bareme } from '@/types/bareme'
import { parseBareme } from '@/store/notationStoreUtils'

export function upsertBaremeList(
  availableBaremes: Bareme[],
  bareme: Bareme,
): Bareme[] {
  const exists = availableBaremes.some((item) => item.id === bareme.id)
  if (exists) {
    return availableBaremes.map((item) => (item.id === bareme.id ? bareme : item))
  }
  return [...availableBaremes, bareme]
}

export function removeBaremeFromList(
  availableBaremes: Bareme[],
  baremeId: string,
): { nextAvailableBaremes: Bareme[]; shouldDeleteFile: boolean } {
  const shouldDeleteFile = availableBaremes.some(
    (item) => item.id === baremeId && !item.isOfficial,
  )
  const nextAvailableBaremes = availableBaremes.filter(
    (item) => item.id !== baremeId || item.isOfficial,
  )
  return { nextAvailableBaremes, shouldDeleteFile }
}

export function buildAvailableBaremesFromImportedItems(
  items: unknown[],
  officialBareme: Bareme,
): Bareme[] {
  const customBaremes = items
    .map((item) => parseBareme(item))
    .filter((bareme): bareme is Bareme => Boolean(bareme))
    .filter((bareme) => bareme.id !== officialBareme.id)

  const unique = new Map<string, Bareme>()
  for (const bareme of customBaremes) {
    unique.set(bareme.id, bareme)
  }
  return [officialBareme, ...Array.from(unique.values())]
}
