import { ChevronLeft, ChevronRight, ExternalLink, Play } from 'lucide-react'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import {
  type CategoryGroup,
  type JudgeSource,
  type NoteLike,
} from '@/utils/results'
import { withAlpha } from '@/utils/colors'
import { TimecodeInlineText } from '@/components/notes/TimecodeInlineText'
import type { Clip } from '@/types/project'

type JudgeNoteLike = NoteLike & {
  criterionNotes?: Record<string, string>
  categoryNotes?: Record<string, string>
  textNotes?: string
}

interface ResultatsJudgeNotesViewProps {
  clips: Clip[]
  selectedClipId: string | null
  judges: JudgeSource[]
  categoryGroups: CategoryGroup[]
  judgeColors: Record<string, string>
  onSelectClip: (clipId: string) => void
  onJumpToTimecode: (clipId: string, seconds: number) => void
  onTimecodeHover: (params: { seconds: number; anchorRect: DOMRect }) => void
  onTimecodeLeave: () => void
  onOpenPlayer?: (clipId: string) => void
  onDetach?: () => void
  detached?: boolean
}

function normalizeText(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function ResultatsJudgeNotesView({
  clips,
  selectedClipId,
  judges,
  categoryGroups,
  judgeColors,
  onSelectClip,
  onJumpToTimecode,
  onTimecodeHover,
  onTimecodeLeave,
  onOpenPlayer,
  onDetach,
  detached = false,
}: ResultatsJudgeNotesViewProps) {
  const selectedClip = clips.find((clip) => clip.id === selectedClipId) ?? clips[0]
  const selectedClipIndex = clips.findIndex((clip) => clip.id === selectedClip?.id)
  const effectiveClipIndex = selectedClipIndex >= 0 ? selectedClipIndex : 0

  if (!selectedClip) {
    return (
      <div className="flex-1 rounded-lg border border-gray-700 bg-surface-dark/40 flex items-center justify-center text-sm text-gray-500">
        Aucun clip
      </div>
    )
  }

  return (
    <div className="flex-1 rounded-lg border border-gray-700 bg-surface-dark/40 overflow-hidden flex flex-col">
      <div className="shrink-0 px-3 py-2 border-b border-gray-700 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (clips.length < 2) return
            const prevIndex = Math.max(0, effectiveClipIndex - 1)
            onSelectClip(clips[prevIndex].id)
          }}
          className="h-8 w-8 rounded-md border border-gray-700 bg-surface-dark text-gray-300 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-default"
          disabled={effectiveClipIndex <= 0}
          title="Clip précédent"
        >
          <ChevronLeft size={16} className="mx-auto" />
        </button>

        <select
          value={selectedClip.id}
          onChange={(event) => onSelectClip(event.target.value)}
          className="h-8 min-w-[240px] max-w-[460px] rounded-md border border-gray-700 bg-surface-dark px-2 text-xs text-gray-200 outline-none focus:border-primary-500"
        >
          {clips.map((clip, index) => {
            const primary = getClipPrimaryLabel(clip)
            const secondary = getClipSecondaryLabel(clip)
            const label = secondary ? `${index + 1}. ${primary} - ${secondary}` : `${index + 1}. ${primary}`
            return (
              <option key={`judge-notes-clip-${clip.id}`} value={clip.id}>
                {label}
              </option>
            )
          })}
        </select>

        <button
          type="button"
          onClick={() => {
            if (clips.length < 2) return
            const nextIndex = Math.min(clips.length - 1, effectiveClipIndex + 1)
            onSelectClip(clips[nextIndex].id)
          }}
          className="h-8 w-8 rounded-md border border-gray-700 bg-surface-dark text-gray-300 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-default"
          disabled={effectiveClipIndex >= clips.length - 1}
          title="Clip suivant"
        >
          <ChevronRight size={16} className="mx-auto" />
        </button>

        <div className="text-xs text-gray-300 truncate min-w-0">
          <span className="text-primary-300">{getClipPrimaryLabel(selectedClip)}</span>
          {getClipSecondaryLabel(selectedClip) ? ` - ${getClipSecondaryLabel(selectedClip)}` : ''}
        </div>

        <button
          type="button"
          onClick={() => {
            if (!selectedClip?.filePath) return
            onOpenPlayer?.(selectedClip.id)
          }}
          className="h-8 w-8 rounded-md border border-gray-700 bg-surface-dark text-gray-300 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-default"
          title={selectedClip?.filePath ? 'Ouvrir le lecteur vidéo' : 'Aucune vidéo liée'}
          disabled={!selectedClip?.filePath}
        >
          <Play size={14} className="mx-auto" />
        </button>

        {onDetach && !detached && (
          <button
            type="button"
            onClick={onDetach}
            className="ml-auto h-8 px-2 rounded-md border border-gray-700 bg-surface-dark text-gray-200 text-xs hover:text-white hover:border-gray-600 flex items-center gap-1"
            title="Ouvrir dans une fenêtre détachée"
          >
            <ExternalLink size={14} />
            Détacher
          </button>
        )}
      </div>

      <div className="shrink-0 px-3 py-2 border-b border-gray-700 flex flex-wrap gap-2">
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
            key={`detail-${selectedClip.id}-${group.category}`}
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
              <table className="min-w-full border-collapse text-xs table-fixed">
                <thead>
                  <tr>
                    <th className="w-[170px] min-w-[170px] px-2 py-2 text-left text-[11px] text-gray-400 border-b border-r border-gray-800 bg-surface-dark">
                      Sous-catégorie
                    </th>
                    {judges.map((judge) => {
                      const color = judgeColors[judge.key] ?? '#60a5fa'
                      return (
                        <th
                          key={`criterion-head-${selectedClip.id}-${group.category}-${judge.key}`}
                          className="w-[300px] min-w-[300px] px-2 py-2 text-center text-[11px] border-b border-r border-gray-800 bg-surface-dark"
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
                    <tr key={`criterion-row-${selectedClip.id}-${group.category}-${criterion.id}`} className="align-top">
                      <td className="px-2 py-2 border-r border-b border-gray-800 bg-surface-dark/30">
                        <div className="text-gray-200 font-medium truncate" title={criterion.name}>
                          {criterion.name}
                        </div>
                        {criterion.description ? (
                          <div className="text-[10px] text-gray-500 mt-0.5 truncate" title={criterion.description}>
                            {criterion.description}
                          </div>
                        ) : null}
                      </td>
                      {judges.map((judge) => {
                        const color = judgeColors[judge.key] ?? '#60a5fa'
                        const note = judge.notes[selectedClip.id] as JudgeNoteLike | undefined
                        const criterionNote = normalizeText(note?.criterionNotes?.[criterion.id])
                        return (
                          <td
                            key={`criterion-cell-${selectedClip.id}-${group.category}-${criterion.id}-${judge.key}`}
                            className="px-2 py-2 border-r border-b border-gray-800"
                            style={{ backgroundColor: withAlpha(color, 0.05) }}
                          >
                            {criterionNote ? (
                              <TimecodeInlineText
                                text={criterionNote}
                                color={color}
                                onTimecodeSelect={(item) => onJumpToTimecode(selectedClip.id, item.seconds)}
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
                    <td className="px-2 py-2 border-r border-b border-gray-800 bg-surface-dark/30">
                      <div className="text-gray-200 font-medium">Note catégorie</div>
                    </td>
                    {judges.map((judge) => {
                      const color = judgeColors[judge.key] ?? '#60a5fa'
                      const note = judge.notes[selectedClip.id] as JudgeNoteLike | undefined
                      const categoryNote = normalizeText(note?.categoryNotes?.[group.category])
                      return (
                        <td
                          key={`category-note-${selectedClip.id}-${group.category}-${judge.key}`}
                          className="px-2 py-2 border-r border-b border-gray-800"
                          style={{ backgroundColor: withAlpha(color, 0.05) }}
                        >
                          {categoryNote ? (
                            <TimecodeInlineText
                              text={categoryNote}
                              color={color}
                              onTimecodeSelect={(item) => onJumpToTimecode(selectedClip.id, item.seconds)}
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
              const note = judge.notes[selectedClip.id] as JudgeNoteLike | undefined
              const text = normalizeText(note?.textNotes)
              return (
                <div
                  key={`global-note-${selectedClip.id}-${judge.key}`}
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
                      onTimecodeSelect={(item) => onJumpToTimecode(selectedClip.id, item.seconds)}
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
  )
}
