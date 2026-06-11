import {
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Subtitles,
  Headphones,
  ImagePlus,
} from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type MutableRefObject } from 'react'
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
import type { OverlayIconScale } from '@/components/player/overlay/overlayConstants'

interface OverlayUtilityControlsProps {
  iconScale: OverlayIconScale
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

const ICON_BTN = `rounded-full text-white/85 transition-colors motion-reduce:transition-none
  hover:bg-primary-500/25 hover:text-white
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400
  shrink-0
  p-1.5 @[700px]/overlay:p-2.5`

export function OverlayUtilityControls({
  iconScale,
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

  const displayedVolume = isMuted ? 0 : volume
  const clampedVolume = Math.max(0, Math.min(100, displayedVolume))
  const volumeGradient = `linear-gradient(to right, rgb(var(--color-primary-500)) 0%, rgb(var(--color-primary-500)) ${clampedVolume}%, rgba(255,255,255,0.28) ${clampedVolume}%, rgba(255,255,255,0.28) 100%)`

  const [volumePanelOpen, setVolumePanelOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openVolumePanel = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setVolumePanelOpen(true)
  }

  const closeVolumePanel = () => {
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

  const muteLabel = isMuted ? t('Activer le son') : t('Couper le son')
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : Volume2

  return (
    <div className="flex items-center min-w-0 gap-1 @[700px]/overlay:gap-2">
      <div
        className="relative shrink-0 @[480px]/overlay:hidden"
        onMouseEnter={openVolumePanel}
        onMouseLeave={closeVolumePanel}
      >
        <HoverTextTooltip text={muteLabel}>
          <button
            type="button"
            onClick={() => setVolumePanelOpen((prev) => !prev)}
            aria-label={muteLabel}
            className={ICON_BTN}
          >
            <VolumeIcon size={iconScale.iconPx} />
          </button>
        </HoverTextTooltip>

        {volumePanelOpen && (
          <div className="absolute bottom-full right-0 mb-2 min-w-[180px] bg-black/85 border border-white/15 rounded-lg shadow-xl p-2 z-50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <HoverTextTooltip text={muteLabel}>
                <button
                  type="button"
                  onClick={onToggleMute}
                  aria-label={muteLabel}
                  className="p-1.5 rounded-full text-white/85 transition-colors motion-reduce:transition-none
                    hover:bg-primary-500/25 hover:text-white
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400
                    shrink-0"
                >
                  <VolumeIcon size={14} />
                </button>
              </HoverTextTooltip>
              <input
                type="range"
                min={0}
                max={100}
                value={displayedVolume}
                onChange={onSetVolume}
                aria-label={t('Volume')}
                className="w-full h-1 rounded-full appearance-none cursor-pointer accent-primary-500
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                style={{ background: volumeGradient }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="hidden @[480px]/overlay:flex items-center gap-1 @[700px]/overlay:gap-2 min-w-0">
        <HoverTextTooltip text={muteLabel}>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muteLabel}
            className={ICON_BTN}
          >
            <VolumeIcon size={iconScale.iconPx} />
          </button>
        </HoverTextTooltip>

        <input
          type="range"
          min={0}
          max={100}
          value={displayedVolume}
          onChange={onSetVolume}
          aria-label={t('Volume')}
          className="flex-1 min-w-[72px] max-w-[160px] h-1 @[700px]/overlay:h-1.5
            rounded-full appearance-none cursor-pointer accent-primary-500
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
            @[700px]/overlay:[&::-webkit-slider-thumb]:w-3.5 @[700px]/overlay:[&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          style={{ background: volumeGradient }}
        />

        {showAudioDb && (
          <div className="hidden @[760px]/overlay:block shrink-0">
            <AudioDbMeter enabled compact={iconScale.iconPx < 18} tiny={false} muted={isMuted || volume === 0} />
          </div>
        )}
      </div>

      <div className="shrink-0">
        <OverlayTrackSelector
          iconScale={iconScale}
          buttonTitle={t('Sous-titres')}
          disabledTitle={t('Pas de sous-titres')}
          enabled={subtitleTracks.length > 0}
          active={currentSubtitleId !== null}
          icon={<Subtitles size={iconScale.iconPx} />}
          open={subMenuOpen}
          containerRef={subRef}
          onToggle={onToggleSubMenu}
          options={subtitleOptions}
        />
      </div>

      <div className="shrink-0">
        <OverlayTrackSelector
          iconScale={iconScale}
          buttonTitle={t('Pistes audio')}
          disabledTitle={t('Audio unique')}
          enabled={audioTracks.length > 1}
          active={currentAudioId !== null && currentAudioId !== audioTracks[0]?.id}
          icon={<Headphones size={iconScale.iconPx} />}
          open={audioMenuOpen}
          containerRef={audioRef}
          onToggle={onToggleAudioMenu}
          options={audioOptions}
        />
      </div>

      {clipInfo.miniaturesEnabled && (
        <HoverTextTooltip text={miniatureLabel}>
          <button
            type="button"
            onClick={onSetMiniatureFrame}
            aria-label={miniatureLabel}
            className={ICON_BTN}
          >
            <ImagePlus size={iconScale.iconPx} />
          </button>
        </HoverTextTooltip>
      )}

      <HoverTextTooltip text={fullscreenLabel}>
        <button
          type="button"
          onClick={isPlayerFullscreen ? onExitFullscreen : onToggleFullscreen}
          aria-label={fullscreenLabel}
          className={`${ICON_BTN} ml-1 @[700px]/overlay:ml-2`}
        >
          {isPlayerFullscreen
            ? <Minimize2 size={iconScale.iconPx} />
            : <Maximize2 size={iconScale.iconPx} />}
        </button>
      </HoverTextTooltip>
    </div>
  )
}
