export const OVERLAY_AUTOHIDE_MS = 3000
const OVERLAY_SCALE_BREAK_PX = 700

export const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const

export interface OverlayIconScale {
  iconPx: number
  playPx: number
  chevronPx: number
}

const COMPACT: OverlayIconScale = { iconPx: 16, playPx: 20, chevronPx: 18 }
const NORMAL: OverlayIconScale = { iconPx: 22, playPx: 28, chevronPx: 24 }

export function getIconScale(width: number): OverlayIconScale {
  return width < OVERLAY_SCALE_BREAK_PX ? COMPACT : NORMAL
}
