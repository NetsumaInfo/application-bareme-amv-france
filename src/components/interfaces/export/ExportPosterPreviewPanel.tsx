import { useEffect, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, MutableRefObject } from 'react'
import { Download } from 'lucide-react'
import { withAlpha } from '@/utils/colors'
import type {
  ExportPosterBlock,
  ExportPosterBlockId,
  ExportPosterImageLayer,
  ExportPosterShadowStyle,
} from '@/components/interfaces/export/types'

interface ExportPosterPreviewPanelProps {
  previewRef: MutableRefObject<HTMLDivElement | null>
  accent: string
  posterWidth: number
  posterHeight: number
  backgroundImage: string | null
  backgroundPositionXPct: number
  backgroundPositionYPct: number
  backgroundDragEnabled: boolean
  backgroundScaleXPct: number
  backgroundScaleYPct: number
  overlayOpacity: number
  previewZoomPct: number
  blocks: ExportPosterBlock[]
  images: ExportPosterImageLayer[]
  activeBlockId: ExportPosterBlockId | null
  activeImageId: string | null
  onSelectBlock: (id: ExportPosterBlockId | null) => void
  onSelectImage: (id: string | null) => void
  onMoveBlock: (id: ExportPosterBlockId, xPct: number, yPct: number) => void
  onMoveImage: (id: string, xPct: number, yPct: number) => void
  onMoveBackground: (xPct: number, yPct: number) => void
}

type DragState =
  | {
    kind: 'block'
    id: ExportPosterBlockId
    originXPct: number
    originYPct: number
    widthPct: number
    startX: number
    startY: number
  }
  | {
    kind: 'image'
    id: string
    originXPct: number
    originYPct: number
    widthPct: number
    startX: number
    startY: number
  }
  | {
    kind: 'background'
    originXPct: number
    originYPct: number
    startX: number
    startY: number
  }

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getTextShadow(shadowStyle: ExportPosterShadowStyle, shadowColor: string): string {
  switch (shadowStyle) {
    case 'none':
      return 'none'
    case 'soft':
      return `0 2px 10px ${withAlpha(shadowColor, 0.62)}`
    case 'strong':
      return `0 5px 18px ${withAlpha(shadowColor, 0.88)}`
    case 'outline':
      return `-1px -1px 0 ${withAlpha(shadowColor, 0.95)}, 1px -1px 0 ${withAlpha(shadowColor, 0.95)}, -1px 1px 0 ${withAlpha(shadowColor, 0.95)}, 1px 1px 0 ${withAlpha(shadowColor, 0.95)}`
    case 'glow':
      return `0 0 8px ${withAlpha(shadowColor, 0.85)}, 0 0 22px ${withAlpha(shadowColor, 0.5)}`
    default:
      return 'none'
  }
}

interface PosterCanvasSceneProps {
  accent: string
  backgroundImage: string | null
  backgroundPositionXPct: number
  backgroundPositionYPct: number
  backgroundDragEnabled: boolean
  backgroundScaleXPct: number
  backgroundScaleYPct: number
  overlayOpacity: number
  blocks: ExportPosterBlock[]
  images: ExportPosterImageLayer[]
  activeBlockId: ExportPosterBlockId | null
  activeImageId: string | null
  interactive: boolean
  onSelectBlock: (id: ExportPosterBlockId | null) => void
  onSelectImage: (id: string | null) => void
  onStartDragBlock: (event: ReactMouseEvent<HTMLDivElement>, block: ExportPosterBlock) => void
  onStartDragImage: (event: ReactMouseEvent<HTMLDivElement>, image: ExportPosterImageLayer) => void
  onStartDragBackground: (event: ReactMouseEvent<HTMLDivElement>) => void
}

