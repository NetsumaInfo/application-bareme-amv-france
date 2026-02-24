import { useMemo } from 'react'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { withAlpha } from '@/utils/colors'
import type { JudgeSource } from '@/utils/results'
import type { ResultatsRow } from '@/components/interfaces/resultats/types'

interface ResultatsTopListsProps {
  canSortByScore: boolean
  judges: JudgeSource[]
  rows: ResultatsRow[]
  judgeColors: Record<string, string>
  selectedClipId: string | null
  onSelectClip: (clipId: string) => void
  onOpenClipInNotation: (clipId: string) => void
}

function sortRowsByScore(rows: ResultatsRow[], scoreAccessor: (row: ResultatsRow) => number) {
  return [...rows].sort((a, b) => {
    const scoreA = scoreAccessor(a)
    const scoreB = scoreAccessor(b)
    if (scoreB !== scoreA) return scoreB - scoreA
    // Tie-breaker 1: compare final average to keep global consistency between views.
    if (b.averageTotal !== a.averageTotal) return b.averageTotal - a.averageTotal
    // Tie-breaker 2: compare per-judge totals lexicographically (desc) for stable ranking with many judges.
    const sortedA = [...a.judgeTotals].sort((x, y) => y - x)
    const sortedB = [...b.judgeTotals].sort((x, y) => y - x)
    const maxLen = Math.max(sortedA.length, sortedB.length)
    for (let i = 0; i < maxLen; i += 1) {
      const va = sortedA[i] ?? 0
      const vb = sortedB[i] ?? 0
      if (vb !== va) return vb - va
    }
    return a.clip.order - b.clip.order
  })
}

function TopList({
  title,
  entries,
  accentColor,
  selectedClipId,
  onSelectClip,
  onOpenClipInNotation,
}: {
  title: string
  entries: ResultatsRow[]
  accentColor: string
  selectedClipId: string | null
  onSelectClip: (clipId: string) => void
  onOpenClipInNotation: (clipId: string) => void
}) {
  return (
    <div className="rounded-lg border border-gray-700 bg-surface overflow-hidden flex-1 basis-0 min-w-[260px]">
      <div
        className="px-3 py-2 text-xs font-semibold uppercase tracking-wide border-b"
        style={{
          color: accentColor,
          borderColor: withAlpha(accentColor, 0.3),
          backgroundColor: withAlpha(accentColor, 0.12),
        }}
      >
        {title}
      </div>
      <div className="divide-y divide-gray-800">
        {entries.map((row, index) => {
          const isSelected = selectedClipId === row.clip.id
          return (
            <button
              key={`${title}-${row.clip.id}`}
              type="button"
              onClick={() => onSelectClip(row.clip.id)}
              onDoubleClick={() => onOpenClipInNotation(row.clip.id)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                isSelected
                  ? 'bg-primary-600/14'
                  : 'hover:bg-primary-600/8'
              }`}
            >
              <div className="flex items-start gap-1.5">
                <span className="text-gray-500 w-4 shrink-0">{index + 1}</span>
                <div className="min-w-0">
                  <div className="truncate text-primary-200 font-medium">{getClipPrimaryLabel(row.clip)}</div>
                  {getClipSecondaryLabel(row.clip) && (
                    <div className="truncate text-[11px] text-gray-500">{getClipSecondaryLabel(row.clip)}</div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ResultatsTopLists({
  canSortByScore,
  judges,
  rows,
  judgeColors,
  selectedClipId,
  onSelectClip,
  onOpenClipInNotation,
}: ResultatsTopListsProps) {
  const finalTop = useMemo(
    () => sortRowsByScore(rows, (row) => row.averageTotal),
    [rows],
  )

  const topByJudge = useMemo(
    () =>
      judges.map((judge, index) => ({
        judge,
        entries: sortRowsByScore(rows, (row) => row.judgeTotals[index] ?? 0),
      })),
    [judges, rows],
  )

  if (!canSortByScore) {
    return (
      <div className="flex-1 rounded-lg border border-gray-700 bg-surface-dark/40 px-3 py-3 text-xs text-gray-300">
        Classement indisponible tant que les totaux sont masqués par les paramètres du projet.
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
      <div className="flex flex-nowrap items-start gap-3 min-w-full w-full">
        {topByJudge.map(({ judge, entries }) => (
          <TopList
            key={`top-${judge.key}`}
            title={`Top ${judge.judgeName}`}
            entries={entries}
            accentColor={judgeColors[judge.key] ?? '#22d3ee'}
            selectedClipId={selectedClipId}
            onSelectClip={onSelectClip}
            onOpenClipInNotation={onOpenClipInNotation}
          />
        ))}

        <TopList
          title="Top final"
          entries={finalTop}
          accentColor="#60a5fa"
          selectedClipId={selectedClipId}
          onSelectClip={onSelectClip}
          onOpenClipInNotation={onOpenClipInNotation}
        />
      </div>
    </div>
  )
}
