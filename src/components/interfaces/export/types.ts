import type { Clip } from '@/types/project'

export type ExportTheme = 'dark' | 'light'
export type ExportDensity = 'comfortable' | 'compact'
export type ExportMode = 'grouped' | 'individual'

export interface ExportJudge {
  key: string
  judgeName: string
}

export interface ExportRow {
  clip: Clip
  categoryJudgeScores: Record<string, number[]>
  categoryAverages: Record<string, number>
  judgeTotals: number[]
  averageTotal: number
}
