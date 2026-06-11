import { useCallback, useEffect, type MouseEvent as ReactMouseEvent } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { OverlayTopBar } from '@/components/player/overlay/OverlayTopBar'
import { OverlayBottomControls } from '@/components/player/overlay/OverlayBottomControls'
import { OverlayNoVideoState } from '@/components/player/overlay/OverlayNoVideoState'
import { useFullscreenOverlayState } from '@/components/player/overlay/useFullscreenOverlayState'
import { setPlayerMenuOpen } from '@/components/player/overlay/overlayMenuFocus'
import { useWindowUiSettingsSync } from '@/hooks/useWindowUiSettingsSync'

export default function FullscreenOverlay() {
  useWindowUiSettingsSync()

  useEffect(() => {
    let unlisten: (() => void) | null = null
    listen<boolean>('player-menu:visibility', (event) => {
      setPlayerMenuOpen(Boolean(event.payload))
    })
      .then((off) => {
        unlisten = off
      })
      .catch(() => {})
    return () => {
      if (unlisten) unlisten()
      setPlayerMenuOpen(false)
    }
  }, [])

  const {
    rootRef,
    iconScale,
    clipInfo,
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
    shortcutBindings,
    subtitleTracks,
    audioTracks,
    subMenuOpen,
    audioMenuOpen,
    subRef,
    audioRef,
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
    pinControls,
    unpinControls,
  } = useFullscreenOverlayState()

  const handleContextMenu = useCallback((event: ReactMouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    // Compute absolute screen position from this overlay window's own position
    // + the click's client coords. More reliable than event.screenX/Y, which is
    // unstable across webview windows. The overlay is borderless, so outer ≈ client.
    const clientX = event.clientX
    const clientY = event.clientY
    const win = getCurrentWindow()
    Promise.all([win.outerPosition(), win.scaleFactor()])
      .then(([pos, scale]) => {
        const x = pos.x / scale + clientX
        const y = pos.y / scale + clientY
        return emit('player-menu:open', { x, y, clipName: clipInfo.name || null })
      })
      .catch(() => {})
    resetHideTimer()
  }, [clipInfo.name, resetHideTimer])

  const hasTopBarContent = Boolean(clipInfo.name) || clipInfo.total > 0
  const hideCursor = isPlayerFullscreen && !controlsVisible

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 @container/overlay"
      onMouseMove={resetHideTimer}
      onMouseEnter={resetHideTimer}
      onMouseDown={resetHideTimer}
      onContextMenu={handleContextMenu}
      style={{ cursor: hideCursor ? 'none' : 'default' }}
      role="presentation"
    >
      {hasTopBarContent && (
        <OverlayTopBar
          clipInfo={clipInfo}
          controlsVisible={controlsVisible}
          iconScale={iconScale}
          onClose={handleClosePlayerWindow}
          onPin={pinControls}
          onUnpin={unpinControls}
        />
      )}

      {clipInfo.hasVideo === false && (
        <OverlayNoVideoState />
      )}

      <OverlayBottomControls
        isPlayerFullscreen={isPlayerFullscreen}
        controlsVisible={controlsVisible}
        iconScale={iconScale}
        currentTime={currentTime}
        duration={duration}
        clipInfo={clipInfo}
        visibleMarkers={visibleMarkers}
        markerTooltip={markerTooltip}
        isPlaying={isPlaying}
        volume={volume}
        isMuted={isMuted}
        showAudioDb={showAudioDb}
        shortcutBindings={shortcutBindings}
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
        onPin={pinControls}
        onUnpin={unpinControls}
      />
    </div>
  )
}
