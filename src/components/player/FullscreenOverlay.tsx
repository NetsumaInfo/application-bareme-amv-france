import { emit } from '@tauri-apps/api/event'
import { OverlayTopBar } from '@/components/player/overlay/OverlayTopBar'
import { OverlayBottomControls } from '@/components/player/overlay/OverlayBottomControls'
import { OverlayNoVideoState } from '@/components/player/overlay/OverlayNoVideoState'
import { useFullscreenOverlayState } from '@/components/player/overlay/useFullscreenOverlayState'

export default function FullscreenOverlay() {
  const {
    clipInfo,
    compactControls,
    controlsVisible,
    currentAudioId,
    currentSubtitleId,
    currentTime,
    duration,
    isMuted,
    isPlayerFullscreen,
    isPlaying,
    markerTooltip,
    setMarkerTooltip,
    showAudioDb,
    subtitleTracks,
    audioTracks,
    subMenuOpen,
    audioMenuOpen,
    subRef,
    audioRef,
    tinyControls,
    visibleMarkers,
    volume,
    setSubMenuOpen,
    setAudioMenuOpen,
    handleSelectSubtitle,
    handleSelectAudio,
    handleSeek,
    handleMarkerJump,
    handlePrevClip,
    handleNextClip,
    handleSeekRelative,
    handleTogglePause,
    handleToggleMute,
    handleSetVolume,
    handleExitFullscreen,
    handleToggleFullscreen,
    handleClosePlayerWindow,
    resetHideTimer,
  } = useFullscreenOverlayState()

  return (
    <div
      className="fixed inset-0"
      onMouseMove={resetHideTimer}
      onMouseEnter={resetHideTimer}
      onMouseDown={resetHideTimer}
      style={{ cursor: isPlayerFullscreen && !controlsVisible ? 'none' : 'default' }}
    >
      <OverlayTopBar
        clipInfo={clipInfo}
        controlsVisible={controlsVisible}
        compactControls={compactControls}
        isPlayerFullscreen={isPlayerFullscreen}
        onClose={handleClosePlayerWindow}
      />

      {clipInfo.hasVideo === false && (
        <OverlayNoVideoState compactControls={compactControls} />
      )}

      <OverlayBottomControls
        isPlayerFullscreen={isPlayerFullscreen}
        controlsVisible={controlsVisible}
        compactControls={compactControls}
        tinyControls={tinyControls}
        currentTime={currentTime}
        duration={duration}
        clipInfo={clipInfo}
        visibleMarkers={visibleMarkers}
        markerTooltip={markerTooltip}
        isPlaying={isPlaying}
        volume={volume}
        isMuted={isMuted}
        showAudioDb={showAudioDb}
        subtitleTracks={subtitleTracks}
        audioTracks={audioTracks}
        currentSubtitleId={currentSubtitleId}
        currentAudioId={currentAudioId}
        subMenuOpen={subMenuOpen}
        audioMenuOpen={audioMenuOpen}
        subRef={subRef}
        audioRef={audioRef}
        onSeek={handleSeek}
        onMarkerJump={handleMarkerJump}
        onMarkerTooltipChange={setMarkerTooltip}
        onPrevClip={handlePrevClip}
        onNextClip={handleNextClip}
        onSeekRelative={handleSeekRelative}
        onTogglePause={handleTogglePause}
        onToggleMute={handleToggleMute}
        onSetVolume={handleSetVolume}
        onToggleSubMenu={() => setSubMenuOpen((prev) => !prev)}
        onToggleAudioMenu={() => setAudioMenuOpen((prev) => !prev)}
        onSelectSubtitle={(id) => {
          handleSelectSubtitle(id).catch(() => {})
        }}
        onSelectAudio={(id) => {
          handleSelectAudio(id).catch(() => {})
        }}
        onSetMiniatureFrame={() => {
          emit('overlay:set-miniature-frame').catch(() => {})
          resetHideTimer()
        }}
        onExitFullscreen={handleExitFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />
    </div>
  )
}
