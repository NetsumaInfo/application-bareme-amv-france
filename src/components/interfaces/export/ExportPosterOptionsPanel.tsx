import { useRef } from 'react'
import { ArrowDown, ArrowUp, Brush, Copy, ImagePlus, RefreshCw, Type } from 'lucide-react'
import { ExportActions } from '@/components/interfaces/export/ExportActions'
import { COLOR_MEMORY_KEYS } from '@/utils/colorPickerStorage'
import { ColorSwatchPicker } from '@/components/ui/ColorSwatchPicker'
import { useI18n } from '@/i18n'
import type {
  ExportJsonJudgeOption,
  ExportJsonMode,
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
  backgroundColor: string | null
  effectiveBackgroundColor: string
  backgroundColorPresets: string[]
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
  jsonExportMode: ExportJsonMode
  jsonJudgeKey: string
  jsonJudgeOptions: ExportJsonJudgeOption[]
  onSelectBlock: (id: ExportPosterBlockId) => void
  onPatchBlock: (id: ExportPosterBlockId, patch: Partial<ExportPosterBlock>) => void
  onSetFontSearch: (value: string) => void
  onLoadSystemFonts: () => void
  onUploadBackground: (file: File) => void
  onClearBackground: () => void
  onSetBackgroundColor: (value: string) => void
  onResetBackgroundColor: () => void
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
  onSetJsonExportMode: (mode: ExportJsonMode) => void
  onSetJsonJudgeKey: (judgeKey: string) => void
  onToggleClipNameInTop: () => void
  onToggleScoreInTop: () => void
  onGenerateTopIntoBlock: () => void
  onCopyTop: () => void
  onUploadOverlayImage: (file: File) => void
  onSelectOverlayImage: (id: string | null) => void
  onPatchOverlayImage: (id: string, patch: Partial<ExportPosterImageLayer>) => void
  onReorderOverlayImage: (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => void
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
  backgroundColor,
  effectiveBackgroundColor,
  backgroundColorPresets,
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
  jsonExportMode,
  jsonJudgeKey,
  jsonJudgeOptions,
  onSelectBlock,
  onPatchBlock,
  onSetFontSearch,
  onLoadSystemFonts,
  onUploadBackground,
  onClearBackground,
  onSetBackgroundColor,
  onResetBackgroundColor,
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
  onSetJsonExportMode,
  onSetJsonJudgeKey,
  onToggleClipNameInTop,
  onToggleScoreInTop,
  onGenerateTopIntoBlock,
  onCopyTop,
  onUploadOverlayImage,
  onSelectOverlayImage,
  onPatchOverlayImage,
  onReorderOverlayImage,
  onRemoveOverlayImage,
  onResetPosterLayout,
  onExportPng,
  onExportPdf,
  onExportJson,
}: ExportPosterOptionsPanelProps) {
  const { t } = useI18n()
  const bgFileInputRef = useRef<HTMLInputElement | null>(null)
  const overlayFileInputRef = useRef<HTMLInputElement | null>(null)
  const fallbackBlock = blocks[0]
  const activeBlock = blocks.find((block) => block.id === activeBlockId) ?? fallbackBlock
  const activeImage = images.find((image) => image.id === activeImageId) ?? null

  return (
    <div className="w-full rounded-lg border border-gray-700 bg-surface p-3 overflow-y-auto">
      <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
        <Brush size={14} />
        {t('Studio Affiche')}
      </h3>
      <p className="text-[11px] text-gray-500 mb-3">
        {t('Fond custom, calques images, polices système et export image propre.')}
      </p>

      <div className="space-y-3">
        <section className="rounded-lg border border-gray-700/80 bg-surface-dark/40 p-2.5 space-y-2">
          <div className="text-[11px] font-semibold text-gray-200">{t('Taille export')}</div>
          <select
            value={selectedSizePreset}
            onChange={(event) => onSetSizePreset(event.target.value)}
            className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
          >
            <option value="custom">{t('Custom')}</option>
            {SIZE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">{t('Largeur (px)')}</label>
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
              <label className="block text-[11px] text-gray-400 mb-1">{t('Hauteur (px)')}</label>
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
            {t('Taille image export')}: {posterWidth}x{posterHeight} px
          </p>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">{t('Zoom aperçu')}: {Math.round(previewZoomPct)}%</label>
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
            {t('Arrière-plan')}
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="block text-[11px] text-gray-400">{t('Couleur du fond')}</label>
              <span className="text-[10px] text-gray-500">
                {backgroundColor ? t('Personnalisée') : t('Couleur du thème')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResetBackgroundColor}
                className={`px-2 py-1.5 rounded border text-xs transition-colors ${
                  !backgroundColor
                    ? 'border-primary-500 text-primary-300 bg-primary-500/10'
                    : 'border-gray-700 bg-surface-dark text-gray-200 hover:text-white hover:border-gray-600'
                }`}
              >
                {t('Couleur du thème')}
              </button>
              <ColorSwatchPicker
                value={effectiveBackgroundColor}
                onChange={onSetBackgroundColor}
                triggerSize="sm"
                title={t('Couleur de fond')}
                presets={backgroundColorPresets}
                memoryKey={COLOR_MEMORY_KEYS.recentGlobal}
              />
            </div>
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
              {backgroundImage ? t('Remplacer image') : t('Choisir image')}
            </button>
            {backgroundImage && (
              <button
                type="button"
                onClick={onClearBackground}
                className="px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-red-300 hover:text-red-200 hover:border-red-500/60 transition-colors"
              >
                {t('Retirer')}
              </button>
            )}
          </div>
          {backgroundImageSizeLabel && (
            <p className="text-[11px] text-gray-400">
              {t('Taille image source')}: {backgroundImageSizeLabel}
            </p>
          )}
          {backgroundImage && (
            <p className="text-[11px] text-gray-400">
              {t("Taille du fond sur l'affiche")}: {backgroundRenderedSizeLabel}
            </p>
          )}
          {backgroundImage && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  {t('Largeur fond (px)')}
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
                  {t('Hauteur fond (px)')}
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
            {backgroundDragEnabled ? t('Déplacement du fond: actif') : t('Déplacer le fond (drag)')}
          </button>
          <p className="text-[11px] text-gray-400">
            {backgroundImage
              ? t('Clique et glisse dans l’aperçu pour repositionner le fond.')
              : t('Ajoute une image de fond pour activer le déplacement.')}
          </p>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">{t('Position X')}: {Math.round(backgroundPositionXPct)}%</label>
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
            <label className="block text-[11px] text-gray-400 mb-1">{t('Position Y')}: {Math.round(backgroundPositionYPct)}%</label>
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
              {t('Zoom fond global')}: {Math.round((backgroundScaleXPct + backgroundScaleYPct) / 2)}%
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
            <label className="block text-[11px] text-gray-400 mb-1">{t('Largeur fond')}: {Math.round(backgroundScaleXPct)}%</label>
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
            <label className="block text-[11px] text-gray-400 mb-1">{t('Hauteur fond')}: {Math.round(backgroundScaleYPct)}%</label>
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
            <label className="block text-[11px] text-gray-400 mb-1">{t('Opacité du voile')}: {overlayOpacity}%</label>
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
          <div className="text-[11px] font-semibold text-gray-200">{t('Images superposées')}</div>
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
              {t('Ajouter image')}
            </button>
            {activeImage && (
              <button
                type="button"
                onClick={() => onRemoveOverlayImage(activeImage.id)}
                className="px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-red-300 hover:text-red-200 hover:border-red-500/60 transition-colors"
              >
                {t('Supprimer image')}
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
                    {t('Afficher cette image')}
                  </label>
                  <p className="text-[11px] text-gray-400">
                    {t('Déplacement: glisser dans l’aperçu ou ajuster avec les curseurs.')}
                  </p>
                  {activeImageSizeLabel && (
                    <p className="text-[11px] text-gray-400">
                      {t('Taille image')}: {activeImageSizeLabel}
                    </p>
                  )}
                  <div className="space-y-1">
                    <div className="text-[11px] text-gray-400">
                      {t('Ordre du calque')}: {images
                        .slice()
                        .sort((a, b) => a.zIndex - b.zIndex)
                        .findIndex((image) => image.id === activeImage.id) + 1}/{images.length}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onReorderOverlayImage(activeImage.id, 'front')}
                        className="px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
                      >
                        {t('Tout devant')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onReorderOverlayImage(activeImage.id, 'back')}
                        className="px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
                      >
                        {t('Tout derrière')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onReorderOverlayImage(activeImage.id, 'forward')}
                        className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
                      >
                        <ArrowUp size={12} />
                        {t('Devant')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onReorderOverlayImage(activeImage.id, 'backward')}
                        className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
                      >
                        <ArrowDown size={12} />
                        {t('Derrière')}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">{t('Position X')}: {Math.round(activeImage.xPct)}%</label>
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
                    <label className="block text-[11px] text-gray-400 mb-1">{t('Position Y')}: {Math.round(activeImage.yPct)}%</label>
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
                    <label className="block text-[11px] text-gray-400 mb-1">{t('Taille')}: {Math.round(activeImage.widthPct)}%</label>
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
                    <label className="block text-[11px] text-gray-400 mb-1">{t('Opacité')}: {Math.round(activeImage.opacity)}%</label>
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
                    <label className="block text-[11px] text-gray-400 mb-1">{t('Rotation')}: {Math.round(activeImage.rotationDeg)}°</label>
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
            {t('Générateur Top')}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">{t('Nombre de places')}</label>
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
              <label className="block text-[11px] text-gray-400 mb-1">{t('Inclure')}</label>
              <label className="flex items-center gap-1.5 text-[11px] text-gray-300">
                <input type="checkbox" checked={includeClipNameInTop} onChange={onToggleClipNameInTop} />
                {t('Nom du clip')}
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-gray-300">
                <input type="checkbox" checked={includeScoreInTop} onChange={onToggleScoreInTop} />
                {t('Score')}
              </label>
            </div>
          </div>
          <div className="rounded border border-gray-700 bg-surface-dark px-2 py-1.5 text-[11px] text-gray-300 whitespace-pre-wrap max-h-28 overflow-auto">
            {generatedTopText || t('Aucune ligne de top disponible.')}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onGenerateTopIntoBlock}
              className="px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
            >
              {t('Mettre dans bloc TOP')}
            </button>
            <button
              type="button"
              onClick={onCopyTop}
              className="px-2 py-1.5 rounded border border-primary-600/50 bg-primary-600/10 text-xs text-primary-300 hover:text-primary-200 transition-colors"
            >
              {copiedTop ? t('Copié') : t('Copier 1. ...')}
            </button>
          </div>
        </section>

        {activeBlock && (
          <section className="rounded-lg border border-gray-700/80 bg-surface-dark/40 p-2.5 space-y-2">
            <div className="text-[11px] font-semibold text-gray-200 flex items-center gap-1.5">
              <Type size={12} />
              {t('Texte')}: {activeBlock.label}
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">{t('Bloc actif')}</label>
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
              {t('Afficher ce bloc')}
            </label>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">{t('Texte')}</label>
              <textarea
                value={activeBlock.text}
                onChange={(event) => onPatchBlock(activeBlock.id, { text: event.target.value })}
                rows={4}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none resize-y"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">{t('Recherche police')}</label>
              <input
                value={fontSearch}
                onChange={(event) => onSetFontSearch(event.target.value)}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
                placeholder={t("Tape le nom d'une police...")}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onLoadSystemFonts}
                className="px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-gray-200 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-60"
                disabled={loadingSystemFonts}
              >
                {loadingSystemFonts ? t('Scan polices...') : t('Scanner polices système')}
              </button>
              {fontLoadMessage && (
                <div className="text-[11px] text-gray-400 self-center">{fontLoadMessage}</div>
              )}
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">{t('Police')}</label>
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
              <label className="block text-[11px] text-gray-400 mb-1">{t('Police manuelle')}</label>
              <input
                value={activeBlock.fontFamily}
                onChange={(event) => onPatchBlock(activeBlock.id, { fontFamily: event.target.value })}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
                placeholder={t('"Nom Police", sans-serif')}
              />
            </div>
            <div className="rounded border border-gray-700/70 bg-surface-dark/40 p-2 space-y-2">
              <div className="text-[11px] font-medium text-gray-300">{t('Typographie')}</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">{t('Poids')}</label>
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
                  <label className="block text-[11px] text-gray-400 mb-1">{t('Taille : {value}px', { value: activeBlock.fontSize })}</label>
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
              <div className="text-[11px] font-medium text-gray-300">{t('Disposition')}</div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">{t('Largeur : {value}%', { value: activeBlock.widthPct })}</label>
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
                  <label className="block text-[11px] text-gray-400 mb-1">{t('Position X : {value}%', { value: Math.round(activeBlock.xPct) })}</label>
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
                  <label className="block text-[11px] text-gray-400 mb-1">{t('Position Y : {value}%', { value: Math.round(activeBlock.yPct) })}</label>
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
                <label className="block text-[11px] text-gray-400 mb-1">{t('Alignement')}</label>
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
                    {t('Gauche')}
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
                    {t('Centre')}
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
                    {t('Droite')}
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded border border-gray-700/70 bg-surface-dark/40 p-2 space-y-2">
              <div className="text-[11px] font-medium text-gray-300">{t('Style')}</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">{t('Couleur du texte')}</label>
                  <ColorSwatchPicker
                    value={activeBlock.color}
                    onChange={(color) => onPatchBlock(activeBlock.id, { color })}
                    title={t('Couleur du bloc')}
                    memoryKey={COLOR_MEMORY_KEYS.recentGlobal}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">{t('Ombre')}</label>
                  <select
                    value={activeBlock.shadowStyle}
                    onChange={(event) => onPatchBlock(activeBlock.id, { shadowStyle: event.target.value as ExportPosterBlock['shadowStyle'] })}
                    className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="none">{t('Aucune')}</option>
                    <option value="soft">{t('Douce')}</option>
                    <option value="strong">{t('Forte')}</option>
                    <option value="outline">{t('Contour')}</option>
                    <option value="glow">{t('Glow')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">{t('Couleur ombre / contour / glow')}</label>
                <ColorSwatchPicker
                  value={activeBlock.shadowColor || '#000000'}
                  onChange={(shadowColor) => onPatchBlock(activeBlock.id, { shadowColor })}
                  title={t("Couleur de l'ombre")}
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
          {t('Réinitialiser la mise en page affiche')}
        </button>
      </div>

      <ExportActions
        exporting={exporting}
        jsonExportMode={jsonExportMode}
        jsonJudgeKey={jsonJudgeKey}
        jsonJudgeOptions={jsonJudgeOptions}
        onSetJsonExportMode={onSetJsonExportMode}
        onSetJsonJudgeKey={onSetJsonJudgeKey}
        onExportPng={onExportPng}
        onExportPdf={onExportPdf}
        onExportJson={onExportJson}
      />
    </div>
  )
}
