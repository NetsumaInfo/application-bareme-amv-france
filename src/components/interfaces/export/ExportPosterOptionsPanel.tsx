import { useRef, type RefObject } from 'react'
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Copy, ImagePlus, RefreshCw, Type } from 'lucide-react'
import { ExportActions } from '@/components/interfaces/export/ExportActions'
import { AppCheckbox } from '@/components/ui/AppCheckbox'
import { AppRangeSlider } from '@/components/ui/AppRangeSlider'
import { AppSelect } from '@/components/ui/AppSelect'
import { COLOR_MEMORY_KEYS } from '@/utils/colorPickerStorage'
import { ColorSwatchPicker } from '@/components/ui/ColorSwatchPicker'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import type {
  ExportContestCategoryOption,
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
  contestCategoryKey: string
  contestCategoryOptions: ExportContestCategoryOption[]
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
  onSetContestCategoryKey: (categoryKey: string) => void
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

/** Compact inline label + value row for sliders */
function SliderRow({
  label,
  value,
  min,
  max,
  step,
  ariaLabel,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  ariaLabel: string
  onChange: (v: number) => void
}) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between">
        <span className="truncate text-[10.5px] text-gray-400">{label}</span>
        <span className="pl-1 text-[10px] text-gray-500 tabular-nums">{Math.round(value)}</span>
      </div>
      <AppRangeSlider min={min} max={max} step={step} value={value} onChange={onChange} ariaLabel={ariaLabel} />
    </div>
  )
}

/** Compact section with a title bar */
function PanelSection({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded border border-gray-700/50 bg-surface-dark/24 overflow-hidden">
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-700/35 bg-surface-dark/35">
        {icon && <span className="text-gray-500 shrink-0">{icon}</span>}
        <span className="text-[10.5px] font-semibold text-gray-300">{title}</span>
      </div>
      <div className="px-2 py-2 space-y-2">{children}</div>
    </section>
  )
}

function useExportPosterOptionsPanelController(props: ExportPosterOptionsPanelProps) {
  const { t } = useI18n()
  const bgFileInputRef = useRef<HTMLInputElement | null>(null)
  const overlayFileInputRef = useRef<HTMLInputElement | null>(null)
  const renderContent = () => renderExportPosterOptionsPanel({
    ...props,
    t,
    bgFileInputRef,
    overlayFileInputRef,
  })
  return { renderContent }
}

export function ExportPosterOptionsPanel(props: ExportPosterOptionsPanelProps) {
  const { renderContent } = useExportPosterOptionsPanelController(props)
  return renderContent()
}

