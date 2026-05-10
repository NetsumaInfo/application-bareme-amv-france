import { useCallback, useEffect } from 'react'
import * as tauri from '@/services/tauri'
import { importBaremesFromData } from '@/components/scoring/bareme/baremeJsonImport'
import type { Bareme } from '@/types/bareme'
import { useI18n } from '@/i18n'

interface UseBaremeJsonTransferParams {
  availableBaremes: Bareme[]
  addBareme: (bareme: Bareme) => Bareme
  onDropImportSuccess?: () => void
}

export function useBaremeJsonTransfer({
  availableBaremes,
  addBareme,
  onDropImportSuccess,
}: UseBaremeJsonTransferParams) {
  const { t } = useI18n()

  const importFromJsonData = useCallback((data: unknown, baremesSnapshot: Bareme[]) => (
    importBaremesFromData({
      data,
      availableBaremes: baremesSnapshot,
      addBareme,
    })
  ), [addBareme])

  const handleImportBaremeJson = useCallback(async () => {
    try {
      const filePath = await tauri.openJsonDialog()
      if (!filePath) return
      const data = await tauri.loadProjectFile(filePath)
      const importedBaremes = importFromJsonData(data, availableBaremes)
      if (importedBaremes.length === 0) {
        alert(t('Aucun barème valide trouvé dans ce fichier JSON.'))
        return
      }
      alert(t('{count} barème(s) importé(s).', { count: importedBaremes.length }))
    } catch (errorValue) {
      console.error('Import bareme JSON failed:', errorValue)
      alert(t("Erreur d'import JSON : {error}", { error: String(errorValue) }))
    }
  }, [availableBaremes, importFromJsonData, t])

  useEffect(() => {
    let unlistenDrop: (() => void) | null = null

    tauri.listenNativeFileDrop({
      onDrop: (paths) => {
        const jsonPaths = paths.filter((pathValue) => pathValue.toLowerCase().endsWith('.json'))
        if (jsonPaths.length === 0) {
          return
        }

        void (async () => {
          let importedCount = 0
          let workingBaremes = [...availableBaremes]

          for (const filePath of jsonPaths) {
            try {
              const data = await tauri.loadProjectFile(filePath)
              const importedBaremes = importFromJsonData(data, workingBaremes)
              importedCount += importedBaremes.length
              if (importedBaremes.length > 0) {
                const importedIds = new Set(importedBaremes.map((bareme) => bareme.id))
                workingBaremes = [
                  ...workingBaremes.filter((bareme) => !importedIds.has(bareme.id)),
                  ...importedBaremes,
                ]
              }
            } catch (errorValue) {
              console.error('Bareme JSON dropped import failed:', errorValue)
            }
          }

          if (importedCount > 0) {
            onDropImportSuccess?.()
            alert(t('{count} barème(s) importé(s).', { count: importedCount }))
          }
        })()
      },
    }).then((fn) => {
      unlistenDrop = fn
    })

    return () => {
      if (unlistenDrop) {
        unlistenDrop()
      }
    }
  }, [availableBaremes, importFromJsonData, onDropImportSuccess, t])

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
      alert(t("Erreur d'export JSON : {error}", { error: String(errorValue) }))
    }
  }, [t])

  return {
    handleImportBaremeJson,
    handleExportBaremeJson,
  }
}
