interface PreviewPlacementParams {
  anchorRect: DOMRect
  previewWidth: number
  previewHeight: number
  viewportWidth?: number
  viewportHeight?: number
}

interface PreviewPlacement {
  left: number
  top: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function computeFramePreviewPlacement({
  anchorRect,
  previewWidth,
  previewHeight,
  viewportWidth = window.innerWidth,
  viewportHeight = window.innerHeight,
}: PreviewPlacementParams): PreviewPlacement {
  const margin = 12
  const gap = 10
  const safeWidth = Math.max(120, previewWidth)
  const safeHeight = Math.max(80, previewHeight)

  const spaceAbove = anchorRect.top - margin
  const spaceBelow = viewportHeight - anchorRect.bottom - margin

  const preferBelow = spaceBelow >= safeHeight + gap || spaceBelow >= spaceAbove
  let top = preferBelow
    ? anchorRect.bottom + gap
    : anchorRect.top - safeHeight - gap
  top = clamp(top, margin, Math.max(margin, viewportHeight - safeHeight - margin))

  let left = anchorRect.left + (anchorRect.width - safeWidth) / 2
  left = clamp(left, margin, Math.max(margin, viewportWidth - safeWidth - margin))

  const overlapsAnchor =
    left < anchorRect.right &&
    left + safeWidth > anchorRect.left &&
    top < anchorRect.bottom &&
    top + safeHeight > anchorRect.top

  if (overlapsAnchor) {
    const roomRight = viewportWidth - anchorRect.right - margin
    const roomLeft = anchorRect.left - margin
    if (roomRight >= safeWidth + gap || roomRight >= roomLeft) {
      left = clamp(
        anchorRect.right + gap,
        margin,
        Math.max(margin, viewportWidth - safeWidth - margin),
      )
    } else {
      left = clamp(
        anchorRect.left - safeWidth - gap,
        margin,
        Math.max(margin, viewportWidth - safeWidth - margin),
      )
    }
    top = clamp(
      anchorRect.top + (anchorRect.height - safeHeight) / 2,
      margin,
      Math.max(margin, viewportHeight - safeHeight - margin),
    )
  }

  return { left, top }
}

