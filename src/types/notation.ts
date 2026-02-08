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
  finalScore?: number
  scoredAt?: string
}

export type InterfaceMode = 'spreadsheet' | 'modern' | 'notation'
