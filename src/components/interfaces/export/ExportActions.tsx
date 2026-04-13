import { Code2, FileImage, FileJson, FileSpreadsheet, FileText } from 'lucide-react'
import type {
  ExportJsonJudgeOption,
  ExportJsonMode,
  ExportNotesPdfMode,
  ExportPngMode,
} from '@/components/interfaces/export/types'
import { AppSelect } from '@/components/ui/AppSelect'
import { useI18n } from '@/i18n'

interface ExportActionsProps {
  exporting: boolean
  pngExportMode?: ExportPngMode
  rowsPerImage?: number
  notesPdfMode?: ExportNotesPdfMode
  jsonExportMode?: ExportJsonMode
  jsonJudgeKey?: string
  jsonJudgeOptions?: ExportJsonJudgeOption[]
  onSetPngExportMode?: (mode: ExportPngMode) => void
  onSetRowsPerImage?: (value: number) => void
  onSetNotesPdfMode?: (mode: ExportNotesPdfMode) => void
  onSetJsonExportMode?: (mode: ExportJsonMode) => void
  onSetJsonJudgeKey?: (judgeKey: string) => void
  onExportPng: () => void
  onExportPdf: () => void
  onExportNotesPdf?: () => void
  onExportJson: () => void
  onExportSpreadsheet?: () => void
  onExportHtml?: () => void
}

export function ExportActions({
  exporting,
  pngExportMode,
  rowsPerImage,
  notesPdfMode,
  jsonExportMode,
  jsonJudgeKey,
  jsonJudgeOptions,
  onSetPngExportMode,
  onSetRowsPerImage,
  onSetNotesPdfMode,
  onSetJsonExportMode,
  onSetJsonJudgeKey,
  onExportPng,
  onExportPdf,
  onExportNotesPdf,
  onExportJson,
  onExportSpreadsheet,
  onExportHtml,
}: ExportActionsProps) {
  const { t } = useI18n()
  return (
    <div className="mt-1.5 pt-1.5 border-t border-gray-700/50 flex flex-col gap-1">
      {pngExportMode && onSetPngExportMode && typeof rowsPerImage === 'number' && onSetRowsPerImage && (
        <div className="rounded border border-gray-700/70 bg-surface-dark/35 p-1 space-y-1">
          <div className="text-[10px] font-semibold text-gray-200">{t('Sortie PNG')}</div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">{t('Mode')}</label>
            <AppSelect
              value={pngExportMode}
              onChange={onSetPngExportMode}
              ariaLabel={t('Mode')}
              className="w-full"
              options={[
                { value: 'single', label: t('Image unique') },
                { value: 'paged', label: t('Plusieurs images') },
                { value: 'both', label: t('Les deux') },
              ]}
            />
          </div>
          {(pngExportMode === 'paged' || pngExportMode === 'both') && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('Participants par image')}</label>
              <input
                type="number"
                min={5}
                max={80}
                value={rowsPerImage}
                onChange={(event) => onSetRowsPerImage(Number(event.target.value))}
                className="w-full px-1 py-0.5 rounded border border-gray-700 bg-surface-dark text-[10px] text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      <button
        onClick={onExportPng}
        disabled={exporting}
        className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded bg-primary-600 hover:bg-primary-500 text-white text-[11px] font-medium disabled:opacity-60"
      >
        <FileImage size={14} />
        {t('Export PNG')}
      </button>
      <button
        onClick={onExportPdf}
        disabled={exporting}
        className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded bg-surface-light border border-gray-700 text-gray-300 hover:text-white text-[11px]"
      >
        <FileText size={14} />
        {t('Export PDF')}
      </button>
      {onExportSpreadsheet && (
        <button
          onClick={onExportSpreadsheet}
          disabled={exporting}
          className="flex items-center justify-center gap-1 px-2 py-1 rounded bg-surface-light border border-gray-700 text-gray-300 hover:text-white text-[11px] disabled:opacity-60"
        >
          <FileSpreadsheet size={14} />
          {t('Export Excel')}
        </button>
      )}
      {onExportHtml && (
        <button
          onClick={onExportHtml}
          disabled={exporting}
          className="flex items-center justify-center gap-1 px-2 py-1 rounded bg-surface-light border border-gray-700 text-gray-300 hover:text-white text-[11px] disabled:opacity-60"
        >
          <Code2 size={14} />
          {t('Export HTML/CSS')}
        </button>
      )}
      {notesPdfMode && onSetNotesPdfMode && onExportNotesPdf && (
        <div className="rounded border border-gray-700/70 bg-surface-dark/35 p-1 space-y-1">
          <div className="text-[10px] font-semibold text-gray-200">{t('Export notes (PDF)')}</div>
          <AppSelect
            value={notesPdfMode}
            onChange={onSetNotesPdfMode}
            ariaLabel={t('Export notes (PDF)')}
            className="w-full"
            options={[
              { value: 'general', label: t('Notes générales') },
              { value: 'judges', label: t('Notes des juges') },
              { value: 'both', label: t('Générales + juges') },
            ]}
          />
          <button
            onClick={onExportNotesPdf}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded bg-surface-light border border-gray-700 text-gray-300 hover:text-white text-[11px] disabled:opacity-60"
          >
            <FileText size={14} />
            {t('Export PDF notes')}
          </button>
        </div>
      )}
      {jsonExportMode && onSetJsonExportMode && (
        <div className="rounded border border-gray-700/70 bg-surface-dark/35 p-1 space-y-1">
          <div className="text-[10px] font-semibold text-gray-200">{t('Export JSON')}</div>
          <AppSelect
            value={jsonExportMode}
            onChange={onSetJsonExportMode}
            ariaLabel={t('Export JSON')}
            className="w-full"
            options={[
              { value: 'full_project', label: t('Tout le projet') },
              { value: 'single_judge', label: t('Par juge') },
              { value: 'notes_only', label: t('Notes uniquement') },
            ]}
          />
          {jsonExportMode === 'single_judge' && jsonJudgeKey && jsonJudgeOptions && onSetJsonJudgeKey && (
            <AppSelect
              value={jsonJudgeKey}
              onChange={onSetJsonJudgeKey}
              ariaLabel={t('Juge')}
              className="w-full"
              options={jsonJudgeOptions.map((judge) => ({
                value: judge.key,
                label: judge.judgeName,
              }))}
            />
          )}
        </div>
      )}
      <button
        onClick={onExportJson}
        className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded bg-surface-light border border-gray-700 text-gray-300 hover:text-white text-[11px]"
      >
        <FileJson size={14} />
        {t('Export JSON')}
      </button>
    </div>
  )
}
