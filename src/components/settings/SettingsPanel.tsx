import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      onClick={onChange}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-primary-600' : 'bg-gray-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
  )
}

type Tab = 'general' | 'notation' | 'player'

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { currentProject, updateSettings, updateProject } = useProjectStore()
  const { currentBareme } = useNotationStore()
  const {
    hideFinalScore,
    toggleFinalScore,
    setShowBaremeEditor,
    zoomLevel,
    setZoomLevel,
    projectsFolderPath,
  } = useUIStore()
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [mpvAvailable, setMpvAvailable] = useState<boolean | null>(null)

  const settings = currentProject?.settings

  useEffect(() => {
    tauri.playerIsAvailable().then(setMpvAvailable).catch(() => setMpvAvailable(false))
  }, [])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'Général' },
    { id: 'notation', label: 'Notation' },
    { id: 'player', label: 'Lecteur' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-lg border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-white">Paramètres</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 min-h-[240px]">
          {activeTab === 'general' && (
            <>
              {/* Judge name */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">
                  Nom du juge
                </label>
                <input
                  value={currentProject?.judgeName ?? ''}
                  onChange={(e) => updateProject({ judgeName: e.target.value })}
                  placeholder="ex: Redrum"
                  className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
                />
              </div>

              {/* Project name */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">
                  Nom du projet
                </label>
                <input
                  value={currentProject?.name ?? ''}
                  onChange={(e) => updateProject({ name: e.target.value })}
                  placeholder="ex: Concours AMV 2026"
                  className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
                />
              </div>

              {/* Zoom */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Zoom de l'interface</span>
                  <span className="text-xs text-gray-500">{zoomLevel}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={200}
                  step={10}
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                  <span>50%</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
              </div>

              {/* Auto-save */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-300 block">
                    Sauvegarde automatique
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Sauvegarde le projet à intervalle régulier
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {settings?.autoSave && (
                    <select
                      value={settings.autoSaveInterval}
                      onChange={(e) =>
                        updateSettings({
                          autoSaveInterval: Number(e.target.value),
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
                  <Toggle
                    checked={settings?.autoSave ?? true}
                    onChange={() =>
                      updateSettings({ autoSave: !settings?.autoSave })
                    }
                  />
                </div>
              </div>

              {/* Projects folder */}
              {projectsFolderPath && (
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">
                    Dossier de projets
                  </label>
                  <p className="text-[11px] text-gray-500 truncate px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg" title={projectsFolderPath}>
                    {projectsFolderPath}
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'notation' && (
            <>
              {/* Current barème info */}
              <div className="p-3 rounded-lg bg-surface-dark border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-300">
                    Barème actif
                  </span>
                  <button
                    onClick={() => {
                      onClose()
                      setShowBaremeEditor(true)
                    }}
                    className="text-[10px] text-primary-400 hover:text-primary-300"
                  >
                    Modifier
                  </button>
                </div>
                <div className="text-sm text-white font-medium">
                  {currentBareme?.name ?? 'Aucun'}
                </div>
                {currentBareme && (
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {currentBareme.criteria.length} critères —{' '}
                    {currentBareme.totalPoints} points
                    {currentBareme.isOfficial && ' — Officiel'}
                  </div>
                )}
              </div>

              {/* Criteria with weights */}
              {currentBareme && (
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-2 block">
                    Critères et poids
                  </label>
                  <div className="space-y-1">
                    {currentBareme.criteria.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between px-3 py-1.5 rounded bg-surface-dark/50 text-xs"
                      >
                        <span className="text-gray-300">{c.name}</span>
                        <span className="text-gray-500">
                          0-{c.max ?? 10} × {c.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories summary */}
              {currentBareme && (
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-2 block">
                    Catégories
                  </label>
                  <div className="space-y-1">
                    {(() => {
                      const cats = new Map<
                        string,
                        { count: number; total: number }
                      >()
                      for (const c of currentBareme.criteria) {
                        const cat = c.category || 'Général'
                        const existing = cats.get(cat) || {
                          count: 0,
                          total: 0,
                        }
                        cats.set(cat, {
                          count: existing.count + 1,
                          total: existing.total + (c.max ?? 10) * c.weight,
                        })
                      }
                      return Array.from(cats.entries()).map(
                        ([name, { count, total }]) => (
                          <div
                            key={name}
                            className="flex items-center justify-between px-3 py-1.5 rounded bg-surface-dark/50 text-xs"
                          >
                            <span className="text-gray-300">{name}</span>
                            <span className="text-gray-500">
                              {count} critère{count > 1 ? 's' : ''} — /{total}
                            </span>
                          </div>
                        ),
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Hide score */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-300 block">
                    Masquer les scores
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Cache le score total pendant la notation
                  </span>
                </div>
                <Toggle checked={hideFinalScore} onChange={toggleFinalScore} />
              </div>
            </>
          )}

          {activeTab === 'player' && (
            <>
              {/* Volume */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Volume par défaut</span>
                  <span className="text-xs text-gray-500">
                    {settings?.defaultVolume ?? 80}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings?.defaultVolume ?? 80}
                  onChange={(e) =>
                    updateSettings({ defaultVolume: Number(e.target.value) })
                  }
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
              </div>

              {/* mpv status */}
              <div className="p-3 rounded-lg bg-surface-dark border border-gray-700">
                <span className="text-xs font-medium text-gray-400 block mb-1">
                  Lecteur vidéo
                </span>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      mpvAvailable ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-[11px] text-gray-300">
                    mpv/libmpv — {mpvAvailable ? 'Disponible' : 'Non disponible'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Le lecteur utilise mpv (libmpv) via chargement dynamique.
                  Supporte tous les codecs FFmpeg : MP4, MKV, AVI, MOV, WebM, FLV,
                  H.264, H.265/HEVC, VP9, AV1.
                </p>
              </div>

              {/* Keyboard shortcuts reference */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-2 block">
                  Raccourcis clavier
                </label>
                <div className="space-y-1 text-[11px]">
                  <ShortcutRow keys="Espace" action="Lecture / Pause" />
                  <ShortcutRow keys="← / →" action="Reculer / Avancer 5s" />
                  <ShortcutRow
                    keys="Shift + ← / →"
                    action="Reculer / Avancer 30s"
                  />
                  <ShortcutRow keys="N / P" action="Clip suivant / précédent" />
                  <ShortcutRow
                    keys="Ctrl + 1/2/3"
                    action="Changer d'interface"
                  />
                  <ShortcutRow keys="F11" action="Plein écran vidéo" />
                  <ShortcutRow keys="Escape" action="Quitter le plein écran" />
                  <ShortcutRow keys="Ctrl + S" action="Sauvegarder" />
                  <ShortcutRow keys="Ctrl + Alt + S" action="Sauvegarder sous..." />
                  <ShortcutRow keys="Ctrl + N" action="Nouveau projet" />
                  <ShortcutRow keys="Ctrl + O" action="Ouvrir un projet" />
                  <ShortcutRow keys="Ctrl + / -" action="Zoom + / -" />
                  <ShortcutRow keys="Ctrl + 0" action="Réinitialiser le zoom" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-lg bg-surface-light text-gray-300 hover:text-white transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

function ShortcutRow({ keys, action }: { keys: string; action: string }) {
  return (
    <div className="flex items-center justify-between px-2 py-1 rounded bg-surface-dark/50">
      <kbd className="px-1.5 py-0.5 bg-surface rounded text-gray-400 text-[10px] font-mono">
        {keys}
      </kbd>
      <span className="text-gray-500">{action}</span>
    </div>
  )
}
