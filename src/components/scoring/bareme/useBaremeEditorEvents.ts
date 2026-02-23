import { useEffect } from 'react'

type BaremeEditorMode = 'list' | 'edit'

interface UseBaremeEditorEventsParams {
  setShowBaremeEditor: (value: boolean) => void
  resetForm: () => void
  setMode: (mode: BaremeEditorMode) => void
}

export function useBaremeEditorEvents({
  setShowBaremeEditor,
  resetForm,
  setMode,
}: UseBaremeEditorEventsParams) {
  useEffect(() => {
    const openCreate = () => {
      setShowBaremeEditor(true)
      resetForm()
      setMode('edit')
    }

    const openList = () => {
      setShowBaremeEditor(true)
      setMode('list')
    }

    window.addEventListener('amv:bareme-open-create', openCreate)
    window.addEventListener('amv:bareme-open-list', openList)

    return () => {
      window.removeEventListener('amv:bareme-open-create', openCreate)
      window.removeEventListener('amv:bareme-open-list', openList)
    }
  }, [resetForm, setMode, setShowBaremeEditor])
}
