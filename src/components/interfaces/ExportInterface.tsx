import { useMemo, useRef, useState } from 'react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { ExportOptionsPanel } from '@/components/interfaces/export/ExportOptionsPanel'
import { ExportPreviewPanel } from '@/components/interfaces/export/ExportPreviewPanel'
import type { ExportDensity, ExportMode, ExportTheme } from '@/components/interfaces/export/types'
import { useExportActions } from '@/components/interfaces/export/hooks/useExportActions'
import { useExportData } from '@/components/interfaces/export/hooks/useExportData'

const ACCENT_PRESETS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4']

export default function ExportInterface() {
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const notes = useNotationStore((state) => state.notes)
  const { currentProject, clips, importedJudges } = useProjectStore()

  const [theme, setTheme] = useState<ExportTheme>('dark')
  const [density, setDensity] = useState<ExportDensity>('comfortable')
  const [exportMode, setExportMode] = useState<ExportMode>('grouped')
  const [selectedJudgeKey, setSelectedJudgeKey] = useState<string>('current')
  const [accent, setAccent] = useState(ACCENT_PRESETS[0])
  const [decimals, setDecimals] = useState(1)
  const [showJudgeColumns, setShowJudgeColumns] = useState(true)
  const [showRank, setShowRank] = useState(true)
  const [showProjectMeta, setShowProjectMeta] = useState(true)
  const [title, setTitle] = useState(() => `${currentProject?.name || 'Projet'} - Resultats`)
  const previewRef = useRef<HTMLDivElement | null>(null)

  const {
    categoryGroups,
    judges,
    selectedJudge,
    selectedJudgeIndex,
    displayRows,
    rankByClipId,
  } = useExportData({
    currentBareme,
    notes,
    currentProject,
    clips,
    importedJudges,
    exportMode,
    selectedJudgeKey,
    onSelectedJudgeKeyChange: setSelectedJudgeKey,
  })

  const projectName = currentProject?.name || 'resultats'

  const jsonPayload = useMemo(() => ({
    exportedAt: new Date().toISOString(),
    projectName: currentProject?.name || '',
    judgeCount: judges.length,
    exportOptions: {
      exportMode,
      selectedJudge: selectedJudge?.judgeName ?? null,
      theme,
      density,
      decimals,
      accent,
      showJudgeColumns,
      showRank,
      showProjectMeta,
    },
    rows: displayRows.map((row) => ({
      clipId: row.clip.id,
      rank: rankByClipId.get(row.clip.id) ?? null,
      pseudo: getClipPrimaryLabel(row.clip),
      clipName: getClipSecondaryLabel(row.clip),
      categoryAverages: row.categoryAverages,
      averageTotal: row.averageTotal,
      displayedTotal:
        exportMode === 'individual'
          ? (row.judgeTotals[selectedJudgeIndex] ?? 0)
          : row.averageTotal,
      categoryByJudge: categoryGroups.reduce<Record<string, Record<string, number>>>((acc, group) => {
        acc[group.category] = judges.reduce<Record<string, number>>((judgeMap, judge, judgeIndex) => {
          judgeMap[judge.judgeName] = row.categoryJudgeScores[group.category][judgeIndex] ?? 0
          return judgeMap
        }, {})
        return acc
      }, {}),
      judgeTotals: judges.reduce<Record<string, number>>((acc, judge, index) => {
        acc[judge.judgeName] = row.judgeTotals[index] ?? 0
        return acc
      }, {}),
    })),
  }), [
    accent,
    categoryGroups,
    currentProject?.name,
    decimals,
    density,
    displayRows,
    exportMode,
    judges,
    rankByClipId,
    selectedJudge?.judgeName,
    selectedJudgeIndex,
    showJudgeColumns,
    showProjectMeta,
    showRank,
    theme,
  ])

  const { exporting, exportContainer, exportJson } = useExportActions({
    previewRef,
    theme,
    projectName,
    jsonPayload,
  })

  const formatScore = (value: number) => value.toFixed(decimals)

  if (!currentBareme) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Aucun barème chargé
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-3 p-3 overflow-hidden">
      <ExportOptionsPanel
        title={title}
        exportMode={exportMode}
        selectedJudgeKey={selectedJudgeKey}
        decimals={decimals}
        theme={theme}
        density={density}
        accent={accent}
        showJudgeColumns={showJudgeColumns}
        showRank={showRank}
        showProjectMeta={showProjectMeta}
        judges={judges}
        accentPresets={ACCENT_PRESETS}
        exporting={exporting}
        onSetTitle={setTitle}
        onSetExportMode={setExportMode}
        onSetSelectedJudgeKey={setSelectedJudgeKey}
        onSetDecimals={setDecimals}
        onSetTheme={setTheme}
        onSetDensity={setDensity}
        onSetAccent={setAccent}
        onToggleShowJudgeColumns={() => setShowJudgeColumns((prev) => !prev)}
        onToggleShowRank={() => setShowRank((prev) => !prev)}
        onToggleShowProjectMeta={() => setShowProjectMeta((prev) => !prev)}
        onExportPng={() => { exportContainer('png').catch(() => {}) }}
        onExportPdf={() => { exportContainer('pdf').catch(() => {}) }}
        onExportJson={() => { exportJson().catch(() => {}) }}
      />

      <ExportPreviewPanel
        previewRef={previewRef}
        theme={theme}
        density={density}
        exportMode={exportMode}
        accent={accent}
        title={title}
        projectName={currentProject?.name || 'Projet'}
        showProjectMeta={showProjectMeta}
        showRank={showRank}
        showJudgeColumns={showJudgeColumns}
        selectedJudgeIndex={selectedJudgeIndex}
        selectedJudgeName={selectedJudge?.judgeName}
        judges={judges}
        categoryGroups={categoryGroups}
        displayRows={displayRows}
        rankByClipId={rankByClipId}
        formatScore={formatScore}
      />
    </div>
  )
}
