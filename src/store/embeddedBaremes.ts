import type { Bareme } from '@/types/bareme'
import { parseBareme } from '@/store/notationStoreUtils'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function collectBaremeCandidates(data: unknown, candidates: unknown[] = [], seen = new Set<unknown>()): unknown[] {
  const root = asRecord(data)
  if (!root || seen.has(root)) return candidates
  seen.add(root)

  candidates.push(root)
  if (root.bareme) {
    candidates.push(root.bareme)
  }
  if (Array.isArray(root.baremes)) {
    candidates.push(...root.baremes)
  }
  if (root.projectData) {
    collectBaremeCandidates(root.projectData, candidates, seen)
  }
  if (root.project_data) {
    collectBaremeCandidates(root.project_data, candidates, seen)
  }

  return candidates
}

export function extractEmbeddedBaremes(data: unknown): Bareme[] {
  const baremes: Bareme[] = []
  const seenIds = new Set<string>()

  for (const candidate of collectBaremeCandidates(data)) {
    const bareme = parseBareme(candidate)
    if (!bareme || seenIds.has(bareme.id)) continue
    seenIds.add(bareme.id)
    baremes.push(bareme)
  }

  return baremes
}
