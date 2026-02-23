import { useOverlayBridgeEmitters } from '@/components/layout/hooks/useOverlayBridgeEmitters'
import { useOverlayBridgeListeners } from '@/components/layout/hooks/useOverlayBridgeListeners'
import type { UseOverlayBridgeOptions } from '@/components/layout/hooks/overlayBridgeTypes'

export function useOverlayBridge({
  clips,
  currentClipIndex,
  currentProject,
  notes,
  currentBareme,
  isFullscreen,
  isDetached,
  onUndo,
  onSetCurrentClipMiniatureFrame,
  onToggleMiniatures,
}: UseOverlayBridgeOptions) {
  const { emitClipInfo, emitOverlayMarkers } = useOverlayBridgeEmitters({
    clips,
    currentClipIndex,
    currentProject,
    notes,
    currentBareme,
    isFullscreen,
    isDetached,
  })

  useOverlayBridgeListeners({
    emitClipInfo,
    emitOverlayMarkers,
    onUndo,
    onSetCurrentClipMiniatureFrame,
    onToggleMiniatures,
  })
}
