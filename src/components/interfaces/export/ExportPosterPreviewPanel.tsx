import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, MutableRefObject, WheelEvent as ReactWheelEvent } from 'react'
import { Download, EyeOff, Image as ImageIcon, Layers, Move, Type, Trash2 } from 'lucide-react'
import { withAlpha } from '@/utils/colors'
import { useI18n } from '@/i18n'
import {
  AppContextMenuItem,
  AppContextMenuPanel,
  AppContextMenuSeparator,
} from '@/components/ui/AppContextMenu'
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
  backgroundColor: string
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
  onSetPreviewZoomPct: (value: number) => void
  onPatchBlock: (id: ExportPosterBlockId, patch: Partial<ExportPosterBlock>) => void
  onPatchImage: (id: string, patch: Partial<ExportPosterImageLayer>) => void
  onRemoveImage: (id: string) => void
  onReorderImage: (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => void
  onClearBackground: () => void
  onToggleBackgroundDrag: () => void
  onMoveBlock: (id: ExportPosterBlockId, xPct: number, yPct: number) => void
  onMoveImage: (id: string, xPct: number, yPct: number) => void
  onMoveBackground: (xPct: number, yPct: number) => void
}

type PosterElementContextMenu =
  | null
  | { x: number; y: number; kind: 'background' }
  | { x: number; y: number; kind: 'image'; imageId: string }
  | { x: number; y: number; kind: 'block'; blockId: ExportPosterBlockId }

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
  backgroundColor: string
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
  onOpenBlockContextMenu: (event: ReactMouseEvent<HTMLDivElement>, block: ExportPosterBlock) => void
  onOpenImageContextMenu: (event: ReactMouseEvent<HTMLDivElement>, image: ExportPosterImageLayer) => void
  onOpenBackgroundContextMenu: (event: ReactMouseEvent<HTMLDivElement>) => void
}

