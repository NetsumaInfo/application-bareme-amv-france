import { useMemo } from 'react'
import { Star } from 'lucide-react'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { withAlpha } from '@/utils/colors'
import type { JudgeSource } from '@/utils/results'
import type { ResultatsRow } from '@/components/interfaces/resultats/types'
import { ClipMiniaturePreview } from '@/components/interfaces/spreadsheet/miniaturePreview'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'

interface ResultatsTopListsProps {
  canSortByScore: boolean
  judges: JudgeSource[]
  rows: ResultatsRow[]
  judgeColors: Record<string, string>
  selectedClipId: string | null
  onSelectClip: (clipId: string) => void
  onOpenClipInNotation: (clipId: string) => void
  showMiniatures: boolean
  thumbnailDefaultSeconds: number
  forceMiniatureLoad?: boolean
  staticExport?: boolean
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
  showMiniatures,
  thumbnailDefaultSeconds,
  forceMiniatureLoad,
  staticExport,
  scoreAccessor,
  favoriteMetaAccessor,
}: {
  title: string
  entries: ResultatsRow[]
  accentColor: string
  selectedClipId: string | null
  onSelectClip: (clipId: string) => void
  onOpenClipInNotation: (clipId: string) => void
  showMiniatures: boolean
  thumbnailDefaultSeconds: number
  forceMiniatureLoad: boolean
  staticExport: boolean
  scoreAccessor: (row: ResultatsRow) => number
  favoriteMetaAccessor?: (row: ResultatsRow) => { color: string; tooltip: string } | null
}) {
  return (
    <div className={`min-w-[220px] flex-1 basis-0 border border-gray-700/50 bg-transparent ${staticExport ? 'overflow-visible' : 'overflow-hidden'}`}>
      <div
        className="flex items-center gap-2 border-b border-gray-700/60 px-2.5 py-1.5 text-[11px] font-medium"
        style={{
          color: accentColor,
          backgroundColor: withAlpha(accentColor, 0.1),
        }}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
        {title}
      </div>
      <div className="divide-y divide-gray-800/60">
        {entries.map((row, index) => {
          const isSelected = selectedClipId === row.clip.id
          const score = scoreAccessor(row)
          const scoreLabel = Number.isFinite(score) ? score.toFixed(1) : null
          const favoriteMeta = favoriteMetaAccessor?.(row) ?? null
          return (
            <button
              key={`${title}-${row.clip.id}`}
              type="button"
              onClick={() => onSelectClip(row.clip.id)}
              onDoubleClick={() => onOpenClipInNotation(row.clip.id)}
              className={`w-full px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                isSelected
                  ? 'bg-white/6'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="relative flex items-start gap-1.5 pr-11">
                <div className="relative w-5 shrink-0">
                  <span className="rounded-md bg-black/15 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-4 text-gray-400">{index + 1}</span>
                  {favoriteMeta ? (
                    <div className="absolute left-1/2 top-[18px] -translate-x-1/2">
                      <HoverTextTooltip text={favoriteMeta.tooltip}>
                        <span
                          className="inline-flex h-4 w-4 items-center justify-center"
                          style={{
                            color: favoriteMeta.color,
                          }}
                        >
                          <Star size={10} fill="currentColor" aria-hidden="true" />
                        </span>
                      </HoverTextTooltip>
                    </div>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className={`${staticExport ? 'whitespace-normal wrap-break-word' : 'truncate'} text-[11px] font-semibold text-primary-300`}>{getClipPrimaryLabel(row.clip)}</div>
                  {getClipSecondaryLabel(row.clip) && (
                    <div className={`${staticExport ? 'whitespace-normal wrap-break-word' : 'truncate'} text-[10px] text-gray-500`}>{getClipSecondaryLabel(row.clip)}</div>
                  )}
                  {showMiniatures && row.clip.filePath ? (
                    <ClipMiniaturePreview
                      clip={row.clip}
                      enabled={showMiniatures}
                      defaultSeconds={thumbnailDefaultSeconds}
                      forceLoad={forceMiniatureLoad}
                    />
                  ) : null}
                </div>
                <div className="absolute right-0 top-0 flex w-10 flex-col items-center">
                  {scoreLabel ? (
                    <span className="shrink-0 rounded-md border border-white/10 bg-white/4.5 px-1.5 py-0.5 text-[10px] font-semibold text-gray-200">
                      {scoreLabel}
                    </span>
                  ) : (
                    <span className="inline-block h-5" aria-hidden="true" />
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
  showMiniatures,
  thumbnailDefaultSeconds,
  forceMiniatureLoad = false,
  staticExport = false,
}: ResultatsTopListsProps) {
  const { t } = useI18n()
  const finalTop = useMemo(
    () => (canSortByScore ? sortRowsByScore(rows, (row) => row.averageTotal) : rows),
    [canSortByScore, rows],
  )

  const topByJudge = useMemo(
    () =>
      judges.map((judge, index) => ({
        judge,
        entries: canSortByScore ? sortRowsByScore(rows, (row) => row.judgeTotals[index] ?? 0) : rows,
      })),
    [canSortByScore, judges, rows],
  )

  return (
    <div className={`flex-1 min-h-0 ${staticExport ? 'overflow-visible' : 'overflow-x-auto overflow-y-hidden'}`}>
      <div className="flex min-w-full w-full flex-nowrap items-start gap-2">
        {topByJudge.map(({ judge, entries }, index) => (
          <TopList
            key={`top-${judge.key}`}
            title={t('Top {name}', { name: judge.judgeName })}
            entries={entries}
            accentColor={judgeColors[judge.key] ?? '#22d3ee'}
            selectedClipId={selectedClipId}
            onSelectClip={onSelectClip}
            onOpenClipInNotation={onOpenClipInNotation}
            showMiniatures={showMiniatures}
            thumbnailDefaultSeconds={thumbnailDefaultSeconds}
            forceMiniatureLoad={forceMiniatureLoad}
            staticExport={staticExport}
            scoreAccessor={(row) => row.judgeTotals[index] ?? 0}
            favoriteMetaAccessor={(row) => {
              const favorite = row.judgeFavorites[index]
              if (!favorite?.isFavorite) return null
              const comment = favorite.comment.trim()
              return {
                color: judgeColors[judge.key] ?? '#fbbf24',
                tooltip: comment || t('Favori'),
              }
            }}
          />
        ))}

        <TopList
          title={t('Top final')}
          entries={finalTop}
          accentColor="#d4d4d8"
          selectedClipId={selectedClipId}
          onSelectClip={onSelectClip}
          onOpenClipInNotation={onOpenClipInNotation}
          showMiniatures={showMiniatures}
          thumbnailDefaultSeconds={thumbnailDefaultSeconds}
          forceMiniatureLoad={forceMiniatureLoad}
          staticExport={staticExport}
          scoreAccessor={(row) => row.averageTotal}
        />
      </div>
    </div>
  )
}
