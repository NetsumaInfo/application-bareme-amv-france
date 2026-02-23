import type { Clip, ImportedJudgeData } from '@/types/project'
import type { JudgeSource, CategoryGroup } from '@/utils/results'

export interface ResultatsRow {
  clip: Clip
  categoryJudgeScores: Record<string, number[]>
  judgeTotals: number[]
  averageTotal: number
}

export interface ResultatsHeaderProps {
  importing: boolean
  judges: JudgeSource[]
  currentJudgeName?: string
  importedJudges: ImportedJudgeData[]
  onImportJudgeJson: () => void
  onOpenMemberContextMenu: (index: number, x: number, y: number) => void
}

export interface ResultatsTableProps {
  canSortByScore: boolean
  currentBaremeTotalPoints: number
  categoryGroups: CategoryGroup[]
  judges: JudgeSource[]
  rows: ResultatsRow[]
  selectedClipId: string | null
  draftCells: Record<string, string>
  onSelectClip: (clipId: string) => void
  onOpenClipInNotation: (clipId: string) => void
  onOpenClipContextMenu: (clipId: string, x: number, y: number) => void
  getCellKey: (clipId: string, category: string, judgeKey: string) => string
  onSetDraftCell: (key: string, value: string) => void
  onCommitDraftCell: (clipId: string, category: string, judgeKey: string) => void
  onClearDraftCell: (key: string) => void
}
