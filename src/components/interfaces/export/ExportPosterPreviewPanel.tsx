import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  DragEvent as ReactDragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  MutableRefObject,
  WheelEvent as ReactWheelEvent,
} from 'react'
import { readFile } from '@tauri-apps/plugin-fs'
import { EyeOff, Image as ImageIcon, Layers, Move, Type, Trash2, X } from 'lucide-react'
import { withAlpha } from '@/utils/colors'
import { useI18n } from '@/i18n'
import { AppRangeSlider } from '@/components/ui/AppRangeSlider'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { listenNativeFileDrop } from '@/services/tauri'
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
  onAddImage: (file: File, placement?: { xPct: number; yPct: number }) => void
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

type ImageEditorState = { imageId: string; x: number; y: number } | null

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
  onOpenImageEditor: (event: ReactMouseEvent<HTMLDivElement>, image: ExportPosterImageLayer) => void
  onOpenBackgroundContextMenu: (event: ReactMouseEvent<HTMLDivElement>) => void
  editingBlockId: ExportPosterBlockId | null
  editingBlockText: string
  onStartEditBlock: (block: ExportPosterBlock) => void
  onSetEditingBlockText: (value: string) => void
  onCommitEditingBlock: () => void
  onCancelEditingBlock: () => void
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
  onOpenImageEditor,
  onOpenBackgroundContextMenu,
  editingBlockId,
  editingBlockText,
  onStartEditBlock,
  onSetEditingBlockText,
  onCommitEditingBlock,
  onCancelEditingBlock,
}: PosterCanvasSceneProps) {
  const editingTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!editingBlockId) return
    editingTextareaRef.current?.focus()
    editingTextareaRef.current?.select()
  }, [editingBlockId])

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
      role="presentation"
    >
      {!backgroundImage && (
        <>
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
              onDoubleClick={(event) => {
                if (!interactive) return
                event.preventDefault()
                event.stopPropagation()
                onOpenImageEditor(event, image)
              }}
              role="presentation"
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
        const editing = editingBlockId === block.id
        return (
          <div
            key={block.id}
            className={interactive ? 'absolute z-20 px-2 py-1 rounded-md cursor-move select-none' : 'absolute z-20 px-2 py-1'}
            style={{
              left: `${block.xPct}%`,
              top: `${block.yPct}%`,
              width: `${block.widthPct}%`,
              outline: interactive && (active || editing) ? `1px dashed ${withAlpha(accent, 0.96)}` : '1px dashed transparent',
              backgroundColor: interactive && active ? withAlpha(accent, 0.12) : 'transparent',
            }}
            onMouseDown={(event) => {
              if (!interactive) return
              if (editing) return
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
            onDoubleClick={(event) => {
              if (!interactive) return
              event.preventDefault()
              event.stopPropagation()
              onStartEditBlock(block)
            }}
            role="presentation"
          >
            {editing ? (
              <textarea
                ref={editingTextareaRef}
                value={editingBlockText}
                onFocus={(event) => event.currentTarget.select()}
                onMouseDown={(event) => event.stopPropagation()}
                onChange={(event) => onSetEditingBlockText(event.target.value)}
                onBlur={onCommitEditingBlock}
                onKeyDown={(event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    onCancelEditingBlock()
                    return
                  }
                  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault()
                    onCommitEditingBlock()
                  }
                }}
                className="block min-h-[2lh] w-full resize-none overflow-hidden rounded bg-black/35 px-1 py-0.5 outline-none ring-1 ring-white/25"
                style={{
                  color: block.color,
                  fontFamily: block.fontFamily,
                  fontSize: `${block.fontSize}px`,
                  fontWeight: block.fontWeight,
                  textAlign: block.align,
                  lineHeight: 1.15,
                  textShadow: getTextShadow(block.shadowStyle, block.shadowColor || '#000000'),
                }}
              />
            ) : (
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
            )}
          </div>
        )
      })}
    </div>
  )
}

function getImageMimeType(pathOrName: string): string {
  const lowered = pathOrName.toLowerCase()
  if (lowered.endsWith('.png')) return 'image/png'
  if (lowered.endsWith('.jpg') || lowered.endsWith('.jpeg')) return 'image/jpeg'
  if (lowered.endsWith('.webp')) return 'image/webp'
  if (lowered.endsWith('.gif')) return 'image/gif'
  if (lowered.endsWith('.bmp')) return 'image/bmp'
  if (lowered.endsWith('.svg')) return 'image/svg+xml'
  return 'image/png'
}

function getFileNameFromPath(pathValue: string): string {
  return pathValue.split(/[\\/]/).pop() || 'image'
}

function isImagePath(pathValue: string): boolean {
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(pathValue)
}

function ImageSliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <div className="grid gap-1">
      <span className="flex items-center justify-between text-[10px] text-gray-400">
        <span>{label}</span>
        <span className="tabular-nums text-gray-500">{Math.round(value)}</span>
      </span>
      <AppRangeSlider value={value} min={min} max={max} step={step} onChange={onChange} ariaLabel={label} />
    </div>
  )
}

function useExportPosterPreviewPanelController({
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
  onAddImage,
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
  const imageEditorRef = useRef<HTMLDivElement | null>(null)
  const lastBrowserImageDropTsRef = useRef(0)
  const [floatingEditorState, setFloatingEditorState] = useState<{
    contextMenu: PosterElementContextMenu
    imageEditor: ImageEditorState
  }>({ contextMenu: null, imageEditor: null })
  const [editingBlockId, setEditingBlockId] = useState<ExportPosterBlockId | null>(null)
  const [editingBlockText, setEditingBlockText] = useState('')
  const [isDraggingImageFile, setIsDraggingImageFile] = useState(false)
  const contextMenu = floatingEditorState.contextMenu
  const imageEditor = floatingEditorState.imageEditor

  const closeFloatingEditors = useCallback(() => {
    setFloatingEditorState({ contextMenu: null, imageEditor: null })
  }, [])

  const showImageDragOverlay = useCallback(() => {
    setIsDraggingImageFile(true)
  }, [])

  const hideImageDragOverlay = useCallback(() => {
    setIsDraggingImageFile(false)
  }, [])

  useEffect(() => {
    if (!contextMenu && !imageEditor) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (target && contextMenuRef.current?.contains(target)) return
      if (target && imageEditorRef.current?.contains(target)) return
      closeFloatingEditors()
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFloatingEditors()
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [closeFloatingEditors, contextMenu, imageEditor])

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
    setFloatingEditorState({
      contextMenu: { ...menu, x, y } as PosterElementContextMenu,
      imageEditor: null,
    })
  }

  const openImageEditor = (imageId: string, x: number, y: number) => {
    onSelectImage(imageId)
    onSelectBlock(null)
    setFloatingEditorState({
      contextMenu: null,
      imageEditor: { imageId, x, y },
    })
  }

  const startEditBlock = (block: ExportPosterBlock) => {
    onSelectBlock(block.id)
    onSelectImage(null)
    setEditingBlockId(block.id)
    setEditingBlockText(block.text)
    closeFloatingEditors()
  }

  const commitEditingBlock = () => {
    if (!editingBlockId) return
    onPatchBlock(editingBlockId, { text: editingBlockText })
    setEditingBlockId(null)
  }

  const cancelEditingBlock = () => {
    setEditingBlockId(null)
    setEditingBlockText('')
  }

  const getDropPlacement = (event: ReactDragEvent<HTMLDivElement>) => {
    const container = interactiveCanvasRef.current
    if (!container) return undefined
    const rect = container.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return undefined
    return {
      xPct: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      yPct: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    }
  }

  const getDroppedImageFiles = (event: ReactDragEvent<HTMLDivElement>) => (
    Array.from(event.dataTransfer.files).filter((file) => (
      file.type.startsWith('image/') || isImagePath(file.name)
    ))
  )

  const hasDraggedImagePayload = (event: ReactDragEvent<HTMLDivElement>) => {
    const files = getDroppedImageFiles(event)
    if (files.length > 0) return true
    return Array.from(event.dataTransfer.items).some((item) => item.kind === 'file' && item.type.startsWith('image/'))
  }

  const handleDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    if (!hasDraggedImagePayload(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    showImageDragOverlay()
  }

  const handleDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    const files = getDroppedImageFiles(event)
    if (files.length === 0) return
    event.preventDefault()
    event.stopPropagation()
    lastBrowserImageDropTsRef.current = Date.now()
    hideImageDragOverlay()
    const placement = getDropPlacement(event)
    for (const file of files) {
      onAddImage(file, placement)
    }
  }

  useEffect(() => {
    let unlistenDrop: (() => void) | null = null

    listenNativeFileDrop({
      onDrop: (paths) => {
        hideImageDragOverlay()
        if (Date.now() - lastBrowserImageDropTsRef.current < 500) return
        const imagePaths = paths.filter(isImagePath)
        for (const imagePath of imagePaths) {
          readFile(imagePath)
            .then((bytes) => {
              const buffer = new ArrayBuffer(bytes.byteLength)
              new Uint8Array(buffer).set(bytes)
              const file = new File(
                [new Blob([buffer], { type: getImageMimeType(imagePath) })],
                getFileNameFromPath(imagePath),
                { type: getImageMimeType(imagePath) },
              )
              onAddImage(file)
            })
            .catch((errorValue) => {
              console.error('Dropped poster image import failed:', errorValue)
            })
        }
      },
      onHover: showImageDragOverlay,
      onCancel: hideImageDragOverlay,
    }).then((fn) => { unlistenDrop = fn })

    const preventBrowserFileDrop = (event: DragEvent) => {
      if (!event.dataTransfer?.types?.includes('Files')) return
      showImageDragOverlay()
      event.preventDefault()
    }

    const resetDragState = () => hideImageDragOverlay()

    window.addEventListener('dragenter', preventBrowserFileDrop)
    window.addEventListener('dragover', preventBrowserFileDrop)
    window.addEventListener('drop', preventBrowserFileDrop)
    window.addEventListener('drop', resetDragState)
    window.addEventListener('blur', resetDragState)
    window.addEventListener('dragend', resetDragState)

    return () => {
      if (unlistenDrop) unlistenDrop()
      window.removeEventListener('dragenter', preventBrowserFileDrop)
      window.removeEventListener('dragover', preventBrowserFileDrop)
      window.removeEventListener('drop', preventBrowserFileDrop)
      window.removeEventListener('drop', resetDragState)
      window.removeEventListener('blur', resetDragState)
      window.removeEventListener('dragend', resetDragState)
    }
  }, [hideImageDragOverlay, onAddImage, showImageDragOverlay])

  const editingImage = imageEditor
    ? images.find((image) => image.id === imageEditor.imageId) ?? null
    : null

  const renderContent = () => (
    <div
      data-screenshot-zone="export-poster"
      className={`flex-1 min-h-0 overflow-auto ${isDraggingImageFile ? 'outline outline-1 outline-primary-400/70 outline-offset-[-1px]' : ''}`}
      onWheel={handlePreviewWheel}
      onDragEnter={(event) => {
        if (hasDraggedImagePayload(event)) showImageDragOverlay()
      }}
      onDragOver={handleDragOver}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        hideImageDragOverlay()
      }}
      onDrop={handleDrop}
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
            onOpenImageEditor={(event, image) => {
              openImageEditor(image.id, event.clientX, event.clientY)
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
            editingBlockId={editingBlockId}
            editingBlockText={editingBlockText}
            onStartEditBlock={startEditBlock}
            onSetEditingBlockText={setEditingBlockText}
            onCommitEditingBlock={commitEditingBlock}
            onCancelEditingBlock={cancelEditingBlock}
          />
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
                label={t('Modifier')}
                icon={ImageIcon}
                onClick={() => {
                  openImageEditor(contextMenu.imageId, contextMenu.x, contextMenu.y)
                }}
              />
              <AppContextMenuItem
                label={t("Masquer l'image")}
                icon={ImageIcon}
                iconSecondary={EyeOff}
                onClick={() => {
                  onPatchImage(contextMenu.imageId, { visible: false })
                  closeFloatingEditors()
                }}
              />
              <AppContextMenuSeparator />
              <AppContextMenuItem
                label={t('Mettre devant')}
                icon={Layers}
                iconSecondary={Move}
                onClick={() => {
                  onReorderImage(contextMenu.imageId, 'front')
                  closeFloatingEditors()
                }}
              />
              <AppContextMenuItem
                label={t("Avancer d'un cran")}
                icon={Layers}
                onClick={() => {
                  onReorderImage(contextMenu.imageId, 'forward')
                  closeFloatingEditors()
                }}
              />
              <AppContextMenuItem
                label={t("Reculer d'un cran")}
                icon={Layers}
                onClick={() => {
                  onReorderImage(contextMenu.imageId, 'backward')
                  closeFloatingEditors()
                }}
              />
              <AppContextMenuItem
                label={t('Mettre derrière')}
                icon={Layers}
                iconSecondary={ImageIcon}
                onClick={() => {
                  onReorderImage(contextMenu.imageId, 'back')
                  closeFloatingEditors()
                }}
              />
              <AppContextMenuSeparator />
              <AppContextMenuItem
                label={t("Supprimer l'image")}
                icon={Trash2}
                danger
                onClick={() => {
                  onRemoveImage(contextMenu.imageId)
                  closeFloatingEditors()
                }}
              />
            </>
          ) : null}

          {contextMenu.kind === 'block' ? (
            <>
              <AppContextMenuItem
                label={t('Modifier')}
                icon={Type}
                onClick={() => {
                  const block = blocks.find((item) => item.id === contextMenu.blockId)
                  if (block) startEditBlock(block)
                }}
              />
              <AppContextMenuItem
                label={t('Masquer le bloc')}
                icon={Type}
                iconSecondary={EyeOff}
                onClick={() => {
                  onPatchBlock(contextMenu.blockId, { visible: false })
                  closeFloatingEditors()
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
                  closeFloatingEditors()
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
                      closeFloatingEditors()
                    }}
                  />
                </>
              ) : null}
            </>
          ) : null}
        </AppContextMenuPanel>
      ) : null}

      {imageEditor && editingImage ? (
        <AppContextMenuPanel
          ref={imageEditorRef}
          x={imageEditor.x}
          y={imageEditor.y}
          minWidthClassName="min-w-[320px]"
          className="max-w-[360px]"
        >
          <div className="p-2">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-12 w-12 overflow-hidden rounded border border-white/10 bg-black/30">
                <img src={editingImage.src} alt={editingImage.label} className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-semibold text-slate-100">{editingImage.label}</div>
                <div className="text-[10px] text-slate-500">{t('Modifier')}</div>
              </div>
              <button
                type="button"
                onClick={() => setFloatingEditorState((prev) => ({ ...prev, imageEditor: null }))}
                className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                aria-label={t('Fermer')}
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <ImageSliderRow
                  label="X"
                  value={editingImage.xPct}
                  min={0}
                  max={100}
                  onChange={(xPct) => onPatchImage(editingImage.id, { xPct })}
                />
                <ImageSliderRow
                  label="Y"
                  value={editingImage.yPct}
                  min={0}
                  max={94}
                  onChange={(yPct) => onPatchImage(editingImage.id, { yPct })}
                />
              </div>
              <ImageSliderRow
                label={t('Taille')}
                value={editingImage.widthPct}
                min={4}
                max={95}
                onChange={(widthPct) => onPatchImage(editingImage.id, { widthPct })}
              />
              <ImageSliderRow
                label={t('Opacité')}
                value={editingImage.opacity}
                min={0}
                max={100}
                onChange={(opacity) => onPatchImage(editingImage.id, { opacity })}
              />
              <ImageSliderRow
                label={t('Rotation')}
                value={editingImage.rotationDeg}
                min={-180}
                max={180}
                onChange={(rotationDeg) => onPatchImage(editingImage.id, { rotationDeg })}
              />
            </div>

            <div className="mt-2 grid grid-cols-4 gap-1">
              <HoverTextTooltip text={t('Tout devant')} className="inline-flex">
                <button
                  type="button"
                  onClick={() => onReorderImage(editingImage.id, 'front')}
                  aria-label={t('Tout devant')}
                  className="rounded border border-slate-700 bg-slate-900 px-1 py-1 text-[10px] text-slate-300 hover:text-white"
                >
                  ↟
                </button>
              </HoverTextTooltip>
              <HoverTextTooltip text={t("Avancer d'un cran")} className="inline-flex">
                <button
                  type="button"
                  onClick={() => onReorderImage(editingImage.id, 'forward')}
                  aria-label={t("Avancer d'un cran")}
                  className="rounded border border-slate-700 bg-slate-900 px-1 py-1 text-[10px] text-slate-300 hover:text-white"
                >
                  ↑
                </button>
              </HoverTextTooltip>
              <HoverTextTooltip text={t("Reculer d'un cran")} className="inline-flex">
                <button
                  type="button"
                  onClick={() => onReorderImage(editingImage.id, 'backward')}
                  aria-label={t("Reculer d'un cran")}
                  className="rounded border border-slate-700 bg-slate-900 px-1 py-1 text-[10px] text-slate-300 hover:text-white"
                >
                  ↓
                </button>
              </HoverTextTooltip>
              <HoverTextTooltip text={t('Tout derrière')} className="inline-flex">
                <button
                  type="button"
                  onClick={() => onReorderImage(editingImage.id, 'back')}
                  aria-label={t('Tout derrière')}
                  className="rounded border border-slate-700 bg-slate-900 px-1 py-1 text-[10px] text-slate-300 hover:text-white"
                >
                  ↡
                </button>
              </HoverTextTooltip>
            </div>
          </div>
        </AppContextMenuPanel>
      ) : null}

      {/* Offscreen clean render target used for PNG/PDF export (no editing outlines). */}
      <div className="fixed left-[-20000px] top-0 -z-10 pointer-events-none overflow-visible" aria-hidden="true">
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
            onOpenImageEditor={() => {}}
            onOpenBackgroundContextMenu={() => {}}
            editingBlockId={null}
            editingBlockText=""
            onStartEditBlock={() => {}}
            onSetEditingBlockText={() => {}}
            onCommitEditingBlock={() => {}}
            onCancelEditingBlock={() => {}}
          />
        </div>
      </div>
    </div>
  )

  return { renderContent }
}

export function ExportPosterPreviewPanel(props: ExportPosterPreviewPanelProps) {
  const { renderContent } = useExportPosterPreviewPanelController(props)
  return renderContent()
}
