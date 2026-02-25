import { useCallback, useState } from 'react'
import * as tauri from '@/services/tauri'
import { normalizeImportedJudge } from '@/components/interfaces/resultats/importJudge'
import type { Clip, ImportedJudgeData } from '@/types/project'

interface UseResultatsJudgeImportOptions {
  clips: Clip[]
  importedJudges: ImportedJudgeData[]
  setImportedJudges: (judges: ImportedJudgeData[]) => void
}

export function useResultatsJudgeImport({
  clips,
  importedJudges,
  setImportedJudges,
}: UseResultatsJudgeImportOptions) {
  const [importing, setImporting] = useState(false)

  const handleImportJudgeJson = useCallback(async () => {
    if (importing || clips.length === 0) return
    setImporting(true)

    try {
      const path = await tauri.openJsonDialog()
      if (!path) return
      const payload = await tauri.loadProjectFile(path)
      const normalized = normalizeImportedJudge(payload, clips)

      if (!normalized) {
        alert('Le fichier importé ne contient pas de notes exploitables pour ce projet.')
        return
      }

      const matchedCount = Object.keys(normalized.notes).length
      const totalClips = clips.length

      const next = importedJudges.filter(
        (judge) => judge.judgeName.toLowerCase() !== normalized.judgeName.toLowerCase(),
      )
      next.push(normalized)
      setImportedJudges(next)

      if (matchedCount < totalClips) {
        alert(`Import réussi : ${normalized.judgeName}\n${matchedCount}/${totalClips} clips appariés.`)
      }
    } catch (error) {
      console.error('Import judge JSON failed:', error)
      alert(`Erreur d'import: ${error}`)
    } finally {
      setImporting(false)
    }
  }, [clips, importedJudges, importing, setImportedJudges])

  const removeImportedJudge = useCallback((index: number) => {
    setImportedJudges(importedJudges.filter((_, i) => i !== index))
  }, [importedJudges, setImportedJudges])

  const renameImportedJudge = useCallback((index: number, nextName: string) => {
    if (index < 0 || index >= importedJudges.length) return false

    const trimmedName = nextName.trim()
    if (!trimmedName) return false

    setImportedJudges(
      importedJudges.map((judge, judgeIndex) => (
        judgeIndex === index ? { ...judge, judgeName: trimmedName } : judge
      )),
    )
    return true
  }, [importedJudges, setImportedJudges])

  return {
    importing,
    handleImportJudgeJson,
    removeImportedJudge,
    renameImportedJudge,
  }
}