function PosterCanvasScene({
  accent,
  backgroundColor,
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
  onOpenBlockContextMenu,
  onOpenImageContextMenu,
  onOpenBackgroundContextMenu,
}: PosterCanvasSceneProps) {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundColor,
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
      onContextMenu={(event) => {
        if (!interactive) return
        if (event.target !== event.currentTarget) return
        onOpenBackgroundContextMenu(event)
      }}
    >
      {!backgroundImage && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(900px 360px at 82% 12%, ${withAlpha(accent, 0.16)}, transparent 62%)`,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)',
              backgroundSize: '42px 42px',
            }}
          />
        </>
      )}

      {backgroundImage ? (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(2,6,23,${Math.min(0.88, overlayOpacity / 100 + 0.2)}), rgba(2,6,23,${Math.min(0.95, overlayOpacity / 100 + 0.35)}))`,
          }}
        />
      ) : null}

      <div
        className="absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: withAlpha(accent, 0.46) }}
      />

      {images
        .filter((image) => image.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((image) => {
          const active = activeImageId === image.id
          return (
            <div
              key={image.id}
              className={interactive ? 'absolute cursor-move select-none' : 'absolute'}
              style={{
                left: `${image.xPct}%`,
                top: `${image.yPct}%`,
                width: `${image.widthPct}%`,
                zIndex: 10 + image.zIndex,
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
              onContextMenu={(event) => {
                if (!interactive) return
                onOpenImageContextMenu(event, image)
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
            onContextMenu={(event) => {
              if (!interactive) return
              onOpenBlockContextMenu(event, block)
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
  backgroundColor,
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
  onSetPreviewZoomPct,
  onPatchBlock,
  onPatchImage,
  onRemoveImage,
  onReorderImage,
  onClearBackground,
  onToggleBackgroundDrag,
  onMoveBlock,
  onMoveImage,
  onMoveBackground,
}: ExportPosterPreviewPanelProps) {
  const { t } = useI18n()
  const interactiveCanvasRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const contextMenuRef = useRef<HTMLDivElement | null>(null)
  const [contextMenu, setContextMenu] = useState<PosterElementContextMenu>(null)

  useEffect(() => {
    if (!contextMenu) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (target && contextMenuRef.current?.contains(target)) return
      setContextMenu(null)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContextMenu(null)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [contextMenu])

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

  const handlePreviewWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) return
    event.preventDefault()
    const direction = event.deltaY > 0 ? -10 : 10
    onSetPreviewZoomPct(clamp(safePreviewZoomPct + direction, 25, 250))
  }

  const openContextMenu = (x: number, y: number, menu: PosterElementContextMenu) => {
    setContextMenu({
      ...menu,
      x,
      y,
    } as PosterElementContextMenu)
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
        <Download size={12} />
        {t('Aperçu affiche exportable')} ({safeWidth}x{safeHeight}) • {t('Zoom')} {safePreviewZoomPct}% • {t('Ctrl + molette = zoom')}
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3 min-w-[760px]">
        <div
          className="overflow-auto rounded-xl border border-slate-700 bg-slate-900/60 p-2"
          onWheel={handlePreviewWheel}
        >
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
                backgroundColor={backgroundColor}
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
                onOpenBlockContextMenu={(event, block) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onSelectBlock(block.id)
                  onSelectImage(null)
                  openContextMenu(event.clientX, event.clientY, { kind: 'block', blockId: block.id, x: 0, y: 0 })
                }}
                onOpenImageContextMenu={(event, image) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onSelectImage(image.id)
                  onSelectBlock(null)
                  openContextMenu(event.clientX, event.clientY, { kind: 'image', imageId: image.id, x: 0, y: 0 })
                }}
                onOpenBackgroundContextMenu={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onSelectBlock(null)
                  onSelectImage(null)
                  openContextMenu(event.clientX, event.clientY, { kind: 'background', x: 0, y: 0 })
                }}
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

      {contextMenu ? (
        <AppContextMenuPanel
          ref={contextMenuRef}
          x={contextMenu.x}
          y={contextMenu.y}
          minWidthClassName="min-w-[220px]"
        >
          {contextMenu.kind === 'image' ? (
            <>
              <AppContextMenuItem
                label={t("Sélectionner l'image")}
                icon={ImageIcon}
                onClick={() => {
                  onSelectImage(contextMenu.imageId)
                  onSelectBlock(null)
                  setContextMenu(null)
                }}
              />
              <AppContextMenuItem
                label={t("Masquer l'image")}
                icon={ImageIcon}
                iconSecondary={EyeOff}
                onClick={() => {
                  onPatchImage(contextMenu.imageId, { visible: false })
                  setContextMenu(null)
                }}
              />
              <AppContextMenuSeparator />
              <AppContextMenuItem
                label={t('Mettre devant')}
                icon={Layers}
                iconSecondary={Move}
                onClick={() => {
                  onReorderImage(contextMenu.imageId, 'front')
                  setContextMenu(null)
                }}
              />
              <AppContextMenuItem
                label={t("Avancer d'un cran")}
                icon={Layers}
                onClick={() => {
                  onReorderImage(contextMenu.imageId, 'forward')
                  setContextMenu(null)
                }}
              />
              <AppContextMenuItem
                label={t("Reculer d'un cran")}
                icon={Layers}
                onClick={() => {
                  onReorderImage(contextMenu.imageId, 'backward')
                  setContextMenu(null)
                }}
              />
              <AppContextMenuItem
                label={t('Mettre derrière')}
                icon={Layers}
                iconSecondary={ImageIcon}
                onClick={() => {
                  onReorderImage(contextMenu.imageId, 'back')
                  setContextMenu(null)
                }}
              />
              <AppContextMenuSeparator />
              <AppContextMenuItem
                label={t("Supprimer l'image")}
                icon={Trash2}
                danger
                onClick={() => {
                  onRemoveImage(contextMenu.imageId)
                  setContextMenu(null)
                }}
              />
            </>
          ) : null}

          {contextMenu.kind === 'block' ? (
            <>
              <AppContextMenuItem
                label={t('Sélectionner le bloc')}
                icon={Type}
                onClick={() => {
                  onSelectBlock(contextMenu.blockId)
                  onSelectImage(null)
                  setContextMenu(null)
                }}
              />
              <AppContextMenuItem
                label={t('Masquer le bloc')}
                icon={Type}
                iconSecondary={EyeOff}
                onClick={() => {
                  onPatchBlock(contextMenu.blockId, { visible: false })
                  setContextMenu(null)
                }}
              />
            </>
          ) : null}

          {contextMenu.kind === 'background' ? (
            <>
              <AppContextMenuItem
                label={backgroundDragEnabled ? t('Désactiver déplacement du fond') : t('Activer déplacement du fond')}
                icon={ImageIcon}
                iconSecondary={backgroundDragEnabled ? EyeOff : Move}
                onClick={() => {
                  onToggleBackgroundDrag()
                  setContextMenu(null)
                }}
              />
              {backgroundImage ? (
                <>
                  <AppContextMenuSeparator />
                  <AppContextMenuItem
                    label={t("Retirer l'image de fond")}
                    icon={Trash2}
                    danger
                    onClick={() => {
                      onClearBackground()
                      setContextMenu(null)
                    }}
                  />
                </>
              ) : null}
            </>
          ) : null}
        </AppContextMenuPanel>
      ) : null}

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
            backgroundColor={backgroundColor}
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
            onOpenBlockContextMenu={() => {}}
            onOpenImageContextMenu={() => {}}
            onOpenBackgroundContextMenu={() => {}}
          />
        </div>
      </div>
    </div>
  )
}
