import { useEffect, useMemo } from 'react'
import { Copy, X } from 'lucide-react'
import { useMediaInfoData } from '@/components/player/mediaInfo/useMediaInfoData'
import { buildMediaInfoSections } from '@/components/player/mediaInfo/mediaInfoSections'
import { MediaInfoSectionTable } from '@/components/player/mediaInfo/MediaInfoSectionTable'

interface MediaInfoPanelProps {
  clipName: string
  filePath: string
  onClose: () => void
}

export default function MediaInfoPanel({ clipName, filePath, onClose }: MediaInfoPanelProps) {
  const { info, error } = useMediaInfoData({ filePath })

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const sections = useMemo(() => (info ? buildMediaInfoSections(info) : []), [info])

  const copyToClipboard = async () => {
    if (!info) return
    const content = {
      clip: clipName,
      path: filePath,
      ...info,
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(content, null, 2))
    } catch {
      // Ignore clipboard failures on restricted environments.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-surface border border-gray-700 rounded-xl shadow-2xl w-[520px] max-w-[94vw] max-h-[86vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-white truncate pr-2">
            MediaInfo - {clipName}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={copyToClipboard}
              className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors shrink-0"
              title="Copier les infos"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 overflow-y-auto max-h-[68vh]">
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : !info ? (
            <p className="text-gray-500 text-sm">Chargement...</p>
          ) : (
            <div className="space-y-4">
              {sections.map((section) => (
                <MediaInfoSectionTable key={section.title} section={section} />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-700">
          <p className="text-[10px] text-gray-600 truncate" title={filePath}>{filePath}</p>
        </div>
      </div>
    </div>
  )
}
