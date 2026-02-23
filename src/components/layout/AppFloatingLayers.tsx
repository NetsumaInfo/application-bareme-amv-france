import ContextMenu from '@/components/layout/ContextMenu'
import { FloatingVideoPlayer } from '@/components/player/FloatingVideoPlayer'
import CreateProjectModal from '@/components/project/CreateProjectModal'
import BaremeEditor from '@/components/scoring/BaremeEditor'
import SettingsPanel from '@/components/settings/SettingsPanel'
import type { InterfaceMode, AppTab } from '@/types/notation'
import type { Project } from '@/types/project'

interface AppFloatingLayersProps {
  contextMenu: { x: number; y: number } | null
  onCloseContextMenu: () => void
  showSettings: boolean
  onCloseSettings: () => void
  currentProject: Project | null
  currentTab: AppTab
  currentInterface: InterfaceMode
  showPipVideo: boolean
  setShowPipVideo: (show: boolean) => void
  isDetached: boolean
}

export function AppFloatingLayers({
  contextMenu,
  onCloseContextMenu,
  showSettings,
  onCloseSettings,
  currentProject,
  currentTab,
  currentInterface,
  showPipVideo,
  setShowPipVideo,
  isDetached,
}: AppFloatingLayersProps) {
  return (
    <>
      {contextMenu ? (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={onCloseContextMenu} />
      ) : null}

      <CreateProjectModal />
      <BaremeEditor />
      {showSettings ? <SettingsPanel onClose={onCloseSettings} /> : null}

      {currentProject
        && currentTab === 'notation'
        && (currentInterface === 'spreadsheet' || currentInterface === 'dual')
        && showPipVideo
        && !isDetached ? (
        <FloatingVideoPlayer onClose={() => setShowPipVideo(false)} />
      ) : null}
    </>
  )
}
