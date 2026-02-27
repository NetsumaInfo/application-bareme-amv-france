import { SlidersHorizontal } from 'lucide-react'
import type {
  ExportDensity,
  ExportJudge,
  ExportMode,
  ExportNotesPdfMode,
  ExportPngMode,
  ExportRankBadgeStyle,
  ExportTableView,
  ExportTheme,
} from '@/components/interfaces/export/types'
import { ExportAccentPresets } from '@/components/interfaces/export/ExportAccentPresets'
import { ExportActions } from '@/components/interfaces/export/ExportActions'
import { ExportBinaryButtons } from '@/components/interfaces/export/ExportBinaryButtons'
import { ExportCheckbox } from '@/components/interfaces/export/ExportCheckbox'

interface ExportOptionsPanelProps {
  title: string
  exportMode: ExportMode
  tableView: ExportTableView
  selectedJudgeKey: string
  decimals: number
  theme: ExportTheme
  density: ExportDensity
  pngExportMode: ExportPngMode
  pngScale: number
  rowsPerImage: number
  accent: string
  showTopBanner: boolean
  showJudgeColumns: boolean
  showRank: boolean
  tableClipColumnWidth: number
  tableScoreColumnWidth: number
  tableRowHeight: number
  tableNumberFontSize: number
  tablePrimaryFontSize: number
  tableSecondaryFontSize: number
  rankBadgeStyle: ExportRankBadgeStyle
  useCollabMepLabels: boolean
  judges: ExportJudge[]
  accentPresets: string[]
  exporting: boolean
  notesPdfMode: ExportNotesPdfMode
  onSetTitle: (value: string) => void
  onSetExportMode: (mode: ExportMode) => void
  onSetTableView: (view: ExportTableView) => void
  onSetSelectedJudgeKey: (judgeKey: string) => void
  onSetDecimals: (value: number) => void
  onSetTheme: (theme: ExportTheme) => void
  onSetDensity: (density: ExportDensity) => void
  onSetPngExportMode: (mode: ExportPngMode) => void
  onSetPngScale: (value: number) => void
  onSetRowsPerImage: (value: number) => void
  onSetAccent: (accent: string) => void
  onSetTableClipColumnWidth: (value: number) => void
  onSetTableScoreColumnWidth: (value: number) => void
  onSetTableRowHeight: (value: number) => void
  onSetTableNumberFontSize: (value: number) => void
  onSetTablePrimaryFontSize: (value: number) => void
  onSetTableSecondaryFontSize: (value: number) => void
  onSetRankBadgeStyle: (style: ExportRankBadgeStyle) => void
  onToggleShowTopBanner: () => void
  onToggleShowJudgeColumns: () => void
  onToggleShowRank: () => void
  onToggleUseCollabMepLabels: () => void
  onExportPng: () => void
  onExportPdf: () => void
  onExportNotesPdf: () => void
  onExportJson: () => void
  onSetNotesPdfMode: (mode: ExportNotesPdfMode) => void
}

