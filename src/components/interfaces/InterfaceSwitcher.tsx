import { Table, BarChart2, FileOutput } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { isNoteComplete } from '@/utils/scoring'
import type { AppTab } from '@/types/notation'

const TABS: { tab: AppTab; label: string; icon: typeof Table; shortcut: string }[] = [
  { tab: 'notation', label: 'Notation', icon: Table, shortcut: '1' },
  { tab: 'resultats', label: 'Résultat', icon: BarChart2, shortcut: '2' },
  { tab: 'export', label: 'Export', icon: FileOutput, shortcut: '3' },
]

export default function InterfaceSwitcher() {
  const { currentTab, switchTab } = useUIStore()
  const { currentProject, clips } = useProjectStore()
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const notes = useNotationStore((state) => state.notes)
  const allClipsScored = clips.length > 0 && clips.every((clip) => {
    if (clip.scored) return true
    if (!currentBareme) return false
    const clipNote = notes[clip.id]
    return clipNote ? isNoteComplete(clipNote, currentBareme) : false
  })
  const hasAnyLinkedVideo = clips.some((clip) => Boolean(clip.filePath))
  const lockResultsUntilScored = Boolean(currentProject?.settings.hideFinalScoreUntilEnd)
    && hasAnyLinkedVideo
    && !allClipsScored

  return (
    <div className="flex items-center bg-surface-dark rounded-lg p-0.5 gap-0.5">
      {TABS.filter(({ tab }) => !(lockResultsUntilScored && (tab === 'resultats' || tab === 'export'))).map(({ tab, label, icon: Icon, shortcut }) => {
        const isActive = currentTab === tab
        return (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all ${
              isActive
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-surface-light'
            }`}
            title={`${label} (Ctrl+${shortcut})`}
          >
            <Icon size={13} />
            <span className="hidden lg:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
