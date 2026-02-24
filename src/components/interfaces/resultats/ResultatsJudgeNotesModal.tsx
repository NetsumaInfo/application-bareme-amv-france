import { useEffect } from 'react'
import { X } from 'lucide-react'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { TimecodeInlineText } from '@/components/notes/TimecodeInlineText'
import {
  type CategoryGroup,
  type JudgeSource,
  type NoteLike,
} from '@/utils/results'
import { withAlpha } from '@/utils/colors'
import type { Clip } from '@/types/project'

interface ResultatsJudgeNotesModalProps {
  clip: Clip
  judges: JudgeSource[]
  categoryGroups: CategoryGroup[]
  judgeColors: Record<string, string>
  onJumpToTimecode: (seconds: number) => void
  onTimecodeHover: (params: { seconds: number; anchorRect: DOMRect }) => void
  onTimecodeLeave: () => void
  onClose: () => void
}

type JudgeNoteLike = NoteLike & {
  criterionNotes?: Record<string, string>
  categoryNotes?: Record<string, string>
  textNotes?: string
}

function normalizeText(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function ResultatsJudgeNotesModal({
  clip,
  judges,
  categoryGroups,
  judgeColors,
  onJumpToTimecode,
  onTimecodeHover,
  onTimecodeLeave,
  onClose,
}: ResultatsJudgeNotesModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-4"
      onClick={onClose}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        className="w-full max-w-[1300px] max-h-[90vh] overflow-hidden rounded-xl border border-gray-700 bg-surface shadow-2xl flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 px-4 py-3 border-b border-gray-700 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">
              Notes détaillées des juges
            </h2>
            <p className="text-xs text-gray-400 truncate">
              <span className="text-primary-300">{getClipPrimaryLabel(clip)}</span>
              {getClipSecondaryLabel(clip) ? ` - ${getClipSecondaryLabel(clip)}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            title="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="shrink-0 px-4 py-2 border-b border-gray-700 flex flex-wrap gap-2">
          {judges.map((judge) => {
            const color = judgeColors[judge.key] ?? '#60a5fa'
            return (
              <div
                key={`judge-pill-${judge.key}`}
                className="px-2 py-1 rounded-md border text-[11px] font-medium"
                style={{
                  color,
                  borderColor: withAlpha(color, 0.5),
                  backgroundColor: withAlpha(color, 0.12),
                }}
              >
                {judge.judgeName}
              </div>
            )
          })}
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-3">
          {categoryGroups.map((group) => (
            <section
              key={`detail-${group.category}`}
              className="rounded-lg border border-gray-700 overflow-hidden"
            >
              <div
                className="px-3 py-2 border-b border-gray-700"
                style={{ backgroundColor: withAlpha(group.color, 0.16) }}
              >
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: group.color }}>
                  {group.category}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] text-gray-400 border-b border-r border-gray-800 bg-surface-dark min-w-[240px]">
                        Sous-catégorie
                      </th>
                      {judges.map((judge) => {
                        const color = judgeColors[judge.key] ?? '#60a5fa'
                        return (
                          <th
                            key={`criterion-head-${group.category}-${judge.key}`}
                            className="px-2 py-2 text-center text-[11px] border-b border-r border-gray-800 bg-surface-dark min-w-[140px]"
                            style={{ color }}
                          >
                            {judge.judgeName}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {group.criteria.map((criterion) => (
                      <tr key={`criterion-row-${group.category}-${criterion.id}`} className="align-top">
                        <td className="px-3 py-2 border-r border-b border-gray-800 bg-surface-dark/30">
                          <div className="text-gray-200 font-medium">{criterion.name}</div>
                          {criterion.description ? (
                            <div className="text-[10px] text-gray-500 mt-0.5">{criterion.description}</div>
                          ) : null}
                        </td>
                        {judges.map((judge) => {
                          const color = judgeColors[judge.key] ?? '#60a5fa'
                          const note = judge.notes[clip.id] as JudgeNoteLike | undefined
                          const criterionNote = normalizeText(note?.criterionNotes?.[criterion.id])
                          return (
                            <td
                              key={`criterion-cell-${group.category}-${criterion.id}-${judge.key}`}
                              className="px-2 py-2 border-r border-b border-gray-800"
                              style={{ backgroundColor: withAlpha(color, 0.05) }}
                            >
                              {criterionNote ? (
                                <TimecodeInlineText
                                  text={criterionNote}
                                  color={color}
                                  onTimecodeSelect={(item) => onJumpToTimecode(item.seconds)}
                                  onTimecodeHover={({ item, anchorRect }) => {
                                    onTimecodeHover({ seconds: item.seconds, anchorRect })
                                  }}
                                  onTimecodeLeave={onTimecodeLeave}
                                />
                              ) : (
                                <div className="text-[11px] text-gray-500">Aucune note</div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    <tr className="align-top">
                      <td className="px-3 py-2 border-r border-b border-gray-800 bg-surface-dark/30">
                        <div className="text-gray-200 font-medium">Note catégorie</div>
                      </td>
                      {judges.map((judge) => {
                        const color = judgeColors[judge.key] ?? '#60a5fa'
                        const note = judge.notes[clip.id] as JudgeNoteLike | undefined
                        const categoryNote = normalizeText(note?.categoryNotes?.[group.category])
                        return (
                          <td
                            key={`category-note-${group.category}-${judge.key}`}
                            className="px-2 py-2 border-r border-b border-gray-800"
                            style={{ backgroundColor: withAlpha(color, 0.05) }}
                          >
                            {categoryNote ? (
                              <TimecodeInlineText
                                text={categoryNote}
                                color={color}
                                onTimecodeSelect={(item) => onJumpToTimecode(item.seconds)}
                                onTimecodeHover={({ item, anchorRect }) => {
                                  onTimecodeHover({ seconds: item.seconds, anchorRect })
                                }}
                                onTimecodeLeave={onTimecodeLeave}
                              />
                            ) : (
                              <div className="text-[11px] text-gray-500">Aucune note</div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          <section className="rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-700 bg-surface-dark text-xs font-semibold uppercase tracking-wide text-primary-300">
              Notes générales
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
              {judges.map((judge) => {
                const color = judgeColors[judge.key] ?? '#60a5fa'
                const note = judge.notes[clip.id] as JudgeNoteLike | undefined
                const text = normalizeText(note?.textNotes)
                return (
                  <div
                    key={`global-note-${judge.key}`}
                    className="rounded border p-2"
                    style={{
                      borderColor: withAlpha(color, 0.45),
                      backgroundColor: withAlpha(color, 0.06),
                    }}
                  >
                    <div className="text-[11px] font-medium mb-1" style={{ color }}>
                      {judge.judgeName}
                    </div>
                    {text ? (
                      <TimecodeInlineText
                        text={text}
                        color={color}
                        onTimecodeSelect={(item) => onJumpToTimecode(item.seconds)}
                        onTimecodeHover={({ item, anchorRect }) => {
                          onTimecodeHover({ seconds: item.seconds, anchorRect })
                        }}
                        onTimecodeLeave={onTimecodeLeave}
                      />
                    ) : (
                      <div className="text-[11px] text-gray-500">Aucune note</div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
