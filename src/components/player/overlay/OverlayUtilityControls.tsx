import {
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Subtitles,
  Headphones,
  ImagePlus,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MutableRefObject } from 'react'
import AudioDbMeter from '@/components/player/AudioDbMeter'
import type { TrackItem } from '@/services/tauri'
import type { ClipInfo } from '@/components/player/overlay/types'
import { OverlayTrackSelector } from '@/components/player/overlay/OverlayTrackSelector'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import {
  formatShortcutAnnotationForAction,
  type ShortcutAction,
} from '@/utils/shortcuts'

interface OverlayUtilityControlsProps {
  controlsRowWidth: number
  compactControls: boolean
  tinyControls: boolean
  isPlayerFullscreen: boolean
  isMuted: boolean
  volume: number
  showAudioDb: boolean
  shortcutBindings: Partial<Record<ShortcutAction, string>>
  clipInfo: ClipInfo
  subtitleTracks: TrackItem[]
  audioTracks: TrackItem[]
  currentSubtitleId: number | null
  currentAudioId: number | null
  subMenuOpen: boolean
  audioMenuOpen: boolean
  subRef: MutableRefObject<HTMLDivElement | null>
  audioRef: MutableRefObject<HTMLDivElement | null>
  onToggleMute: () => void
  onSetVolume: (event: ChangeEvent<HTMLInputElement>) => void
  onToggleSubMenu: () => void
  onToggleAudioMenu: () => void
  onSelectSubtitle: (id: number | null) => void
  onSelectAudio: (id: number) => void
  onSetMiniatureFrame: () => void
  onExitFullscreen: () => void
  onToggleFullscreen: () => void
}

