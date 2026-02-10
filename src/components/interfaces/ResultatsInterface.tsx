import { useMemo, useState } from 'react'
import { Upload, X, Users, ArrowUpDown } from 'lucide-react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import * as tauri from '@/services/tauri'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { withAlpha } from '@/utils/colors'
import {
  buildCategoryGroups,
  buildJudgeSources,
  getCategoryScore,
  getNoteTotal,
  getCriterionNumericScore,
  type NoteLike,
} from '@/utils/results'
import type { ImportedJudgeData, ImportedJudgeNote, ImportedJudgeCriterionScore } from '@/types/project'
import type { Criterion } from '@/types/bareme'

type SortMode = 'folder' | 'alpha'

function normalizeImportedJudge(
  raw: unknown,
  currentClips: { id: string; fileName: string; displayName: string; author?: string }[],
): ImportedJudgeData | null {
  const root = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null
  if (!root) return null

  const currentClipIds = new Set(currentClips.map((clip) => clip.id))
  const clipIdByFileName = new Map(
    currentClips.map((clip) => [clip.fileName.toLowerCase(), clip.id]),
  )
  const clipIdByDisplayAuthor = new Map(
    currentClips.map((clip) => [
      `${(clip.author || '').toLowerCase()}|${clip.displayName.toLowerCase()}`,
      clip.id,
    ]),
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
  const importedClipById = new Map<
  string,
  { fileName: string; displayName: string; author?: string }
  >()
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
    notes[targetClipId] = Number.isFinite(maybeFinal)
      ? { scores, finalScore: maybeFinal }
      : { scores }
  }

  if (Object.keys(notes).length === 0) return null

  return {
    judgeName: judgeName || 'Juge importe',
    notes,
  }
}

function getGroupStep(criteria: Criterion[]): number {
  const steps = criteria
    .map((criterion) => Number(criterion.step))
    .filter((value) => Number.isFinite(value) && value > 0)
  if (steps.length === 0) return 0.5
  return Math.min(...steps)
}

function roundToStep(value: number, step: number): number {
  if (!Number.isFinite(step) || step <= 0) return value
  return Math.round(value / step) * step
}

function distributeCategoryScore(
  criteria: Criterion[],
  note: NoteLike | undefined,
  targetRaw: number,
): Record<string, number> {
  const totalMax = criteria.reduce((sum, criterion) => sum + Number(criterion.max ?? 10), 0)
  if (totalMax <= 0) {
    return criteria.reduce<Record<string, number>>((acc, criterion) => {
      acc[criterion.id] = 0
      return acc
    }, {})
  }
  const target = Math.max(0, Math.min(totalMax, Number.isFinite(targetRaw) ? targetRaw : 0))
  const step = getGroupStep(criteria)

  const currentValues = criteria.map((criterion) => getCriterionNumericScore(note, criterion))
  const currentTotal = currentValues.reduce((sum, value) => sum + value, 0)

  const values = criteria.map((criterion, index) => {
    const max = Number(criterion.max ?? 10)
    if (max <= 0) return 0

    if (currentTotal > 0) {
      return Math.min(max, (currentValues[index] / currentTotal) * target)
    }

    return Math.min(max, (max / totalMax) * target)
  })

  const rounded = values.map((value, index) => {
    const max = Number(criteria[index].max ?? 10)
    return Math.max(0, Math.min(max, roundToStep(value, step)))
  })

  let delta = target - rounded.reduce((sum, value) => sum + value, 0)
  const minStep = step > 0 ? step : 0.5
  let guard = 0
  while (Math.abs(delta) >= minStep / 2 && guard < 1200) {
    let adjusted = false
    const direction = delta > 0 ? 1 : -1

    for (let i = 0; i < criteria.length; i += 1) {
      const max = Number(criteria[i].max ?? 10)
      const nextValue = rounded[i] + direction * minStep
      if (nextValue < 0 || nextValue > max) continue
      rounded[i] = roundToStep(nextValue, minStep)
      delta -= direction * minStep
      adjusted = true
      if (Math.abs(delta) < minStep / 2) break
    }

    if (!adjusted) break
    guard += 1
  }

  return criteria.reduce<Record<string, number>>((acc, criterion, index) => {
    acc[criterion.id] = Math.round(rounded[index] * 1000) / 1000
    return acc
  }, {})
}

