export interface UseOverlayBridgeOptions {
  clips: Array<{ id: string; filePath?: string; displayName?: string }>
  currentClipIndex: number
  currentProject: { settings: { showMiniatures?: boolean } } | null
  notes: unknown
  currentBareme: unknown
  isFullscreen: boolean
  isDetached: boolean
  onUndo: () => void
  onSetCurrentClipMiniatureFrame: () => Promise<void>
  onToggleMiniatures: () => void
}

export interface OverlayFocusMarkerPayload {
  clipId?: string
  seconds?: number
  category?: string | null
  criterionId?: string | null
  source?: string | null
  raw?: string | null
}
