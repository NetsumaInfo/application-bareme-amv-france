import { useMemo, useRef, useState } from 'react'
import { Download, FileImage, FileJson, FileText, SlidersHorizontal, Sparkles, ArrowUpDown } from 'lucide-react'
import { save } from '@tauri-apps/api/dialog'
import { writeBinaryFile } from '@tauri-apps/api/fs'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import * as tauri from '@/services/tauri'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { withAlpha } from '@/utils/colors'
import {
  buildCategoryGroups,
  buildJudgeSources,
  getCategoryScore,
  getNoteTotal,
  type NoteLike,
} from '@/utils/results'
import type { Clip } from '@/types/project'

type ExportTheme = 'dark' | 'light'
type ExportDensity = 'comfortable' | 'compact'
type SortMode = 'folder' | 'alpha'

const ACCENT_PRESETS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4']

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? ''
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export default function ExportInterface() {
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const notes = useNotationStore((state) => state.notes)
  const { currentProject, clips, importedJudges } = useProjectStore()

  const [theme, setTheme] = useState<ExportTheme>('dark')
  const [density, setDensity] = useState<ExportDensity>('comfortable')
  const [sortMode, setSortMode] = useState<SortMode>('folder')
  const [accent, setAccent] = useState(ACCENT_PRESETS[0])
  const [decimals, setDecimals] = useState(1)
  const [showJudgeColumns, setShowJudgeColumns] = useState(true)
  const [showRank, setShowRank] = useState(true)
  const [showProjectMeta, setShowProjectMeta] = useState(true)
  const [title, setTitle] = useState(() => `${currentProject?.name || 'Projet'} - Resultats`)
  const [exporting, setExporting] = useState(false)
  const previewRef = useRef<HTMLDivElement | null>(null)

  const categoryGroups = useMemo(
    () => (currentBareme ? buildCategoryGroups(currentBareme) : []),
    [currentBareme],
  )

  const judges = useMemo(
    () => buildJudgeSources(currentProject?.judgeName, notes, importedJudges),
    [currentProject?.judgeName, notes, importedJudges],
  )

  const sortedClips = useMemo(() => {
    const base = [...clips]
    const originalIndex = new Map(clips.map((clip, index) => [clip.id, index]))

    if (sortMode === 'alpha') {
      base.sort((a, b) => {
        const labelA = getClipPrimaryLabel(a)
        const labelB = getClipPrimaryLabel(b)
        const cmp = labelA.localeCompare(labelB, 'fr', { sensitivity: 'base' })
        if (cmp !== 0) return cmp
        return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
      })
      return base
    }

    base.sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : (originalIndex.get(a.id) ?? 0)
      const orderB = Number.isFinite(b.order) ? b.order : (originalIndex.get(b.id) ?? 0)
      if (orderA !== orderB) return orderA - orderB
      return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
    })
    return base
  }, [clips, sortMode])

  const rows = useMemo(() => {
    if (!currentBareme) return []
    return sortedClips.map((clip) => {
      const categoryJudgeScores: Record<string, number[]> = {}
      const categoryAverages: Record<string, number> = {}
      for (const group of categoryGroups) {
        const values = judges.map((judge) =>
          getCategoryScore(judge.notes[clip.id] as NoteLike | undefined, group.criteria),
        )
        categoryJudgeScores[group.category] = values
        const average = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

        categoryAverages[group.category] = Math.round(average * 100) / 100
      }

      const judgeTotals = judges.map((judge) =>
        getNoteTotal(judge.notes[clip.id] as NoteLike | undefined, currentBareme),
      )
      const averageTotal = judgeTotals.length > 0
        ? Math.round((judgeTotals.reduce((sum, value) => sum + value, 0) / judgeTotals.length) * 100) / 100
        : 0

      return { clip, categoryJudgeScores, categoryAverages, judgeTotals, averageTotal }
    })
  }, [sortedClips, categoryGroups, currentBareme, judges])

  const rankByClipId = useMemo(() => {
    const sortedByScore = [...rows].sort((a, b) => b.averageTotal - a.averageTotal)
    const map = new Map<string, number>()
    sortedByScore.forEach((row, index) => {
      map.set(row.clip.id, index + 1)
    })
    return map
  }, [rows])

  const formatScore = (value: number) => value.toFixed(decimals)

  const getSubtitle = (clip: Clip) => {
    const secondary = getClipSecondaryLabel(clip)
    return secondary ? ` - ${secondary}` : ''
  }

  const exportContainer = async (type: 'png' | 'pdf') => {
    if (!previewRef.current || exporting) return
    setExporting(true)

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
        scale: 2,
        useCORS: true,
      })

      const dataUrl = canvas.toDataURL('image/png')
      if (type === 'png') {
        const pngPath = await save({
          filters: [{ name: 'PNG', extensions: ['png'] }],
          defaultPath: `${currentProject?.name || 'resultats'}_export.png`,
        })
        if (!pngPath) return
        await writeBinaryFile(pngPath, dataUrlToBytes(dataUrl))
        return
      }

      const pdfPath = await save({
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: `${currentProject?.name || 'resultats'}_export.pdf`,
      })
      if (!pdfPath) return

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'pt',
        format: 'a4',
      })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const maxWidth = pageWidth - 40
      const maxHeight = pageHeight - 40
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height)
      const renderWidth = canvas.width * ratio
      const renderHeight = canvas.height * ratio
      const x = (pageWidth - renderWidth) / 2
      const y = (pageHeight - renderHeight) / 2

      pdf.addImage(dataUrl, 'PNG', x, y, renderWidth, renderHeight)
      await writeBinaryFile(pdfPath, new Uint8Array(pdf.output('arraybuffer')))
    } catch (e) {
      console.error(`Export ${type.toUpperCase()} failed:`, e)
      alert(`Erreur export ${type.toUpperCase()}: ${e}`)
    } finally {
      setExporting(false)
    }
  }

  const exportJson = async () => {
    try {
      const jsonPath = await tauri.saveJsonDialog(`${currentProject?.name || 'resultats'}_export.json`)
      if (!jsonPath) return
      await tauri.exportJsonFile(
        {
          exportedAt: new Date().toISOString(),
          projectName: currentProject?.name || '',
          judgeCount: judges.length,
          exportOptions: {
            sortMode,
            theme,
            density,
            decimals,
            accent,
            showJudgeColumns,
            showRank,
            showProjectMeta,
          },
          rows: rows.map((row) => ({
            clipId: row.clip.id,
            rank: rankByClipId.get(row.clip.id) ?? null,
            pseudo: getClipPrimaryLabel(row.clip),
            clipName: getClipSecondaryLabel(row.clip),
            categoryAverages: row.categoryAverages,
            averageTotal: row.averageTotal,
            categoryByJudge: categoryGroups.reduce<Record<string, Record<string, number>>>((acc, group) => {
              acc[group.category] = judges.reduce<Record<string, number>>((judgeMap, judge, judgeIdx) => {
                judgeMap[judge.judgeName] = row.categoryJudgeScores[group.category][judgeIdx] ?? 0
                return judgeMap
              }, {})
              return acc
            }, {}),
            judgeTotals: judges.reduce<Record<string, number>>((acc, judge, idx) => {
              acc[judge.judgeName] = row.judgeTotals[idx] ?? 0
              return acc
            }, {}),
          })),
        },
        jsonPath,
      )
    } catch (e) {
      console.error('Export JSON failed:', e)
      alert(`Erreur export JSON: ${e}`)
    }
  }

  if (!currentBareme) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Aucun barème chargé
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-3 p-3 overflow-hidden">
      <div className="w-full lg:w-80 shrink-0 rounded-lg border border-gray-700 bg-surface p-3 overflow-y-auto">
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
          <SlidersHorizontal size={14} />
          Options d'export
        </h3>
        <p className="text-[11px] text-gray-500 mb-3">
          Mets en forme le rendu avant export.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Titre</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
              placeholder="Titre de la planche export"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Tri</label>
            <div className="relative">
              <ArrowUpDown size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="w-full pl-7 pr-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="folder">Ordre du dossier</option>
                <option value="alpha">Alphabétique</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Arrondi des notes</label>
            <select
              value={decimals}
              onChange={(event) => setDecimals(Number(event.target.value))}
              className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
            >
              <option value={0}>0 décimale</option>
              <option value={1}>1 décimale</option>
              <option value={2}>2 décimales</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Thème</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme('dark')}
                className={`px-2 py-1.5 rounded text-xs border transition-colors ${
                  theme === 'dark'
                    ? 'border-primary-500 text-primary-300 bg-primary-600/10'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                Sombre
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`px-2 py-1.5 rounded text-xs border transition-colors ${
                  theme === 'light'
                    ? 'border-primary-500 text-primary-300 bg-primary-600/10'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                Clair
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Densité</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDensity('comfortable')}
                className={`px-2 py-1.5 rounded text-xs border transition-colors ${
                  density === 'comfortable'
                    ? 'border-primary-500 text-primary-300 bg-primary-600/10'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                Confort
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={`px-2 py-1.5 rounded text-xs border transition-colors ${
                  density === 'compact'
                    ? 'border-primary-500 text-primary-300 bg-primary-600/10'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                Compact
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Accent</label>
            <div className="flex flex-wrap gap-1.5">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAccent(preset)}
                  className={`w-6 h-6 rounded border transition-transform ${
                    accent === preset ? 'border-white scale-105' : 'border-gray-700'
                  }`}
                  style={{ backgroundColor: preset }}
                  title={preset}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={showJudgeColumns}
              onChange={() => setShowJudgeColumns((prev) => !prev)}
              className="accent-primary-500"
            />
            Afficher les colonnes juges
          </label>

          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={showRank}
              onChange={() => setShowRank((prev) => !prev)}
              className="accent-primary-500"
            />
            Afficher le rang
          </label>

          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={showProjectMeta}
              onChange={() => setShowProjectMeta((prev) => !prev)}
              className="accent-primary-500"
            />
            Afficher les métadonnées
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={() => exportContainer('png')}
            disabled={exporting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium disabled:opacity-60"
          >
            <FileImage size={14} />
            Export PNG
          </button>
          <button
            onClick={() => exportContainer('pdf')}
            disabled={exporting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-surface-light border border-gray-700 text-gray-300 hover:text-white text-xs"
          >
            <FileText size={14} />
            Export PDF
          </button>
          <button
            onClick={exportJson}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-surface-light border border-gray-700 text-gray-300 hover:text-white text-xs"
          >
            <FileJson size={14} />
            Export JSON
          </button>
        </div>
      </div>

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
                  Projet: {currentProject?.name || 'Projet'}
                </span>
                <span className="px-2 py-1 rounded border" style={{ borderColor: withAlpha(accent, 0.4) }}>
                  Juges: {judges.length}
                </span>
                <span className="px-2 py-1 rounded border" style={{ borderColor: withAlpha(accent, 0.4) }}>
                  Tri: {sortMode === 'folder' ? 'Ordre du dossier' : 'Alphabétique'}
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
                  style={{
                    borderColor: theme === 'light' ? '#d1d5db' : '#334155',
                  }}
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
                  Total
                </th>

                {showJudgeColumns && judges.map((judge) => (
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
              {rows.map((row, index) => (
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
                      {getSubtitle(row.clip)}
                    </span>
                  </td>

                  {categoryGroups.map((group) => (
                    <td
                      key={`export-score-${row.clip.id}-${group.category}`}
                      className={`px-2 ${density === 'compact' ? 'py-1' : 'py-1.5'} text-center border font-mono`}
                      style={{ borderColor: theme === 'light' ? '#e5e7eb' : '#334155' }}
                    >
                      {formatScore(row.categoryAverages[group.category])}
                    </td>
                  ))}

                  <td
                    className={`px-2 ${density === 'compact' ? 'py-1' : 'py-1.5'} text-center border font-mono font-bold`}
                    style={{ borderColor: theme === 'light' ? '#d1d5db' : '#334155' }}
                  >
                    {formatScore(row.averageTotal)}
                  </td>

                  {showJudgeColumns && row.judgeTotals.map((value, judgeIdx) => (
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
    </div>
  )
}
