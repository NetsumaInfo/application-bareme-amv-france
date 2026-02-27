import type { Clip } from '@/types/project'

export type ExportTheme = 'dark' | 'light'
export type ExportDensity = 'comfortable' | 'compact'
export type ExportMode = 'grouped' | 'individual'
export type ExportLayout = 'table' | 'poster'
export type ExportPngMode = 'single' | 'paged' | 'both'
export type ExportRankBadgeStyle = 'filled' | 'outline' | 'plain'
export type ExportTableView = 'summary' | 'detailed'
export type ExportNotesPdfMode = 'general' | 'judges' | 'both'

export type ExportPosterBlockId = 'title' | 'subtitle' | 'top' | 'footer'
export type ExportPosterTextAlign = 'left' | 'center' | 'right'
export type ExportPosterShadowStyle = 'none' | 'soft' | 'strong' | 'outline' | 'glow'

export interface ExportJudge {
  key: string
  judgeName: string
}

export interface ExportRow {
  clip: Clip
  categoryJudgeScores: Record<string, number[]>
  categoryAverages: Record<string, number>
  criterionJudgeScores: Record<string, number[]>
  criterionAverages: Record<string, number>
  judgeTotals: number[]
  averageTotal: number
}

export interface ExportPosterBlock {
  id: ExportPosterBlockId
  label: string
  text: string
  xPct: number
  yPct: number
  widthPct: number
  fontFamily: string
  fontSize: number
  fontWeight: 400 | 500 | 600 | 700 | 800 | 900
  color: string
  shadowColor: string
  align: ExportPosterTextAlign
  shadowStyle: ExportPosterShadowStyle
  visible: boolean
}

export interface ExportPosterFontOption {
  label: string
  value: string
}

export interface ExportPosterImageLayer {
  id: string
  label: string
  src: string
  sourceWidth?: number
  sourceHeight?: number
  xPct: number
  yPct: number
  widthPct: number
  opacity: number
  rotationDeg: number
  visible: boolean
}

export interface ExportTableMetaVisibility {
  project: boolean
  clips: boolean
  judges: boolean
  mode: boolean
  date: boolean
}
