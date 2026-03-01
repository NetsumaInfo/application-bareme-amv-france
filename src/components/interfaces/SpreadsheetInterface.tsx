import { NoVideoState } from '@/components/interfaces/spreadsheet/NoVideoState'
import { SpreadsheetLoadedView } from '@/components/interfaces/spreadsheet/SpreadsheetLoadedView'
import { useSpreadsheetInterfaceController } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetInterfaceController'
import { useI18n } from '@/i18n'

export default function SpreadsheetInterface() {
  const { t } = useI18n()
  const {
    currentBareme,
    hasClips,
    noVideoStateProps,
    spreadsheetLoadedViewProps,
  } = useSpreadsheetInterfaceController()

  if (!currentBareme) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        {t('Aucun barème sélectionné')}
      </div>
    )
  }

  if (!hasClips) {
    return <NoVideoState {...noVideoStateProps} />
  }

  if (!spreadsheetLoadedViewProps) {
    return null
  }

  return <SpreadsheetLoadedView {...spreadsheetLoadedViewProps} />
}
