import { useState, useEffect, useCallback } from 'react'
import { X, FolderOpen, SlidersHorizontal, Keyboard } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { normalizeShortcutFromEvent, type ShortcutAction } from '@/utils/shortcuts'
import { UI_ICONS } from '@/components/ui/actionIcons'
import { SettingsGeneralTab } from '@/components/settings/SettingsGeneralTab'
import { SettingsNotationTab } from '@/components/settings/SettingsNotationTab'
import { SettingsProjectTab } from '@/components/settings/SettingsProjectTab'
import { SettingsShortcutsTab } from '@/components/settings/SettingsShortcutsTab'
import { getSettingsTabs, type SettingsTab } from '@/components/settings/settingsPanelConfig'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import * as tauri from '@/services/tauri'
import { OFFICIAL_BAREME, type Bareme } from '@/types/bareme'

const TAB_ICONS: Record<SettingsTab, React.FC<{ size?: number; className?: string }>> = {
  project: FolderOpen,
  notation: UI_ICONS.notation,
  application: SlidersHorizontal,
  raccourcis: Keyboard,
}

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { currentProject, updateSettings, updateProject } = useProjectStore()
  const { currentBareme, loadCustomBaremes } = useNotationStore()
  const {
    hideFinalScore,
    toggleFinalScore,
    hideAverages,
    toggleAverages,
    hideTextNotes,
    toggleTextNotes,
    showAudioDb,
    toggleAudioDb,
    confirmClipDeletion,
    toggleConfirmClipDeletion,
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
    setProjectsFolderPathPreference,
    baremesFolderPath,
    setBaremesFolderPathPreference,
    shortcutBindings,
    setShortcut,
    resetShortcuts,
  } = useUIStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('project')
  const [editingShortcut, setEditingShortcut] = useState<ShortcutAction | null>(null)
  const { t } = useI18n()

  const settings = currentProject?.settings
  const settingsTabs = getSettingsTabs(t)

  const handleChangeProjectsFolder = useCallback(async () => {
    const folderPath = await tauri.openFolderDialog(projectsFolderPath ?? undefined)
    if (!folderPath) return
    await setProjectsFolderPathPreference(folderPath)
  }, [projectsFolderPath, setProjectsFolderPathPreference])

  const handleChangeBaremesFolder = useCallback(async () => {
    const folderPath = await tauri.openFolderDialog(baremesFolderPath ?? undefined)
    if (!folderPath) return

    const items = await setBaremesFolderPathPreference(folderPath)
      .then(() => tauri.saveBareme(OFFICIAL_BAREME, OFFICIAL_BAREME.id))
      .then(() => tauri.loadBaremes())
    if (Array.isArray(items)) {
      loadCustomBaremes(items as Bareme[])
    }
  }, [baremesFolderPath, loadCustomBaremes, setBaremesFolderPathPreference])

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
    if (!editingShortcut) return undefined
    window.addEventListener('keydown', handleShortcutCapture, true)
    return () => window.removeEventListener('keydown', handleShortcutCapture, true)
  }, [editingShortcut, handleShortcutCapture])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" data-context-scope="settings">
      <div
        className="bg-surface rounded-xl shadow-2xl w-full max-w-3xl h-[88vh] max-h-[88vh] overflow-hidden ring-1 ring-inset ring-primary-400/10 flex flex-col mx-4"
        data-context-scope="settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-primary-400/10 shrink-0">
          <h2 className="text-sm font-semibold text-white">{t('Paramètres')}</h2>
          <HoverTextTooltip text={t('Fermer')}>
            <button
              onClick={onClose}
              aria-label={t('Fermer')}
              className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </HoverTextTooltip>
        </div>

        {/* Body: top bar + content */}
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          {/* Tabs bar */}
          <nav
            className="grid grid-cols-4 gap-1 overflow-x-auto border-b border-primary-400/10 px-0 pt-0"
            role="tablist"
            aria-orientation="horizontal"
            aria-label={t('Paramètres')}
          >
            {settingsTabs.map((tab) => {
              const Icon = TAB_ICONS[tab.id]
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`settings-tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="settings-panel"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center justify-center gap-2 rounded-t-lg border border-transparent px-3 py-2 text-xs font-medium transition-all text-center ${
                    isActive
                      ? 'border-primary-400/15 bg-surface-light/60 text-white ring-1 ring-inset ring-primary-400/15'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-surface-light/50'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-primary-400' : 'text-gray-500'} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Tab content */}
          <div
            id="settings-panel"
            role="tabpanel"
            aria-labelledby={`settings-tab-${activeTab}`}
            className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden p-5 space-y-4"
          >
            {activeTab === 'project' && (
              <SettingsProjectTab
                currentProject={currentProject}
                settings={settings}
                onUpdateProject={updateProject}
                onUpdateSettings={updateSettings}
              />
            )}

            {activeTab === 'application' && (
              <SettingsGeneralTab
                currentInterface={currentInterface}
                zoomMode={zoomMode}
                zoomLevel={zoomLevel}
                appTheme={appTheme}
                primaryColorPreset={primaryColorPreset}
                showAudioDb={showAudioDb}
                confirmClipDeletion={confirmClipDeletion}
                projectsFolderPath={projectsFolderPath ?? ''}
                baremesFolderPath={baremesFolderPath ?? ''}
                onSwitchInterface={switchInterface}
                onSetZoomMode={setZoomMode}
                onSetZoomLevel={setZoomLevel}
                onSetAppTheme={setAppTheme}
                onSetPrimaryColorPreset={setPrimaryColorPreset}
                onToggleAudioDb={toggleAudioDb}
                onToggleConfirmClipDeletion={toggleConfirmClipDeletion}
                onChangeProjectsFolder={handleChangeProjectsFolder}
                onChangeBaremesFolder={handleChangeBaremesFolder}
              />
            )}

            {activeTab === 'notation' && (
              <SettingsNotationTab
                currentBareme={currentBareme}
                settings={settings}
                hideFinalScore={hideFinalScore}
                hideAverages={hideAverages}
                hideTextNotes={hideTextNotes}
                onOpenBaremeEditor={() => {
                  onClose()
                  setShowBaremeEditor(true)
                }}
                onToggleFinalScore={toggleFinalScore}
                onToggleAverages={toggleAverages}
                onToggleTextNotes={toggleTextNotes}
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
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-primary-400/10 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-lg bg-surface-light/70 text-gray-300 hover:bg-surface-light hover:text-white transition-colors"
          >
            {t('Fermer')}
          </button>
        </div>
      </div>
    </div>
  )
}
