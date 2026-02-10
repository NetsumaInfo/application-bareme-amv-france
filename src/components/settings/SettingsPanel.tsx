import { useState, useEffect, useCallback } from 'react'
import { X, Table, LayoutGrid, Maximize2 } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { sanitizeColor, withAlpha, CATEGORY_COLOR_PRESETS } from '@/utils/colors'
import type { InterfaceMode } from '@/types/notation'

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

type Tab = 'general' | 'notation' | 'raccourcis'

const DEFAULT_SHORTCUTS: { action: string; label: string; defaultKeys: string }[] = [
  { action: 'togglePause', label: 'Lecture / Pause', defaultKeys: 'Espace' },
  { action: 'seekBack', label: 'Reculer 5s', defaultKeys: '←' },
  { action: 'seekForward', label: 'Avancer 5s', defaultKeys: '→' },
  { action: 'seekBackLong', label: 'Reculer 30s', defaultKeys: 'Shift + ←' },
  { action: 'seekForwardLong', label: 'Avancer 30s', defaultKeys: 'Shift + →' },
  { action: 'nextClip', label: 'Clip suivant', defaultKeys: 'N' },
  { action: 'prevClip', label: 'Clip précédent', defaultKeys: 'P' },
  { action: 'tabNotation', label: 'Onglet Notation', defaultKeys: 'Ctrl + 1' },
  { action: 'tabResultats', label: 'Onglet Résultat', defaultKeys: 'Ctrl + 2' },
  { action: 'tabExport', label: 'Onglet Export', defaultKeys: 'Ctrl + 3' },
  { action: 'fullscreen', label: 'Plein écran vidéo', defaultKeys: 'F11' },
  { action: 'exitFullscreen', label: 'Quitter le plein écran', defaultKeys: 'Escape' },
  { action: 'save', label: 'Sauvegarder', defaultKeys: 'Ctrl + S' },
  { action: 'saveAs', label: 'Sauvegarder sous...', defaultKeys: 'Ctrl + Alt + S' },
  { action: 'newProject', label: 'Nouveau projet', defaultKeys: 'Ctrl + N' },
  { action: 'openProject', label: 'Ouvrir un projet', defaultKeys: 'Ctrl + O' },
  { action: 'zoomIn', label: 'Zoom +', defaultKeys: 'Ctrl + =' },
  { action: 'zoomOut', label: 'Zoom -', defaultKeys: 'Ctrl + -' },
  { action: 'resetZoom', label: 'Réinitialiser le zoom', defaultKeys: 'Ctrl + 0' },
]

