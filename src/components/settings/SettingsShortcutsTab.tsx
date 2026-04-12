import {
  CONTEXTUAL_SHORTCUT_DEFINITIONS,
  SHORTCUT_DEFINITIONS,
  formatShortcutDisplay,
  type ShortcutAction,
} from '@/utils/shortcuts'
import { useI18n } from '@/i18n'

interface SettingsShortcutsTabProps {
  editingShortcut: ShortcutAction | null
  shortcutBindings: Record<ShortcutAction, string>
  onSetEditingShortcut: (action: ShortcutAction | null) => void
  onResetShortcuts: () => void
}

export function SettingsShortcutsTab({
  editingShortcut,
  shortcutBindings,
  onSetEditingShortcut,
  onResetShortcuts,
}: SettingsShortcutsTabProps) {
  const { t } = useI18n()
  return (
    <>
      <div className="space-y-1">
        {SHORTCUT_DEFINITIONS.map((shortcut) => (
          <div
            key={shortcut.action}
            className="flex items-center justify-between px-2 py-1.5 rounded bg-surface-dark/50 text-[11px]"
          >
            <span className="text-gray-300">{t(shortcut.label)}</span>
            <div className="flex items-center gap-2">
              <kbd
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono min-w-[60px] text-center ${editingShortcut === shortcut.action
                    ? 'bg-primary-600 text-white border border-primary-400 animate-pulse'
                    : 'bg-surface text-gray-400 border border-gray-700'
                  }`}
              >
                {editingShortcut === shortcut.action
                  ? t('Appuyez...')
                  : formatShortcutDisplay(shortcutBindings[shortcut.action], t)}
              </kbd>
              <button
                onClick={() =>
                  onSetEditingShortcut(
                    editingShortcut === shortcut.action ? null : shortcut.action,
                  )
                }
                className="text-[9px] text-gray-500 hover:text-primary-400 transition-colors px-1"
              >
                {editingShortcut === shortcut.action ? t('Annuler') : t('Modifier')}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-gray-700/80 bg-surface-dark/40 p-2.5">
        <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1.5">
          {t('Raccourcis contextuels')}
        </div>
        <div className="space-y-1 text-[11px] text-gray-400">
          {CONTEXTUAL_SHORTCUT_DEFINITIONS.map((shortcut) => (
            <div key={shortcut.id} className="flex items-center justify-between gap-2">
              <span>{t(shortcut.label)}</span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface text-gray-400 border border-gray-700">
                {t(shortcut.shortcut)}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          onSetEditingShortcut(null)
          onResetShortcuts()
        }}
        className="w-full mt-3 px-4 py-2 text-xs rounded-lg bg-surface-dark border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
      >
        {t('Réinitialiser les raccourcis par défaut')}
      </button>
    </>
  )
}
