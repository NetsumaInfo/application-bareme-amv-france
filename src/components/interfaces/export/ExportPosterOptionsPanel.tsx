import { useRef } from 'react'
import { Brush, Copy, ImagePlus, RefreshCw, Type } from 'lucide-react'
import { ExportActions } from '@/components/interfaces/export/ExportActions'
import { COLOR_MEMORY_KEYS } from '@/utils/colorPickerStorage'
import { ColorSwatchPicker } from '@/components/ui/ColorSwatchPicker'
import type {
  ExportPosterBlock,
  ExportPosterBlockId,
  ExportPosterFontOption,
  ExportPosterImageLayer,
} from '@/components/interfaces/export/types'

interface ExportPosterOptionsPanelProps {
  blocks: ExportPosterBlock[]
  activeBlockId: ExportPosterBlockId | null
  images: ExportPosterImageLayer[]
  activeImageId: string | null
  activeImageSizeLabel: string | null
  fontOptions: ExportPosterFontOption[]
  fontSearch: string
  loadingSystemFonts: boolean
  fontLoadMessage: string | null
  selectedSizePreset: string
  posterWidth: number
  posterHeight: number
  backgroundImage: string | null
  backgroundImageSizeLabel: string | null
  backgroundRenderedSizeLabel: string
  backgroundPositionXPct: number
  backgroundPositionYPct: number
  backgroundDragEnabled: boolean
  backgroundScaleXPct: number
  backgroundScaleYPct: number
  overlayOpacity: number
  previewZoomPct: number
  topCount: number
  includeClipNameInTop: boolean
  includeScoreInTop: boolean
  generatedTopText: string
  exporting: boolean
  copiedTop: boolean
  onSelectBlock: (id: ExportPosterBlockId) => void
  onPatchBlock: (id: ExportPosterBlockId, patch: Partial<ExportPosterBlock>) => void
  onSetFontSearch: (value: string) => void
  onLoadSystemFonts: () => void
  onUploadBackground: (file: File) => void
  onClearBackground: () => void
  onSetPosterWidth: (value: number) => void
  onSetPosterHeight: (value: number) => void
  onSetSizePreset: (value: string) => void
  onSetBackgroundPositionXPct: (value: number) => void
  onSetBackgroundPositionYPct: (value: number) => void
  onToggleBackgroundDrag: () => void
  onSetBackgroundScaleXPct: (value: number) => void
  onSetBackgroundScaleYPct: (value: number) => void
  onSetBackgroundScaleUniform: (value: number) => void
  onSetOverlayOpacity: (value: number) => void
  onSetPreviewZoomPct: (value: number) => void
  onSetTopCount: (count: number) => void
  onToggleClipNameInTop: () => void
  onToggleScoreInTop: () => void
  onGenerateTopIntoBlock: () => void
  onCopyTop: () => void
  onUploadOverlayImage: (file: File) => void
  onSelectOverlayImage: (id: string | null) => void
  onPatchOverlayImage: (id: string, patch: Partial<ExportPosterImageLayer>) => void
  onRemoveOverlayImage: (id: string) => void
  onResetPosterLayout: () => void
  onExportPng: () => void
  onExportPdf: () => void
  onExportJson: () => void
}

const SIZE_PRESETS = [
  { value: '1920x1080', label: 'Full HD paysage (1920x1080)' },
  { value: '1080x1920', label: 'Story vertical (1080x1920)' },
  { value: '1080x1350', label: 'Post IG (1080x1350)' },
  { value: '2048x1152', label: '2K paysage (2048x1152)' },
]

