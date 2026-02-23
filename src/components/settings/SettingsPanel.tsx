import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { normalizeShortcutFromEvent, type ShortcutAction } from '@/utils/shortcuts'
import { SettingsGeneralTab } from '@/components/settings/SettingsGeneralTab'
import { SettingsNotationTab } from '@/components/settings/SettingsNotationTab'
import { SettingsShortcutsTab } from '@/components/settings/SettingsShortcutsTab'
import { SETTINGS_TABS, type SettingsTab } from '@/components/settings/settingsPanelConfig'

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { currentProject, updateSettings, updateProject } = useProjectStore()
  const { currentBareme } = useNotationStore()
  const {
    hideFinalScore,
    toggleFinalScore,
    hideAverages,
    toggleAverages,
    hideTextNotes,
    toggleTextNotes,
    showAudioDb,
    toggleAudioDb,
    setShowBaremeEditor,
    currentInterface,
    switchInterface,
    zoomLevel,
    setZoomLevel,
    zoomMode,
    setZoomMode,
    projectsFolderPath,
    shortcutBindings,
    setShortcut,
    resetShortcuts,
  } = useUIStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [editingShortcut, setEditingShortcut] = useState<ShortcutAction | null>(null)

  const settings = currentProject?.settings

  const handleShortcutCapture = useCallback(
    (event: KeyboardEvent) => {
      if (!editingShortcut) return
      event.preventDefault()
      event.stopPropagation()

      if (event.key === 'Escape') {
        setEditingShortcut(null)
        return
      }

      const shortcut = normalizeShortcutFromEvent(event)
      if (!shortcut) return
      setShortcut(editingShortcut, shortcut)
      setEditingShortcut(null)
    },
    [editingShortcut, setShortcut],
  )

  useEffect(() => {
    if (editingShortcut) {
      window.addEventListener('keydown', handleShortcutCapture, true)
      return () => window.removeEventListener('keydown', handleShortcutCapture, true)
    }
  }, [editingShortcut, handleShortcutCapture])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-xl border border-gray-700 max-h-[85vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 shrink-0">
          <h2 className="text-sm font-semibold text-white">Paramètres</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-gray-700 shrink-0">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${activeTab === tab.id
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'general' && (
            <SettingsGeneralTab
              currentProject={currentProject}
              settings={settings}
              currentInterface={currentInterface}
              zoomMode={zoomMode}
              zoomLevel={zoomLevel}
              projectsFolderPath={projectsFolderPath ?? ''}
              onUpdateProject={updateProject}
              onUpdateSettings={updateSettings}
              onSwitchInterface={switchInterface}
              onSetZoomMode={setZoomMode}
              onSetZoomLevel={setZoomLevel}
            />
          )}

          {activeTab === 'notation' && (
            <SettingsNotationTab
              currentBareme={currentBareme}
              settings={settings}
              hideFinalScore={hideFinalScore}
              hideAverages={hideAverages}
              hideTextNotes={hideTextNotes}
              showAudioDb={showAudioDb}
              onOpenBaremeEditor={() => {
                onClose()
                setShowBaremeEditor(true)
              }}
              onToggleFinalScore={toggleFinalScore}
              onToggleAverages={toggleAverages}
              onToggleTextNotes={toggleTextNotes}
              onToggleAudioDb={toggleAudioDb}
              onUpdateSettings={updateSettings}
            />
          )}

          {activeTab === 'raccourcis' && (
            <SettingsShortcutsTab
              editingShortcut={editingShortcut}
              shortcutBindings={shortcutBindings}
              onSetEditingShortcut={setEditingShortcut}
              onResetShortcuts={resetShortcuts}
            />
          )}
        </div>

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