function PosterCanvasScene({
  accent,
  backgroundImage,
  backgroundPositionXPct,
  backgroundPositionYPct,
  backgroundDragEnabled,
  backgroundScaleXPct,
  backgroundScaleYPct,
  overlayOpacity,
  blocks,
  images,
  activeBlockId,
  activeImageId,
  interactive,
  onSelectBlock,
  onSelectImage,
  onStartDragBlock,
  onStartDragImage,
  onStartDragBackground,
}: PosterCanvasSceneProps) {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundColor: '#020617',
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundPosition: `${backgroundPositionXPct}% ${backgroundPositionYPct}%`,
        backgroundSize: `${backgroundScaleXPct}% ${backgroundScaleYPct}%`,
        backgroundRepeat: 'no-repeat',
      }}
      onMouseDown={() => {
        if (!interactive) return
        if (backgroundDragEnabled && backgroundImage) return
        onSelectBlock(null)
        onSelectImage(null)
      }}
      onMouseDownCapture={(event) => {
        if (!interactive) return
        if (!backgroundDragEnabled || !backgroundImage) return
        if (event.target !== event.currentTarget) return
        onSelectBlock(null)
        onSelectImage(null)
        onStartDragBackground(event)
      }}
    >
      {!backgroundImage && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(1000px 380px at 85% 12%, rgba(56,189,248,0.26), transparent 62%), radial-gradient(660px 300px at 12% 90%, rgba(245,158,11,0.24), transparent 68%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
              backgroundSize: '42px 42px',
            }}
          />
        </>
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, rgba(2,6,23,${Math.min(0.88, overlayOpacity / 100 + 0.2)}), rgba(2,6,23,${Math.min(0.95, overlayOpacity / 100 + 0.35)}))`,
        }}
      />

      <div
        className="absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: withAlpha(accent, 0.46) }}
      />

      {images.filter((image) => image.visible).map((image) => {
        const active = activeImageId === image.id
        return (
          <div
            key={image.id}
            className={interactive ? 'absolute z-10 cursor-move select-none' : 'absolute z-10'}
            style={{
              left: `${image.xPct}%`,
              top: `${image.yPct}%`,
              width: `${image.widthPct}%`,
              outline: interactive && active ? `1px dashed ${withAlpha(accent, 0.96)}` : '1px dashed transparent',
              backgroundColor: interactive && active ? withAlpha(accent, 0.08) : 'transparent',
            }}
            onMouseDown={(event) => {
              if (!interactive) return
              event.preventDefault()
              event.stopPropagation()
              onSelectImage(image.id)
              onSelectBlock(null)
              onStartDragImage(event, image)
            }}
          >
            <img
              src={image.src}
              alt={image.label}
              draggable={false}
              className="block w-full h-auto pointer-events-none"
              style={{
                opacity: clamp(image.opacity, 0, 100) / 100,
                transform: `rotate(${image.rotationDeg}deg)`,
                transformOrigin: 'center center',
              }}
            />
          </div>
        )
      })}

      {blocks.filter((block) => block.visible).map((block) => {
        const active = activeBlockId === block.id
        return (
          <div
            key={block.id}
            className={interactive ? 'absolute z-20 px-2 py-1 rounded-md cursor-move select-none' : 'absolute z-20 px-2 py-1'}
            style={{
              left: `${block.xPct}%`,
              top: `${block.yPct}%`,
              width: `${block.widthPct}%`,
              outline: interactive && active ? `1px dashed ${withAlpha(accent, 0.96)}` : '1px dashed transparent',
              backgroundColor: interactive && active ? withAlpha(accent, 0.12) : 'transparent',
            }}
            onMouseDown={(event) => {
              if (!interactive) return
              event.preventDefault()
              event.stopPropagation()
              onSelectBlock(block.id)
              onSelectImage(null)
              onStartDragBlock(event, block)
            }}
          >
            <div
              className="whitespace-pre-wrap break-words"
              style={{
                color: block.color,
                fontFamily: block.fontFamily,
                fontSize: `${block.fontSize}px`,
                fontWeight: block.fontWeight,
                textAlign: block.align,
                lineHeight: 1.15,
                textShadow: getTextShadow(block.shadowStyle, block.shadowColor || '#000000'),
              }}
            >
              {block.text.trim() ? block.text : `${block.label}...`}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ExportPosterPreviewPanel({
  previewRef,
  accent,
  posterWidth,
  posterHeight,
  backgroundImage,
  backgroundPositionXPct,
  backgroundPositionYPct,
  backgroundDragEnabled,
  backgroundScaleXPct,
  backgroundScaleYPct,
  overlayOpacity,
  previewZoomPct,
  blocks,
  images,
  activeBlockId,
  activeImageId,
  onSelectBlock,
  onSelectImage,
  onMoveBlock,
  onMoveImage,
  onMoveBackground,
}: ExportPosterPreviewPanelProps) {
  const interactiveCanvasRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<DragState | null>(null)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current
      const container = interactiveCanvasRef.current
      if (!dragState || !container) return

      const rect = container.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return

      const deltaXPct = ((event.clientX - dragState.startX) / rect.width) * 100
      const deltaYPct = ((event.clientY - dragState.startY) / rect.height) * 100
      if (dragState.kind === 'background') {
        const nextX = clamp(dragState.originXPct + deltaXPct, 0, 100)
        const nextY = clamp(dragState.originYPct + deltaYPct, 0, 100)
        onMoveBackground(nextX, nextY)
        return
      }

      const maxX = Math.max(0, 100 - dragState.widthPct)
      const nextX = clamp(dragState.originXPct + deltaXPct, 0, maxX)
      const nextY = clamp(dragState.originYPct + deltaYPct, 0, 94)

      if (dragState.kind === 'block') {
        onMoveBlock(dragState.id, nextX, nextY)
      } else {
        onMoveImage(dragState.id, nextX, nextY)
      }
    }

    const handleMouseUp = () => {
      dragStateRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [onMoveBackground, onMoveBlock, onMoveImage])

  const safeWidth = Math.max(320, Math.round(posterWidth))
  const safeHeight = Math.max(240, Math.round(posterHeight))
  const safePreviewZoomPct = clamp(Math.round(previewZoomPct), 25, 250)
  const previewScale = safePreviewZoomPct / 100

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
        <Download size={12} />
        Aperçu affiche exportable ({safeWidth}x{safeHeight}) • Zoom {safePreviewZoomPct}%
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3 min-w-[760px]">
        <div className="overflow-auto rounded-xl border border-slate-700 bg-slate-900/60 p-2">
          <div
            className="relative"
            style={{
              width: `${Math.round(safeWidth * previewScale)}px`,
              height: `${Math.round(safeHeight * previewScale)}px`,
            }}
          >
            <div
              ref={interactiveCanvasRef}
              className="relative"
              style={{
                width: `${safeWidth}px`,
                height: `${safeHeight}px`,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
              <PosterCanvasScene
                accent={accent}
                backgroundImage={backgroundImage}
                backgroundPositionXPct={backgroundPositionXPct}
                backgroundPositionYPct={backgroundPositionYPct}
                backgroundDragEnabled={backgroundDragEnabled}
                backgroundScaleXPct={backgroundScaleXPct}
                backgroundScaleYPct={backgroundScaleYPct}
                overlayOpacity={overlayOpacity}
                blocks={blocks}
                images={images}
                activeBlockId={activeBlockId}
                activeImageId={activeImageId}
                interactive
                onSelectBlock={onSelectBlock}
                onSelectImage={onSelectImage}
                onStartDragBlock={(event, block) => {
                  dragStateRef.current = {
                    kind: 'block',
                    id: block.id,
                    originXPct: block.xPct,
                    originYPct: block.yPct,
                    widthPct: block.widthPct,
                    startX: event.clientX,
                    startY: event.clientY,
                  }
                }}
                onStartDragImage={(event, image) => {
                  dragStateRef.current = {
                    kind: 'image',
                    id: image.id,
                    originXPct: image.xPct,
                    originYPct: image.yPct,
                    widthPct: image.widthPct,
                    startX: event.clientX,
                    startY: event.clientY,
                  }
                }}
                onStartDragBackground={(event) => {
                  dragStateRef.current = {
                    kind: 'background',
                    originXPct: backgroundPositionXPct,
                    originYPct: backgroundPositionYPct,
                    startX: event.clientX,
                    startY: event.clientY,
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Offscreen clean render target used for PNG/PDF export (no editing outlines). */}
      <div className="fixed inset-0 -z-10 opacity-0 pointer-events-none overflow-hidden">
        <div
          ref={previewRef}
          style={{
            width: `${safeWidth}px`,
            height: `${safeHeight}px`,
          }}
        >
          <PosterCanvasScene
            accent={accent}
            backgroundImage={backgroundImage}
            backgroundPositionXPct={backgroundPositionXPct}
            backgroundPositionYPct={backgroundPositionYPct}
            backgroundDragEnabled={false}
            backgroundScaleXPct={backgroundScaleXPct}
            backgroundScaleYPct={backgroundScaleYPct}
            overlayOpacity={overlayOpacity}
            blocks={blocks}
            images={images}
            activeBlockId={null}
            activeImageId={null}
            interactive={false}
            onSelectBlock={() => {}}
            onSelectImage={() => {}}
            onStartDragBlock={() => {}}
            onStartDragImage={() => {}}
            onStartDragBackground={() => {}}
          />
        </div>
      </div>
    </div>
  )
}
