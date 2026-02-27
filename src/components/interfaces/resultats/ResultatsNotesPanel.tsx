import { X } from 'lucide-react'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import { getClipPrimaryLabel } from '@/utils/formatters'
import type { Clip } from '@/types/project'
import { getCategoryScore, type CategoryGroup, type NoteLike, type JudgeSource } from '@/utils/results'

interface ResultatsNotesPanelProps {
  hidden: boolean
  selectedClip: Clip | undefined
  generalJudge: JudgeSource | null
  categoryGroups: CategoryGroup[]
  hideTotalsSummary?: boolean
  selectedClipFps: number | null
  onSetCurrentJudgeText: (clipId: string, text: string) => void
  onClosePanel?: () => void
  onJumpToTimecode: (clipId: string, seconds: number) => void
  onTimecodeHover: (params: { seconds: number; anchorRect: DOMRect }) => void
  onTimecodeLeave: () => void
}

export function ResultatsNotesPanel({
  hidden,
  selectedClip,
  generalJudge,
  categoryGroups,
  hideTotalsSummary = false,
  selectedClipFps,
  onSetCurrentJudgeText,
  onClosePanel,
  onJumpToTimecode,
  onTimecodeHover,
  onTimecodeLeave,
}: ResultatsNotesPanelProps) {
  if (hidden || !selectedClip) {
    return null
  }

  const generalNote = generalJudge?.notes[selectedClip.id] as (NoteLike & { textNotes?: string }) | undefined
  const generalNoteText = generalNote?.textNotes ?? ''
  const summaryByCategory = categoryGroups.map((group) => {
    const score = hideTotalsSummary ? null : getCategoryScore(generalNote, group.criteria)
    const scoreLabel = score === null
      ? '--'
      : (Number.isInteger(score) ? String(score) : score.toFixed(1))
    return {
      key: group.category,
      label: group.category.toUpperCase(),
      value: `${scoreLabel}/${group.totalMax}`,
      color: group.color,
    }
  })

  return (
    <div className="border-t border-gray-700 shrink-0" style={{ background: '#1a1a2e' }}>
      <div className="px-3 py-1.5 border-b border-gray-700/60 text-[11px] text-gray-400 flex items-center justify-between gap-2">
        <div className="min-w-0">
          Note générale du clip
          <span className="text-primary-300 ml-1">{getClipPrimaryLabel(selectedClip)}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 pl-2">
          {summaryByCategory.length > 0 && (
            <div className="hidden md:flex items-center gap-3 whitespace-nowrap">
              {summaryByCategory.map((item) => (
                <div key={`summary-${item.key}`} className="text-[11px] font-semibold tracking-[0.01em]">
                  <span style={{ color: item.color }}>{item.label}: </span>
                  <span className="text-gray-400">{item.value}</span>
                </div>
              ))}
            </div>
          )}
          {onClosePanel && (
            <button
              type="button"
              onClick={onClosePanel}
              className="h-5 w-5 rounded text-gray-400 hover:text-white hover:bg-gray-700/60 transition-colors"
              title="Masquer les notes"
            >
              <X size={13} className="mx-auto" />
            </button>
          )}
        </div>
      </div>
      <div className="px-3 py-2">
        <TimecodeTextarea
          value={generalNoteText}
          onChange={(nextValue) => {
            onSetCurrentJudgeText(selectedClip.id, nextValue)
          }}
          onTimecodeSelect={(item) => {
            onJumpToTimecode(selectedClip.id, item.seconds)
          }}
          onTimecodeHover={({ item, anchorRect }) => {
            onTimecodeHover({ seconds: item.seconds, anchorRect })
          }}
          onTimecodeLeave={onTimecodeLeave}
          color="#60a5fa"
          fpsHint={selectedClipFps ?? undefined}
          textareaClassName="min-h-[36px]"
          placeholder="Notes générales..."
        />
      </div>
    </div>
  )
}
