import { Table, FileText } from 'lucide-react'
import type { InterfaceMode } from '@/types/notation'

export type SettingsTab = 'general' | 'notation' | 'raccourcis'

export const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: 'general', label: 'Général' },
  { id: 'notation', label: 'Notation' },
  { id: 'raccourcis', label: 'Raccourcis' },
]

export const INTERFACE_OPTIONS: {
  mode: InterfaceMode
  label: string
  icon: typeof Table
  iconSecondary?: typeof Table
}[] = [
  { mode: 'spreadsheet', label: 'Tableur', icon: Table },
  { mode: 'notation', label: 'Notes', icon: FileText },
  { mode: 'dual', label: 'Tableur + Notes', icon: Table, iconSecondary: FileText },
]
