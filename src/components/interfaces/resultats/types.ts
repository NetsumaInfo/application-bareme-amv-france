import type { Clip } from '@/types/project'
import type { JudgeSource } from '@/utils/results'

export type ResultatsMainView = 'judge' | 'global' | 'top' | 'judgeNotes'
export type ResultatsGlobalVariant = 'detailed' | 'category'

export interface ResultatsRow {
  clip: Clip
  categoryJudgeScores: Record<string, number[]>
  judgeTotals: number[]
  averageTotal: number
}

export interface ResultatsHeaderProps {
  judges: JudgeSource[]
  selectedJudgeKey: string
  judgeColors: Record<string, string>
  onSelectJudge: (judgeKey: string) => void
  onJudgeColorChange: (judgeKey: string, color: string) => void
  onOpenMemberContextMenu: (judgeKey: string, x: number, y: number) => void
}
