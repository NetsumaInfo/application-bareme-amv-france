import { useMemo, useState } from 'react'
import { FileJson, FileSpreadsheet, FileText } from 'lucide-react'
import { useI18n } from '@/i18n'
import type { XlsxSheet } from '@/components/interfaces/export/xlsxWorkbook'

const JSON_PREVIEW_LIMIT = 16000
const SPREADSHEET_ROW_LIMIT = 60

/** Caption bar above each type-specific preview. */
function PreviewCaption({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-gray-700/40 bg-surface-dark/30 px-3 py-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600/15 text-primary-300">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[12px] font-semibold text-gray-100">{title}</div>
        <div className="truncate text-[10.5px] text-gray-500">{subtitle}</div>
      </div>
    </div>
  )
}

// ─── JSON ──────────────────────────────────────────────────────────────────

export function ExportJsonPreview({ payload }: { payload: unknown }) {
  const { t } = useI18n()
  const { text, truncated, fullLength } = useMemo(() => {
    let full = ''
    try {
      full = JSON.stringify(payload, null, 2)
    } catch {
      full = String(payload)
    }
    if (full.length > JSON_PREVIEW_LIMIT) {
      return { text: full.slice(0, JSON_PREVIEW_LIMIT), truncated: true, fullLength: full.length }
    }
    return { text: full, truncated: false, fullLength: full.length }
  }, [payload])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PreviewCaption
        icon={<FileJson size={14} />}
        title={t('Aperçu JSON')}
        subtitle={t('{count} caractères', { count: fullLength })}
      />
      <pre className="min-h-0 flex-1 overflow-auto bg-[#0d1117] px-3 py-2 font-mono text-[11px] leading-[1.5] text-slate-300 select-text">
        {text}
        {truncated ? `\n\n… ${t('aperçu tronqué, le fichier exporté est complet')}` : ''}
      </pre>
    </div>
  )
}

// ─── Spreadsheet (Excel) ────────────────────────────────────────────────────

export function ExportSpreadsheetPreview({ sheets }: { sheets: XlsxSheet[] }) {
  const { t } = useI18n()
  const [activeSheet, setActiveSheet] = useState(0)
  const safeIndex = Math.min(activeSheet, Math.max(sheets.length - 1, 0))
  const sheet = sheets[safeIndex]
  const visibleRows = sheet?.rows.slice(0, SPREADSHEET_ROW_LIMIT) ?? []
  const hiddenRows = (sheet?.rows.length ?? 0) - visibleRows.length

  if (!sheet) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PreviewCaption icon={<FileSpreadsheet size={14} />} title={t('Aperçu Excel')} subtitle={t('Aucune feuille')} />
        <div className="flex flex-1 items-center justify-center text-[12px] text-gray-500">
          {t('Aucune donnée à exporter.')}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PreviewCaption
        icon={<FileSpreadsheet size={14} />}
        title={t('Aperçu Excel')}
        subtitle={t('{count} feuilles', { count: sheets.length })}
      />

      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-gray-700/35 bg-surface-dark/20 px-2 py-1.5">
        {sheets.map((s, index) => (
          <button
            key={`${s.name}-${index}`}
            type="button"
            onClick={() => setActiveSheet(index)}
            className={`shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-medium transition-colors ${
              index === safeIndex
                ? 'bg-primary-600/20 text-primary-200'
                : 'text-gray-400 hover:bg-white/6 hover:text-gray-200'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto select-text">
        <table className="w-max border-collapse text-[11px]">
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]'}>
                {row.map((cell, colIndex) => {
                  const raw = typeof cell === 'object' && cell !== null ? cell.value : cell
                  const value = raw === '' || raw == null ? '' : String(raw)
                  const isHeader = colIndex === 0 || rowIndex < 2
                  return (
                    <td
                      key={colIndex}
                      className={`max-w-[220px] truncate border border-gray-800/60 px-2 py-1 ${
                        isHeader ? 'font-semibold text-gray-200' : 'text-gray-400'
                      }`}
                    >
                      {value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {hiddenRows > 0 ? (
          <div className="px-3 py-2 text-[10.5px] text-gray-500">
            {t('… +{count} lignes dans le fichier exporté', { count: hiddenRows })}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export interface ExportNotesPreviewEntry {
  primary: string
  secondary: string
  generalNote: string
  judges: Array<{
    judgeName: string
    generalNote: string
    categoryNotes: Array<{ category: string; text: string }>
    criterionNotes: Array<{ criterion: string; text: string }>
  }>
}

export function ExportNotesPreview({
  title,
  entries,
}: {
  title: string
  entries: ExportNotesPreviewEntry[]
}) {
  const { t } = useI18n()
  const withContent = entries.filter(
    (entry) => entry.generalNote.length > 0 || entry.judges.length > 0,
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PreviewCaption
        icon={<FileText size={14} />}
        title={t('Aperçu Notes')}
        subtitle={t('{count} clips commentés', { count: withContent.length })}
      />
      <div className="min-h-0 flex-1 overflow-auto px-3 py-3 select-text">
        <div className="mx-auto max-w-[760px] space-y-3">
          <div className="text-[14px] font-bold text-gray-100">{title}</div>
          {withContent.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-700/60 px-3 py-6 text-center text-[12px] text-gray-500">
              {t('Aucun commentaire à exporter.')}
            </div>
          ) : (
            withContent.map((entry) => (
              <article
                key={`${entry.primary}-${entry.secondary}`}
                className="space-y-1.5 rounded-md border border-gray-700/40 bg-surface-dark/25 px-3 py-2.5"
              >
                <header className="text-[12.5px] font-semibold text-gray-100">
                  {entry.primary}
                  {entry.secondary ? <span className="font-normal text-gray-400"> — {entry.secondary}</span> : null}
                </header>
                {entry.generalNote ? (
                  <p className="whitespace-pre-wrap text-[11.5px] leading-5 text-gray-300">{entry.generalNote}</p>
                ) : null}
                {entry.judges.map((judge, judgeIndex) => (
                  <div key={judgeIndex} className="border-t border-gray-700/30 pt-1.5">
                    <div className="text-[11px] font-semibold text-primary-300/90">{judge.judgeName}</div>
                    {judge.generalNote ? (
                      <p className="mt-0.5 whitespace-pre-wrap text-[11px] leading-5 text-gray-400">{judge.generalNote}</p>
                    ) : null}
                    {judge.categoryNotes.map((note, noteIndex) => (
                      <p key={`cat-${noteIndex}`} className="mt-0.5 text-[11px] leading-5 text-gray-400">
                        <span className="text-gray-500">{note.category} : </span>
                        {note.text}
                      </p>
                    ))}
                    {judge.criterionNotes.map((note, noteIndex) => (
                      <p key={`crit-${noteIndex}`} className="mt-0.5 text-[11px] leading-5 text-gray-400">
                        <span className="text-gray-500">{note.criterion} : </span>
                        {note.text}
                      </p>
                    ))}
                  </div>
                ))}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
