export const FRAME_PREVIEW_BASE_WIDTH = 236
export const FRAME_PREVIEW_FALLBACK_BASE_WIDTH = 164

export function getFramePreviewCaptureWidth(baseWidth: number): number {
  if (typeof window === 'undefined') return baseWidth
  const scale = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2)
  return Math.round(baseWidth * scale)
}
