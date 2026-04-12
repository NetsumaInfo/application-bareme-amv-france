import type { Bareme } from '@/types/bareme'
import { parseBareme } from '@/store/notationStoreUtils'

function normalizeToken(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function buildBaremeFingerprint(bareme: Bareme): string {
  const criteria = bareme.criteria
    .map((criterion) => [
      normalizeToken(criterion.name),
      criterion.max ?? '',
      normalizeToken(criterion.category),
    ].join(':'))
    .join('|')

  return `${normalizeToken(bareme.name)}|${criteria}`
}

function buildImportedBaremeFingerprint(bareme: Bareme): string {
  const criteria = bareme.criteria
    .map((criterion) => [
      normalizeToken(criterion.name),
      criterion.max ?? '',
    ].join(':'))
    .join('|')

  return `${normalizeToken(bareme.name)}|${criteria}`
}

function isAutoImportedBareme(bareme: Bareme): boolean {
  const normalizedDescription = normalizeToken(bareme.description)
  return !bareme.isOfficial && (
    bareme.id.startsWith('imported-')
    || normalizedDescription.includes('bareme detecte automatiquement')
    || normalizedDescription.includes('bareme detecte')
    || normalizedDescription.includes('detected automatically')
    || normalizedDescription.includes('detected from')
  )
}

function buildBaremeDedupKey(bareme: Bareme): string {
  if (isAutoImportedBareme(bareme)) {
    return `import:${buildImportedBaremeFingerprint(bareme)}`
  }
  return `strict:${buildBaremeFingerprint(bareme)}`
}

export function upsertBaremeList(
  availableBaremes: Bareme[],
  bareme: Bareme,
): { nextAvailableBaremes: Bareme[]; persistedBareme: Bareme } {
  const existingById = availableBaremes.find((item) => item.id === bareme.id)
  if (existingById) {
    return {
      nextAvailableBaremes: availableBaremes.map((item) => (item.id === bareme.id ? bareme : item)),
      persistedBareme: bareme,
    }
  }

  const fingerprint = buildBaremeDedupKey(bareme)
  const duplicateIndex = availableBaremes.findIndex((item) => (
    !item.isOfficial && buildBaremeDedupKey(item) === fingerprint
  ))
  if (duplicateIndex >= 0) {
    const existing = availableBaremes[duplicateIndex]
    const persistedBareme: Bareme = {
      ...bareme,
      id: existing.id,
      createdAt: existing.createdAt,
    }

    return {
      nextAvailableBaremes: availableBaremes.map((item, index) => (
        index === duplicateIndex ? persistedBareme : item
      )),
      persistedBareme,
    }
  }

  return {
    nextAvailableBaremes: [...availableBaremes, bareme],
    persistedBareme: bareme,
  }
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
    const key = buildBaremeDedupKey(bareme)
    if (!unique.has(key)) {
      unique.set(key, bareme)
    }
  }
  return [officialBareme, ...Array.from(unique.values())]
}
