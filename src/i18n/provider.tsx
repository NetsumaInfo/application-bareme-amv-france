import { useMemo, type ReactNode } from 'react'
import { useUIStore } from '@/store/useUIStore'
import {
  type AppLanguage,
  APP_LANGUAGE_INTL_LOCALES,
  APP_LANGUAGE_LABELS,
  APP_LANGUAGE_NATIVE_LABELS,
} from '@/i18n/config'
import { translateKey } from '@/i18n/messages'
import { I18nContext, type I18nContextValue } from '@/i18n/context'

const TIME_ONLY_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
}

const DATE_TIME_LIST_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

const DATE_FORMATTER_PRESETS: Record<AppLanguage, { timeOnly: Intl.DateTimeFormat; dateTimeList: Intl.DateTimeFormat }> = {
  fr: {
    timeOnly: new Intl.DateTimeFormat(APP_LANGUAGE_INTL_LOCALES.fr, TIME_ONLY_FORMAT_OPTIONS),
    dateTimeList: new Intl.DateTimeFormat(APP_LANGUAGE_INTL_LOCALES.fr, DATE_TIME_LIST_FORMAT_OPTIONS),
  },
  en: {
    timeOnly: new Intl.DateTimeFormat(APP_LANGUAGE_INTL_LOCALES.en, TIME_ONLY_FORMAT_OPTIONS),
    dateTimeList: new Intl.DateTimeFormat(APP_LANGUAGE_INTL_LOCALES.en, DATE_TIME_LIST_FORMAT_OPTIONS),
  },
  ja: {
    timeOnly: new Intl.DateTimeFormat(APP_LANGUAGE_INTL_LOCALES.ja, TIME_ONLY_FORMAT_OPTIONS),
    dateTimeList: new Intl.DateTimeFormat(APP_LANGUAGE_INTL_LOCALES.ja, DATE_TIME_LIST_FORMAT_OPTIONS),
  },
  ru: {
    timeOnly: new Intl.DateTimeFormat(APP_LANGUAGE_INTL_LOCALES.ru, TIME_ONLY_FORMAT_OPTIONS),
    dateTimeList: new Intl.DateTimeFormat(APP_LANGUAGE_INTL_LOCALES.ru, DATE_TIME_LIST_FORMAT_OPTIONS),
  },
  zh: {
    timeOnly: new Intl.DateTimeFormat(APP_LANGUAGE_INTL_LOCALES.zh, TIME_ONLY_FORMAT_OPTIONS),
    dateTimeList: new Intl.DateTimeFormat(APP_LANGUAGE_INTL_LOCALES.zh, DATE_TIME_LIST_FORMAT_OPTIONS),
  },
  es: {
    timeOnly: new Intl.DateTimeFormat(APP_LANGUAGE_INTL_LOCALES.es, TIME_ONLY_FORMAT_OPTIONS),
    dateTimeList: new Intl.DateTimeFormat(APP_LANGUAGE_INTL_LOCALES.es, DATE_TIME_LIST_FORMAT_OPTIONS),
  },
}

function matchesFormatOptions(
  options: Intl.DateTimeFormatOptions | undefined,
  reference: Intl.DateTimeFormatOptions,
) {
  if (!options) return false

  const optionKeys = Object.keys(options) as Array<keyof Intl.DateTimeFormatOptions>
  const referenceKeys = Object.keys(reference) as Array<keyof Intl.DateTimeFormatOptions>
  if (optionKeys.length !== referenceKeys.length) return false

  return referenceKeys.every((key) => options[key] === reference[key])
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const language = useUIStore((state) => state.language)

  const value = useMemo<I18nContextValue>(() => {
    const locale = APP_LANGUAGE_INTL_LOCALES[language]
    const presets = DATE_FORMATTER_PRESETS[language]

    return {
      language,
      languageLabel: APP_LANGUAGE_LABELS[language],
      languageNativeLabel: APP_LANGUAGE_NATIVE_LABELS[language],
      t: (key, params) => translateKey(language, key, params),
      formatDate: (value, options) => {
        const date = value instanceof Date ? value : new Date(value)
        if (Number.isNaN(date.getTime())) return ''
        if (matchesFormatOptions(options, TIME_ONLY_FORMAT_OPTIONS)) {
          return presets.timeOnly.format(date)
        }
        if (matchesFormatOptions(options, DATE_TIME_LIST_FORMAT_OPTIONS)) {
          return presets.dateTimeList.format(date)
        }
        return date.toLocaleString(locale, options)
      },
    }
  }, [language])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}
