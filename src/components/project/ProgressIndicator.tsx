import { useProjectStore } from '@/store/useProjectStore'
import { getProgressStats } from '@/utils/scoring'

export default function ProgressIndicator() {
  const { clips } = useProjectStore()
  const stats = getProgressStats(clips)

  if (clips.length === 0) return null

  return (
    <div className="px-3 py-2 border-t border-gray-700">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-400">Progression</span>
        <span className="text-gray-300 font-medium">
          {stats.scored}/{stats.total}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-300"
          style={{ width: `${stats.percentage}%` }}
        />
      </div>
      {stats.remaining > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {stats.remaining} restant{stats.remaining > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
