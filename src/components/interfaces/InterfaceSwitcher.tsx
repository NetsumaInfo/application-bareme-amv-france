import type { LucideIcon } from 'lucide-react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useUIStore } from '@/store/useUIStore'
import type { AppTab } from '@/types/notation'
import { useI18n } from '@/i18n'
import { formatShortcutAnnotationForAction } from '@/utils/shortcuts'
import { UI_ICONS } from '@/components/ui/actionIcons'

export default function InterfaceSwitcher() {
  const { currentTab, switchTab, shortcutBindings } = useUIStore()
  const { t } = useI18n()
  const tabs: { tab: AppTab; label: string; icon: LucideIcon; action: 'tabNotation' | 'tabResultats' | 'tabExport' }[] = [
    { tab: 'notation', label: t('Notation'), icon: UI_ICONS.notation, action: 'tabNotation' },
    { tab: 'resultats', label: t('Résultat'), icon: UI_ICONS.results, action: 'tabResultats' },
    { tab: 'export', label: t('Export'), icon: UI_ICONS.export, action: 'tabExport' },
  ]

  return (
    <div className="flex items-center overflow-hidden rounded-md bg-surface-dark p-0">
      {tabs.map(({ tab, label, icon: Icon, action }) => {
        const isActive = currentTab === tab
        const annotation = formatShortcutAnnotationForAction(action, shortcutBindings, t, label)
        return (
          <HoverTextTooltip
            key={tab}
            text={annotation}
          >
            <button
              onClick={() => switchTab(tab)}
              aria-label={annotation}
              className={`flex h-[22px] items-center gap-0.5 px-1.5 text-[11px] leading-none transition-all first:rounded-l-[5px] last:rounded-r-[5px] ${
                isActive
                  ? 'bg-primary-600/80 text-white shadow-xs'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={11} />
              <span className="hidden lg:inline">{label}</span>
            </button>
          </HoverTextTooltip>
        )
      })}
    </div>
  )
}