const INTERFACE_OPTIONS: { mode: InterfaceMode; label: string; icon: typeof Table }[] = [
  { mode: 'spreadsheet', label: 'Tableur', icon: Table },
  { mode: 'modern', label: 'Moderne', icon: LayoutGrid },
  { mode: 'notation', label: 'Notation', icon: Maximize2 },
]

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { currentProject, updateSettings, updateProject } = useProjectStore()
  const { currentBareme } = useNotationStore()
  const {
    hideFinalScore,
    toggleFinalScore,
    hideAverages,
    toggleAverages,
    setShowBaremeEditor,
    currentInterface,
    switchInterface,
    zoomLevel,
    setZoomLevel,
    zoomMode,
    setZoomMode,
    projectsFolderPath,
  } = useUIStore()
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)

  const settings = currentProject?.settings

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'Général' },
    { id: 'notation', label: 'Notation' },
    { id: 'raccourcis', label: 'Raccourcis' },
  ]

  const handleShortcutCapture = useCallback(
    (e: KeyboardEvent) => {
      if (!editingShortcut) return
      e.preventDefault()
      e.stopPropagation()

      if (e.key === 'Escape') {
        setEditingShortcut(null)
        return
      }

      // Don't complete on modifier-only press
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return

      setEditingShortcut(null)
    },
    [editingShortcut],
  )

  useEffect(() => {
    if (editingShortcut) {
      window.addEventListener('keydown', handleShortcutCapture, true)
      return () => window.removeEventListener('keydown', handleShortcutCapture, true)
    }
  }, [editingShortcut, handleShortcutCapture])

  // Get categories with colors for notation tab
  const categories = currentBareme
    ? (() => {
        const cats = new Map<string, { count: number; total: number; color: string }>()
        const order: string[] = []
        for (const c of currentBareme.criteria) {
          const cat = c.category || 'Général'
          if (!cats.has(cat)) {
            const idx = order.length
            order.push(cat)
            cats.set(cat, {
              count: 0,
              total: 0,
              color: sanitizeColor(
                currentBareme.categoryColors?.[cat],
                CATEGORY_COLOR_PRESETS[idx % CATEGORY_COLOR_PRESETS.length],
              ),
            })
          }
          const existing = cats.get(cat)!
          cats.set(cat, {
            ...existing,
            count: existing.count + 1,
            total: existing.total + (c.max ?? 10),
          })
        }
        return Array.from(cats.entries()).map(([name, data]) => ({ name, ...data }))
      })()
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-xl border border-gray-700 max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 shrink-0">
          <h2 className="text-sm font-semibold text-white">Paramètres</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 shrink-0">
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
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
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

              {/* Interface mode selector */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-2 block">
                  Interface de notation
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {INTERFACE_OPTIONS.map(({ mode, label, icon: Icon }) => (
                    <button
                      key={mode}
                      onClick={() => switchInterface(mode)}
                      className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all border ${
                        currentInterface === mode
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

              {/* Zoom mode */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-2 block">
                  Mode de zoom
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setZoomMode('fixed')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left ${
                      zoomMode === 'fixed'
                        ? 'bg-primary-600/20 border-primary-500 text-primary-300'
                        : 'bg-surface-dark border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                    }`}
                  >
                    Zoom fixe
                    <p className="text-[9px] text-gray-500 font-normal mt-0.5">Pas de défilement horizontal</p>
                  </button>
                  <button
                    onClick={() => setZoomMode('navigable')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left ${
                      zoomMode === 'navigable'
                        ? 'bg-primary-600/20 border-primary-500 text-primary-300'
                        : 'bg-surface-dark border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                    }`}
                  >
                    Zoom navigable
                    <p className="text-[9px] text-gray-500 font-normal mt-0.5">Défilement libre</p>
                  </button>
                </div>
              </div>

              {/* Zoom slider */}
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
                  onChange={(e) => setZoomLevel(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex gap-1.5 mt-2">
                  {[75, 100, 125, 150].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setZoomLevel(preset)}
                      className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                        zoomLevel === preset
                          ? 'bg-primary-600 text-white'
                          : 'bg-surface-dark text-gray-400 hover:text-white border border-gray-700'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
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
                    Éditeur complet
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

              {/* Criteria list */}
              {currentBareme && (
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-2 block">
                    Critères
                  </label>
                  <div className="space-y-1">
                    {currentBareme.criteria.map((c) => {
                      const catColor = sanitizeColor(
                        currentBareme.categoryColors?.[c.category || ''],
                        CATEGORY_COLOR_PRESETS[0],
                      )
                      return (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs"
                          style={{ backgroundColor: withAlpha(catColor, 0.08) }}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: catColor }}
                          />
                          <span className="text-gray-300 flex-1 truncate">{c.name}</span>
                          <span className="text-gray-500 font-mono">/{c.max ?? 10}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Category summary */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(({ name, count, total, color }) => (
                    <span
                      key={name}
                      className="text-[10px] px-2 py-1 rounded border"
                      style={{
                        borderColor: withAlpha(color, 0.45),
                        backgroundColor: withAlpha(color, 0.15),
                        color,
                      }}
                    >
                      {name}: {count} crit. — /{total}
                    </span>
                  ))}
                </div>
              )}

              {/* Hide score & averages */}
              <div className="space-y-3 pt-2 border-t border-gray-700">
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
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-300 block">
                      Masquer les moyennes
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Cache la ligne de moyennes du tableur
                    </span>
                  </div>
                  <Toggle checked={hideAverages} onChange={toggleAverages} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'raccourcis' && (
            <>
              <div className="space-y-1">
                {DEFAULT_SHORTCUTS.map((shortcut) => (
                  <div
                    key={shortcut.action}
                    className="flex items-center justify-between px-2 py-1.5 rounded bg-surface-dark/50 text-[11px]"
                  >
                    <span className="text-gray-300">{shortcut.label}</span>
                    <div className="flex items-center gap-2">
                      <kbd
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono min-w-[60px] text-center ${
                          editingShortcut === shortcut.action
                            ? 'bg-primary-600 text-white border border-primary-400 animate-pulse'
                            : 'bg-surface text-gray-400 border border-gray-700'
                        }`}
                      >
                        {editingShortcut === shortcut.action
                          ? 'Appuyez...'
                          : shortcut.defaultKeys}
                      </kbd>
                      <button
                        onClick={() =>
                          setEditingShortcut(
                            editingShortcut === shortcut.action ? null : shortcut.action,
                          )
                        }
                        className="text-[9px] text-gray-500 hover:text-primary-400 transition-colors px-1"
                      >
                        {editingShortcut === shortcut.action ? 'Annuler' : 'Modifier'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setEditingShortcut(null)}
                className="w-full mt-3 px-4 py-2 text-xs rounded-lg bg-surface-dark border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
              >
                Réinitialiser les raccourcis par défaut
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-gray-700 shrink-0">
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
