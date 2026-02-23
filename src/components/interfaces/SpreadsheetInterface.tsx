import { NoVideoState } from '@/components/interfaces/spreadsheet/NoVideoState'
import { SpreadsheetLoadedView } from '@/components/interfaces/spreadsheet/SpreadsheetLoadedView'
import { useSpreadsheetInterfaceController } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetInterfaceController'

export default function SpreadsheetInterface() {
  const {
    currentBareme,
    hasClips,
    noVideoStateProps,
    spreadsheetLoadedViewProps,
  } = useSpreadsheetInterfaceController()

  if (!currentBareme) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Aucun bareme selectionne
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
