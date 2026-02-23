import { useCallback } from 'react'
import { generateId } from '@/utils/formatters'
import * as tauri from '@/services/tauri'
import { normalizeImportedBaremes } from '@/components/scoring/baremeEditorUtils'
import type { Bareme } from '@/types/bareme'

interface UseBaremeJsonTransferParams {
  availableBaremes: Bareme[]
  addBareme: (bareme: Bareme) => void
}

export function useBaremeJsonTransfer({
  availableBaremes,
  addBareme,
}: UseBaremeJsonTransferParams) {
  const handleImportBaremeJson = useCallback(async () => {
    try {
      const filePath = await tauri.openJsonDialog()
      if (!filePath) return
      const data = await tauri.loadProjectFile(filePath)
      const imported = normalizeImportedBaremes(data)
      if (imported.length === 0) {
        alert('Aucun bareme valide trouve dans ce fichier JSON.')
        return
      }

      const existingIds = new Set(availableBaremes.map((bareme) => bareme.id))
      for (const bareme of imported) {
        const id = existingIds.has(bareme.id) ? `custom-${generateId()}` : bareme.id
        existingIds.add(id)
        addBareme({
          ...bareme,
          id,
          updatedAt: new Date().toISOString(),
          isOfficial: false,
        })
      }
      alert(`${imported.length} bareme(s) importe(s).`)
    } catch (errorValue) {
      console.error('Import bareme JSON failed:', errorValue)
      alert(`Erreur d'import JSON: ${errorValue}`)
    }
  }, [addBareme, availableBaremes])

  const handleExportBaremeJson = useCallback(async (bareme: Bareme) => {
    try {
      const filePath = await tauri.saveJsonDialog(
        `${bareme.name.replace(/[\\/:*?"<>|]+/g, '_')}.json`,
      )
      if (!filePath) return
      await tauri.exportJsonFile(
        {
          ...bareme,
          isOfficial: false,
        },
        filePath,
      )
    } catch (errorValue) {
      console.error('Export bareme JSON failed:', errorValue)
      alert(`Erreur d'export JSON: ${errorValue}`)
    }
  }, [])

  return {
    handleImportBaremeJson,
    handleExportBaremeJson,
  }
}
