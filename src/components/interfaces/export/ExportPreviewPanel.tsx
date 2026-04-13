import { useMemo } from 'react'
import type { MutableRefObject } from 'react'
import { ResultatsGlobalCategoryTable } from '@/components/interfaces/resultats/ResultatsGlobalCategoryTable'
import { ResultatsGlobalDetailedTable } from '@/components/interfaces/resultats/ResultatsGlobalDetailedTable'
import { ResultatsJudgeTable } from '@/components/interfaces/resultats/ResultatsJudgeTable'
import { ResultatsTopLists } from '@/components/interfaces/resultats/ResultatsTopLists'
import type {
  ResultatsGlobalVariant,
  ResultatsMainView,
  ResultatsRow,
} from '@/components/interfaces/resultats/types'
import type { CategoryGroup, JudgeSource } from '@/utils/results'
import { useI18n } from '@/i18n'

interface ExportPreviewPanelProps {
  previewRef: MutableRefObject<HTMLDivElement | null>
  exportPageRefs: MutableRefObject<Array<HTMLDivElement | null>>
  mainView: ResultatsMainView
  globalVariant: ResultatsGlobalVariant
  canSortByScore: boolean
  currentBaremeTotalPoints: number
  categoryGroups: CategoryGroup[]
  judges: JudgeSource[]
  rows: ResultatsRow[]
  judgeColors: Record<string, string>
  selectedJudgeIndex: number
  rowsPerImage: number
  showMiniatures: boolean
  thumbnailDefaultSeconds: number
}

function chunkRows(rows: ResultatsRow[], chunkSize: number): ResultatsRow[][] {
  if (rows.length === 0) return []
  const pages: ResultatsRow[][] = []
  for (let index = 0; index < rows.length; index += chunkSize) {
    pages.push(rows.slice(index, index + chunkSize))
  }
  return pages
}

function clampRowsPerImage(value: number): number {
  if (!Number.isFinite(value)) return 20
  return Math.min(Math.max(Math.round(value), 5), 80)
}

function getCriterionCellKey(clipId: string, criterionId: string, judgeKey: string): string {
  return `${clipId}:${criterionId}:${judgeKey}`
}

function noop() {}

interface ResultatsExportSurfaceProps {
  mainView: ResultatsMainView
  globalVariant: ResultatsGlobalVariant
  canSortByScore: boolean
  currentBaremeTotalPoints: number
  categoryGroups: CategoryGroup[]
  judges: JudgeSource[]
  rows: ResultatsRow[]
  judgeColors: Record<string, string>
  selectedJudgeIndex: number
  showMiniatures: boolean
  thumbnailDefaultSeconds: number
  staticExport?: boolean
}

function ResultatsExportSurface({
  mainView,
  globalVariant,
  canSortByScore,
  currentBaremeTotalPoints,
  categoryGroups,
  judges,
  rows,
  judgeColors,
  selectedJudgeIndex,
  showMiniatures,
  thumbnailDefaultSeconds,
  staticExport = false,
}: ResultatsExportSurfaceProps) {
  const { t } = useI18n()
  const selectedJudge = judges[selectedJudgeIndex] ?? judges[0]
  const safeSelectedJudgeIndex = selectedJudge ? Math.max(0, judges.findIndex((judge) => judge.key === selectedJudge.key)) : 0

  if (!selectedJudge && mainView === 'judge') {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        {t('Aucun juge disponible')}
      </div>
    )
  }

  return (
    <div className={`relative flex h-full w-full min-w-0 flex-1 flex-col bg-transparent ${staticExport ? 'amv-export-surface overflow-visible' : 'overflow-hidden'}`}>
      {mainView === 'judge' && selectedJudge ? (
        <ResultatsJudgeTable
          currentBaremeTotalPoints={currentBaremeTotalPoints}
          categoryGroups={categoryGroups}
          judge={selectedJudge}
          judgeIndex={safeSelectedJudgeIndex}
          rows={rows}
          selectedClipId={null}
          criterionDraftCells={{}}
          onSelectClip={noop}
          onOpenClipInNotation={noop}
          onOpenClipContextMenu={noop}
          getCriterionCellKey={getCriterionCellKey}
          onSetCriterionDraftCell={noop}
          onCommitCriterionDraftCell={noop}
          onClearCriterionDraftCell={noop}
          showMiniatures={showMiniatures}
          thumbnailDefaultSeconds={thumbnailDefaultSeconds}
          forceMiniatureLoad={staticExport}
          staticExport={staticExport}
          readOnly
        />
      ) : null}

      {mainView === 'global' && globalVariant === 'detailed' ? (
        <ResultatsGlobalDetailedTable
          canSortByScore={canSortByScore}
          currentBaremeTotalPoints={currentBaremeTotalPoints}
          categoryGroups={categoryGroups}
          judges={judges}
          rows={rows}
          judgeColors={judgeColors}
          selectedClipId={null}
          criterionDraftCells={{}}
          onSelectClip={noop}
          onOpenClipInNotation={noop}
          onOpenClipContextMenu={noop}
          getCriterionCellKey={getCriterionCellKey}
          onSetCriterionDraftCell={noop}
          onCommitCriterionDraftCell={noop}
          onClearCriterionDraftCell={noop}
          showMiniatures={showMiniatures}
          thumbnailDefaultSeconds={thumbnailDefaultSeconds}
          forceMiniatureLoad={staticExport}
          staticExport={staticExport}
          readOnly
        />
      ) : null}

      {mainView === 'global' && globalVariant === 'category' ? (
        <ResultatsGlobalCategoryTable
          currentBaremeTotalPoints={currentBaremeTotalPoints}
          categoryGroups={categoryGroups}
          judges={judges}
          judgeColors={judgeColors}
          rows={rows}
          selectedClipId={null}
          onSelectClip={noop}
          onOpenClipInNotation={noop}
          onOpenClipContextMenu={noop}
          showMiniatures={showMiniatures}
          thumbnailDefaultSeconds={thumbnailDefaultSeconds}
          forceMiniatureLoad={staticExport}
          staticExport={staticExport}
        />
      ) : null}

      {mainView === 'top' ? (
        <ResultatsTopLists
          canSortByScore={canSortByScore}
          judges={judges}
          rows={rows}
          judgeColors={judgeColors}
          selectedClipId={null}
          onSelectClip={noop}
          onOpenClipInNotation={noop}
          showMiniatures={showMiniatures}
          thumbnailDefaultSeconds={thumbnailDefaultSeconds}
          forceMiniatureLoad={staticExport}
          staticExport={staticExport}
        />
      ) : null}
    </div>
  )
}