function computeNoteTotalForBareme(
  baremeCriteria: Criterion[],
  note: ImportedJudgeNote | undefined,
): number {
  const total = baremeCriteria.reduce((sum, criterion) => {
    const score = note?.scores[criterion.id]
    if (!score || score.isValid === false) return sum
    const value = Number(score.value)
    if (!Number.isFinite(value)) return sum
    return sum + Math.max(0, Math.min(Number(criterion.max ?? 10), value))
  }, 0)
  return Math.round(total * 100) / 100
}

export default function ResultatsInterface() {
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const notes = useNotationStore((state) => state.notes)
  const updateCriterion = useNotationStore((state) => state.updateCriterion)
  const isClipComplete = useNotationStore((state) => state.isClipComplete)

  const {
    currentProject,
    clips,
    importedJudges,
    setImportedJudges,
    markDirty,
    markClipScored,
  } = useProjectStore()

  const [importing, setImporting] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('folder')
  const [draftCells, setDraftCells] = useState<Record<string, string>>({})

  const categoryGroups = useMemo(
    () => (currentBareme ? buildCategoryGroups(currentBareme) : []),
    [currentBareme],
  )

  const judges = useMemo(
    () => buildJudgeSources(currentProject?.judgeName, notes, importedJudges),
    [currentProject?.judgeName, notes, importedJudges],
  )

  const currentJudge = judges.find((judge) => judge.isCurrentJudge)
  const collator = useMemo(
    () => new Intl.Collator('fr', { sensitivity: 'base', numeric: true, ignorePunctuation: true }),
    [],
  )

  const sortedClips = useMemo(() => {
    const base = [...clips]
    const originalIndex = new Map(clips.map((clip, index) => [clip.id, index]))

    if (sortMode === 'alpha') {
      base.sort((a, b) => {
        const labelA = getClipPrimaryLabel(a)
        const labelB = getClipPrimaryLabel(b)
        const cmp = collator.compare(labelA, labelB)
        if (cmp !== 0) return cmp
        return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
      })
      return base
    }

    base.sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : (originalIndex.get(a.id) ?? 0)
      const orderB = Number.isFinite(b.order) ? b.order : (originalIndex.get(b.id) ?? 0)
      if (orderA !== orderB) return orderA - orderB
      return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
    })
    return base
  }, [clips, collator, sortMode])

  const rows = useMemo(() => {
    if (!currentBareme) return []

    return sortedClips.map((clip) => {
      const categoryJudgeScores: Record<string, number[]> = {}

      for (const group of categoryGroups) {
        categoryJudgeScores[group.category] = judges.map((judge) =>
          getCategoryScore(judge.notes[clip.id] as NoteLike | undefined, group.criteria),
        )
      }

      const judgeTotals = judges.map((judge) =>
        getNoteTotal(judge.notes[clip.id] as NoteLike | undefined, currentBareme),
      )
      const averageTotal = judgeTotals.length > 0
        ? Math.round((judgeTotals.reduce((sum, value) => sum + value, 0) / judgeTotals.length) * 100) / 100
        : 0

      return {
        clip,
        categoryJudgeScores,
        judgeTotals,
        averageTotal,
      }
    })
  }, [categoryGroups, currentBareme, judges, sortedClips])

  const handleImportJudgeJson = async () => {
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

      const next = importedJudges.filter(
        (judge) => judge.judgeName.toLowerCase() !== normalized.judgeName.toLowerCase(),
      )
      next.push(normalized)
      setImportedJudges(next)
    } catch (e) {
      console.error('Import judge JSON failed:', e)
      alert(`Erreur d'import: ${e}`)
    } finally {
      setImporting(false)
    }
  }

  const removeImportedJudge = (index: number) => {
    setImportedJudges(importedJudges.filter((_, i) => i !== index))
  }

  const getCellKey = (clipId: string, category: string, judgeKey: string) =>
    `${clipId}|${category}|${judgeKey}`

  const applyCategoryValue = (
    clipId: string,
    category: string,
    judgeKey: string,
    valueRaw: number,
  ) => {
    if (!currentBareme) return

    const group = categoryGroups.find((item) => item.category === category)
    if (!group) return

    const judge = judges.find((item) => item.key === judgeKey)
    if (!judge) return

    if (judge.isCurrentJudge) {
      const note = notes[clipId]
      const nextByCriterion = distributeCategoryScore(group.criteria, note, valueRaw)

      for (const criterion of group.criteria) {
        updateCriterion(clipId, criterion.id, nextByCriterion[criterion.id] ?? 0)
      }
      markDirty()
      const clip = clips.find((item) => item.id === clipId)
      if (clip && !clip.scored && isClipComplete(clipId)) {
        markClipScored(clipId)
      }
      return
    }

    const importedIndex = Number(judge.key.replace('imported-', ''))
    if (!Number.isFinite(importedIndex) || importedIndex < 0 || importedIndex >= importedJudges.length) return

    const nextImported = importedJudges.map((importedJudge, idx) => {
      if (idx !== importedIndex) return importedJudge

      const previousNote = importedJudge.notes[clipId] ?? { scores: {} }
      const nextByCriterion = distributeCategoryScore(group.criteria, previousNote, valueRaw)

      const nextScores: Record<string, ImportedJudgeCriterionScore> = { ...previousNote.scores }
      for (const criterion of group.criteria) {
        const value = nextByCriterion[criterion.id] ?? 0
        nextScores[criterion.id] = {
          value,
          isValid: true,
        }
      }

      const nextNote: ImportedJudgeNote = {
        ...previousNote,
        scores: nextScores,
      }
      nextNote.finalScore = computeNoteTotalForBareme(currentBareme.criteria, nextNote)

      return {
        ...importedJudge,
        notes: {
          ...importedJudge.notes,
          [clipId]: nextNote,
        },
      }
    })

    setImportedJudges(nextImported)
  }

  const commitDraftCell = (clipId: string, category: string, judgeKey: string) => {
    const key = getCellKey(clipId, category, judgeKey)
    const raw = draftCells[key]
    if (raw === undefined) return
    const numeric = Number(raw.replace(',', '.'))
    if (Number.isFinite(numeric)) {
      applyCategoryValue(clipId, category, judgeKey, numeric)
    }
    setDraftCells((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  if (!currentBareme) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Aucun barème chargé
      </div>
    )
  }

  if (clips.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Aucun clip dans le projet
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleImportJudgeJson}
          disabled={importing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-60"
        >
          <Upload size={13} />
          {importing ? 'Import...' : 'Importer un JE.json'}
        </button>

        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Users size={13} />
          {judges.length} juge{judges.length > 1 ? 's' : ''}
        </div>

        <div className="relative">
          <ArrowUpDown size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="pl-7 pr-2 py-1 rounded border border-gray-700 bg-surface text-[11px] text-gray-300 focus:border-primary-500 outline-none"
          >
            <option value="folder">Ordre du dossier</option>
            <option value="alpha">Alphabétique</option>
          </select>
        </div>

        {currentJudge && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-primary-500/40 bg-primary-600/10 text-primary-300">
            {currentJudge.judgeName} (projet)
          </span>
        )}

        {importedJudges.map((judge, index) => (
          <span
            key={`${judge.judgeName}-${index}`}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-gray-700 bg-surface-dark text-gray-300"
          >
            {judge.judgeName}
            <button
              onClick={() => removeImportedJudge(index)}
              className="text-gray-500 hover:text-white transition-colors"
              title="Retirer ce juge importé"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      <div className="text-[10px] text-gray-500 px-1">
        Clique dans une cellule de catégorie pour modifier la note (toi + juges importés).
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-gray-700">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr>
              <th
                rowSpan={2}
                className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 w-8 bg-surface-dark sticky left-0 z-20"
              >
                #
              </th>
              <th
                rowSpan={2}
                className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 min-w-[180px] bg-surface-dark sticky left-8 z-20"
              >
                Clip
              </th>

              {categoryGroups.map((group) => (
                <th
                  key={group.category}
                  colSpan={judges.length}
                  className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-b"
                  style={{
                    color: group.color,
                    backgroundColor: withAlpha(group.color, 0.16),
                    borderColor: withAlpha(group.color, 0.3),
                  }}
                >
                  {group.category}
                  <span className="text-gray-500 font-normal ml-1">/{group.totalMax}</span>
                </th>
              ))}

              <th
                colSpan={judges.length + 1}
                className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-b border-gray-700 min-w-[90px] bg-surface-dark"
              >
                Total
                <div className="text-gray-500 font-normal">/{currentBareme.totalPoints}</div>
              </th>
            </tr>
            <tr>
              {categoryGroups.map((group) =>
                judges.map((judge) => (
                  <th
                    key={`${group.category}-${judge.key}`}
                    className="px-1 py-1 text-center text-[9px] border-r border-b border-gray-700"
                    style={{
                      backgroundColor: withAlpha(group.color, 0.1),
                      color: judge.isCurrentJudge ? '#93c5fd' : '#94a3b8',
                    }}
                    title={judge.judgeName}
                  >
                    {judge.judgeName}
                  </th>
                )),
              )}

              {judges.map((judge) => (
                <th
                  key={`total-${judge.key}`}
                  className="px-1 py-1 text-center text-[9px] border-r border-b border-gray-700 bg-surface-dark"
                >
                  <span className={judge.isCurrentJudge ? 'text-primary-300' : 'text-gray-400'}>
                    {judge.judgeName}
                  </span>
                </th>
              ))}
              <th className="px-1 py-1 text-center text-[9px] text-gray-500 border-r border-b border-gray-700 bg-surface-dark">
                Moy.
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.clip.id}
                className={index % 2 === 0 ? 'bg-surface-dark/20' : 'bg-transparent'}
              >
                <td className="px-2 py-1 text-center text-[10px] text-gray-500 border-r border-gray-800 sticky left-0 z-10 bg-surface-dark">
                  {index + 1}
                </td>
                <td className="px-2 py-1 border-r border-gray-800 sticky left-8 z-10 bg-surface-dark">
                  <div className="truncate">
                    <span className="text-primary-300 font-semibold">{getClipPrimaryLabel(row.clip)}</span>
                    {getClipSecondaryLabel(row.clip) && (
                      <span className="text-gray-500 ml-1">- {getClipSecondaryLabel(row.clip)}</span>
                    )}
                  </div>
                </td>

                {categoryGroups.map((group) =>
                  judges.map((judge, judgeIdx) => {
                    const key = getCellKey(row.clip.id, group.category, judge.key)
                    const score = row.categoryJudgeScores[group.category][judgeIdx] ?? 0
                    const displayed = draftCells[key] ?? score.toFixed(1)
                    const step = getGroupStep(group.criteria)

                    return (
                      <td
                        key={`${row.clip.id}-${group.category}-${judge.key}`}
                        className={`px-1 py-1 text-center border-r border-gray-800 font-mono ${
                          judge.isCurrentJudge ? 'text-primary-200' : 'text-gray-300'
                        }`}
                      >
                        <input
                          type="number"
                          min={0}
                          max={group.totalMax}
                          step={step}
                          value={displayed}
                          onChange={(event) => {
                            const next = event.target.value
                            setDraftCells((prev) => ({ ...prev, [key]: next }))
                          }}
                          onBlur={() => commitDraftCell(row.clip.id, group.category, judge.key)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              commitDraftCell(row.clip.id, group.category, judge.key)
                            } else if (event.key === 'Escape') {
                              setDraftCells((prev) => {
                                const next = { ...prev }
                                delete next[key]
                                return next
                              })
                            }
                          }}
                          className="amv-soft-number w-full px-1 py-0.5 rounded bg-transparent border border-transparent hover:bg-surface-light/40 focus:bg-surface-dark focus:border-primary-500 focus-visible:outline-none outline-none text-center"
                          title={`${judge.judgeName} - ${group.category}`}
                        />
                      </td>
                    )
                  }),
                )}

                {row.judgeTotals.map((score, judgeIdx) => (
                  <td
                    key={`${row.clip.id}-total-${judges[judgeIdx].key}`}
                    className={`px-2 py-1 text-center border-r border-gray-800 font-mono ${
                      judges[judgeIdx].isCurrentJudge ? 'text-primary-300 font-semibold' : 'text-gray-300'
                    }`}
                  >
                    {score.toFixed(1)}
                  </td>
                ))}

                <td className="px-2 py-1 text-center border-r border-gray-700 font-mono font-bold text-white">
                  {row.averageTotal.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
