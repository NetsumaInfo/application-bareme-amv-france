import { Code2, FileImage, FileJson, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import type { ElementType } from 'react'
import type {
  ExportContestCategoryOption,
  ExportJsonJudgeOption,
  ExportJsonMode,
  ExportJudge,
  ExportMode,
  ExportNotesPdfMode,
  ExportPngMode,
  ExportTableView,
} from '@/components/interfaces/export/types'
import { AppSelect } from '@/components/ui/AppSelect'
import { useI18n } from '@/i18n'

// ─── Download button ──────────────────────────────────────────────────────────

function DlBtn({
  icon: Icon,
  label,
  loading,
  onClick,
}: {
  icon: ElementType
  label: string
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label={label}
      className="group flex min-w-[42px] flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-gray-400 transition-colors hover:bg-white/6 hover:text-white disabled:opacity-40 active:scale-[0.97]"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/6 text-gray-400 transition-colors group-hover:bg-primary-600/20 group-hover:text-primary-300">
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
      </span>
      <span className="text-[10px] font-medium leading-tight">{label}</span>
    </button>
  )
}

// ─── Inline option chip ───────────────────────────────────────────────────────

function InlineChip<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { label: string; value: T }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-px rounded-md border border-gray-700/40 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
            value === opt.value
              ? 'bg-primary-600/20 text-primary-300'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface ExportOptionsPanelProps {
  exportMode: ExportMode
  tableView: ExportTableView
  selectedJudgeKey: string
  pngExportMode: ExportPngMode
  pngScale: number
  rowsPerImage: number
  judges: ExportJudge[]
  exporting: boolean
  notesPdfMode: ExportNotesPdfMode
  jsonExportMode: ExportJsonMode
  jsonJudgeKey: string
  jsonJudgeOptions: ExportJsonJudgeOption[]
  contestCategoryKey: string
  contestCategoryOptions: ExportContestCategoryOption[]
  onSetExportMode: (mode: ExportMode) => void
  onSetTableView: (view: ExportTableView) => void
  onSetSelectedJudgeKey: (judgeKey: string) => void
  onSetPngExportMode: (mode: ExportPngMode) => void
  onSetPngScale: (value: number) => void
  onSetRowsPerImage: (value: number) => void
  onSetJsonExportMode: (mode: ExportJsonMode) => void
  onSetJsonJudgeKey: (judgeKey: string) => void
  onSetContestCategoryKey: (categoryKey: string) => void
  onExportPng: () => void
  onExportPdf: () => void
  onExportNotesPdf: () => void
  onExportJson: () => void
  onExportSpreadsheet: () => void
  onExportHtml: () => void
  onSetNotesPdfMode: (mode: ExportNotesPdfMode) => void
}

export function ExportOptionsPanel({
  pngExportMode,
  pngScale,
  rowsPerImage,
  exporting,
  notesPdfMode,
  jsonExportMode,
  jsonJudgeKey,
  jsonJudgeOptions,
  contestCategoryKey,
  contestCategoryOptions,
  onSetPngExportMode,
  onSetPngScale,
  onSetRowsPerImage,
  onSetJsonExportMode,
  onSetJsonJudgeKey,
  onSetContestCategoryKey,
  onExportPng,
  onExportPdf,
  onExportNotesPdf,
  onExportJson,
  onExportSpreadsheet,
  onExportHtml,
  onSetNotesPdfMode,
}: ExportOptionsPanelProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-0">

      {/* ── Format buttons — horizontal row ──────────────────── */}
      <div className="flex items-end gap-0.5 overflow-x-auto border-b border-gray-700/30 pb-1.5">
        <DlBtn
          icon={FileImage}
          label="PNG"
          loading={exporting}
          onClick={onExportPng}
        />
        <DlBtn
          icon={FileText}
          label="PDF"
          loading={exporting}
          onClick={onExportPdf}
        />
        <DlBtn
          icon={FileSpreadsheet}
          label="Excel"
          loading={exporting}
          onClick={onExportSpreadsheet}
        />
        <DlBtn
          icon={Code2}
          label="HTML"
          loading={exporting}
          onClick={onExportHtml}
        />
        <DlBtn
          icon={FileText}
          label={t('Notes')}
          loading={exporting}
          onClick={onExportNotesPdf}
        />
        <DlBtn
          icon={FileJson}
          label="JSON"
          loading={exporting}
          onClick={onExportJson}
        />
      </div>

      {/* ── Compact settings ─────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 pt-1.5">

        {/* PNG */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-gray-500 shrink-0">PNG</span>
          <div className="flex items-center gap-2">
            <InlineChip
              value={String(pngScale) as '2' | '3' | '4' | '5'}
              options={[
                { label: '1×', value: '2' },
                { label: '2×', value: '3' },
                { label: '3×', value: '4' },
                { label: '4×', value: '5' },
              ]}
              onChange={(v) => onSetPngScale(Number(v))}
            />
            <InlineChip
              value={pngExportMode}
              options={[
                { label: t('Unique'), value: 'single' },
                { label: t('Paginé'), value: 'paged' },
              ]}
              onChange={onSetPngExportMode}
            />
          </div>
        </div>

        {(pngExportMode === 'paged' || pngExportMode === 'both') && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-gray-500 shrink-0">{t('Par page')}</span>
            <input
              type="number"
              min={5}
              max={80}
              value={rowsPerImage}
              onChange={(e) => onSetRowsPerImage(Number(e.target.value))}
              className="w-14 rounded-sm border border-gray-700/50 bg-transparent px-1.5 py-0.5 text-center text-[10px] text-white focus:border-primary-500 focus:outline-hidden"
            />
          </div>
        )}

        {/* Notes PDF */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-gray-500 shrink-0">{t('Notes')}</span>
          <InlineChip
            value={notesPdfMode}
            options={[
              { label: t('Générales'), value: 'general' },
              { label: t('Juges'), value: 'judges' },
              { label: t('Toutes'), value: 'both' },
            ]}
            onChange={onSetNotesPdfMode}
          />
        </div>

        {/* JSON */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-gray-500 shrink-0">JSON</span>
          <AppSelect
            value={jsonExportMode}
            onChange={onSetJsonExportMode}
            ariaLabel={t('Contenu JSON')}
            className="w-32"
            options={[
              { value: 'full_project', label: t('Projet complet') },
              { value: 'single_judge', label: t('Par juge') },
              { value: 'notes_only', label: t('Notes') },
            ]}
          />
        </div>

        {jsonExportMode === 'single_judge' && jsonJudgeOptions.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-gray-500 shrink-0">{t('Juge')}</span>
            <AppSelect
              value={jsonJudgeKey}
              onChange={onSetJsonJudgeKey}
              ariaLabel={t('Juge')}
              className="w-32"
              options={jsonJudgeOptions.map((j) => ({ value: j.key, label: j.judgeName }))}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-gray-500 shrink-0">{t('Catégories clip')}</span>
          <AppSelect
            value={contestCategoryKey}
            onChange={onSetContestCategoryKey}
            ariaLabel={t('Catégories clip')}
            className="w-32"
            options={contestCategoryOptions.map((option) => ({ value: option.key, label: option.label }))}
          />
        </div>
      </div>
    </div>
  )
}
