import { SlidersHorizontal } from 'lucide-react'
import type {
  ExportDensity,
  ExportJsonJudgeOption,
  ExportJsonMode,
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
import { AppRangeSlider } from '@/components/ui/AppRangeSlider'
import { AppSelect } from '@/components/ui/AppSelect'
import { useI18n } from '@/i18n'

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
  jsonExportMode: ExportJsonMode
  jsonJudgeKey: string
  jsonJudgeOptions: ExportJsonJudgeOption[]
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
  onSetJsonExportMode: (mode: ExportJsonMode) => void
  onSetJsonJudgeKey: (judgeKey: string) => void
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

export function ExportOptionsPanel(props: ExportOptionsPanelProps) {
  const { t } = useI18n()
  return renderExportOptionsPanel({ ...props, t })
}

function renderExportOptionsPanel({
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
  jsonExportMode,
  jsonJudgeKey,
  jsonJudgeOptions,
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
  onSetJsonExportMode,
  onSetJsonJudgeKey,
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
  t,
}: ExportOptionsPanelProps & { t: ReturnType<typeof useI18n>['t'] }) {
  return (
    <div className="w-full rounded-lg border border-gray-700 bg-surface p-3 overflow-y-auto">
      <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
        <SlidersHorizontal size={14} />
        {t("Options d'export")}
      </h3>
      <p className="text-[11px] text-gray-500 mb-3">
        {t('Mets en forme le rendu avant export.')}
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('Titre')}</label>
          <input
            value={title}
            onChange={(event) => onSetTitle(event.target.value)}
            className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
            placeholder={t("Titre de la planche d'export")}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('Type de résultats')}</label>
          <ExportBinaryButtons
            value={exportMode}
            left={{ label: t('Groupés'), value: 'grouped' }}
            right={{ label: t('Individuel'), value: 'individual' }}
            onChange={onSetExportMode}
          />
        </div>

        {exportMode === 'individual' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Juge')}</label>
            <AppSelect
              value={selectedJudgeKey}
              onChange={onSetSelectedJudgeKey}
              ariaLabel={t('Juge')}
              className="w-full"
              options={judges.map((judge) => ({
                value: judge.key,
                label: judge.judgeName,
              }))}
            />
          </div>
        )}

        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('Arrondi des notes')}</label>
          <AppSelect
            value={decimals}
            onChange={onSetDecimals}
            ariaLabel={t('Arrondi des notes')}
            className="w-full"
            options={[
              { value: 0, label: t('0 décimale') },
              { value: 1, label: t('1 décimale') },
              { value: 2, label: t('2 décimales') },
            ]}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('Thème')}</label>
          <ExportBinaryButtons
            value={theme}
            left={{ label: t('Sombre'), value: 'dark' }}
            right={{ label: t('Clair'), value: 'light' }}
            onChange={onSetTheme}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('Densité')}</label>
          <ExportBinaryButtons
            value={density}
            left={{ label: t('Confort'), value: 'comfortable' }}
            right={{ label: t('Compact'), value: 'compact' }}
            onChange={onSetDensity}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('Affichage tableau')}</label>
          <ExportBinaryButtons
            value={tableView}
            left={{ label: t('Synthèse'), value: 'summary' }}
            right={{ label: t('Détaillé'), value: 'detailed' }}
            onChange={onSetTableView}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('Qualité PNG (échelle)')}: x{pngScale}</label>
          <AppRangeSlider
            min={2}
            max={5}
            step={1}
            value={pngScale}
            onChange={onSetPngScale}
            ariaLabel={t('Qualité PNG (échelle)')}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">{t('Accent')}</label>
          <ExportAccentPresets accent={accent} presets={accentPresets} onChange={onSetAccent} />
        </div>

        <div className="rounded border border-gray-700/80 bg-surface-dark/40 p-2.5 space-y-1.5">
          <div className="text-[11px] font-semibold text-gray-200">{t('Habillage tableau')}</div>
          <ExportCheckbox
            checked={showTopBanner}
            onToggle={onToggleShowTopBanner}
            label={t('Afficher bandeau supérieur')}
          />
        </div>

        <div className="rounded border border-gray-700/80 bg-surface-dark/40 p-2.5 space-y-2">
          <div className="text-[11px] font-semibold text-gray-200">{t('Personnalisation avancée')}</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('Colonne clip (px)')}</label>
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
              <label className="block text-xs text-gray-400 mb-1">{t('Colonne notes (px)')}</label>
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
            <label className="block text-xs text-gray-400 mb-1">{t('Hauteur ligne')}: {tableRowHeight}px</label>
            <AppRangeSlider
              min={44}
              max={88}
              step={1}
              value={tableRowHeight}
              onChange={onSetTableRowHeight}
              ariaLabel={t('Hauteur ligne')}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Taille chiffres')}: {tableNumberFontSize}px</label>
            <AppRangeSlider
              min={11}
              max={20}
              step={1}
              value={tableNumberFontSize}
              onChange={onSetTableNumberFontSize}
              ariaLabel={t('Taille chiffres')}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('Taille pseudo')}: {tablePrimaryFontSize}px</label>
              <AppRangeSlider
                min={12}
                max={24}
                step={1}
                value={tablePrimaryFontSize}
                onChange={onSetTablePrimaryFontSize}
                ariaLabel={t('Taille pseudo')}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('Taille clip')}: {tableSecondaryFontSize}px</label>
              <AppRangeSlider
                min={10}
                max={18}
                step={1}
                value={tableSecondaryFontSize}
                onChange={onSetTableSecondaryFontSize}
                ariaLabel={t('Taille clip')}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('Style rang')}</label>
            <AppSelect
              value={rankBadgeStyle}
              onChange={onSetRankBadgeStyle}
              ariaLabel={t('Style rang')}
              className="w-full"
              options={[
                { value: 'filled', label: t('Puce pleine') },
                { value: 'outline', label: t('Puce contour') },
                { value: 'plain', label: t('Texte simple') },
              ]}
            />
          </div>
        </div>

        {exportMode === 'grouped' && (
          <ExportCheckbox
            checked={showJudgeColumns}
            onToggle={onToggleShowJudgeColumns}
            label={t('Afficher les totaux par juge')}
          />
        )}

        <ExportCheckbox checked={showRank} onToggle={onToggleShowRank} label={t('Afficher le rang')} />

        <ExportCheckbox
          checked={useCollabMepLabels}
          onToggle={onToggleUseCollabMepLabels}
          label={t('Remplacer les pseudos multiples par « Collab / MEP »')}
        />
        <p className="text-[11px] text-gray-500 -mt-1">
          {t('Désactivé: export avec tous les pseudos. Séparateurs reconnus:')} <code>,</code> {t('et')} <code>&amp;</code>.
        </p>
      </div>

      <ExportActions
        exporting={exporting}
        pngExportMode={pngExportMode}
        rowsPerImage={rowsPerImage}
        notesPdfMode={notesPdfMode}
        jsonExportMode={jsonExportMode}
        jsonJudgeKey={jsonJudgeKey}
        jsonJudgeOptions={jsonJudgeOptions}
        onSetPngExportMode={onSetPngExportMode}
        onSetRowsPerImage={onSetRowsPerImage}
        onSetNotesPdfMode={onSetNotesPdfMode}
        onSetJsonExportMode={onSetJsonExportMode}
        onSetJsonJudgeKey={onSetJsonJudgeKey}
        onExportPng={onExportPng}
        onExportPdf={onExportPdf}
        onExportNotesPdf={onExportNotesPdf}
        onExportJson={onExportJson}
      />
    </div>
  )
}
