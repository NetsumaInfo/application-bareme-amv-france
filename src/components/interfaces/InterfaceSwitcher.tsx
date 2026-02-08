import { LayoutGrid, Table, Maximize2 } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import type { InterfaceMode } from '@/types/notation'

const INTERFACES: { mode: InterfaceMode; label: string; icon: typeof Table; shortcut: string }[] = [
  { mode: 'spreadsheet', label: 'Tableur', icon: Table, shortcut: '1' },
  { mode: 'modern', label: 'Moderne', icon: LayoutGrid, shortcut: '2' },
  { mode: 'notation', label: 'Notation', icon: Maximize2, shortcut: '3' },
]

export default function InterfaceSwitcher() {
  const { currentInterface, switchInterface } = useUIStore()

  return (
    <div className="flex items-center bg-surface-dark rounded-lg p-0.5 gap-0.5">
      {INTERFACES.map(({ mode, label, icon: Icon, shortcut }) => {
        const isActive = currentInterface === mode
        return (
          <button
            key={mode}
            onClick={() => switchInterface(mode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all ${
              isActive
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-surface-light'
            }`}
            title={`${label} (Ctrl+${shortcut})`}
          >
            <Icon size={13} />
            <span className="hidden lg:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
