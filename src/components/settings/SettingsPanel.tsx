import { X } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { currentProject, updateSettings } = useProjectStore()
  const { hideFinalScore, toggleFinalScore } = useUIStore()

  const settings = currentProject?.settings

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Parametres</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Auto-save */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Sauvegarde automatique</div>
              <div className="text-xs text-gray-500">Sauvegarder periodiquement</div>
            </div>
            <button
              onClick={() => updateSettings({ autoSave: !settings?.autoSave })}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                settings?.autoSave ? 'bg-primary-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings?.autoSave ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Auto-save interval */}
          {settings?.autoSave && (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">Intervalle (secondes)</div>
              </div>
              <select
                value={settings.autoSaveInterval}
                onChange={(e) => updateSettings({ autoSaveInterval: Number(e.target.value) })}
                className="bg-surface-dark text-gray-300 text-sm rounded px-3 py-1 border border-gray-700 focus:border-primary-500 outline-none"
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={120}>120s</option>
              </select>
            </div>
          )}

          {/* Default volume */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Volume par defaut</div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={settings?.defaultVolume ?? 80}
                onChange={(e) => updateSettings({ defaultVolume: Number(e.target.value) })}
                className="w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <span className="text-xs text-gray-400 w-8 text-right">{settings?.defaultVolume ?? 80}%</span>
            </div>
          </div>

          {/* Default speed */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Vitesse par defaut</div>
            </div>
            <select
              value={settings?.defaultPlaybackSpeed ?? 1}
              onChange={(e) => updateSettings({ defaultPlaybackSpeed: Number(e.target.value) })}
              className="bg-surface-dark text-gray-300 text-sm rounded px-3 py-1 border border-gray-700 focus:border-primary-500 outline-none"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>

          {/* Hide final score */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Masquer le score final</div>
              <div className="text-xs text-gray-500">Cache le score pendant la notation</div>
            </div>
            <button
              onClick={toggleFinalScore}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                hideFinalScore ? 'bg-primary-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  hideFinalScore ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
