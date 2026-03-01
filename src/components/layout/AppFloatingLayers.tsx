import ContextMenu from '@/components/layout/ContextMenu'
import { FloatingVideoPlayer } from '@/components/player/FloatingVideoPlayer'
import CreateProjectModal from '@/components/project/CreateProjectModal'
import BaremeEditor from '@/components/scoring/BaremeEditor'
import SettingsPanel from '@/components/settings/SettingsPanel'
import type { InterfaceMode, AppTab } from '@/types/notation'
import type { Project } from '@/types/project'
import type { LayoutContextScope } from '@/components/layout/hooks/useLayoutContextMenu'

interface AppFloatingLayersProps {
  contextMenu: { x: number; y: number; scope: LayoutContextScope } | null
  onCloseContextMenu: () => void
  onOpenProject: () => void
  onCreateProject: () => void
  onOpenSettings: () => void
  onCloseSettingsMenuTarget: () => void
  onCloseProjectModal: () => void
  onOpenBaremes: () => void
  onCloseBaremeEditor: () => void
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
  onOpenProject,
  onCreateProject,
  onOpenSettings,
  onCloseSettingsMenuTarget,
  onCloseProjectModal,
  onOpenBaremes,
  onCloseBaremeEditor,
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
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          scope={contextMenu.scope}
          onClose={onCloseContextMenu}
          onOpenProject={onOpenProject}
          onCreateProject={onCreateProject}
          onOpenSettings={onOpenSettings}
          onCloseSettingsMenuTarget={onCloseSettingsMenuTarget}
          onCloseProjectModal={onCloseProjectModal}
          onOpenBaremes={onOpenBaremes}
          onCloseBaremeEditor={onCloseBaremeEditor}
        />
      ) : null}

      <CreateProjectModal />
      <BaremeEditor />
      {showSettings ? <SettingsPanel onClose={onCloseSettings} /> : null}

      {currentProject
        && (
          currentTab === 'resultats'
          || (currentTab === 'notation' && (currentInterface === 'spreadsheet' || currentInterface === 'dual'))
        )
        && showPipVideo
        && !isDetached ? (
        <FloatingVideoPlayer onClose={() => setShowPipVideo(false)} />
      ) : null}
    </>
  )
}
