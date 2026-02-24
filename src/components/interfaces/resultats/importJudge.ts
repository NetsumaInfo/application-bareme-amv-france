import type { ImportedJudgeData, ImportedJudgeNote, ImportedJudgeCriterionScore } from '@/types/project'

interface ClipLookupRow {
  id: string
  fileName: string
  displayName: string
  author?: string
}

export function normalizeImportedJudge(
  raw: unknown,
  currentClips: ClipLookupRow[],
): ImportedJudgeData | null {
  const root = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null
  if (!root) return null

  const currentClipIds = new Set(currentClips.map((clip) => clip.id))
  const clipIdByFileName = new Map(currentClips.map((clip) => [clip.fileName.toLowerCase(), clip.id]))
  const clipIdByDisplayAuthor = new Map(
    currentClips.map((clip) => [`${(clip.author || '').toLowerCase()}|${clip.displayName.toLowerCase()}`, clip.id]),
  )

  const rootProject = root.project && typeof root.project === 'object'
    ? (root.project as Record<string, unknown>)
    : null

  const judgeName = (
    typeof rootProject?.judgeName === 'string'
      ? rootProject.judgeName
      : typeof rootProject?.judge_name === 'string'
        ? rootProject.judge_name
        : typeof root.judgeName === 'string'
          ? root.judgeName
          : ''
  ).trim()

  const notesRaw = root.notes && typeof root.notes === 'object'
    ? (root.notes as Record<string, unknown>)
    : null
  if (!notesRaw) return null

  const importedClipsRaw = Array.isArray(root.clips) ? root.clips : []
  const importedClipById = new Map<string, { fileName: string; displayName: string; author?: string }>()
  for (const importedClip of importedClipsRaw) {
    const clipRow = importedClip && typeof importedClip === 'object'
      ? (importedClip as Record<string, unknown>)
      : null
    if (!clipRow || typeof clipRow.id !== 'string') continue

    importedClipById.set(clipRow.id, {
      fileName: typeof clipRow.fileName === 'string' ? clipRow.fileName : '',
      displayName: typeof clipRow.displayName === 'string' ? clipRow.displayName : '',
      author: typeof clipRow.author === 'string' ? clipRow.author : undefined,
    })
  }

  const notes: Record<string, ImportedJudgeNote> = {}

  for (const [sourceClipId, noteValue] of Object.entries(notesRaw)) {
    let targetClipId: string | undefined
    if (currentClipIds.has(sourceClipId)) {
      targetClipId = sourceClipId
    } else {
      const importedClip = importedClipById.get(sourceClipId)
      if (importedClip) {
        const keyFile = importedClip.fileName.toLowerCase()
        const keyDisplayAuthor = `${(importedClip.author || '').toLowerCase()}|${importedClip.displayName.toLowerCase()}`
        targetClipId = clipIdByFileName.get(keyFile) || clipIdByDisplayAuthor.get(keyDisplayAuthor)
      }
    }
    if (!targetClipId) continue

    const noteRaw = noteValue && typeof noteValue === 'object'
      ? (noteValue as Record<string, unknown>)
      : null
    if (!noteRaw) continue

    const scoresRaw = noteRaw.scores && typeof noteRaw.scores === 'object'
      ? (noteRaw.scores as Record<string, unknown>)
      : null
    if (!scoresRaw) continue

    const scores: Record<string, ImportedJudgeCriterionScore> = {}
    for (const [criterionId, scoreValue] of Object.entries(scoresRaw)) {
      const scoreRaw = scoreValue && typeof scoreValue === 'object'
        ? (scoreValue as Record<string, unknown>)
        : null
      if (!scoreRaw) continue

      const value = scoreRaw.value
      const normalizedValue =
        typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean'
          ? value
          : 0

      scores[criterionId] = {
        value: normalizedValue,
        isValid: scoreRaw.isValid !== false,
      }
    }

    const maybeFinal = Number(noteRaw.finalScore)
    const textNotes =
      typeof noteRaw.textNotes === 'string'
        ? noteRaw.textNotes
        : typeof noteRaw.text_notes === 'string'
          ? noteRaw.text_notes
          : undefined
    const criterionNotesRaw = noteRaw.criterionNotes && typeof noteRaw.criterionNotes === 'object'
      ? (noteRaw.criterionNotes as Record<string, unknown>)
      : noteRaw.criterion_notes && typeof noteRaw.criterion_notes === 'object'
        ? (noteRaw.criterion_notes as Record<string, unknown>)
        : {}
    const criterionNotes = Object.fromEntries(
      Object.entries(criterionNotesRaw)
        .filter(([key, value]) => key.trim().length > 0 && typeof value === 'string')
        .map(([key, value]) => [key, value as string]),
    )
    const categoryNotesRaw = noteRaw.categoryNotes && typeof noteRaw.categoryNotes === 'object'
      ? (noteRaw.categoryNotes as Record<string, unknown>)
      : noteRaw.category_notes && typeof noteRaw.category_notes === 'object'
        ? (noteRaw.category_notes as Record<string, unknown>)
        : {}
    const categoryNotes = Object.fromEntries(
      Object.entries(categoryNotesRaw)
        .filter(([key, value]) => key.trim().length > 0 && typeof value === 'string')
        .map(([key, value]) => [key, value as string]),
    )

    notes[targetClipId] = Number.isFinite(maybeFinal)
      ? {
          scores,
          finalScore: maybeFinal,
          textNotes,
          criterionNotes,
          categoryNotes,
        }
      : {
          scores,
          textNotes,
          criterionNotes,
          categoryNotes,
        }
  }

  if (Object.keys(notes).length === 0) return null

  return {
    judgeName: judgeName || 'Juge importe',
    notes,
  }
}
