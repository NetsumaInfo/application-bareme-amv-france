import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import { getClipPrimaryLabel } from '@/utils/formatters'
import type { Clip } from '@/types/project'
import type { NoteLike, JudgeSource } from '@/utils/results'

interface ResultatsNotesPanelProps {
  hidden: boolean
  selectedClip: Clip | undefined
  judges: JudgeSource[]
  selectedClipFps: number | null
  onSetCurrentJudgeText: (clipId: string, text: string) => void
  onJumpToTimecode: (clipId: string, seconds: number) => void
  onTimecodeHover: (params: { seconds: number; anchorRect: DOMRect }) => void
  onTimecodeLeave: () => void
}

export function ResultatsNotesPanel({
  hidden,
  selectedClip,
  judges,
  selectedClipFps,
  onSetCurrentJudgeText,
  onJumpToTimecode,
  onTimecodeHover,
  onTimecodeLeave,
}: ResultatsNotesPanelProps) {
  if (hidden || !selectedClip) {
    return null
  }

  return (
    <div className="shrink-0 border border-gray-700 rounded-lg bg-surface overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-700 text-[11px] text-gray-400">
        Notes du clip
        <span className="text-primary-300 ml-1">{getClipPrimaryLabel(selectedClip)}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
        {judges.map((judge) => {
          const judgeNote = judge.notes[selectedClip.id] as (NoteLike & { textNotes?: string }) | undefined
          const noteText = judgeNote?.textNotes ?? ''
          return (
            <div key={`note-${judge.key}`} className="rounded border border-gray-700 bg-surface-dark p-2">
              <div className="text-[10px] text-gray-400 mb-1">
                <span className={judge.isCurrentJudge ? 'text-primary-300' : 'text-gray-300'}>
                  {judge.judgeName}
                </span>
              </div>
              {judge.isCurrentJudge ? (
                <TimecodeTextarea
                  value={noteText}
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
                  textareaClassName="min-h-[52px]"
                  placeholder="Notes libres..."
                />
              ) : (
                noteText.trim().length > 0 ? (
                  <TimecodeTextarea
                    value={noteText}
                    onChange={() => {}}
                    readOnly
                    onTimecodeSelect={(item) => {
                      onJumpToTimecode(selectedClip.id, item.seconds)
                    }}
                    onTimecodeHover={({ item, anchorRect }) => {
                      onTimecodeHover({ seconds: item.seconds, anchorRect })
                    }}
                    onTimecodeLeave={onTimecodeLeave}
                    color="#94a3b8"
                    fpsHint={selectedClipFps ?? undefined}
                    textareaClassName="min-h-[52px]"
                  />
                ) : (
                  <p className="text-[11px] text-gray-300 min-h-[52px] whitespace-pre-wrap">
                    Aucune note
                  </p>
                )
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
