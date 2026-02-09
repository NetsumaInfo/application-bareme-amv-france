import { useRef, useCallback, useMemo } from 'react'
import { FolderPlus } from 'lucide-react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { generateId, parseClipName, getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { CATEGORY_COLOR_PRESETS, sanitizeColor, withAlpha } from '@/utils/colors'
import type { Clip } from '@/types/project'
import type { Criterion } from '@/types/bareme'

interface CategoryGroup {
  category: string
  criteria: Criterion[]
  totalMax: number
  color: string
}

export default function SpreadsheetInterface() {
  const {
    currentBareme,
    updateCriterion,
    getNoteForClip,
    getScoreForClip,
    setTextNotes,
  } = useNotationStore()
  const {
    clips,
    currentClipIndex,
    setCurrentClip,
    setClips,
    currentProject,
    updateProject,
    markClipScored,
    markDirty,
  } = useProjectStore()
  const { setShowPipVideo } = useUIStore()
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map())

  const criteriaCount = currentBareme?.criteria.length ?? 0

  const categoryGroups = useMemo((): CategoryGroup[] => {
    if (!currentBareme) return []
    const groups: CategoryGroup[] = []
    const seen = new Map<string, number>()

    for (const c of currentBareme.criteria) {
      const cat = c.category || 'Général'
      if (seen.has(cat)) {
        groups[seen.get(cat)!].criteria.push(c)
        groups[seen.get(cat)!].totalMax += (c.max ?? 10) * c.weight
      } else {
        seen.set(cat, groups.length)
        const colorFromBareme = currentBareme.categoryColors?.[cat]
        groups.push({
          category: cat,
          criteria: [c],
          totalMax: (c.max ?? 10) * c.weight,
          color: sanitizeColor(
            colorFromBareme,
            CATEGORY_COLOR_PRESETS[groups.length % CATEGORY_COLOR_PRESETS.length],
          ),
        })
      }
    }
    return groups
  }, [currentBareme])

  const focusCell = useCallback(
    (clipIdx: number, critIdx: number) => {
      if (clipIdx < 0 || clipIdx >= clips.length) return
      if (critIdx < 0 || critIdx >= criteriaCount) return
      const key = `${clipIdx}-${critIdx}`
      const input = cellRefs.current.get(key)
      if (input) {
        input.focus()
        input.select()
      }
      // Scroll row into view
      const row = rowRefs.current.get(clipIdx)
      if (row) {
        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
      setCurrentClip(clipIdx)
    },
    [clips.length, criteriaCount, setCurrentClip],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, clipIdx: number, critIdx: number) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        if (critIdx < criteriaCount - 1) focusCell(clipIdx, critIdx + 1)
        else if (clipIdx < clips.length - 1) focusCell(clipIdx + 1, 0)
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        if (critIdx > 0) focusCell(clipIdx, critIdx - 1)
        else if (clipIdx > 0) focusCell(clipIdx - 1, criteriaCount - 1)
      } else if (e.key === 'ArrowRight') {
        const input = e.currentTarget as HTMLInputElement
        if (input.selectionStart === input.value.length) {
          e.preventDefault()
          focusCell(clipIdx, critIdx + 1)
        }
      } else if (e.key === 'ArrowLeft') {
        const input = e.currentTarget as HTMLInputElement
        if (input.selectionStart === 0) {
          e.preventDefault()
          focusCell(clipIdx, critIdx - 1)
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        focusCell(clipIdx + 1, critIdx)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        focusCell(clipIdx - 1, critIdx)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        focusCell(clipIdx + 1, critIdx)
      }
    },
    [focusCell, clips.length, criteriaCount],
  )

  const handleChange = useCallback(
    (clipId: string, criterionId: string, value: string) => {
      const numValue = value === '' ? '' : Number(value)
      if (typeof numValue === 'number' && isNaN(numValue)) return
      updateCriterion(clipId, criterionId, numValue as number)
      markDirty()
    },
    [updateCriterion, markDirty],
  )

  const handleBlur = useCallback(
    (clipId: string) => {
      if (!currentBareme) return
      const note = getNoteForClip(clipId)
      if (note) {
        const clip = clips.find((c) => c.id === clipId)
        const allFilled = currentBareme.criteria.every((c) => {
          if (!c.required) return true
          const score = note.scores[c.id]
          return (
            score &&
            score.isValid &&
            score.value !== '' &&
            score.value !== undefined
          )
        })
        if (allFilled && clip && !clip.scored) {
          markClipScored(clipId)
        }
      }
    },
    [currentBareme, getNoteForClip, clips, markClipScored],
  )

  const handleImportFolder = async () => {
    try {
      const folderPath = await tauri.openFolderDialog()
      if (!folderPath) return

      const videos = await tauri.scanVideoFolder(folderPath)

      const newClips: Clip[] = videos.map((v, i) => {
        const parsed = parseClipName(v.file_name)
        return {
          id: generateId(),
          fileName: v.file_name,
          filePath: v.file_path,
          displayName: parsed.displayName,
          author: parsed.author,
          duration: 0,
          hasInternalSubtitles: false,
          audioTrackCount: 1,
          scored: false,
          order: clips.length + i,
        }
      })

      setClips([...clips, ...newClips])
      if (currentProject) {
        updateProject({ clipsFolderPath: folderPath })
      }
    } catch (e) {
      console.error('Failed to import folder:', e)
      alert(`Erreur lors de l'import: ${e}`)
    }
  }

  const getCategoryScore = useCallback(
    (clipId: string, group: CategoryGroup): number => {
      const note = getNoteForClip(clipId)
      if (!note) return 0
      let total = 0
      for (const c of group.criteria) {
        const score = note.scores[c.id]
        if (score && score.isValid && typeof score.value === 'number') {
          total += score.value * c.weight
        }
      }
      return Math.round(total * 100) / 100
    },
    [getNoteForClip],
  )

  if (!currentBareme) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Aucun barème sélectionné
      </div>
    )
  }

  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-gray-500 text-sm">
          Importez des vidéos pour commencer
        </p>
        <button
          onClick={handleImportFolder}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
        >
          <FolderPlus size={16} />
          Importer un dossier
        </button>
      </div>
    )
  }

  const currentClip = clips[currentClipIndex]
  const currentNote = currentClip ? getNoteForClip(currentClip.id) : undefined

  // Build flat criteria index for cell navigation
  let globalCritIdx = 0
  const critIdxMap = new Map<string, number>()
  for (const c of currentBareme.criteria) {
    critIdxMap.set(c.id, globalCritIdx++)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            {/* Row 1: Category headers */}
            <tr>
              <th
                rowSpan={2}
                className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 w-7 bg-surface-dark sticky left-0 z-20"
              >
                #
              </th>
              <th
                rowSpan={2}
                className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 min-w-[120px] bg-surface-dark sticky left-7 z-20"
              >
                Pseudo
              </th>
              {categoryGroups.map((g) => (
                <th
                  key={g.category}
                  colSpan={g.criteria.length}
                  className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-b border-gray-600"
                  style={{
                    backgroundColor: withAlpha(g.color, 0.22),
                    borderColor: withAlpha(g.color, 0.35),
                  }}
                >
                  <span style={{ color: g.color }}>{g.category}</span>
                  <span className="font-normal text-gray-500 ml-1">
                    /{g.totalMax}
                  </span>
                </th>
              ))}
              <th
                rowSpan={2}
                className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-b border-gray-700 min-w-[50px] bg-surface-dark"
              >
                Total
                <div className="font-normal text-gray-500">
                  /{currentBareme.totalPoints}
                </div>
              </th>
            </tr>

            {/* Row 2: Criteria names */}
            <tr>
              {categoryGroups.map((g) =>
                g.criteria.map((c) => (
                  <th
                    key={c.id}
                    className="px-1 py-1 text-center text-[9px] font-medium border-r border-b border-gray-700 min-w-[76px]"
                    title={c.description}
                    style={{ backgroundColor: withAlpha(g.color, 0.12) }}
                  >
                    <div className="truncate" style={{ color: withAlpha(g.color, 0.92) }}>
                      {g.criteria.length === 1 ? '' : c.name}
                    </div>
                    <div className="text-gray-500 font-normal">
                      /{c.max ?? 10}
                    </div>
                    <div className="text-[8px] text-gray-500">
                      coef x{c.weight}
                    </div>
                  </th>
                )),
              )}
            </tr>
          </thead>

          <tbody>
            {clips.map((clip, clipIdx) => {
              const note = getNoteForClip(clip.id)
              const totalScore = getScoreForClip(clip.id)
              const isActive = clipIdx === currentClipIndex

              return (
                <tr
                  key={clip.id}
                  ref={(el) => { if (el) rowRefs.current.set(clipIdx, el) }}
                  className={`transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary-600/15'
                      : clipIdx % 2 === 0
                        ? 'bg-surface-dark/30'
                        : 'bg-transparent'
                  } hover:bg-primary-600/10`}
                  onClick={() => setCurrentClip(clipIdx)}
                >
                  <td
                    className={`px-2 py-1 text-center font-mono text-[10px] text-gray-500 border-r border-gray-800 sticky left-0 z-10 ${
                      isActive
                        ? 'bg-primary-900/30'
                        : clipIdx % 2 === 0
                          ? 'bg-surface-dark'
                          : 'bg-surface'
                    }`}
                  >
                    {clipIdx + 1}
                  </td>

                  <td
                    className={`px-2 py-1 border-r border-gray-800 sticky left-7 z-10 ${
                      isActive
                        ? 'bg-primary-900/30'
                        : clipIdx % 2 === 0
                          ? 'bg-surface-dark'
                          : 'bg-surface'
                    }`}
                    onDoubleClick={() => setShowPipVideo(true)}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      {clip.scored && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      )}
                      <div className="truncate flex flex-col min-w-0 leading-tight">
                        <span className="truncate text-primary-300 text-[11px] font-semibold">
                          {getClipPrimaryLabel(clip)}
                        </span>
                        {getClipSecondaryLabel(clip) && (
                          <span className="truncate text-[9px] text-gray-500">
                            {getClipSecondaryLabel(clip)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {currentBareme.criteria.map((criterion) => {
                    const critIdx = critIdxMap.get(criterion.id) ?? 0
                    const score = note?.scores[criterion.id]
                    const hasError = score && !score.isValid
                    const value = score?.value ?? ''

                    return (
                      <td
                        key={criterion.id}
                        className="px-0.5 py-0.5 border-r border-gray-800 text-center"
                      >
                        <input
                          ref={(el) => {
                            if (el)
                              cellRefs.current.set(`${clipIdx}-${critIdx}`, el)
                          }}
                          type="number"
                          min={criterion.min}
                          max={criterion.max}
                          step={criterion.step || 0.5}
                          value={value === '' ? '' : String(value)}
                          onChange={(e) =>
                            handleChange(clip.id, criterion.id, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, clipIdx, critIdx)}
                          onFocus={() => setCurrentClip(clipIdx)}
                          onBlur={() => handleBlur(clip.id)}
                          onClick={(e) => e.stopPropagation()}
                          className={`w-full px-1 py-0.5 text-center rounded text-xs font-mono transition-colors ${
                            hasError
                              ? 'border border-accent bg-accent/10 text-accent-light'
                              : 'border border-transparent bg-transparent text-white hover:bg-surface-light/50 focus:border-primary-500 focus:bg-surface-dark'
                          } focus:outline-none`}
                        />
                      </td>
                    )
                  })}

                  <td className="px-2 py-1 text-center font-mono font-bold text-[11px]">
                    <span
                      className={
                        totalScore > 0 ? 'text-white' : 'text-gray-600'
                      }
                    >
                      {totalScore}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* Footer averages */}
          {clips.length > 1 && (
            <tfoot>
              <tr>
                <td
                  colSpan={2 + currentBareme.criteria.length + 1}
                  className="h-px bg-gray-600"
                />
              </tr>
              <tr className="bg-surface-dark/80">
                <td
                  colSpan={2}
                  className="px-2 py-1.5 font-bold text-[9px] uppercase tracking-wider text-gray-400 border-r border-gray-700 sticky left-0 z-10 bg-surface-dark"
                >
                  Moyennes
                </td>
                {categoryGroups.map((g) =>
                  g.criteria.map((c, i) => {
                    if (i === 0) {
                      const avg =
                        clips.length > 0
                          ? clips.reduce(
                              (s, clip) => s + getCategoryScore(clip.id, g),
                              0,
                            ) / clips.length
                          : 0
                      return (
                        <td
                          key={`avg-${c.id}`}
                          colSpan={g.criteria.length}
                          className="px-1 py-1.5 text-center border-r border-gray-700"
                          style={{ backgroundColor: withAlpha(g.color, 0.18) }}
                        >
                          <span className="text-[10px] font-mono font-medium text-gray-300">
                            {avg.toFixed(1)}
                          </span>
                          <span className="text-[9px] text-gray-500">
                            /{g.totalMax}
                          </span>
                        </td>
                      )
                    }
                    return null
                  }),
                )}
                <td className="px-2 py-1.5 text-center font-mono font-bold text-[11px] text-gray-300 bg-surface-dark">
                  {clips.length > 0
                    ? (
                        clips.reduce(
                          (s, c) => s + getScoreForClip(c.id),
                          0,
                        ) / clips.length
                      ).toFixed(1)
                    : '0'}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Notes for selected clip */}
      {currentClip && (
        <div className="px-3 py-2 border-t border-gray-700 bg-surface shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Notes
            </span>
            <span className="text-[10px] text-gray-600">—</span>
            <span className="text-[10px] text-gray-400">
              <span className="text-primary-400">
                {getClipPrimaryLabel(currentClip)}
              </span>
              {getClipSecondaryLabel(currentClip) && (
                <span className="text-gray-500 ml-1">
                  ({getClipSecondaryLabel(currentClip)})
                </span>
              )}
            </span>
            <span className="text-[10px] text-gray-600 ml-auto">
              {categoryGroups.map((g) => (
                <span key={g.category} className="ml-2">
                  <span style={{ color: g.color }}>{g.category}</span>:{' '}
                  <span className="text-gray-400">
                    {getCategoryScore(currentClip.id, g)}/{g.totalMax}
                  </span>
                </span>
              ))}
            </span>
          </div>
          <textarea
            placeholder="Notes libres pour ce clip..."
            value={currentNote?.textNotes ?? ''}
            onChange={(e) => {
              setTextNotes(currentClip.id, e.target.value)
              markDirty()
            }}
            className="w-full px-2 py-1.5 text-xs bg-surface-dark border border-gray-700 rounded text-gray-300 placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-y min-h-[40px]"
            rows={2}
          />
        </div>
      )}
    </div>
  )
}
