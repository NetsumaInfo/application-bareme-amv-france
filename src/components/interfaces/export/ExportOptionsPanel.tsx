import { Code2, Download, FileImage, FileJson, FileSpreadsheet, FileText, Loader2, Table } from 'lucide-react'
import type { ElementType } from 'react'
import type {
  ExportContestCategoryOption,
  ExportJsonJudgeOption,
  ExportJsonMode,
  ExportJudge,
  ExportMode,
  ExportNotesPdfMode,
  ExportExcelLayout,
  ExportExcelOrientation,
  ExportExcelSort,
  ExportPngMode,
  ExportTableType,
  ExportTableView,
  ExportTheme,
} from '@/components/interfaces/export/types'
import { AppSelect } from '@/components/ui/AppSelect'
import { useI18n } from '@/i18n'

// ─── Download button ──────────────────────────────────────────────────────────

function DlBtn({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: ElementType
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`group flex w-full flex-col items-center gap-1 rounded-md px-2 py-2 transition-colors active:scale-[0.97] ${
        active
          ? 'bg-primary-600/15 text-white ring-1 ring-primary-500/40'
          : 'text-gray-400 hover:bg-white/6 hover:text-white'
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
          active
            ? 'bg-primary-600/30 text-primary-200'
            : 'bg-white/6 text-gray-400 group-hover:bg-primary-600/20 group-hover:text-primary-300'
        }`}
      >
        <Icon size={14} />
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

// ─── Small column toggle pill ──────────────────────────────────────────────────

function ColumnToggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
        active
          ? 'border-primary-600/40 bg-primary-600/20 text-primary-300'
          : 'border-gray-700/40 text-gray-500 hover:text-gray-300'
      }`}
    >
      {label}
    </button>
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
  includeTimecodeThumbnails: boolean
  jsonExportMode: ExportJsonMode
  jsonJudgeKey: string
  jsonJudgeOptions: ExportJsonJudgeOption[]
  contestCategoryKey: string
  contestCategoryOptions: ExportContestCategoryOption[]
  selectedType: ExportTableType
  onSelectType: (type: ExportTableType) => void
  onExportSelected: () => void
  includeComments: boolean
  commentsSupported: boolean
  onToggleComments: () => void
  fileNameBase: string
  fileNamePlaceholder: string
  exportTheme: ExportTheme
  pngTransparent: boolean
  excelLayout: ExportExcelLayout
  excelOrientation: ExportExcelOrientation
  excelSort: ExportExcelSort
  excelShowJudges: boolean
  excelShowCategories: boolean
  excelShowRank: boolean
  onSetFileNameBase: (value: string) => void
  onSetExportTheme: (theme: ExportTheme) => void
  onTogglePngTransparent: () => void
  onSetExcelLayout: (layout: ExportExcelLayout) => void
  onSetExcelOrientation: (orientation: ExportExcelOrientation) => void
  onSetExcelSort: (sort: ExportExcelSort) => void
  onToggleExcelJudges: () => void
  onToggleExcelCategories: () => void
  onToggleExcelRank: () => void
  onSetExportMode: (mode: ExportMode) => void
  onSetTableView: (view: ExportTableView) => void
  onSetSelectedJudgeKey: (judgeKey: string) => void
  onSetPngExportMode: (mode: ExportPngMode) => void
  onSetPngScale: (value: number) => void
  onSetRowsPerImage: (value: number) => void
  onSetJsonExportMode: (mode: ExportJsonMode) => void
  onSetJsonJudgeKey: (judgeKey: string) => void
  onSetContestCategoryKey: (categoryKey: string) => void
  onSetNotesPdfMode: (mode: ExportNotesPdfMode) => void
  onToggleTimecodeThumbnails: () => void
}

const TYPE_META: Record<ExportTableType, { icon: ElementType; label: string }> = {
  png: { icon: FileImage, label: 'PNG' },
  pdf: { icon: FileText, label: 'PDF' },
  excel: { icon: FileSpreadsheet, label: 'Excel' },
  csv: { icon: Table, label: 'CSV' },
  html: { icon: Code2, label: 'HTML' },
  notes: { icon: FileText, label: 'Notes' },
  json: { icon: FileJson, label: 'JSON' },
}

const TYPE_ORDER: ExportTableType[] = ['png', 'pdf', 'excel', 'csv', 'html', 'notes', 'json']

export function ExportOptionsPanel({
  pngExportMode,
  pngScale,
  rowsPerImage,
  exporting,
  notesPdfMode,
  includeTimecodeThumbnails,
  jsonExportMode,
  jsonJudgeKey,
  jsonJudgeOptions,
  contestCategoryKey,
  contestCategoryOptions,
  selectedType,
  onSelectType,
  onExportSelected,
  includeComments,
  commentsSupported,
  onToggleComments,
  fileNameBase,
  fileNamePlaceholder,
  exportTheme,
  pngTransparent,
  excelLayout,
  excelOrientation,
  excelSort,
  excelShowJudges,
  excelShowCategories,
  excelShowRank,
  onSetFileNameBase,
  onSetExportTheme,
  onTogglePngTransparent,
  onSetExcelLayout,
  onSetExcelOrientation,
  onSetExcelSort,
  onToggleExcelJudges,
  onToggleExcelCategories,
  onToggleExcelRank,
  onSetPngExportMode,
  onSetPngScale,
  onSetRowsPerImage,
  onSetJsonExportMode,
  onSetJsonJudgeKey,
  onSetContestCategoryKey,
  onSetNotesPdfMode,
  onToggleTimecodeThumbnails,
}: ExportOptionsPanelProps) {
  const { t } = useI18n()

  const typeLabel = selectedType === 'notes' ? t('Notes') : TYPE_META[selectedType].label
  const isImageType = selectedType === 'png' || selectedType === 'pdf'
  const typeHint: Record<ExportTableType, string> = {
    png: t('Image du tableau affiché à droite.'),
    pdf: t('PDF du tableau affiché à droite.'),
    excel: t('Classeur multi-feuilles (synthèse + un onglet par juge).'),
    csv: t('Fichier CSV brut (séparateur point-virgule) du tableau.'),
    html: t('Page web autonome du tableau.'),
    notes: t('Document des commentaires juges et généraux.'),
    json: t('Données brutes du projet au format JSON.'),
  }

  return (
    <div className="flex flex-col gap-0">

      <div className="px-0.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {t('Type d’export')}
      </div>

      {/* ── Type selector — choose what to export ───────────────── */}
      <div className="grid grid-cols-3 gap-1">
        {TYPE_ORDER.map((type) => (
          <DlBtn
            key={type}
            icon={TYPE_META[type].icon}
            label={type === 'notes' ? t('Notes') : TYPE_META[type].label}
            active={selectedType === type}
            onClick={() => onSelectType(type)}
          />
        ))}
      </div>

      <p className="mt-1.5 px-0.5 text-[10.5px] leading-4 text-gray-500">{typeHint[selectedType]}</p>

      {/* ── Primary export action ───────────────────────────────── */}
      <button
        type="button"
        onClick={onExportSelected}
        disabled={exporting}
        className="mt-2 flex h-9 items-center justify-center gap-2 rounded-md bg-primary-600 text-[12px] font-semibold text-white transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        {t('Exporter en {type}', { type: typeLabel })}
      </button>

      {/* ── Contextual settings for the selected type ───────────── */}
      <div className="mt-3 border-t border-gray-700/30 pt-2">
        <div className="px-0.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          {t('Réglages')}
        </div>
        <div className="flex flex-col gap-1.5">

          <label className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500">{t('Nom du fichier')}</span>
            <input
              type="text"
              value={fileNameBase}
              onChange={(e) => onSetFileNameBase(e.target.value)}
              placeholder={fileNamePlaceholder}
              className="h-7 w-full rounded-sm border border-gray-700/50 bg-transparent px-2 text-[11px] text-white placeholder:text-gray-600 focus:border-primary-500 focus:outline-hidden"
            />
          </label>

          {commentsSupported && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-gray-500 shrink-0">{t('Commentaires')}</span>
              <button
                type="button"
                onClick={onToggleComments}
                aria-pressed={includeComments}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors border ${
                  includeComments
                    ? 'bg-primary-600/20 text-primary-300 border-primary-600/40'
                    : 'text-gray-500 border-gray-700/40 hover:text-gray-300'
                }`}
              >
                {includeComments ? t('Inclure') : t('Exclure')}
              </button>
            </div>
          )}

          {isImageType && (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-500 shrink-0">{t('Résolution')}</span>
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
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-500 shrink-0">{t('Fond')}</span>
                <InlineChip
                  value={exportTheme}
                  options={[
                    { label: t('Sombre'), value: 'dark' },
                    { label: t('Clair'), value: 'light' },
                  ]}
                  onChange={onSetExportTheme}
                />
              </div>
              {selectedType === 'png' && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-gray-500 shrink-0">{t('Fond transparent')}</span>
                  <button
                    type="button"
                    onClick={onTogglePngTransparent}
                    aria-pressed={pngTransparent}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors border ${
                      pngTransparent
                        ? 'bg-primary-600/20 text-primary-300 border-primary-600/40'
                        : 'text-gray-500 border-gray-700/40 hover:text-gray-300'
                    }`}
                  >
                    {pngTransparent ? t('Activé') : t('Désactivé')}
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-500 shrink-0">{t('Pages')}</span>
                <InlineChip
                  value={pngExportMode}
                  options={[
                    { label: t('Unique'), value: 'single' },
                    { label: t('Paginé'), value: 'paged' },
                  ]}
                  onChange={onSetPngExportMode}
                />
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
                    aria-label={t('Participants par page')}
                    className="w-14 rounded-sm border border-gray-700/50 bg-transparent px-1.5 py-0.5 text-center text-[10px] text-white focus:border-primary-500 focus:outline-hidden"
                  />
                </div>
              )}
            </>
          )}

          {selectedType === 'notes' && (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-500 shrink-0">{t('Contenu')}</span>
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
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-500 shrink-0">{t('Vignettes timecode')}</span>
                <button
                  type="button"
                  onClick={onToggleTimecodeThumbnails}
                  aria-pressed={includeTimecodeThumbnails}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors border ${
                    includeTimecodeThumbnails
                      ? 'bg-primary-600/20 text-primary-300 border-primary-600/40'
                      : 'text-gray-500 border-gray-700/40 hover:text-gray-300'
                  }`}
                >
                  {includeTimecodeThumbnails ? t('Activé') : t('Désactivé')}
                </button>
              </div>
            </>
          )}

          {selectedType === 'json' && (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-500 shrink-0">{t('Contenu JSON')}</span>
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
            </>
          )}

          {selectedType === 'excel' && (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-500 shrink-0">{t('Disposition')}</span>
                <AppSelect
                  value={excelLayout}
                  onChange={onSetExcelLayout}
                  ariaLabel={t('Disposition Excel')}
                  className="w-36"
                  options={[
                    { value: 'full', label: t('Complet (synthèse + juges)') },
                    { value: 'summary', label: t('Synthèse seule') },
                    { value: 'judges', label: t('Une feuille par juge') },
                    { value: 'ranking', label: t('Classement simple') },
                  ]}
                />
              </div>

              {excelLayout !== 'judges' && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-gray-500 shrink-0">{t('Tri')}</span>
                  <InlineChip
                    value={excelSort}
                    options={[
                      { label: t('Score'), value: 'score' },
                      { label: t('Ordre'), value: 'original' },
                      { label: t('A→Z'), value: 'alpha' },
                    ]}
                    onChange={onSetExcelSort}
                  />
                </div>
              )}

              {(excelLayout === 'full' || excelLayout === 'summary') && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-gray-500 shrink-0">{t('Orientation')}</span>
                    <InlineChip
                      value={excelOrientation}
                      options={[
                        { label: t('Lignes'), value: 'rows' },
                        { label: t('Colonnes'), value: 'columns' },
                      ]}
                      onChange={onSetExcelOrientation}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-gray-500 shrink-0">{t('Colonnes')}</span>
                    <div className="flex gap-1">
                      <ColumnToggle active={excelShowRank} label={t('Rang')} onClick={onToggleExcelRank} />
                      <ColumnToggle active={excelShowJudges} label={t('Juges')} onClick={onToggleExcelJudges} />
                      <ColumnToggle active={excelShowCategories} label={t('Catég.')} onClick={onToggleExcelCategories} />
                    </div>
                  </div>
                </>
              )}
            </>
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
    </div>
  )
}
