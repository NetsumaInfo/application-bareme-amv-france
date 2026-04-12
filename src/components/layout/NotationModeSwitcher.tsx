import { useUIStore } from '@/store/useUIStore'
import type { InterfaceMode } from '@/types/notation'
import { useI18n } from '@/i18n'
import { UI_ICONS } from '@/components/ui/actionIcons'

function hasSpreadsheetView(mode: InterfaceMode): boolean {
  return mode === 'spreadsheet' || mode === 'dual'
}

function hasNotationView(mode: InterfaceMode): boolean {
  return mode === 'notation' || mode === 'dual'
}

export function NotationModeSwitcher() {
  const SpreadsheetIcon = UI_ICONS.spreadsheet
  const NotesIcon = UI_ICONS.generalNote
  const { currentTab, currentInterface, switchInterface } = useUIStore()
  const { t } = useI18n()
  if (currentTab !== 'notation') return null

  const spreadsheetActive = hasSpreadsheetView(currentInterface)
  const notationActive = hasNotationView(currentInterface)

  const toggleSpreadsheet = () => {
    if (spreadsheetActive && !notationActive) return
    if (spreadsheetActive && notationActive) {
      switchInterface('notation')
      return
    }
    if (!spreadsheetActive && notationActive) {
      switchInterface('dual')
      return
    }
    switchInterface('spreadsheet')
  }

  const toggleNotation = () => {
    if (notationActive && !spreadsheetActive) return
    if (notationActive && spreadsheetActive) {
      switchInterface('spreadsheet')
      return
    }
    if (!notationActive && spreadsheetActive) {
      switchInterface('dual')
      return
    }
    switchInterface('notation')
  }

  return (
    <div className="flex items-center overflow-hidden rounded-md bg-surface-dark p-0">
      <button
        onClick={toggleSpreadsheet}
        className={`h-5 rounded-l-[5px] px-2 text-[11px] leading-none transition-all ${
          spreadsheetActive
            ? 'bg-primary-600/80 text-white shadow-sm'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <span className="inline-flex items-center gap-1">
          <SpreadsheetIcon size={11} />
          <span>{t('Tableur')}</span>
        </span>
      </button>
      <button
        onClick={toggleNotation}
        className={`h-5 rounded-r-[5px] px-2 text-[11px] leading-none transition-all ${
          notationActive
            ? 'bg-primary-600/80 text-white shadow-sm'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <span className="inline-flex items-center gap-1">
          <NotesIcon size={11} />
          <span>{t('Commentaires')}</span>
        </span>
      </button>
    </div>
  )
}
