import { useEffect, useRef, useState } from 'react'
import { FolderPlus, Check, Circle } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import * as tauri from '@/services/tauri'
import { generateId, parseClipName, getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import type { Clip } from '@/types/project'

export default function VideoList() {
  const { clips, currentClipIndex, setCurrentClip, setClips, currentProject, updateProject, removeClip } =
    useProjectStore()
  const { isClipComplete } = useNotationStore()
  const [contextMenu, setContextMenu] = useState<{ clipId: string; x: number; y: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!contextMenu) return
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (contextMenuRef.current?.contains(target)) return
      setContextMenu(null)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [contextMenu])

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Clips ({clips.length})
        </h3>
        {currentProject && (
          <button
            onClick={handleImportFolder}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            title="Importer un dossier de vidéos"
          >
            <FolderPlus size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {clips.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-xs">
            {currentProject
              ? 'Importez un dossier de vidéos pour commencer'
              : 'Créez ou ouvrez un projet'}
          </div>
        )}

        {clips.map((clip, index) => {
          const isActive = index === currentClipIndex
          const isComplete = isClipComplete(clip.id)

          return (
            <button
              key={clip.id}
              onClick={() => setCurrentClip(index)}
              onContextMenu={(event) => {
                event.preventDefault()
                event.stopPropagation()
                const width = 220
                const height = 46
                const x = Math.max(8, Math.min(event.clientX, window.innerWidth - width - 8))
                const y = Math.max(8, Math.min(event.clientY, window.innerHeight - height - 8))
                setContextMenu({ clipId: clip.id, x, y })
              }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 border-b border-gray-800 transition-colors ${
                isActive
                  ? 'bg-primary-600/20 text-primary-300 border-l-2 border-l-primary-500'
                  : 'text-gray-300 hover:bg-surface-light'
              }`}
            >
              <span className="flex-shrink-0">
                {isComplete ? (
                  <Check size={12} className="text-green-400" />
                ) : (
                  <Circle size={12} className="text-gray-600" />
                )}
              </span>
              <span className="truncate flex-1">
                <span className="text-primary-300">{getClipPrimaryLabel(clip)}</span>
                {getClipSecondaryLabel(clip) && (
                  <span className="text-gray-500 ml-1">({getClipSecondaryLabel(clip)})</span>
                )}
              </span>
              <span className="text-gray-500 flex-shrink-0">{index + 1}</span>
            </button>
          )
        })}
      </div>

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-[95] bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[210px]"
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