export function ExportOptionsPanel({
  title,
  exportMode,
  tableView,
  selectedJudgeKey,
  decimals,
  theme,
  density,
  pngExportMode,
  pngScale,
  rowsPerImage,
  accent,
  showTopBanner,
  showJudgeColumns,
  showRank,
  tableClipColumnWidth,
  tableScoreColumnWidth,
  tableRowHeight,
  tableNumberFontSize,
  tablePrimaryFontSize,
  tableSecondaryFontSize,
  rankBadgeStyle,
  useCollabMepLabels,
  judges,
  accentPresets,
  exporting,
  notesPdfMode,
  onSetTitle,
  onSetExportMode,
  onSetTableView,
  onSetSelectedJudgeKey,
  onSetDecimals,
  onSetTheme,
  onSetDensity,
  onSetPngExportMode,
  onSetPngScale,
  onSetRowsPerImage,
  onSetAccent,
  onSetTableClipColumnWidth,
  onSetTableScoreColumnWidth,
  onSetTableRowHeight,
  onSetTableNumberFontSize,
  onSetTablePrimaryFontSize,
  onSetTableSecondaryFontSize,
  onSetRankBadgeStyle,
  onToggleShowTopBanner,
  onToggleShowJudgeColumns,
  onToggleShowRank,
  onToggleUseCollabMepLabels,
  onExportPng,
  onExportPdf,
  onExportNotesPdf,
  onExportJson,
  onSetNotesPdfMode,
}: ExportOptionsPanelProps) {
  return (
    <div className="w-full rounded-lg border border-gray-700 bg-surface p-3 overflow-y-auto">
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
            onChange={(event) => onSetTitle(event.target.value)}
            className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
            placeholder="Titre de la planche export"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Type de résultats</label>
          <ExportBinaryButtons
            value={exportMode}
            left={{ label: 'Groupés', value: 'grouped' }}
            right={{ label: 'Individuel', value: 'individual' }}
            onChange={onSetExportMode}
          />
        </div>

        {exportMode === 'individual' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Juge</label>
            <select
              value={selectedJudgeKey}
              onChange={(event) => onSetSelectedJudgeKey(event.target.value)}
              className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
            >
              {judges.map((judge) => (
                <option key={judge.key} value={judge.key}>
                  {judge.judgeName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs text-gray-400 mb-1">Arrondi des notes</label>
          <select
            value={decimals}
            onChange={(event) => onSetDecimals(Number(event.target.value))}
            className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
          >
            <option value={0}>0 décimale</option>
            <option value={1}>1 décimale</option>
            <option value={2}>2 décimales</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Thème</label>
          <ExportBinaryButtons
            value={theme}
            left={{ label: 'Sombre', value: 'dark' }}
            right={{ label: 'Clair', value: 'light' }}
            onChange={onSetTheme}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Densité</label>
          <ExportBinaryButtons
            value={density}
            left={{ label: 'Confort', value: 'comfortable' }}
            right={{ label: 'Compact', value: 'compact' }}
            onChange={onSetDensity}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Affichage tableau</label>
          <ExportBinaryButtons
            value={tableView}
            left={{ label: 'Synthèse', value: 'summary' }}
            right={{ label: 'Détaillé', value: 'detailed' }}
            onChange={onSetTableView}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Qualité PNG (échelle): x{pngScale}</label>
          <input
            type="range"
            min={2}
            max={5}
            step={1}
            value={pngScale}
            onChange={(event) => onSetPngScale(Number(event.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Accent</label>
          <ExportAccentPresets accent={accent} presets={accentPresets} onChange={onSetAccent} />
        </div>

        <div className="rounded border border-gray-700/80 bg-surface-dark/40 p-2.5 space-y-1.5">
          <div className="text-[11px] font-semibold text-gray-200">Habillage tableau</div>
          <ExportCheckbox
            checked={showTopBanner}
            onToggle={onToggleShowTopBanner}
            label="Afficher bandeau supérieur"
          />
        </div>

        <div className="rounded border border-gray-700/80 bg-surface-dark/40 p-2.5 space-y-2">
          <div className="text-[11px] font-semibold text-gray-200">Personnalisation avancée</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Colonne clip (px)</label>
              <input
                type="number"
                min={260}
                max={560}
                value={tableClipColumnWidth}
                onChange={(event) => onSetTableClipColumnWidth(Number(event.target.value))}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Colonne notes (px)</label>
              <input
                type="number"
                min={88}
                max={180}
                value={tableScoreColumnWidth}
                onChange={(event) => onSetTableScoreColumnWidth(Number(event.target.value))}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Hauteur ligne: {tableRowHeight}px</label>
            <input
              type="range"
              min={44}
              max={88}
              step={1}
              value={tableRowHeight}
              onChange={(event) => onSetTableRowHeight(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Taille chiffres: {tableNumberFontSize}px</label>
            <input
              type="range"
              min={11}
              max={20}
              step={1}
              value={tableNumberFontSize}
              onChange={(event) => onSetTableNumberFontSize(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Taille pseudo: {tablePrimaryFontSize}px</label>
              <input
                type="range"
                min={12}
                max={24}
                step={1}
                value={tablePrimaryFontSize}
                onChange={(event) => onSetTablePrimaryFontSize(Number(event.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Taille clip: {tableSecondaryFontSize}px</label>
              <input
                type="range"
                min={10}
                max={18}
                step={1}
                value={tableSecondaryFontSize}
                onChange={(event) => onSetTableSecondaryFontSize(Number(event.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Style rang</label>
            <select
              value={rankBadgeStyle}
              onChange={(event) => onSetRankBadgeStyle(event.target.value as ExportRankBadgeStyle)}
              className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="filled">Puce pleine</option>
              <option value="outline">Puce contour</option>
              <option value="plain">Texte simple</option>
            </select>
          </div>
        </div>

        {exportMode === 'grouped' && (
          <ExportCheckbox
            checked={showJudgeColumns}
            onToggle={onToggleShowJudgeColumns}
            label="Afficher les totaux par juge"
          />
        )}

        <ExportCheckbox checked={showRank} onToggle={onToggleShowRank} label="Afficher le rang" />

        <ExportCheckbox
          checked={useCollabMepLabels}
          onToggle={onToggleUseCollabMepLabels}
          label="Remplacer pseudos multiples par colab / mep"
        />
        <p className="text-[11px] text-gray-500 -mt-1">
          Désactivé: export avec tous les pseudos. Séparateurs reconnus: <code>,</code> et <code>&amp;</code>.
        </p>
      </div>

      <ExportActions
        exporting={exporting}
        pngExportMode={pngExportMode}
        rowsPerImage={rowsPerImage}
        notesPdfMode={notesPdfMode}
        onSetPngExportMode={onSetPngExportMode}
        onSetRowsPerImage={onSetRowsPerImage}
        onSetNotesPdfMode={onSetNotesPdfMode}
        onExportPng={onExportPng}
        onExportPdf={onExportPdf}
        onExportNotesPdf={onExportNotesPdf}
        onExportJson={onExportJson}
      />
    </div>
  )
}
