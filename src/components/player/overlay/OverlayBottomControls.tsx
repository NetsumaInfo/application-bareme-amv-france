import { type ChangeEvent, type MutableRefObject } from 'react'
import type { TrackItem } from '@/services/tauri'
import type { ClipInfo, MarkerTooltip, OverlayTimecodeMarker } from '@/components/player/overlay/types'
import { OverlayTimeline } from '@/components/player/overlay/OverlayTimeline'
import { OverlayTransportControls } from '@/components/player/overlay/OverlayTransportControls'
import { OverlayUtilityControls } from '@/components/player/overlay/OverlayUtilityControls'
import type { ShortcutAction } from '@/utils/shortcuts'
import type { OverlayIconScale } from '@/components/player/overlay/overlayConstants'

interface OverlayBottomControlsProps {
  isPlayerFullscreen: boolean
  controlsVisible: boolean
  iconScale: OverlayIconScale
  currentTime: number
  duration: number
  clipInfo: ClipInfo
  visibleMarkers: OverlayTimecodeMarker[]
  markerTooltip: MarkerTooltip | null
  isPlaying: boolean
  volume: number
  isMuted: boolean
  showAudioDb: boolean
  shortcutBindings: Partial<Record<ShortcutAction, string>>
  subtitleTracks: TrackItem[]
  audioTracks: TrackItem[]
  currentSubtitleId: number | null
  currentAudioId: number | null
  subMenuOpen: boolean
  audioMenuOpen: boolean
  subRef: MutableRefObject<HTMLDivElement | null>
  audioRef: MutableRefObject<HTMLDivElement | null>
  onSeek: (event: ChangeEvent<HTMLInputElement>) => void
  onMarkerJump: (marker: OverlayTimecodeMarker) => void
  onMarkerTooltipChange: (tooltip: MarkerTooltip | null) => void
  onPrevClip: () => void
  onNextClip: () => void
  onSeekRelative: (delta: number) => void
  onTogglePause: () => void
  onToggleMute: () => void
  onSetVolume: (event: ChangeEvent<HTMLInputElement>) => void
  onToggleSubMenu: () => void
  onToggleAudioMenu: () => void
  onSelectSubtitle: (id: number | null) => void
  onSelectAudio: (id: number) => void
  onSetMiniatureFrame: () => void
  onExitFullscreen: () => void
  onToggleFullscreen: () => void
  onPin?: () => void
  onUnpin?: () => void
}

export function OverlayBottomControls({
  isPlayerFullscreen,
  controlsVisible,
  iconScale,
  currentTime,
  duration,
  clipInfo,
  visibleMarkers,
  markerTooltip,
  isPlaying,
  volume,
  isMuted,
  showAudioDb,
  shortcutBindings,
  subtitleTracks,
  audioTracks,
  currentSubtitleId,
  currentAudioId,
  subMenuOpen,
  audioMenuOpen,
  subRef,
  audioRef,
  onSeek,
  onMarkerJump,
  onMarkerTooltipChange,
  onPrevClip,
  onNextClip,
  onSeekRelative,
  onTogglePause,
  onToggleMute,
  onSetVolume,
  onToggleSubMenu,
  onToggleAudioMenu,
  onSelectSubtitle,
  onSelectAudio,
  onSetMiniatureFrame,
  onExitFullscreen,
  onToggleFullscreen,
  onPin,
  onUnpin,
}: OverlayBottomControlsProps) {
  const hasVideo = clipInfo.hasVideo !== false

  return (
    <div
      onMouseEnter={onPin}
      onMouseLeave={onUnpin}
      className={`absolute bottom-0 left-0 right-0 px-3 pb-2 pt-10 @[700px]/overlay:px-6 @[700px]/overlay:pb-4 @[700px]/overlay:pt-14
        bg-linear-to-t from-black/75 via-black/35 to-transparent backdrop-blur-[2px]
        transition-all duration-300 motion-reduce:transition-none ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      data-fullscreen={isPlayerFullscreen ? 'true' : 'false'}
    >
      <OverlayTimeline
        iconScale={iconScale}
        currentTime={hasVideo ? currentTime : 0}
        duration={hasVideo ? duration : 0}
        visibleMarkers={hasVideo ? visibleMarkers : []}
        markerTooltip={markerTooltip}
        onSeek={hasVideo ? onSeek : () => {}}
        onMarkerJump={hasVideo ? onMarkerJump : () => {}}
        onMarkerTooltipChange={hasVideo ? onMarkerTooltipChange : () => {}}
      />

      <div className="flex items-center justify-between gap-1 @[700px]/overlay:gap-2">
        <div className="shrink-0">
          <OverlayTransportControls
            iconScale={iconScale}
            clipInfo={clipInfo}
            isPlaying={hasVideo ? isPlaying : false}
            shortcutBindings={shortcutBindings}
            onPrevClip={onPrevClip}
            onNextClip={onNextClip}
            onSeekRelative={hasVideo ? onSeekRelative : () => {}}
            onTogglePause={hasVideo ? onTogglePause : () => {}}
          />
        </div>

        <div className="min-w-0 flex flex-1 justify-end">
          <OverlayUtilityControls
            iconScale={iconScale}
            isPlayerFullscreen={isPlayerFullscreen}
            isMuted={hasVideo ? isMuted : true}
            volume={hasVideo ? volume : 0}
            showAudioDb={showAudioDb}
            shortcutBindings={shortcutBindings}
            clipInfo={clipInfo}
            subtitleTracks={subtitleTracks}
            audioTracks={audioTracks}
            currentSubtitleId={currentSubtitleId}
            currentAudioId={currentAudioId}
            subMenuOpen={subMenuOpen}
            audioMenuOpen={audioMenuOpen}
            subRef={subRef}
            audioRef={audioRef}
            onToggleMute={hasVideo ? onToggleMute : () => {}}
            onSetVolume={hasVideo ? onSetVolume : () => {}}
            onToggleSubMenu={onToggleSubMenu}
            onToggleAudioMenu={onToggleAudioMenu}
            onSelectSubtitle={onSelectSubtitle}
            onSelectAudio={onSelectAudio}
            onSetMiniatureFrame={onSetMiniatureFrame}
            onExitFullscreen={onExitFullscreen}
            onToggleFullscreen={onToggleFullscreen}
          />
        </div>
      </div>
    </div>
  )
}