export function ExportPreviewPanel({
  previewRef,
  exportPageRefs,
  mainView,
  globalVariant,
  canSortByScore,
  currentBaremeTotalPoints,
  categoryGroups,
  judges,
  rows,
  judgeColors,
  selectedJudgeIndex,
  rowsPerImage,
  showMiniatures,
  thumbnailDefaultSeconds,
}: ExportPreviewPanelProps) {
  const safeRowsPerImage = clampRowsPerImage(rowsPerImage)
  const pagedRows = useMemo(
    () => (mainView === 'top' ? [rows] : chunkRows(rows, safeRowsPerImage)),
    [mainView, rows, safeRowsPerImage],
  )

  return (
    <div data-screenshot-zone="export-table" className="flex-1 min-h-0 overflow-hidden">
      <ResultatsExportSurface
        mainView={mainView}
        globalVariant={globalVariant}
        canSortByScore={canSortByScore}
        currentBaremeTotalPoints={currentBaremeTotalPoints}
        categoryGroups={categoryGroups}
        judges={judges}
        rows={rows}
        judgeColors={judgeColors}
        selectedJudgeIndex={selectedJudgeIndex}
        showMiniatures={showMiniatures}
        thumbnailDefaultSeconds={thumbnailDefaultSeconds}
      />

      <div className="fixed left-[-20000px] top-0 z-[-1] min-w-[1400px] pointer-events-none" style={{ zoom: 1 }} aria-hidden="true">
        <div ref={previewRef} data-export-preview="true" className="amv-export-static-target min-h-0 bg-surface p-1">
          <ResultatsExportSurface
            mainView={mainView}
            globalVariant={globalVariant}
            canSortByScore={canSortByScore}
            currentBaremeTotalPoints={currentBaremeTotalPoints}
            categoryGroups={categoryGroups}
            judges={judges}
            rows={rows}
            judgeColors={judgeColors}
            selectedJudgeIndex={selectedJudgeIndex}
            showMiniatures={showMiniatures}
            thumbnailDefaultSeconds={thumbnailDefaultSeconds}
            staticExport
          />
        </div>

        {pagedRows.map((pageRows, pageIndex) => (
          <div
            key={`export-page-${pageIndex}`}
            ref={(node) => {
              exportPageRefs.current[pageIndex] = node
            }}
            data-export-page="true"
            data-export-page-index={String(pageIndex)}
            className="amv-export-static-target mt-8 min-h-0 bg-surface p-1 first:mt-0"
          >
            <ResultatsExportSurface
              mainView={mainView}
              globalVariant={globalVariant}
              canSortByScore={canSortByScore}
              currentBaremeTotalPoints={currentBaremeTotalPoints}
              categoryGroups={categoryGroups}
              judges={judges}
              rows={pageRows}
              judgeColors={judgeColors}
              selectedJudgeIndex={selectedJudgeIndex}
              showMiniatures={showMiniatures}
              thumbnailDefaultSeconds={thumbnailDefaultSeconds}
              staticExport
            />
          </div>
        ))}
      </div>
    </div>
  )
}
