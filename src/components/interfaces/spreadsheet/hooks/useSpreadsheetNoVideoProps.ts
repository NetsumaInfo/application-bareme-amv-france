import { useMemo } from 'react'
import type { ComponentProps } from 'react'
import type { NoVideoState } from '@/components/interfaces/spreadsheet/NoVideoState'
import type { ClipNamePattern } from '@/types/project'

interface UseSpreadsheetNoVideoPropsParams {
  isDragOver: boolean
  clipNamePattern: ClipNamePattern
  showNoVideoTableModal: boolean
  noVideoTableAccepted: boolean
  noVideoTableInput: string
  noVideoTableError: string | null
  handleImportFolder: () => void
  handleImportFiles: () => void
  setShowNoVideoTableModal: (value: boolean) => void
  setNoVideoTableError: (value: string | null) => void
  resetNoVideoTableModal: () => void
  setNoVideoTableAccepted: (value: boolean) => void
  setNoVideoTableInput: (value: string) => void
  handleCreateNoVideoTable: () => void
}

export function useSpreadsheetNoVideoProps({
  isDragOver,
  clipNamePattern,
  showNoVideoTableModal,
  noVideoTableAccepted,
  noVideoTableInput,
  noVideoTableError,
  handleImportFolder,
  handleImportFiles,
  setShowNoVideoTableModal,
  setNoVideoTableError,
  resetNoVideoTableModal,
  setNoVideoTableAccepted,
  setNoVideoTableInput,
  handleCreateNoVideoTable,
}: UseSpreadsheetNoVideoPropsParams): ComponentProps<typeof NoVideoState> {
  return useMemo(() => ({
    isDragOver,
    clipNamePattern,
    showNoVideoTableModal,
    noVideoTableAccepted,
    noVideoTableInput,
    noVideoTableError,
    onImportFolder: handleImportFolder,
    onImportFiles: handleImportFiles,
    onOpenNoVideoModal: () => {
      setShowNoVideoTableModal(true)
      setNoVideoTableError(null)
    },
    onCloseNoVideoModal: resetNoVideoTableModal,
    onNoVideoTableAcceptedChange: setNoVideoTableAccepted,
    onNoVideoTableInputChange: (nextValue: string) => {
      setNoVideoTableInput(nextValue)
      if (noVideoTableError) setNoVideoTableError(null)
    },
    onCreateNoVideoTable: handleCreateNoVideoTable,
  }), [
    handleCreateNoVideoTable,
    handleImportFiles,
    handleImportFolder,
    isDragOver,
    clipNamePattern,
    noVideoTableAccepted,
    noVideoTableError,
    noVideoTableInput,
    resetNoVideoTableModal,
    setNoVideoTableAccepted,
    setNoVideoTableError,
    setNoVideoTableInput,
    setShowNoVideoTableModal,
    showNoVideoTableModal,
  ])
}
