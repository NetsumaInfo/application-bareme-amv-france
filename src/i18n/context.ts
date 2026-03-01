import { createContext } from 'react'
import type { AppLanguage } from '@/i18n/config'
import type { TranslationParams } from '@/i18n/messages'

export type TranslateFn = (key: string, params?: TranslationParams) => string

export interface I18nContextValue {
  language: AppLanguage
  languageLabel: string
  languageNativeLabel: string
  t: TranslateFn
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)
