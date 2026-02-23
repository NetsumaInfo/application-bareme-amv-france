import { Download, Sparkles } from 'lucide-react'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { withAlpha } from '@/utils/colors'
import type { CategoryGroup } from '@/utils/results'
import type { ExportDensity, ExportJudge, ExportMode, ExportRow, ExportTheme } from '@/components/interfaces/export/types'
import type { MutableRefObject } from 'react'

interface ExportPreviewPanelProps {
  previewRef: MutableRefObject<HTMLDivElement | null>
  theme: ExportTheme
  density: ExportDensity
  exportMode: ExportMode
  accent: string
  title: string
  projectName: string
  showProjectMeta: boolean
  showRank: boolean
  showJudgeColumns: boolean
  selectedJudgeIndex: number
  selectedJudgeName?: string
  judges: ExportJudge[]
  categoryGroups: CategoryGroup[]
  displayRows: ExportRow[]
  rankByClipId: Map<string, number>
  formatScore: (value: number) => string
}

export function ExportPreviewPanel({
  previewRef,
  theme,
  density,
  exportMode,
  accent,
  title,
  projectName,
  showProjectMeta,
  showRank,
  showJudgeColumns,
  selectedJudgeIndex,
  selectedJudgeName,
  judges,
  categoryGroups,
  displayRows,
  rankByClipId,
  formatScore,
}: ExportPreviewPanelProps) {
  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
        <Download size={12} />
        Aperçu exportable
      </div>

      <div
        ref={previewRef}
        className={`rounded-2xl border p-4 min-w-[760px] ${
          theme === 'light'
            ? 'bg-white border-gray-200 text-gray-900'
            : 'bg-slate-950 border-slate-700 text-slate-100'
        }`}
      >
        <div
          className="rounded-xl border p-4 mb-4"
          style={{
            borderColor: withAlpha(accent, 0.45),
            background:
              theme === 'light'
                ? `linear-gradient(135deg, ${withAlpha(accent, 0.16)}, rgba(255,255,255,0.9))`
                : `linear-gradient(135deg, ${withAlpha(accent, 0.34)}, rgba(15,23,42,0.9))`,
          }}
        >
          <h2 className={`text-xl font-bold flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            <Sparkles size={16} />
            {title || 'Resultats'}
          </h2>
          {showProjectMeta && (
            <div className={`mt-2 flex flex-wrap gap-2 text-[11px] ${theme === 'light' ? 'text-gray-700' : 'text-slate-300'}`}>
              <span className="px-2 py-1 rounded border" style={{ borderColor: withAlpha(accent, 0.4) }}>
                Projet: {projectName}
              </span>
              <span className="px-2 py-1 rounded border" style={{ borderColor: withAlpha(accent, 0.4) }}>
                Juges: {judges.length}
              </span>
              <span className="px-2 py-1 rounded border" style={{ borderColor: withAlpha(accent, 0.4) }}>
                Mode: {exportMode === 'grouped' ? 'Groupé (moyenne)' : `Individuel (${selectedJudgeName || '-'})`}
              </span>
              <span className="px-2 py-1 rounded border" style={{ borderColor: withAlpha(accent, 0.4) }}>
                Date: {new Date().toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
        </div>

        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {showRank && (
                <th
                  className={`px-2 ${density === 'compact' ? 'py-1' : 'py-1.5'} text-center border`}
                  style={{ borderColor: theme === 'light' ? '#d1d5db' : '#334155' }}
                >
                  #
                </th>
              )}
              <th
                className={`px-2 ${density === 'compact' ? 'py-1' : 'py-1.5'} text-left border`}
                style={{ borderColor: theme === 'light' ? '#d1d5db' : '#334155' }}
              >
                Clip
              </th>

              {categoryGroups.map((group) => (
                <th
                  key={`export-${group.category}`}
                  className={`px-2 ${density === 'compact' ? 'py-1' : 'py-1.5'} text-center border`}
                  style={{
                    borderColor: withAlpha(group.color, 0.45),
                    backgroundColor: withAlpha(group.color, theme === 'light' ? 0.16 : 0.2),
                    color: theme === 'light' ? '#111827' : group.color,
                  }}
                >
                  {group.category}
                </th>
              ))}

              <th
                className={`px-2 ${density === 'compact' ? 'py-1' : 'py-1.5'} text-center border`}
                style={{ borderColor: theme === 'light' ? '#d1d5db' : '#334155' }}
              >
                {exportMode === 'individual' ? `Total ${selectedJudgeName || ''}` : 'Total moyen'}
              </th>

              {exportMode === 'grouped' && showJudgeColumns && judges.map((judge) => (
                <th
                  key={`export-judge-${judge.key}`}
                  className={`px-2 ${density === 'compact' ? 'py-1' : 'py-1.5'} text-center border`}
                  style={{ borderColor: theme === 'light' ? '#d1d5db' : '#334155' }}
                >
                  {judge.judgeName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, index) => (
              <tr
                key={`export-row-${row.clip.id}`}
                style={{
                  backgroundColor:
                    index % 2 === 0
                      ? theme === 'light'
                        ? '#f9fafb'
                        : '#0f172a'
                      : 'transparent',
                }}
              >
                {showRank && (
                  <td
                    className={`px-2 ${density === 'compact' ? 'py-1' : 'py-1.5'} text-center border font-mono`}
                    style={{ borderColor: theme === 'light' ? '#e5e7eb' : '#334155' }}
                  >
                    {rankByClipId.get(row.clip.id) ?? '-'}
                  </td>
                )}
                <td
                  className={`px-2 ${density === 'compact' ? 'py-1' : 'py-1.5'} border`}
                  style={{ borderColor: theme === 'light' ? '#e5e7eb' : '#334155' }}
                >
                  <span className="font-semibold">{getClipPrimaryLabel(row.clip)}</span>
                  <span className={theme === 'light' ? 'text-gray-600 ml-1' : 'text-slate-400 ml-1'}>
                    {getClipSecondaryLabel(row.clip) ? ` - ${getClipSecondaryLabel(row.clip)}` : ''}
                  </span>
                </td>

                {categoryGroups.map((group) => (
                  <td
                    key={`export-score-${row.clip.id}-${group.category}`}
                    className={`px-2 ${density === 'compact' ? 'py-1' : 'py-1.5'} text-center border font-mono`}
                    style={{ borderColor: theme === 'light' ? '#e5e7eb' : '#334155' }}
                  >
                    {formatScore(
                      exportMode === 'individual'
                        ? (row.categoryJudgeScores[group.category][selectedJudgeIndex] ?? 0)
                        : (row.categoryAverages[group.category] ?? 0),
                    )}
                  </td>
                ))}

                <td
                  className={`px-2 ${density === 'compact' ? 'py-1' : 'py-1.5'} text-center border font-mono font-bold`}
                  style={{ borderColor: theme === 'light' ? '#d1d5db' : '#334155' }}
                >
                  {formatScore(
                    exportMode === 'individual'
                      ? (row.judgeTotals[selectedJudgeIndex] ?? 0)
                      : row.averageTotal,
                  )}
                </td>

                {exportMode === 'grouped' && showJudgeColumns && row.judgeTotals.map((value, judgeIdx) => (
                  <td
                    key={`export-judge-score-${row.clip.id}-${judges[judgeIdx].key}`}
                    className={`px-2 ${density === 'compact' ? 'py-1' : 'py-1.5'} text-center border font-mono`}
                    style={{ borderColor: theme === 'light' ? '#e5e7eb' : '#334155' }}
                  >
                    {formatScore(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