function renderExportPosterOptionsPanel({
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
  contestCategoryKey,
  contestCategoryOptions,
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
  onSetBackgroundScaleUniform,
  onSetOverlayOpacity,
  onSetPreviewZoomPct,
  onSetTopCount,
  onSetJsonExportMode,
  onSetJsonJudgeKey,
  onSetContestCategoryKey,
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
  t,
  bgFileInputRef,
  overlayFileInputRef,
}: ExportPosterOptionsPanelProps & {
  t: ReturnType<typeof useI18n>['t']
  bgFileInputRef: RefObject<HTMLInputElement | null>
  overlayFileInputRef: RefObject<HTMLInputElement | null>
}) {
  const fallbackBlock = blocks[0]
  const activeBlock = blocks.find((block) => block.id === activeBlockId) ?? fallbackBlock
  const activeImage = images.find((image) => image.id === activeImageId) ?? null
  const textAlignOptions: Array<{
    value: 'left' | 'center' | 'right'
    icon: React.ReactNode
    annotation: string
  }> = [
    {
      value: 'left',
      icon: <AlignLeft size={12} />,
      annotation: t('Aligner le texte à gauche'),
    },
    {
      value: 'center',
      icon: <AlignCenter size={12} />,
      annotation: t('Centrer le texte'),
    },
    {
      value: 'right',
      icon: <AlignRight size={12} />,
      annotation: t('Aligner le texte à droite'),
    },
  ]

  return (
    <div className="w-full space-y-1.5">

      {/* ── Format & Zoom ── */}
      <PanelSection title={t('Format')}>
        <div>
          <label className="block text-[10.5px] text-gray-400 mb-1">{t('Catégories concours')}</label>
          <AppSelect
            value={contestCategoryKey}
            onChange={onSetContestCategoryKey}
            ariaLabel={t('Catégories concours')}
            className="w-full"
            options={contestCategoryOptions.map((option) => ({
              value: option.key,
              label: option.label,
            }))}
          />
        </div>
        <AppSelect
          value={selectedSizePreset}
          onChange={onSetSizePreset}
          ariaLabel={t('Taille export')}
          className="w-full"
          options={[
            { value: 'custom', label: t('Custom') },
            ...SIZE_PRESETS.map((preset) => ({
              value: preset.value,
              label: preset.label,
            })),
          ]}
        />
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="block text-[10.5px] text-gray-400 mb-1">{t('Largeur (px)')}</label>
            <input
              type="number"
              min={320}
              max={8000}
              value={posterWidth}
              onChange={(event) => onSetPosterWidth(Number(event.target.value))}
              className="h-7 w-full px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10.5px] text-gray-400 mb-1">{t('Hauteur (px)')}</label>
            <input
              type="number"
              min={240}
              max={8000}
              value={posterHeight}
              onChange={(event) => onSetPosterHeight(Number(event.target.value))}
              className="h-7 w-full px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>
        <SliderRow
          label={t('Zoom aperçu')}
          value={previewZoomPct}
          min={25}
          max={250}
          ariaLabel={t('Zoom aperçu')}
          onChange={onSetPreviewZoomPct}
        />
      </PanelSection>

      {/* ── Arrière-plan ── */}
      <PanelSection icon={<ImagePlus size={11} />} title={t('Arrière-plan')}>
        {/* Couleur de fond */}
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="min-w-0 truncate text-[10.5px] text-gray-400">{t('Couleur du fond')}</span>
            {backgroundColor ? (
              <span className="ml-auto shrink-0 rounded border border-gray-700/70 bg-surface-dark px-1.5 py-0.5 text-[10px] text-gray-400">
                {t('Personnalisée')}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            <HoverTextTooltip text={t('Revenir à la couleur du thème')} className="inline-flex shrink-0">
              <button
                type="button"
                onClick={onResetBackgroundColor}
                className={`h-7 px-2 rounded border text-[11px] transition-colors ${
                  !backgroundColor
                    ? 'border-primary-500 text-primary-300 bg-primary-500/10'
                    : 'border-gray-700 bg-surface-dark text-gray-200 hover:text-white hover:border-gray-600'
                }`}
              >
                {t('Thème')}
              </button>
            </HoverTextTooltip>
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

        {/* Image de fond */}
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
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => bgFileInputRef.current?.click()}
            className="h-7 flex-1 px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
          >
            {backgroundImage ? t('Remplacer image') : t('Choisir image')}
          </button>
          {backgroundImage && (
            <button
              type="button"
              onClick={onClearBackground}
              className="h-7 px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-red-300 hover:text-red-200 hover:border-red-500/60 transition-colors shrink-0"
            >
              {t('Retirer')}
            </button>
          )}
          {backgroundImageSizeLabel && (
            <span className="text-[10px] text-gray-500 shrink-0">{backgroundImageSizeLabel}</span>
          )}
        </div>

        {backgroundImage && (
          <>
            {/* Drag toggle */}
            <button
              type="button"
              onClick={onToggleBackgroundDrag}
              className={`h-7 w-full px-2 rounded border text-[11px] transition-colors ${
                backgroundDragEnabled
                  ? 'border-primary-500 text-primary-300 bg-primary-500/10'
                  : 'border-gray-700 text-gray-200 bg-surface-dark hover:text-white hover:border-gray-600'
              }`}
            >
              {backgroundDragEnabled ? t('Déplacement: actif') : t('Activer déplacement (drag)')}
            </button>

            {/* Sliders fond */}
            <SliderRow
              label={t('Zoom')}
              value={(backgroundScaleXPct + backgroundScaleYPct) / 2}
              min={20}
              max={250}
              ariaLabel={t('Zoom fond global')}
              onChange={onSetBackgroundScaleUniform}
            />
            <div className="grid grid-cols-2 gap-1.5">
              <SliderRow
                label={`X ${Math.round(backgroundPositionXPct)}%`}
                value={backgroundPositionXPct}
                min={0}
                max={100}
                ariaLabel={t('Position X')}
                onChange={onSetBackgroundPositionXPct}
              />
              <SliderRow
                label={`Y ${Math.round(backgroundPositionYPct)}%`}
                value={backgroundPositionYPct}
                min={0}
                max={100}
                ariaLabel={t('Position Y')}
                onChange={onSetBackgroundPositionYPct}
              />
            </div>
          </>
        )}

        {/* Voile */}
        <SliderRow
          label={t('Voile')}
          value={overlayOpacity}
          min={0}
          max={90}
          step={1}
          ariaLabel={t('Opacité du voile')}
          onChange={onSetOverlayOpacity}
        />
      </PanelSection>

      {/* ── Images superposées ── */}
      <PanelSection icon={<ImagePlus size={11} />} title={t('Images superposées')}>
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
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => overlayFileInputRef.current?.click()}
            className="h-7 flex-1 px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
          >
            {t('Ajouter image')}
          </button>
          {activeImage && (
            <button
              type="button"
              onClick={() => onRemoveOverlayImage(activeImage.id)}
              className="h-7 px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-red-300 hover:text-red-200 hover:border-red-500/60 transition-colors shrink-0"
            >
              {t('Supprimer')}
            </button>
          )}
          {activeImageSizeLabel && (
            <span className="text-[10px] text-gray-500 shrink-0">{activeImageSizeLabel}</span>
          )}
        </div>

        {images.length > 0 && (
          <>
            <AppSelect
              value={activeImage?.id ?? ''}
              onChange={(id) => onSelectOverlayImage(id || null)}
              ariaLabel={t('Images superposées')}
              className="w-full"
              options={images.map((image) => ({
                value: image.id,
                label: image.label,
              }))}
            />
            {activeImage && (
              <div className="space-y-1.5">
                <AppCheckbox
                  checked={activeImage.visible}
                  onChange={(visible) => onPatchOverlayImage(activeImage.id, { visible })}
                  label={t('Afficher')}
                  className="gap-1.5"
                />
                {/* Ordre du calque */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-400">
                    {t('Calque')} {images.slice().sort((a, b) => a.zIndex - b.zIndex).findIndex((image) => image.id === activeImage.id) + 1}/{images.length}
                  </span>
                  <div className="flex gap-1 ml-auto">
                    <HoverTextTooltip text={t('Tout devant')} className="inline-flex">
                      <button
                        type="button"
                        onClick={() => onReorderOverlayImage(activeImage.id, 'front')}
                        aria-label={t('Tout devant')}
                        className="h-6 px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
                      >
                        ↟
                      </button>
                    </HoverTextTooltip>
                    <button
                      type="button"
                      onClick={() => onReorderOverlayImage(activeImage.id, 'forward')}
                      aria-label={t("Avancer d'un cran")}
                      className="inline-flex h-6 items-center gap-0.5 px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
                    >
                      <ArrowUp size={10} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onReorderOverlayImage(activeImage.id, 'backward')}
                      aria-label={t("Reculer d'un cran")}
                      className="inline-flex h-6 items-center gap-0.5 px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
                    >
                      <ArrowDown size={10} />
                    </button>
                    <HoverTextTooltip text={t('Tout derrière')} className="inline-flex">
                      <button
                        type="button"
                        onClick={() => onReorderOverlayImage(activeImage.id, 'back')}
                        aria-label={t('Tout derrière')}
                        className="h-6 px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
                      >
                        ↡
                      </button>
                    </HoverTextTooltip>
                  </div>
                </div>
                {/* Sliders image */}
                <div className="grid grid-cols-2 gap-1.5">
                  <SliderRow
                    label={`X ${Math.round(activeImage.xPct)}%`}
                    value={activeImage.xPct}
                    min={0}
                    max={100}
                    ariaLabel={t('Position X')}
                    onChange={(xPct) => onPatchOverlayImage(activeImage.id, { xPct })}
                  />
                  <SliderRow
                    label={`Y ${Math.round(activeImage.yPct)}%`}
                    value={activeImage.yPct}
                    min={0}
                    max={94}
                    ariaLabel={t('Position Y')}
                    onChange={(yPct) => onPatchOverlayImage(activeImage.id, { yPct })}
                  />
                  <SliderRow
                    label={`${t('Taille')} ${Math.round(activeImage.widthPct)}%`}
                    value={activeImage.widthPct}
                    min={4}
                    max={95}
                    ariaLabel={t('Taille')}
                    onChange={(widthPct) => onPatchOverlayImage(activeImage.id, { widthPct })}
                  />
                  <SliderRow
                    label={`${t('Opacité')} ${Math.round(activeImage.opacity)}%`}
                    value={activeImage.opacity}
                    min={0}
                    max={100}
                    ariaLabel={t('Opacité')}
                    onChange={(opacity) => onPatchOverlayImage(activeImage.id, { opacity })}
                  />
                  <SliderRow
                    label={`${t('Rotation')} ${Math.round(activeImage.rotationDeg)}°`}
                    value={activeImage.rotationDeg}
                    min={-180}
                    max={180}
                    ariaLabel={t('Rotation')}
                    onChange={(rotationDeg) => onPatchOverlayImage(activeImage.id, { rotationDeg })}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </PanelSection>

      {/* ── Générateur Top ── */}
      <PanelSection icon={<Copy size={11} />} title={t('Générateur Top')}>
        <div className="grid grid-cols-2 gap-1.5 items-end">
          <div>
            <label className="block text-[10.5px] text-gray-400 mb-1">{t('Nb de places')}</label>
            <input
              type="number"
              min={1}
              max={20}
              value={topCount}
              onChange={(event) => onSetTopCount(Number(event.target.value))}
              className="h-7 w-full px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="space-y-0.5">
            <AppCheckbox checked={includeClipNameInTop} onChange={onToggleClipNameInTop} label={t('Clip')} className="gap-1.5" />
            <AppCheckbox checked={includeScoreInTop} onChange={onToggleScoreInTop} label={t('Score')} className="gap-1.5" />
          </div>
        </div>
        <div className="rounded border border-gray-700 bg-surface-dark px-2 py-1 text-[10.5px] text-gray-300 whitespace-pre-wrap max-h-20 overflow-auto">
          {generatedTopText || t('Aucune ligne de top disponible.')}
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onGenerateTopIntoBlock}
            className="h-7 flex-1 px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
          >
            {t('→ Bloc TOP')}
          </button>
          <button
            type="button"
            onClick={onCopyTop}
            className="h-7 flex-1 px-2 rounded border border-primary-600/50 bg-primary-600/10 text-[11px] text-primary-300 hover:text-primary-200 transition-colors"
          >
            {copiedTop ? t('Copié ✓') : t('Copier')}
          </button>
        </div>
      </PanelSection>

      {/* ── Bloc texte actif ── */}
      {activeBlock && (
        <PanelSection icon={<Type size={11} />} title={`${t('Texte')} — ${activeBlock.label}`}>
          {/* Sélecteur de bloc + visibilité en ligne */}
          <div className="flex items-center gap-1.5">
            <div className="flex-1 min-w-0">
              <AppSelect
                value={activeBlock.id}
                onChange={onSelectBlock}
                ariaLabel={t('Bloc actif')}
                className="w-full"
                options={blocks.map((block) => ({
                  value: block.id,
                  label: block.label,
                }))}
              />
            </div>
            <AppCheckbox
              checked={activeBlock.visible}
              onChange={(visible) => onPatchBlock(activeBlock.id, { visible })}
              label={t('Visible')}
              className="gap-1 shrink-0"
            />
          </div>

          {/* Contenu texte */}
          <textarea
            value={activeBlock.text}
            onChange={(event) => onPatchBlock(activeBlock.id, { text: event.target.value })}
            rows={3}
            placeholder={t('Texte...')}
            className="w-full px-2 py-1 rounded border border-gray-700 bg-surface-dark text-[11px] text-white focus:border-primary-500 focus:outline-none resize-y"
          />

          {/* Police */}
          <div className="flex gap-1.5">
            <div className="flex-1 min-w-0">
              <input
                value={fontSearch}
                onChange={(event) => onSetFontSearch(event.target.value)}
                className="h-7 w-full px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-white focus:border-primary-500 focus:outline-none"
                placeholder={t('Recherche police...')}
              />
            </div>
            <HoverTextTooltip text={t('Scanner polices système')} className="inline-flex">
              <button
                type="button"
                onClick={onLoadSystemFonts}
                disabled={loadingSystemFonts}
                aria-label={t('Scanner polices système')}
                className="h-7 px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-gray-200 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-60 shrink-0"
              >
                {loadingSystemFonts ? '…' : t('Scan')}
              </button>
            </HoverTextTooltip>
          </div>
          {fontLoadMessage && (
            <div className="text-[10px] text-gray-500">{fontLoadMessage}</div>
          )}
          <AppSelect
            value={activeBlock.fontFamily}
            onChange={(fontFamily) => onPatchBlock(activeBlock.id, { fontFamily })}
            ariaLabel={t('Police')}
            className="w-full"
            maxMenuHeight={300}
            options={fontOptions.map((font) => ({
              value: font.value,
              label: font.label,
            }))}
          />
          {/* Police manuelle */}
          <input
            value={activeBlock.fontFamily}
            onChange={(event) => onPatchBlock(activeBlock.id, { fontFamily: event.target.value })}
            className="h-7 w-full px-2 rounded border border-gray-700 bg-surface-dark text-[11px] text-white focus:border-primary-500 focus:outline-none"
            placeholder={t('"Nom Police", sans-serif')}
          />

          {/* Typographie : poids + taille en ligne */}
          <div className="grid gap-1.5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)] gap-1.5">
              <div className="truncate text-[10.5px] text-gray-400">{t('Poids')}</div>
              <div className="truncate text-[10.5px] text-gray-400">{t('Couleur du texte')}</div>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)] gap-1.5 items-end">
              <div>
                <AppSelect
                  value={activeBlock.fontWeight}
                  onChange={(fontWeight) => onPatchBlock(activeBlock.id, { fontWeight: fontWeight as ExportPosterBlock['fontWeight'] })}
                  ariaLabel={t('Poids')}
                  className="w-full"
                  options={[
                    { value: 400, label: '400' },
                    { value: 500, label: '500' },
                    { value: 600, label: '600' },
                    { value: 700, label: '700' },
                    { value: 800, label: '800' },
                    { value: 900, label: '900' },
                  ]}
                />
              </div>
              <div>
                <ColorSwatchPicker
                  value={activeBlock.color}
                  onChange={(color) => onPatchBlock(activeBlock.id, { color })}
                  triggerSize="sm"
                  title={t('Couleur du texte')}
                  memoryKey={COLOR_MEMORY_KEYS.recentGlobal}
                />
              </div>
              <div className="grid gap-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-[10.5px] text-gray-400">{t('Taille : {value}px', { value: activeBlock.fontSize })}</span>
                  <span className="pl-1 text-[10px] text-gray-500 tabular-nums">{activeBlock.fontSize}</span>
                </div>
                <AppRangeSlider
                  min={12}
                  max={180}
                  value={activeBlock.fontSize}
                  onChange={(fontSize) => onPatchBlock(activeBlock.id, { fontSize })}
                  ariaLabel={t('Taille police')}
                />
              </div>
            </div>
          </div>

          {/* Alignement */}
          <div className="grid grid-cols-3 gap-1.5 justify-items-center">
            {textAlignOptions.map((option) => (
              <HoverTextTooltip key={option.value} text={option.annotation} className="inline-flex">
                <button
                  type="button"
                  onClick={() => onPatchBlock(activeBlock.id, { align: option.value })}
                  aria-label={option.annotation}
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-150 ${
                    activeBlock.align === option.value
                      ? 'border-primary-500/70 text-primary-200 bg-primary-500/12 shadow-[0_0_0_1px_rgba(96,165,250,0.12)]'
                      : 'border-gray-700 text-gray-300 bg-surface-dark/70 hover:text-white hover:border-gray-600 hover:bg-surface-dark'
                  }`}
                >
                  {option.icon}
                </button>
              </HoverTextTooltip>
            ))}
          </div>

          {/* Disposition */}
          <SliderRow
            label={`${t('Largeur')} ${activeBlock.widthPct}%`}
            value={activeBlock.widthPct}
            min={20}
            max={95}
            ariaLabel={t('Largeur bloc')}
            onChange={(widthPct) => onPatchBlock(activeBlock.id, { widthPct })}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <SliderRow
              label={`X ${Math.round(activeBlock.xPct)}%`}
              value={activeBlock.xPct}
              min={0}
              max={100}
              ariaLabel={t('Position X')}
              onChange={(xPct) => onPatchBlock(activeBlock.id, { xPct })}
            />
            <SliderRow
              label={`Y ${Math.round(activeBlock.yPct)}%`}
              value={activeBlock.yPct}
              min={0}
              max={94}
              ariaLabel={t('Position Y')}
              onChange={(yPct) => onPatchBlock(activeBlock.id, { yPct })}
            />
          </div>

          {/* Couleur texte + ombre */}
          <div className="grid grid-cols-2 gap-1.5 items-start">
            <div>
              <label className="block text-[10.5px] text-gray-400 mb-1">{t('Ombre')}</label>
              <AppSelect
                value={activeBlock.shadowStyle}
                onChange={(shadowStyle) => onPatchBlock(activeBlock.id, { shadowStyle })}
                ariaLabel={t('Ombre')}
                className="w-full"
                options={[
                  { value: 'none', label: t('Aucune') },
                  { value: 'soft', label: t('Douce') },
                  { value: 'strong', label: t('Forte') },
                  { value: 'outline', label: t('Contour') },
                  { value: 'glow', label: t('Glow') },
                ]}
              />
            </div>
            <div>
              <div className="text-[10.5px] text-gray-400 mb-1">{t('Couleur ombre')}</div>
              <ColorSwatchPicker
                value={activeBlock.shadowColor || '#000000'}
                onChange={(shadowColor) => onPatchBlock(activeBlock.id, { shadowColor })}
                triggerSize="sm"
                title={t("Couleur de l'ombre")}
                memoryKey={COLOR_MEMORY_KEYS.recentGlobal}
              />
            </div>
          </div>
        </PanelSection>
      )}

      {/* Reset */}
      <button
        type="button"
        onClick={onResetPosterLayout}
        className="flex h-7 w-full items-center justify-center gap-1 rounded border border-gray-700 bg-surface-dark px-2 text-[11px] text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
      >
        <RefreshCw size={11} />
        {t('Réinitialiser la mise en page')}
      </button>

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
