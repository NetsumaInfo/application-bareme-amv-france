export interface CriterionScore {
  criterionId: string
  value: number | string | boolean
  isValid: boolean
  validationErrors: string[]
}

export interface Note {
  clipId: string
  baremeId: string
  scores: Record<string, CriterionScore>
  textNotes: string
  criterionNotes?: Record<string, string>
  categoryNotes?: Record<string, string>
  finalScore?: number
  scoredAt?: string
}

export type InterfaceMode = 'spreadsheet' | 'notation' | 'dual'
export type LegacyInterfaceMode = InterfaceMode | 'modern'
export type AppTab = 'notation' | 'resultats' | 'export'
