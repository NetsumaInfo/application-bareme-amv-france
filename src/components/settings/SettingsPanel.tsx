import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { normalizeShortcutFromEvent, type ShortcutAction } from '@/utils/shortcuts'
import { SettingsGeneralTab } from '@/components/settings/SettingsGeneralTab'
import { SettingsNotationTab } from '@/components/settings/SettingsNotationTab'
import { SettingsShortcutsTab } from '@/components/settings/SettingsShortcutsTab'
import { getSettingsTabs, type SettingsTab } from '@/components/settings/settingsPanelConfig'
import { useI18n } from '@/i18n'

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
    appTheme,
    setAppTheme,
    primaryColorPreset,
    setPrimaryColorPreset,
    projectsFolderPath,
    shortcutBindings,
    setShortcut,
    resetShortcuts,
  } = useUIStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [editingShortcut, setEditingShortcut] = useState<ShortcutAction | null>(null)
  const { t } = useI18n()

  const settings = currentProject?.settings
  const settingsTabs = getSettingsTabs(t)

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" data-context-scope="settings">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-3xl border border-gray-700 max-h-[88vh] flex flex-col mx-4" data-context-scope="settings">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 shrink-0">
          <h2 className="text-sm font-semibold text-white">{t('Paramètres')}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white"
            title={t('Fermer')}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-gray-700 shrink-0">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 px-4 py-2 text-xs font-medium leading-tight transition-colors ${activeTab === tab.id
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              <span className="whitespace-normal break-words">{tab.label}</span>
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
              appTheme={appTheme}
              primaryColorPreset={primaryColorPreset}
              projectsFolderPath={projectsFolderPath ?? ''}
              onUpdateProject={updateProject}
              onUpdateSettings={updateSettings}
              onSwitchInterface={switchInterface}
              onSetZoomMode={setZoomMode}
              onSetZoomLevel={setZoomLevel}
              onSetAppTheme={setAppTheme}
              onSetPrimaryColorPreset={setPrimaryColorPreset}
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
            {t('Fermer')}
          </button>
        </div>
      </div>
    </div>
  )
}
