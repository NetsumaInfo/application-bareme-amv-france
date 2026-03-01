import { Table, FileText } from 'lucide-react'
import type { InterfaceMode } from '@/types/notation'
import type { TranslateFn } from '@/i18n'

export type SettingsTab = 'general' | 'notation' | 'raccourcis'

export function getSettingsTabs(t: TranslateFn): { id: SettingsTab; label: string }[] {
  return [
    { id: 'general', label: t('Général') },
    { id: 'notation', label: t('Notation') },
    { id: 'raccourcis', label: t('Raccourcis') },
  ]
}

export function getInterfaceOptions(t: TranslateFn): {
  mode: InterfaceMode
  label: string
  icon: typeof Table
  iconSecondary?: typeof Table
}[] {
  return [
    { mode: 'spreadsheet', label: t('Tableur'), icon: Table },
    { mode: 'notation', label: t('Notes'), icon: FileText },
    { mode: 'dual', label: t('Tableur + Notes'), icon: Table, iconSecondary: FileText },
  ]
}