export function ExportPosterOptionsPanel({
  blocks,
  activeBlockId,
  images,
  activeImageId,
  activeImageSizeLabel,
  fontOptions,
  fontSearch,
  loadingSystemFonts,
  fontLoadMessage,
  selectedSizePreset,
  posterWidth,
  posterHeight,
  backgroundImage,
  backgroundImageSizeLabel,
  backgroundRenderedSizeLabel,
  backgroundPositionXPct,
  backgroundPositionYPct,
  backgroundDragEnabled,
  backgroundScaleXPct,
  backgroundScaleYPct,
  overlayOpacity,
  previewZoomPct,
  topCount,
  includeClipNameInTop,
  includeScoreInTop,
  generatedTopText,
  exporting,
  copiedTop,
  onSelectBlock,
  onPatchBlock,
  onSetFontSearch,
  onLoadSystemFonts,
  onUploadBackground,
  onClearBackground,
  onSetPosterWidth,
  onSetPosterHeight,
  onSetSizePreset,
  onSetBackgroundPositionXPct,
  onSetBackgroundPositionYPct,
  onToggleBackgroundDrag,
  onSetBackgroundScaleXPct,
  onSetBackgroundScaleYPct,
  onSetBackgroundScaleUniform,
  onSetOverlayOpacity,
  onSetPreviewZoomPct,
  onSetTopCount,
  onToggleClipNameInTop,
  onToggleScoreInTop,
  onGenerateTopIntoBlock,
  onCopyTop,
  onUploadOverlayImage,
  onSelectOverlayImage,
  onPatchOverlayImage,
  onRemoveOverlayImage,
  onResetPosterLayout,
  onExportPng,
  onExportPdf,
  onExportJson,
}: ExportPosterOptionsPanelProps) {
  const bgFileInputRef = useRef<HTMLInputElement | null>(null)
  const overlayFileInputRef = useRef<HTMLInputElement | null>(null)
  const fallbackBlock = blocks[0]
  const activeBlock = blocks.find((block) => block.id === activeBlockId) ?? fallbackBlock
  const activeImage = images.find((image) => image.id === activeImageId) ?? null

  return (
    <div className="w-full rounded-lg border border-gray-700 bg-surface p-3 overflow-y-auto">
      <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
        <Brush size={14} />
        Studio Affiche
      </h3>
      <p className="text-[11px] text-gray-500 mb-3">
        Fond custom, calques images, polices système et export image propre.
      </p>

      <div className="space-y-3">
        <section className="rounded-lg border border-gray-700/80 bg-surface-dark/40 p-2.5 space-y-2">
          <div className="text-[11px] font-semibold text-gray-200">Taille export</div>
          <select
            value={selectedSizePreset}
            onChange={(event) => onSetSizePreset(event.target.value)}
            className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
          >
            <option value="custom">Custom</option>
            {SIZE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Largeur (px)</label>
              <input
                type="number"
                min={320}
                max={8000}
                value={posterWidth}
                onChange={(event) => onSetPosterWidth(Number(event.target.value))}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Hauteur (px)</label>
              <input
                type="number"
                min={240}
                max={8000}
                value={posterHeight}
                onChange={(event) => onSetPosterHeight(Number(event.target.value))}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            Taille image export: {posterWidth}x{posterHeight} px
          </p>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Zoom aperçu: {Math.round(previewZoomPct)}%</label>
            <input
              type="range"
              min={25}
              max={250}
              value={previewZoomPct}
              onChange={(event) => onSetPreviewZoomPct(Number(event.target.value))}
              className="w-full"
            />
          </div>
        </section>

        <section className="rounded-lg border border-gray-700/80 bg-surface-dark/40 p-2.5 space-y-2">
          <div className="text-[11px] font-semibold text-gray-200 flex items-center gap-1.5">
            <ImagePlus size={12} />
            Arrière-plan
          </div>
          <input
            ref={bgFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              onUploadBackground(file)
              event.target.value = ''
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => bgFileInputRef.current?.click()}
              className="px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
            >
              {backgroundImage ? 'Remplacer image' : 'Choisir image'}
            </button>
            {backgroundImage && (
              <button
                type="button"
                onClick={onClearBackground}
                className="px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-red-300 hover:text-red-200 hover:border-red-500/60 transition-colors"
              >
                Retirer
              </button>
            )}
          </div>
          {backgroundImageSizeLabel && (
            <p className="text-[11px] text-gray-400">
              Taille image source: {backgroundImageSizeLabel}
            </p>
          )}
          {backgroundImage && (
            <p className="text-[11px] text-gray-400">
              Taille du fond sur l'affiche: {backgroundRenderedSizeLabel}
            </p>
          )}
          {backgroundImage && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Largeur fond (px)
                </label>
                <input
                  type="number"
                  min={Math.round((posterWidth * 20) / 100)}
                  max={Math.round((posterWidth * 250) / 100)}
                  value={Math.round((posterWidth * backgroundScaleXPct) / 100)}
                  onChange={(event) => {
                    const nextPx = Number(event.target.value)
                    if (!Number.isFinite(nextPx) || posterWidth <= 0) return
                    onSetBackgroundScaleXPct((nextPx / posterWidth) * 100)
                  }}
                  className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Hauteur fond (px)
                </label>
                <input
                  type="number"
                  min={Math.round((posterHeight * 20) / 100)}
                  max={Math.round((posterHeight * 250) / 100)}
                  value={Math.round((posterHeight * backgroundScaleYPct) / 100)}
                  onChange={(event) => {
                    const nextPx = Number(event.target.value)
                    if (!Number.isFinite(nextPx) || posterHeight <= 0) return
                    onSetBackgroundScaleYPct((nextPx / posterHeight) * 100)
                  }}
                  className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleBackgroundDrag}
            disabled={!backgroundImage}
            className={`px-2 py-1.5 rounded border text-xs transition-colors disabled:opacity-50 ${
              backgroundDragEnabled
                ? 'border-primary-500 text-primary-300 bg-primary-500/10'
                : 'border-gray-700 text-gray-200 bg-surface-dark hover:text-white hover:border-gray-600'
            }`}
          >
            {backgroundDragEnabled ? 'Déplacement du fond: actif' : 'Déplacer le fond (drag)'}
          </button>
          <p className="text-[11px] text-gray-400">
            {backgroundImage
              ? 'Clique et glisse dans l’aperçu pour repositionner le fond.'
              : 'Ajoute une image de fond pour activer le déplacement.'}
          </p>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Position X: {Math.round(backgroundPositionXPct)}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={backgroundPositionXPct}
              onChange={(event) => onSetBackgroundPositionXPct(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Position Y: {Math.round(backgroundPositionYPct)}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={backgroundPositionYPct}
              onChange={(event) => onSetBackgroundPositionYPct(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">
              Zoom fond global: {Math.round((backgroundScaleXPct + backgroundScaleYPct) / 2)}%
            </label>
            <input
              type="range"
              min={20}
              max={250}
              value={(backgroundScaleXPct + backgroundScaleYPct) / 2}
              onChange={(event) => onSetBackgroundScaleUniform(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Largeur fond: {Math.round(backgroundScaleXPct)}%</label>
            <input
              type="range"
              min={20}
              max={250}
              value={backgroundScaleXPct}
              onChange={(event) => onSetBackgroundScaleXPct(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Hauteur fond: {Math.round(backgroundScaleYPct)}%</label>
            <input
              type="range"
              min={20}
              max={250}
              value={backgroundScaleYPct}
              onChange={(event) => onSetBackgroundScaleYPct(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Opacité du voile: {overlayOpacity}%</label>
            <input
              type="range"
              min={0}
              max={90}
              step={1}
              value={overlayOpacity}
              onChange={(event) => onSetOverlayOpacity(Number(event.target.value))}
              className="w-full"
            />
          </div>
        </section>

        <section className="rounded-lg border border-gray-700/80 bg-surface-dark/40 p-2.5 space-y-2">
          <div className="text-[11px] font-semibold text-gray-200">Images superposées</div>
          <input
            ref={overlayFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              onUploadOverlayImage(file)
              event.target.value = ''
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => overlayFileInputRef.current?.click()}
              className="px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
            >
              Ajouter image
            </button>
            {activeImage && (
              <button
                type="button"
                onClick={() => onRemoveOverlayImage(activeImage.id)}
                className="px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-red-300 hover:text-red-200 hover:border-red-500/60 transition-colors"
              >
                Supprimer image
              </button>
            )}
          </div>
          {images.length > 0 && (
            <>
              <select
                value={activeImage?.id ?? ''}
                onChange={(event) => onSelectOverlayImage(event.target.value || null)}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
              >
                {images.map((image) => (
                  <option key={image.id} value={image.id}>
                    {image.label}
                  </option>
                ))}
              </select>
              {activeImage && (
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-300">
                    <input
                      type="checkbox"
                      checked={activeImage.visible}
                      onChange={() => onPatchOverlayImage(activeImage.id, { visible: !activeImage.visible })}
                    />
                    Afficher cette image
                  </label>
                  <p className="text-[11px] text-gray-400">
                    Déplacement: glisser dans l’aperçu ou ajuster avec les curseurs.
                  </p>
                  {activeImageSizeLabel && (
                    <p className="text-[11px] text-gray-400">
                      Taille image: {activeImageSizeLabel}
                    </p>
                  )}
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Position X: {Math.round(activeImage.xPct)}%</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={activeImage.xPct}
                      onChange={(event) => onPatchOverlayImage(activeImage.id, { xPct: Number(event.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Position Y: {Math.round(activeImage.yPct)}%</label>
                    <input
                      type="range"
                      min={0}
                      max={94}
                      value={activeImage.yPct}
                      onChange={(event) => onPatchOverlayImage(activeImage.id, { yPct: Number(event.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Taille: {Math.round(activeImage.widthPct)}%</label>
                    <input
                      type="range"
                      min={4}
                      max={95}
                      value={activeImage.widthPct}
                      onChange={(event) => onPatchOverlayImage(activeImage.id, { widthPct: Number(event.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Opacité: {Math.round(activeImage.opacity)}%</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={activeImage.opacity}
                      onChange={(event) => onPatchOverlayImage(activeImage.id, { opacity: Number(event.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Rotation: {Math.round(activeImage.rotationDeg)}°</label>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      value={activeImage.rotationDeg}
                      onChange={(event) => onPatchOverlayImage(activeImage.id, { rotationDeg: Number(event.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section className="rounded-lg border border-gray-700/80 bg-surface-dark/40 p-2.5 space-y-2">
          <div className="text-[11px] font-semibold text-gray-200 flex items-center gap-1.5">
            <Copy size={12} />
            Générateur Top
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Nombre de places</label>
              <input
                type="number"
                min={1}
                max={20}
                value={topCount}
                onChange={(event) => onSetTopCount(Number(event.target.value))}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-gray-400 mb-1">Inclure</label>
              <label className="flex items-center gap-1.5 text-[11px] text-gray-300">
                <input type="checkbox" checked={includeClipNameInTop} onChange={onToggleClipNameInTop} />
                Nom du clip
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-gray-300">
                <input type="checkbox" checked={includeScoreInTop} onChange={onToggleScoreInTop} />
                Score
              </label>
            </div>
          </div>
          <div className="rounded border border-gray-700 bg-surface-dark px-2 py-1.5 text-[11px] text-gray-300 whitespace-pre-wrap max-h-28 overflow-auto">
            {generatedTopText || 'Aucune ligne de top disponible.'}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onGenerateTopIntoBlock}
              className="px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
            >
              Mettre dans bloc TOP
            </button>
            <button
              type="button"
              onClick={onCopyTop}
              className="px-2 py-1.5 rounded border border-primary-600/50 bg-primary-600/10 text-xs text-primary-300 hover:text-primary-200 transition-colors"
            >
              {copiedTop ? 'Copié' : 'Copier 1. ...'}
            </button>
          </div>
        </section>

        {activeBlock && (
          <section className="rounded-lg border border-gray-700/80 bg-surface-dark/40 p-2.5 space-y-2">
            <div className="text-[11px] font-semibold text-gray-200 flex items-center gap-1.5">
              <Type size={12} />
              Texte: {activeBlock.label}
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Bloc actif</label>
              <select
                value={activeBlock.id}
                onChange={(event) => onSelectBlock(event.target.value as ExportPosterBlockId)}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
              >
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-gray-300">
              <input
                type="checkbox"
                checked={activeBlock.visible}
                onChange={() => onPatchBlock(activeBlock.id, { visible: !activeBlock.visible })}
              />
              Afficher ce bloc
            </label>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Texte</label>
              <textarea
                value={activeBlock.text}
                onChange={(event) => onPatchBlock(activeBlock.id, { text: event.target.value })}
                rows={4}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none resize-y"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Recherche police</label>
              <input
                value={fontSearch}
                onChange={(event) => onSetFontSearch(event.target.value)}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
                placeholder="Tape le nom d'une police..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onLoadSystemFonts}
                className="px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-gray-200 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-60"
                disabled={loadingSystemFonts}
              >
                {loadingSystemFonts ? 'Scan polices...' : 'Scanner polices système'}
              </button>
              {fontLoadMessage && (
                <div className="text-[11px] text-gray-400 self-center">{fontLoadMessage}</div>
              )}
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Police</label>
              <select
                value={activeBlock.fontFamily}
                onChange={(event) => onPatchBlock(activeBlock.id, { fontFamily: event.target.value })}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
              >
                {fontOptions.map((font) => (
                  <option key={`${font.label}-${font.value}`} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Police manuelle</label>
              <input
                value={activeBlock.fontFamily}
                onChange={(event) => onPatchBlock(activeBlock.id, { fontFamily: event.target.value })}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
                placeholder='"Nom Police", sans-serif'
              />
            </div>
            <div className="rounded border border-gray-700/70 bg-surface-dark/40 p-2 space-y-2">
              <div className="text-[11px] font-medium text-gray-300">Typographie</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Poids</label>
                  <select
                    value={activeBlock.fontWeight}
                    onChange={(event) => onPatchBlock(activeBlock.id, { fontWeight: Number(event.target.value) as ExportPosterBlock['fontWeight'] })}
                    className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value={400}>400</option>
                    <option value={500}>500</option>
                    <option value={600}>600</option>
                    <option value={700}>700</option>
                    <option value={800}>800</option>
                    <option value={900}>900</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Taille: {activeBlock.fontSize}px</label>
                  <input
                    type="range"
                    min={12}
                    max={180}
                    value={activeBlock.fontSize}
                    onChange={(event) => onPatchBlock(activeBlock.id, { fontSize: Number(event.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <div className="rounded border border-gray-700/70 bg-surface-dark/40 p-2 space-y-2">
              <div className="text-[11px] font-medium text-gray-300">Disposition</div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Largeur: {activeBlock.widthPct}%</label>
                <input
                  type="range"
                  min={20}
                  max={95}
                  value={activeBlock.widthPct}
                  onChange={(event) => onPatchBlock(activeBlock.id, { widthPct: Number(event.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Position X: {Math.round(activeBlock.xPct)}%</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={activeBlock.xPct}
                    onChange={(event) => onPatchBlock(activeBlock.id, { xPct: Number(event.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Position Y: {Math.round(activeBlock.yPct)}%</label>
                  <input
                    type="range"
                    min={0}
                    max={94}
                    value={activeBlock.yPct}
                    onChange={(event) => onPatchBlock(activeBlock.id, { yPct: Number(event.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Alignement</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onPatchBlock(activeBlock.id, { align: 'left' })}
                    className={`px-2 py-1.5 rounded border text-[11px] ${
                      activeBlock.align === 'left'
                        ? 'border-primary-500 text-primary-300 bg-primary-500/10'
                        : 'border-gray-700 text-gray-300 hover:text-white hover:border-gray-600'
                    } transition-colors`}
                  >
                    Gauche
                  </button>
                  <button
                    type="button"
                    onClick={() => onPatchBlock(activeBlock.id, { align: 'center' })}
                    className={`px-2 py-1.5 rounded border text-[11px] ${
                      activeBlock.align === 'center'
                        ? 'border-primary-500 text-primary-300 bg-primary-500/10'
                        : 'border-gray-700 text-gray-300 hover:text-white hover:border-gray-600'
                    } transition-colors`}
                  >
                    Centre
                  </button>
                  <button
                    type="button"
                    onClick={() => onPatchBlock(activeBlock.id, { align: 'right' })}
                    className={`px-2 py-1.5 rounded border text-[11px] ${
                      activeBlock.align === 'right'
                        ? 'border-primary-500 text-primary-300 bg-primary-500/10'
                        : 'border-gray-700 text-gray-300 hover:text-white hover:border-gray-600'
                    } transition-colors`}
                  >
                    Droite
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded border border-gray-700/70 bg-surface-dark/40 p-2 space-y-2">
              <div className="text-[11px] font-medium text-gray-300">Style</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Couleur du texte</label>
                  <ColorSwatchPicker
                    value={activeBlock.color}
                    onChange={(color) => onPatchBlock(activeBlock.id, { color })}
                    title="Couleur du bloc"
                    memoryKey={COLOR_MEMORY_KEYS.recentGlobal}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Ombre</label>
                  <select
                    value={activeBlock.shadowStyle}
                    onChange={(event) => onPatchBlock(activeBlock.id, { shadowStyle: event.target.value as ExportPosterBlock['shadowStyle'] })}
                    className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="none">Aucune</option>
                    <option value="soft">Douce</option>
                    <option value="strong">Forte</option>
                    <option value="outline">Contour</option>
                    <option value="glow">Glow</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Couleur ombre / contour / glow</label>
                <ColorSwatchPicker
                  value={activeBlock.shadowColor || '#000000'}
                  onChange={(shadowColor) => onPatchBlock(activeBlock.id, { shadowColor })}
                  title="Couleur de l'ombre"
                  memoryKey={COLOR_MEMORY_KEYS.recentGlobal}
                />
              </div>
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={onResetPosterLayout}
          className="w-full rounded border border-gray-700 bg-surface-dark px-2 py-1.5 text-xs text-gray-300 hover:text-white hover:border-gray-600 transition-colors flex items-center justify-center gap-1.5"
        >
          <RefreshCw size={12} />
          Réinitialiser la mise en page affiche
        </button>
      </div>

      <ExportActions
        exporting={exporting}
        onExportPng={onExportPng}
        onExportPdf={onExportPdf}
        onExportJson={onExportJson}
      />
    </div>
  )
}