export function OverlayUtilityControls({
  controlsRowWidth,
  compactControls,
  tinyControls,
  isPlayerFullscreen,
  isMuted,
  volume,
  showAudioDb,
  shortcutBindings,
  clipInfo,
  subtitleTracks,
  audioTracks,
  currentSubtitleId,
  currentAudioId,
  subMenuOpen,
  audioMenuOpen,
  subRef,
  audioRef,
  onToggleMute,
  onSetVolume,
  onToggleSubMenu,
  onToggleAudioMenu,
  onSelectSubtitle,
  onSelectAudio,
  onSetMiniatureFrame,
  onExitFullscreen,
  onToggleFullscreen,
}: OverlayUtilityControlsProps) {
  const { t } = useI18n()
  const miniatureLabel = formatShortcutAnnotationForAction('setMiniatureFrame', shortcutBindings, t)
  const fullscreenLabel = formatShortcutAnnotationForAction(
    isPlayerFullscreen ? 'exitFullscreen' : 'fullscreen',
    shortcutBindings,
    t,
    isPlayerFullscreen ? t('Quitter le plein écran') : t('Agrandir'),
  )
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [utilityWidth, setUtilityWidth] = useState(0)
  const subtitleOptions = [
    {
      key: 'none',
      label: t('Pas de sous-titres'),
      active: currentSubtitleId === null,
      onSelect: () => onSelectSubtitle(null),
    },
    ...subtitleTracks.map((track) => ({
      key: track.id,
      label: `${track.title || track.lang || t('Piste {id}', { id: track.id })}${track.codec ? ` (${track.codec})` : ''}`,
      active: currentSubtitleId === track.id,
      onSelect: () => onSelectSubtitle(track.id),
    })),
  ]

  const audioOptions = audioTracks.map((track) => ({
    key: track.id,
    label: track.title || track.lang || t('Audio {id}', { id: track.id }),
    active: currentAudioId === track.id,
    onSelect: () => onSelectAudio(track.id),
  }))

  useEffect(() => {
    const element = rootRef.current
    if (!element) return

    const update = () => {
      const next = Math.round(element.getBoundingClientRect().width)
      setUtilityWidth((prev) => (prev === next ? prev : next))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const effectiveWidth = Math.max(controlsRowWidth, utilityWidth)
  const inlineVolumeBreakpoint = compactControls ? 280 : 320
  const inlineMeterBreakpoint = compactControls ? 480 : 540
  const iconOnlyAudio = effectiveWidth < inlineVolumeBreakpoint
  const showInlineMeter = showAudioDb && !iconOnlyAudio && effectiveWidth >= inlineMeterBreakpoint
  const volumeSliderWidth = useMemo(() => {
    if (iconOnlyAudio) return 0
    const min = compactControls ? 72 : 92
    const max = compactControls ? 126 : 156
    const rightIconsReserve = compactControls ? 182 : 224
    const miniatureReserve = clipInfo.miniaturesEnabled ? (compactControls ? 30 : 44) : 0
    const meterReserve = showInlineMeter ? (compactControls ? 128 : 148) : 0
    const target = effectiveWidth - rightIconsReserve - miniatureReserve - meterReserve
    return Math.max(min, Math.min(max, target))
  }, [iconOnlyAudio, compactControls, clipInfo.miniaturesEnabled, showInlineMeter, effectiveWidth])
  const displayedVolume = isMuted ? 0 : volume
  const clampedVolume = Math.max(0, Math.min(100, displayedVolume))
  const volumeGradient = `linear-gradient(to right, rgba(59,130,246,0.95) 0%, rgba(59,130,246,0.95) ${clampedVolume}%, rgba(255,255,255,0.28) ${clampedVolume}%, rgba(255,255,255,0.28) 100%)`
  const [volumePanelOpen, setVolumePanelOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openVolumePanel = () => {
    if (!iconOnlyAudio) return
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setVolumePanelOpen(true)
  }

  const closeVolumePanel = () => {
    if (!iconOnlyAudio) return
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => {
      setVolumePanelOpen(false)
      closeTimerRef.current = null
    }, 150)
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  return (
    <div ref={rootRef} className={`flex items-center min-w-0 ${compactControls ? 'gap-1' : 'gap-2'}`}>
      <div
        className="relative shrink-0"
        onMouseEnter={openVolumePanel}
        onMouseLeave={closeVolumePanel}
      >
        <HoverTextTooltip text={isMuted ? t('Activer le son') : t('Couper le son')}>
          <button
            onClick={iconOnlyAudio ? () => setVolumePanelOpen((prev) => !prev) : onToggleMute}
            aria-label={isMuted ? t('Activer le son') : t('Couper le son')}
            className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0`}
          >
            {isMuted || volume === 0 ? <VolumeX size={compactControls ? 16 : 22} /> : <Volume2 size={compactControls ? 16 : 22} />}
          </button>
        </HoverTextTooltip>

        {iconOnlyAudio && volumePanelOpen && (
          <div className="absolute bottom-full right-0 mb-2 min-w-[170px] bg-black/90 border border-white/20 rounded-lg shadow-xl p-2 z-50 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <HoverTextTooltip text={isMuted ? t('Activer le son') : t('Couper le son')}>
                <button
                  onClick={onToggleMute}
                  aria-label={isMuted ? t('Activer le son') : t('Couper le son')}
                  className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0"
                >
                  {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </HoverTextTooltip>
              <input
                type="range"
                min={0}
                max={100}
                value={displayedVolume}
                onChange={onSetVolume}
                className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-primary-500
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                style={{ background: volumeGradient }}
              />
            </div>
          </div>
        )}
      </div>

      {!iconOnlyAudio && (
        <>
          <input
            type="range"
            min={0}
            max={100}
            value={displayedVolume}
            onChange={onSetVolume}
            className={`${compactControls ? 'h-1' : 'h-1.5'} bg-white/30 rounded-full appearance-none cursor-pointer accent-primary-500
              [&::-webkit-slider-thumb]:appearance-none ${compactControls ? '[&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5' : '[&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5'}
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
            `}
            style={{ background: volumeGradient, width: `${volumeSliderWidth}px` }}
          />

          {showInlineMeter && (
            <AudioDbMeter enabled compact={compactControls} tiny={tinyControls} muted={isMuted || volume === 0} />
          )}
        </>
      )}

      <div className="shrink-0">
        <OverlayTrackSelector
          compactControls={compactControls}
          buttonTitle={t('Sous-titres')}
          disabledTitle={t('Pas de sous-titres')}
          enabled={subtitleTracks.length > 0}
          active={currentSubtitleId !== null}
          icon={<Subtitles size={compactControls ? 16 : 22} />}
          open={subMenuOpen}
          containerRef={subRef}
          onToggle={onToggleSubMenu}
          options={subtitleOptions}
        />
      </div>

      <div className="shrink-0">
        <OverlayTrackSelector
          compactControls={compactControls}
          buttonTitle={t('Pistes audio')}
          disabledTitle={t('Audio unique')}
          enabled={audioTracks.length > 1}
          active={currentAudioId !== null && currentAudioId !== audioTracks[0]?.id}
          icon={<Headphones size={compactControls ? 16 : 22} />}
          open={audioMenuOpen}
          containerRef={audioRef}
          onToggle={onToggleAudioMenu}
          options={audioOptions}
        />
      </div>

      {clipInfo.miniaturesEnabled && (
        <HoverTextTooltip text={miniatureLabel}>
          <button
            onClick={onSetMiniatureFrame}
            aria-label={miniatureLabel}
            className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0`}
          >
            <ImagePlus size={compactControls ? 16 : 22} />
          </button>
        </HoverTextTooltip>
      )}

      <HoverTextTooltip text={fullscreenLabel}>
        <button
          onClick={isPlayerFullscreen ? onExitFullscreen : onToggleFullscreen}
          aria-label={fullscreenLabel}
          className={`${compactControls ? 'p-1.5 ml-1' : 'p-2.5 ml-2'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0`}
        >
          {isPlayerFullscreen
            ? <Minimize2 size={compactControls ? 16 : 22} />
            : <Maximize2 size={compactControls ? 16 : 22} />}
        </button>
      </HoverTextTooltip>

    </div>
  )
}
