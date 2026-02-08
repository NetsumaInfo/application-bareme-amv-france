import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import VideoList from '@/components/project/VideoList'
import ProgressIndicator from '@/components/project/ProgressIndicator'

export default function Sidebar() {
  const { clips, currentClipIndex, nextClip, previousClip } = useProjectStore()

  return (
    <aside className="flex flex-col w-60 bg-surface border-r border-gray-700 min-w-[200px]">
      {/* Video list */}
      <div className="flex-1 overflow-hidden">
        <VideoList />
      </div>

      {/* Navigation buttons */}
      {clips.length > 0 && (
        <div className="flex items-center gap-1 px-2 py-2 border-t border-gray-700">
          <button
            onClick={previousClip}
            disabled={currentClipIndex === 0}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded bg-surface-light text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
            Précédent
          </button>
          <button
            onClick={nextClip}
            disabled={currentClipIndex >= clips.length - 1}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded bg-surface-light text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Suivant
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Progress */}
      <ProgressIndicator />
    </aside>
  )
}
