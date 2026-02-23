import { INTERFACE_OPTIONS } from '@/components/settings/settingsPanelConfig'
import { SettingsToggle } from '@/components/settings/SettingsToggle'
import type { Project, ProjectSettings } from '@/types/project'
import type { InterfaceMode } from '@/types/notation'

interface SettingsGeneralTabProps {
  currentProject: Project | null
  settings: ProjectSettings | undefined
  currentInterface: InterfaceMode
  zoomMode: 'fixed' | 'navigable'
  zoomLevel: number
  projectsFolderPath: string
  onUpdateProject: (updates: Partial<Project>) => void
  onUpdateSettings: (updates: Partial<ProjectSettings>) => void
  onSwitchInterface: (mode: InterfaceMode) => void
  onSetZoomMode: (mode: 'fixed' | 'navigable') => void
  onSetZoomLevel: (level: number) => void
}

export function SettingsGeneralTab({
  currentProject,
  settings,
  currentInterface,
  zoomMode,
  zoomLevel,
  projectsFolderPath,
  onUpdateProject,
  onUpdateSettings,
  onSwitchInterface,
  onSetZoomMode,
  onSetZoomLevel,
}: SettingsGeneralTabProps) {
  return (
    <>
      <div>
        <label className="text-xs font-medium text-gray-400 mb-1 block">Nom du juge</label>
        <input
          value={currentProject?.judgeName ?? ''}
          onChange={(event) => onUpdateProject({ judgeName: event.target.value })}
          placeholder="ex: Redrum"
          className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-400 mb-1 block">Nom du projet</label>
        <input
          value={currentProject?.name ?? ''}
          onChange={(event) => onUpdateProject({ name: event.target.value })}
          placeholder="ex: Concours AMV 2026"
          className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-400 mb-2 block">Interface de notation</label>
        <div className="grid grid-cols-3 gap-2">
          {INTERFACE_OPTIONS.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => onSwitchInterface(mode)}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all border ${currentInterface === mode
                  ? 'bg-primary-600/20 border-primary-500 text-primary-300'
                  : 'bg-surface-dark border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                }`}
            >
              <Icon size={14} />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-400 mb-2 block">Mode de zoom</label>
        <div className="flex gap-2">
          <button
            onClick={() => onSetZoomMode('fixed')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left ${zoomMode === 'fixed'
                ? 'bg-primary-600/20 border-primary-500 text-primary-300'
                : 'bg-surface-dark border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
              }`}
          >
            Zoom fixe
            <p className="text-[9px] text-gray-500 font-normal mt-0.5">Pas de défilement horizontal</p>
          </button>
          <button
            onClick={() => onSetZoomMode('navigable')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left ${zoomMode === 'navigable'
                ? 'bg-primary-600/20 border-primary-500 text-primary-300'
                : 'bg-surface-dark border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
              }`}
          >
            Zoom navigable
            <p className="text-[9px] text-gray-500 font-normal mt-0.5">Défilement libre</p>
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-400">Niveau de zoom</span>
          <span className="text-xs text-gray-500 font-mono">{zoomLevel}%</span>
        </div>
        <input
          type="range"
          min={50}
          max={200}
          step={5}
          value={zoomLevel}
          onChange={(event) => onSetZoomLevel(Number(event.target.value))}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
        />
        <div className="flex gap-1.5 mt-2">
          {[75, 100, 125, 150].map((preset) => (
            <button
              key={preset}
              onClick={() => onSetZoomLevel(preset)}
              className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${zoomLevel === preset
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-dark text-gray-400 hover:text-white border border-gray-700'
                }`}
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-300 block">Sauvegarde automatique</span>
          <span className="text-[10px] text-gray-500">Sauvegarde le projet à intervalle régulier</span>
        </div>
        <div className="flex items-center gap-2">
          {settings?.autoSave && (
            <select
              value={settings.autoSaveInterval}
              onChange={(event) =>
                onUpdateSettings({
                  autoSaveInterval: Number(event.target.value),
                })
              }
              className="bg-surface-dark text-gray-400 text-xs rounded px-2 py-1 border border-gray-700 focus:border-primary-500 outline-none"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1min</option>
              <option value={120}>2min</option>
            </select>
          )}
          <SettingsToggle
            checked={settings?.autoSave ?? true}
            onChange={() => onUpdateSettings({ autoSave: !settings?.autoSave })}
          />
        </div>
      </div>

      {projectsFolderPath && (
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1 block">Dossier de projets</label>
          <p
            className="text-[11px] text-gray-500 truncate px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg"
            title={projectsFolderPath}
          >
            {projectsFolderPath}
          </p>
        </div>
      )}
    </>
  )
}
