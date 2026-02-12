import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Upload, Users, ArrowUpDown } from 'lucide-react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
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

type SortMode = 'folder' | 'alpha' | 'score'

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
    const textNotes =
      typeof noteRaw.textNotes === 'string'
        ? noteRaw.textNotes
        : typeof noteRaw.text_notes === 'string'
          ? noteRaw.text_notes
          : undefined
    notes[targetClipId] = Number.isFinite(maybeFinal)
      ? { scores, finalScore: maybeFinal, textNotes }
      : { scores, textNotes }
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
  const setTextNotes = useNotationStore((state) => state.setTextNotes)
  const isClipComplete = useNotationStore((state) => state.isClipComplete)
  const { switchTab, switchInterface, setShowPipVideo, hideTextNotes } = useUIStore()

  const {
    currentProject,
    clips,
    importedJudges,
    setImportedJudges,
    markDirty,
    markClipScored,
    setCurrentClip,
    removeClip,
  } = useProjectStore()

  const [importing, setImporting] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('folder')
  const [draftCells, setDraftCells] = useState<Record<string, string>>({})
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [memberContextMenu, setMemberContextMenu] = useState<{ index: number; x: number; y: number } | null>(null)
  const [clipContextMenu, setClipContextMenu] = useState<{ clipId: string; x: number; y: number } | null>(null)
  const memberContextMenuRef = useRef<HTMLDivElement | null>(null)
  const clipContextMenuRef = useRef<HTMLDivElement | null>(null)

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

  const getClipAverageTotal = useCallback((clipId: string) => {
    if (!currentBareme) return 0
    const totals = judges.map((judge) =>
      getNoteTotal(judge.notes[clipId] as NoteLike | undefined, currentBareme),
    )
    return totals.length > 0
      ? totals.reduce((sum, v) => sum + v, 0) / totals.length
      : 0
  }, [currentBareme, judges])

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

    if (sortMode === 'score') {
      base.sort((a, b) => {
        const scoreA = getClipAverageTotal(a.id)
        const scoreB = getClipAverageTotal(b.id)
        if (scoreB !== scoreA) return scoreB - scoreA
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
  }, [clips, collator, sortMode, getClipAverageTotal])

  useEffect(() => {
    if (!selectedClipId || !sortedClips.some((clip) => clip.id === selectedClipId)) {
      setSelectedClipId(sortedClips[0]?.id ?? null)
    }
  }, [sortedClips, selectedClipId])

  useEffect(() => {
    if (!memberContextMenu) return
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (memberContextMenuRef.current?.contains(target)) return
      setMemberContextMenu(null)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [memberContextMenu])

  useEffect(() => {
    if (!clipContextMenu) return
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (clipContextMenuRef.current?.contains(target)) return
      setClipContextMenu(null)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [clipContextMenu])

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

  const openClipInNotation = useCallback((clipId: string) => {
    const index = clips.findIndex((clip) => clip.id === clipId)
    if (index < 0) return
    setCurrentClip(index)
    setShowPipVideo(true)
    switchInterface('spreadsheet')
    switchTab('notation')
  }, [clips, setCurrentClip, setShowPipVideo, switchInterface, switchTab])

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
    setMemberContextMenu(null)
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

  const selectedClip = sortedClips.find((clip) => clip.id === selectedClipId) ?? sortedClips[0]

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

        <button
          onClick={() => {
            const modes: SortMode[] = ['folder', 'alpha', 'score']
            const idx = modes.indexOf(sortMode)
            setSortMode(modes[(idx + 1) % modes.length])
          }}
          className="flex items-center gap-1.5 pl-2 pr-2 py-1 rounded border border-gray-700 bg-surface text-[11px] text-gray-300 hover:border-primary-500 hover:bg-surface-light transition-colors"
        >
          <ArrowUpDown size={12} className="text-gray-500" />
          <span>{sortMode === 'folder' ? 'Ordre du dossier' : sortMode === 'alpha' ? 'Alphabétique' : 'Par moyenne'}</span>
        </button>

        {currentJudge && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-primary-500/40 bg-primary-600/10 text-primary-300">
            {currentJudge.judgeName} (projet)
          </span>
        )}

        {importedJudges.map((judge, index) => (
          <button
            key={`${judge.judgeName}-${index}`}
            onContextMenu={(event) => {
              event.preventDefault()
              setMemberContextMenu({ index, x: event.clientX, y: event.clientY })
            }}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-gray-700 bg-surface-dark text-gray-300 hover:border-gray-500 transition-colors"
            title="Clic droit pour options"
          >
            {judge.judgeName}
          </button>
        ))}
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
                className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 min-w-[120px] max-w-[180px] bg-surface-dark sticky left-8 z-20"
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
            {rows.map((row, index) => {
              const isSelected = selectedClipId === row.clip.id
              return (
                <tr
                  key={row.clip.id}
                  onClick={() => setSelectedClipId(row.clip.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary-600/12'
                      : index % 2 === 0
                        ? 'bg-surface-dark/20'
                        : 'bg-transparent'
                  } hover:bg-primary-600/8`}
                >
                <td className="px-2 py-1 text-center text-[10px] text-gray-500 border-r border-gray-800 sticky left-0 z-10 bg-surface-dark">
                  {index + 1}
                </td>
                <td
                  className="px-2 py-1 border-r border-gray-800 sticky left-8 z-10 bg-surface-dark max-w-[180px]"
                  onDoubleClick={(event) => {
                    event.stopPropagation()
                    openClipInNotation(row.clip.id)
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    const width = 210
                    const height = 46
                    const x = Math.max(8, Math.min(event.clientX, window.innerWidth - width - 8))
                    const y = Math.max(8, Math.min(event.clientY, window.innerHeight - height - 8))
                    setClipContextMenu({ clipId: row.clip.id, x, y })
                  }}
                >
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span className="truncate text-primary-300 text-[11px] font-semibold">{getClipPrimaryLabel(row.clip)}</span>
                    {getClipSecondaryLabel(row.clip) && (
                      <span className="truncate text-[9px] text-gray-500">{getClipSecondaryLabel(row.clip)}</span>
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
              )
            })}
          </tbody>
        </table>
      </div>

      {!hideTextNotes && selectedClip && (
        <div className="shrink-0 border border-gray-700 rounded-lg bg-surface overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-700 text-[11px] text-gray-400">
            Notes du clip
            <span className="text-primary-300 ml-1">{getClipPrimaryLabel(selectedClip)}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
            {judges.map((judge) => {
              const judgeNote = judge.notes[selectedClip.id] as (NoteLike & { textNotes?: string }) | undefined
              const noteText = judgeNote?.textNotes ?? ''
              return (
                <div key={`note-${judge.key}`} className="rounded border border-gray-700 bg-surface-dark p-2">
                  <div className="text-[10px] text-gray-400 mb-1">
                    <span className={judge.isCurrentJudge ? 'text-primary-300' : 'text-gray-300'}>
                      {judge.judgeName}
                    </span>
                  </div>
                  {judge.isCurrentJudge ? (
                    <textarea
                      value={noteText}
                      onChange={(event) => {
                        setTextNotes(selectedClip.id, event.target.value)
                        markDirty()
                      }}
                      className="w-full px-2 py-1 text-[11px] bg-surface border border-gray-700 rounded text-gray-300 placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-y min-h-[52px]"
                      rows={2}
                      placeholder="Notes libres..."
                    />
                  ) : (
                    <p className="text-[11px] text-gray-300 min-h-[52px] whitespace-pre-wrap">
                      {noteText || 'Aucune note'}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {memberContextMenu && (
        <div
          ref={memberContextMenuRef}
          className="fixed z-[90] bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[210px]"
          style={{ left: memberContextMenu.x, top: memberContextMenu.y }}
        >
          <button
            onClick={() => removeImportedJudge(memberContextMenu.index)}
            className="w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:bg-gray-800 transition-colors"
          >
            Supprimer le membre sélectionné
          </button>
        </div>
      )}

      {clipContextMenu && (
        <div
          ref={clipContextMenuRef}
          className="fixed z-[90] bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[210px]"
          style={{ left: clipContextMenu.x, top: clipContextMenu.y }}
        >
          <button
            onClick={() => {
              removeClip(clipContextMenu.clipId)
              setClipContextMenu(null)
            }}
            className="w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:bg-gray-800 transition-colors"
          >
            Supprimer la vidéo
          </button>
        </div>
      )}
    </div>
  )
}
