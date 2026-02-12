import { useRef, useCallback, useMemo, useState, useEffect } from 'react'
import { FolderPlus, FilePlus, ArrowUpDown } from 'lucide-react'
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

type SortMode = 'folder' | 'alpha' | 'score'

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
    removeClip,
  } = useProjectStore()
  const { setShowPipVideo, hideAverages, hideTextNotes } = useUIStore()
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map())
  const [sortMode, setSortMode] = useState<SortMode>('folder')
  const [contextMenu, setContextMenu] = useState<{ clipId: string; x: number; y: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement | null>(null)

  const openClipContextMenu = useCallback((clipId: string, x: number, y: number) => {
    const width = 210
    const height = 46
    const paddedX = Math.max(8, Math.min(x, window.innerWidth - width - 8))
    const paddedY = Math.max(8, Math.min(y, window.innerHeight - height - 8))
    setContextMenu({ clipId, x: paddedX, y: paddedY })
  }, [])

  useEffect(() => {
    if (!contextMenu) return
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [contextMenu])

  const criteriaCount = currentBareme?.criteria.length ?? 0

  const categoryGroups = useMemo((): CategoryGroup[] => {
    if (!currentBareme) return []
    const groups: CategoryGroup[] = []
    const seen = new Map<string, number>()

    for (const c of currentBareme.criteria) {
      const cat = c.category || 'Général'
      if (seen.has(cat)) {
        groups[seen.get(cat)!].criteria.push(c)
        groups[seen.get(cat)!].totalMax += (c.max ?? 10)
      } else {
        seen.set(cat, groups.length)
        const colorFromBareme = currentBareme.categoryColors?.[cat]
        groups.push({
          category: cat,
          criteria: [c],
          totalMax: (c.max ?? 10),
          color: sanitizeColor(
            colorFromBareme,
            CATEGORY_COLOR_PRESETS[groups.length % CATEGORY_COLOR_PRESETS.length],
          ),
        })
      }
    }
    return groups
  }, [currentBareme])

  const sortedClips = useMemo(() => {
    const base = [...clips]
    const originalIndex = new Map(clips.map((clip, index) => [clip.id, index]))

    if (sortMode === 'alpha') {
      base.sort((a, b) => {
        const labelA = getClipPrimaryLabel(a)
        const labelB = getClipPrimaryLabel(b)
        const cmp = labelA.localeCompare(labelB, 'fr', { sensitivity: 'base' })
        if (cmp !== 0) return cmp
        return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
      })
      return base
    }

    if (sortMode === 'score') {
      base.sort((a, b) => {
        const scoreA = getScoreForClip(a.id)
        const scoreB = getScoreForClip(b.id)
        if (scoreB !== scoreA) return scoreB - scoreA
        return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
      })
      return base
    }

    // folder mode (default)
    base.sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : (originalIndex.get(a.id) ?? 0)
      const orderB = Number.isFinite(b.order) ? b.order : (originalIndex.get(b.id) ?? 0)
      if (orderA !== orderB) return orderA - orderB
      return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
    })
    return base
  }, [clips, sortMode, getScoreForClip])

  const focusCell = useCallback(
    (clipIdx: number, critIdx: number) => {
      if (clipIdx < 0 || clipIdx >= sortedClips.length) return
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
        row.scrollIntoView({ block: 'nearest' })
      }
      // Map sorted index to original index
      const clip = sortedClips[clipIdx]
      const originalIndex = clips.findIndex(c => c.id === clip.id)
      if (originalIndex !== -1) {
        setCurrentClip(originalIndex)
      }
    },
    [sortedClips, clips, criteriaCount, setCurrentClip],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, clipIdx: number, critIdx: number) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        if (critIdx < criteriaCount - 1) focusCell(clipIdx, critIdx + 1)
        else if (clipIdx < sortedClips.length - 1) focusCell(clipIdx + 1, 0)
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
    [focusCell, sortedClips.length, criteriaCount],
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

  const handleImportFiles = async () => {
    try {
      const filePaths = await tauri.openVideoFilesDialog()
      if (!filePaths || filePaths.length === 0) return

      const newClips: Clip[] = filePaths.map((filePath, i) => {
        const fileName = filePath.split(/[\\/]/).pop() || filePath
        const parsed = parseClipName(fileName)
        return {
          id: generateId(),
          fileName,
          filePath,
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
    } catch (e) {
      console.error('Failed to import files:', e)
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
          total += score.value
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
        <div className="flex gap-2">
          <button
            onClick={handleImportFolder}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
          >
            <FolderPlus size={16} />
            Importer un dossier
          </button>
          <button
            onClick={handleImportFiles}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-600 text-primary-500 hover:bg-primary-600/10 text-sm font-medium transition-colors"
          >
            <FilePlus size={16} />
            Importer des fichiers
          </button>
        </div>
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
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 px-2 py-1.5 bg-surface-dark border-b border-gray-700">
        <button
          onClick={() => {
            const modes: SortMode[] = ['folder', 'alpha', 'score']
            const currentIndex = modes.indexOf(sortMode)
            const nextIndex = (currentIndex + 1) % modes.length
            setSortMode(modes[nextIndex])
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded border border-gray-700 bg-surface text-[11px] text-gray-300 hover:border-primary-500 hover:bg-surface-light transition-colors"
          title="Changer le mode de tri"
        >
          <ArrowUpDown size={12} className="text-gray-500" />
          <span>
            {sortMode === 'folder' ? 'Ordre du dossier' : sortMode === 'alpha' ? 'Alphabétique' : 'Par note'}
          </span>
        </button>
      </div>

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
                  </th>
                )),
              )}
            </tr>
          </thead>

          <tbody>
            {sortedClips.map((clip, clipIdx) => {
              const note = getNoteForClip(clip.id)
              const totalScore = getScoreForClip(clip.id)
              const currentClip = clips[currentClipIndex]
              const isActive = currentClip?.id === clip.id

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
                  onClick={() => {
                    const originalIndex = clips.findIndex(c => c.id === clip.id)
                    if (originalIndex !== -1) setCurrentClip(originalIndex)
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    openClipContextMenu(clip.id, e.clientX, e.clientY)
                  }}
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
                    className={`px-2 py-1 border-r border-gray-800 sticky left-7 z-10 group/clip ${
                      isActive
                        ? 'bg-primary-900/30'
                        : clipIdx % 2 === 0
                          ? 'bg-surface-dark'
                          : 'bg-surface'
                    }`}
                    onDoubleClick={() => setShowPipVideo(true)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openClipContextMenu(clip.id, e.clientX, e.clientY)
                    }}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      {clip.scored && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      )}
                      <div className="truncate flex flex-col min-w-0 leading-tight flex-1">
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
                          onFocus={() => {
                            const originalIndex = clips.findIndex(c => c.id === clip.id)
                            if (originalIndex !== -1) setCurrentClip(originalIndex)
                          }}
                          onBlur={() => handleBlur(clip.id)}
                          onClick={(e) => e.stopPropagation()}
                          className={`amv-soft-number w-full px-1 py-0.5 text-center rounded text-xs font-mono transition-colors focus-visible:outline-none ${
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
          {clips.length > 1 && !hideAverages && (
            <tfoot>
              <tr>
                <td
                  colSpan={2 + currentBareme.criteria.length + 1}
                  className="h-[2px] bg-gray-500"
                />
              </tr>
              <tr className="bg-surface-dark">
                <td
                  colSpan={2}
                  className="px-2 py-2 font-bold text-[10px] uppercase tracking-wider text-gray-300 border-r border-gray-600 sticky left-0 z-10 bg-surface-dark"
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
                          className="px-1 py-2 text-center border-r border-gray-600"
                          style={{ backgroundColor: withAlpha(g.color, 0.22) }}
                        >
                          <span
                            className="text-[11px] font-mono font-bold"
                            style={{ color: g.color }}
                          >
                            {avg.toFixed(1)}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            /{g.totalMax}
                          </span>
                        </td>
                      )
                    }
                    return null
                  }),
                )}
                <td className="px-2 py-2 text-center font-mono font-bold text-[12px] text-white bg-surface-dark">
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
      {currentClip && !hideTextNotes && (
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

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              removeClip(contextMenu.clipId)
              setContextMenu(null)
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
