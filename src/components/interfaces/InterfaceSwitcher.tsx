import { Table, BarChart2, FileOutput } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import type { AppTab } from '@/types/notation'
import { useI18n } from '@/i18n'

export default function InterfaceSwitcher() {
  const { currentTab, switchTab } = useUIStore()
  const { t } = useI18n()
  const tabs: { tab: AppTab; label: string; icon: typeof Table; shortcut: string }[] = [
    { tab: 'notation', label: t('Notation'), icon: Table, shortcut: '1' },
    { tab: 'resultats', label: t('Résultat'), icon: BarChart2, shortcut: '2' },
    { tab: 'export', label: t('Export'), icon: FileOutput, shortcut: '3' },
  ]

  return (
    <div className="flex items-center bg-surface-dark rounded-lg p-0.5 gap-0.5">
      {tabs.map(({ tab, label, icon: Icon, shortcut }) => {
        const isActive = currentTab === tab
        return (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
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
