import type { LucideIcon } from 'lucide-react'
import type { InterfaceMode } from '@/types/notation'
import type { TranslateFn } from '@/i18n'
import { UI_ICONS } from '@/components/ui/actionIcons'

export type SettingsTab = 'project' | 'notation' | 'application' | 'raccourcis'

export function getSettingsTabs(t: TranslateFn): { id: SettingsTab; label: string }[] {
  return [
    { id: 'project', label: t('Projet') },
    { id: 'notation', label: t('Notation') },
    { id: 'application', label: t('Application') },
    { id: 'raccourcis', label: t('Raccourcis') },
  ]
}

export function getInterfaceOptions(t: TranslateFn): {
  mode: InterfaceMode
  label: string
  icon: LucideIcon
  iconSecondary?: LucideIcon
}[] {
  return [
    { mode: 'spreadsheet', label: t('Tableur'), icon: UI_ICONS.spreadsheet },
    { mode: 'notation', label: t('Commentaires'), icon: UI_ICONS.generalNote },
    { mode: 'dual', label: t('Tableur + Commentaires'), icon: UI_ICONS.spreadsheet, iconSecondary: UI_ICONS.generalNote },
  ]
}
