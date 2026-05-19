export const OVERLAY_AUTOHIDE_MS = 3000
export const OVERLAY_SCALE_BREAK_PX = 700

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
