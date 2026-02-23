import type { Criterion } from '@/types/bareme'

export interface CategoryGroup {
  category: string
  criteria: Criterion[]
  totalMax: number
  color: string
}

export interface SpreadsheetNoteScore {
  value: number | string | boolean
  isValid: boolean
}

export interface SpreadsheetNoteLike {
  scores: Record<string, SpreadsheetNoteScore>
}
