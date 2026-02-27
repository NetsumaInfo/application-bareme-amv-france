import { FileText, Table } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import type { InterfaceMode } from '@/types/notation'

function hasSpreadsheetView(mode: InterfaceMode): boolean {
  return mode === 'spreadsheet' || mode === 'dual'
}

function hasNotationView(mode: InterfaceMode): boolean {
  return mode === 'notation' || mode === 'dual'
}

export function NotationModeSwitcher() {
  const { currentTab, currentInterface, switchInterface } = useUIStore()
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
    <div className="flex items-center bg-surface-dark rounded-lg p-0.5 gap-0.5 border border-gray-700/70">
      <button
        onClick={toggleSpreadsheet}
        className={`px-3 py-1 text-xs rounded-md transition-all ${
          spreadsheetActive
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-surface-light'
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          <Table size={13} />
          <span>Tableur</span>
        </span>
      </button>
      <button
        onClick={toggleNotation}
        className={`px-3 py-1 text-xs rounded-md transition-all ${
          notationActive
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-surface-light'
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          <FileText size={13} />
          <span>Notation</span>
        </span>
      </button>
    </div>
  )
}
