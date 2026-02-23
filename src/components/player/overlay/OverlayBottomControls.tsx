import { useEffect, useRef, useState, type ChangeEvent, type MutableRefObject } from 'react'
import type { TrackItem } from '@/services/tauri'
import type { ClipInfo, MarkerTooltip, OverlayTimecodeMarker } from '@/components/player/overlay/types'
import { OverlayTimeline } from '@/components/player/overlay/OverlayTimeline'
import { OverlayTransportControls } from '@/components/player/overlay/OverlayTransportControls'
import { OverlayUtilityControls } from '@/components/player/overlay/OverlayUtilityControls'

interface OverlayBottomControlsProps {
  isPlayerFullscreen: boolean
  controlsVisible: boolean
  compactControls: boolean
  tinyControls: boolean
  currentTime: number
  duration: number
  clipInfo: ClipInfo
  visibleMarkers: OverlayTimecodeMarker[]
  markerTooltip: MarkerTooltip | null
  isPlaying: boolean
  volume: number
  isMuted: boolean
  showAudioDb: boolean
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
}

export function OverlayBottomControls({
  isPlayerFullscreen,
  controlsVisible,
  compactControls,
  tinyControls,
  currentTime,
  duration,
  clipInfo,
  visibleMarkers,
  markerTooltip,
  isPlaying,
  volume,
  isMuted,
  showAudioDb,
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
}: OverlayBottomControlsProps) {
  const controlsRowRef = useRef<HTMLDivElement | null>(null)
  const [controlsRowWidth, setControlsRowWidth] = useState(0)

  useEffect(() => {
    const el = controlsRowRef.current
    if (!el) return

    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = Math.round(el.getBoundingClientRect().width)
        setControlsRowWidth((prev) => (prev === next ? prev : next))
      })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    window.addEventListener('resize', update)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const hasVideo = clipInfo.hasVideo !== false

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 ${compactControls ? 'px-3 pb-2 pt-10' : 'px-6 pb-4 pt-14'} ${
        isPlayerFullscreen
          ? 'bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent'
          : 'bg-gradient-to-t from-slate-950/88 via-slate-950/62 to-slate-950/15 border-t border-white/10 backdrop-blur-[3px]'
      } transition-all duration-300 ${
        controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <OverlayTimeline
        compactControls={compactControls}
        currentTime={hasVideo ? currentTime : 0}
        duration={hasVideo ? duration : 0}
        visibleMarkers={hasVideo ? visibleMarkers : []}
        markerTooltip={markerTooltip}
        onSeek={hasVideo ? onSeek : () => {}}
        onMarkerJump={hasVideo ? onMarkerJump : () => {}}
        onMarkerTooltipChange={hasVideo ? onMarkerTooltipChange : () => {}}
      />

      <div ref={controlsRowRef} className={`flex items-center justify-between ${tinyControls ? 'gap-1' : 'gap-2'}`}>
        <OverlayTransportControls
          compactControls={compactControls}
          clipInfo={clipInfo}
          isPlaying={hasVideo ? isPlaying : false}
          onPrevClip={onPrevClip}
          onNextClip={onNextClip}
          onSeekRelative={hasVideo ? onSeekRelative : () => {}}
          onTogglePause={hasVideo ? onTogglePause : () => {}}
        />

        <OverlayUtilityControls
          controlsRowWidth={controlsRowWidth}
          compactControls={compactControls}
          tinyControls={tinyControls}
          isPlayerFullscreen={isPlayerFullscreen}
          isMuted={hasVideo ? isMuted : true}
          volume={hasVideo ? volume : 0}
          showAudioDb={showAudioDb}
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
  )
}
