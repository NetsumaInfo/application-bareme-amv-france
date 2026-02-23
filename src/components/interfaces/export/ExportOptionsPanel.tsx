import { SlidersHorizontal } from 'lucide-react'
import type { ExportDensity, ExportJudge, ExportMode, ExportTheme } from '@/components/interfaces/export/types'
import { ExportAccentPresets } from '@/components/interfaces/export/ExportAccentPresets'
import { ExportActions } from '@/components/interfaces/export/ExportActions'
import { ExportBinaryButtons } from '@/components/interfaces/export/ExportBinaryButtons'
import { ExportCheckbox } from '@/components/interfaces/export/ExportCheckbox'

interface ExportOptionsPanelProps {
  title: string
  exportMode: ExportMode
  selectedJudgeKey: string
  decimals: number
  theme: ExportTheme
  density: ExportDensity
  accent: string
  showJudgeColumns: boolean
  showRank: boolean
  showProjectMeta: boolean
  judges: ExportJudge[]
  accentPresets: string[]
  exporting: boolean
  onSetTitle: (value: string) => void
  onSetExportMode: (mode: ExportMode) => void
  onSetSelectedJudgeKey: (judgeKey: string) => void
  onSetDecimals: (value: number) => void
  onSetTheme: (theme: ExportTheme) => void
  onSetDensity: (density: ExportDensity) => void
  onSetAccent: (accent: string) => void
  onToggleShowJudgeColumns: () => void
  onToggleShowRank: () => void
  onToggleShowProjectMeta: () => void
  onExportPng: () => void
  onExportPdf: () => void
  onExportJson: () => void
}

export function ExportOptionsPanel({
  title,
  exportMode,
  selectedJudgeKey,
  decimals,
  theme,
  density,
  accent,
  showJudgeColumns,
  showRank,
  showProjectMeta,
  judges,
  accentPresets,
  exporting,
  onSetTitle,
  onSetExportMode,
  onSetSelectedJudgeKey,
  onSetDecimals,
  onSetTheme,
  onSetDensity,
  onSetAccent,
  onToggleShowJudgeColumns,
  onToggleShowRank,
  onToggleShowProjectMeta,
  onExportPng,
  onExportPdf,
  onExportJson,
}: ExportOptionsPanelProps) {
  return (
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
          <label className="block text-xs text-gray-400 mb-1">Accent</label>
          <ExportAccentPresets accent={accent} presets={accentPresets} onChange={onSetAccent} />
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
          checked={showProjectMeta}
          onToggle={onToggleShowProjectMeta}
          label="Afficher les métadonnées"
        />
      </div>

      <ExportActions
        exporting={exporting}
        onExportPng={onExportPng}
        onExportPdf={onExportPdf}
        onExportJson={onExportJson}
      />
    </div>
  )
}
