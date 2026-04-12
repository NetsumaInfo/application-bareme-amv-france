import { normalizeImportedBaremes } from '@/components/scoring/baremeEditorUtils'
import { generateId } from '@/utils/formatters'
import type { Bareme } from '@/types/bareme'

interface ImportBaremesFromDataParams {
  data: unknown
  availableBaremes: Bareme[]
  addBareme: (bareme: Bareme) => Bareme
}

export function importBaremesFromData({
  data,
  availableBaremes,
  addBareme,
}: ImportBaremesFromDataParams): Bareme[] {
  const imported = normalizeImportedBaremes(data)
  if (imported.length === 0) {
    return []
  }

  const existingIds = new Set(availableBaremes.map((bareme) => bareme.id))
  const persistedBaremes: Bareme[] = []

  for (const bareme of imported) {
    const nextId = existingIds.has(bareme.id) ? `custom-${generateId()}` : bareme.id
    existingIds.add(nextId)
    const persistedBareme = addBareme({
      ...bareme,
      id: nextId,
      updatedAt: new Date().toISOString(),
      isOfficial: false,
    })
    existingIds.add(persistedBareme.id)
    persistedBaremes.push(persistedBareme)
  }

  return persistedBaremes
}
