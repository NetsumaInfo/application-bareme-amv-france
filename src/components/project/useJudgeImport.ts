import { useCallback, useRef, useState } from 'react'
import * as tauri from '@/services/tauri'
import { useProjectStore } from '@/store/useProjectStore'
import { normalizeImportedJudge } from '@/components/interfaces/resultats/importJudge'
import type { ImportedJudgeData } from '@/types/project'
import { useI18n } from '@/i18n'

function isJsonPath(path: string) {
  return path.trim().toLowerCase().endsWith('.json')
}

function getFileName(path: string) {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path
}

function getJudgeKey(judgeName: string) {
  return judgeName.trim().toLowerCase()
}

function mergeImportedJudges<T extends { judgeName: string }>(
  currentJudges: T[],
  incomingJudges: T[],
) {
  const uniqueIncoming: T[] = []
  const incomingIndexByName = new Map<string, number>()

  for (const judge of incomingJudges) {
    const key = getJudgeKey(judge.judgeName)
    const existingIndex = incomingIndexByName.get(key)
    if (existingIndex === undefined) {
      incomingIndexByName.set(key, uniqueIncoming.length)
      uniqueIncoming.push(judge)
      continue
    }
    uniqueIncoming[existingIndex] = judge
  }

  const incomingNames = new Set(uniqueIncoming.map((judge) => getJudgeKey(judge.judgeName)))
  return [
    ...currentJudges.filter((judge) => !incomingNames.has(getJudgeKey(judge.judgeName))),
    ...uniqueIncoming,
  ]
}

export function useJudgeImport() {
  const { t } = useI18n()
  const clips = useProjectStore((state) => state.clips)
  const importedJudges = useProjectStore((state) => state.importedJudges)
  const setImportedJudges = useProjectStore((state) => state.setImportedJudges)
  const [importing, setImporting] = useState(false)
  const importingRef = useRef(false)

  const importJudgePaths = useCallback(async (
    paths: string[],
    options: { alreadyImporting?: boolean } = {},
  ) => {
    if (clips.length === 0) return
    if (!options.alreadyImporting && importingRef.current) return

    if (!options.alreadyImporting) {
      importingRef.current = true
    }
    setImporting(true)

    try {
      const jsonPaths = paths.filter(isJsonPath)
      if (jsonPaths.length === 0) {
        alert(t('Aucun fichier JSON de juge trouvé.'))
        return
      }

      const normalizedJudges: ImportedJudgeData[] = []
      const ignoredFiles: string[] = []
      const partialImports: Array<{ judgeName: string; matchedCount: number }> = []
      const totalClips = clips.length

      for (const path of jsonPaths) {
        try {
          const payload = await tauri.loadProjectFile(path)
          const normalized = normalizeImportedJudge(payload, clips)

          if (!normalized) {
            ignoredFiles.push(getFileName(path))
            continue
          }

          normalizedJudges.push(normalized)

          const matchedCount = Object.keys(normalized.notes).length
          if (matchedCount < totalClips) {
            partialImports.push({ judgeName: normalized.judgeName, matchedCount })
          }
        } catch (error) {
          console.error('Import judge JSON failed:', error)
          ignoredFiles.push(getFileName(path))
        }
      }

      if (normalizedJudges.length === 0) {
        alert(t("Le fichier importé ne contient pas de notes exploitables pour ce projet."))
        return
      }

      setImportedJudges(mergeImportedJudges(importedJudges, normalizedJudges))

      if (
        jsonPaths.length === 1 &&
        normalizedJudges.length === 1 &&
        ignoredFiles.length === 0 &&
        partialImports.length === 1
      ) {
        const partialImport = partialImports[0]
        alert(t('Import réussi : {judgeName}\n{matchedCount}/{totalClips} clips appariés.', {
          judgeName: partialImport.judgeName,
          matchedCount: partialImport.matchedCount,
          totalClips,
        }))
        return
      }

      if (jsonPaths.length > 1 || ignoredFiles.length > 0 || partialImports.length > 0) {
        const messages = [
          t('Import terminé : {count} juge(s) importé(s).', { count: normalizedJudges.length }),
        ]
        if (partialImports.length > 0) {
          messages.push(
            partialImports
              .map((item) => `${item.judgeName}: ${item.matchedCount}/${totalClips}`)
              .join('\n'),
          )
        }
        if (ignoredFiles.length > 0) {
          messages.push(t('{count} fichier(s) ignoré(s).', { count: ignoredFiles.length }))
        }
        alert(messages.join('\n'))
      }
    } catch (error) {
      console.error('Import judge JSON failed:', error)
      alert(t("Erreur d'import: {error}", { error: String(error) }))
    } finally {
      importingRef.current = false
      setImporting(false)
    }
  }, [clips, importedJudges, setImportedJudges, t])

  const handleImportJudgeJson = useCallback(async () => {
    if (importingRef.current || clips.length === 0) return

    importingRef.current = true
    setImporting(true)

    try {
      const paths = await tauri.openJsonFilesDialog()
      if (!paths || paths.length === 0) return

      await importJudgePaths(paths, { alreadyImporting: true })
    } catch (error) {
      console.error('Import judge JSON failed:', error)
      alert(t("Erreur d'import: {error}", { error: String(error) }))
    } finally {
      if (importingRef.current) {
        importingRef.current = false
        setImporting(false)
      }
    }
  }, [clips.length, importJudgePaths, t])

  return {
    importing,
    canImportJudge: clips.length > 0,
    handleImportJudgeJson,
    importJudgePaths,
  }
}
