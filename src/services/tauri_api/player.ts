import { invoke } from '@tauri-apps/api/tauri'

export async function playerLoad(path: string): Promise<void> {
  await invoke('player_load', { path })
}

export async function playerPlay(): Promise<void> {
  await invoke('player_play')
}

export async function playerPause(): Promise<void> {
  await invoke('player_pause')
}

export async function playerTogglePause(): Promise<void> {
  await invoke('player_toggle_pause')
}

export async function playerStop(): Promise<void> {
  await invoke('player_stop')
}

export async function playerSeek(position: number): Promise<void> {
  await invoke('player_seek', { position })
}

export async function playerSeekRelative(offset: number): Promise<void> {
  await invoke('player_seek_relative', { offset })
}

export async function playerSetVolume(volume: number): Promise<void> {
  await invoke('player_set_volume', { volume })
}

export async function playerSetSpeed(speed: number): Promise<void> {
  await invoke('player_set_speed', { speed })
}

export interface PlayerStatus {
  is_playing: boolean
  current_time: number
  duration: number
  volume: number
  speed: number
}

export async function playerGetStatus(): Promise<PlayerStatus> {
  return await invoke('player_get_status')
}

export interface TrackItem {
  id: number
  title: string | null
  lang: string | null
  codec: string | null
  external: boolean
}

export interface TrackListResult {
  audio_tracks: TrackItem[]
  subtitle_tracks: TrackItem[]
}

export async function playerGetTracks(): Promise<TrackListResult> {
  return await invoke('player_get_tracks')
}

export async function playerSetSubtitleTrack(id: number | null): Promise<void> {
  await invoke('player_set_subtitle_track', { id })
}

export async function playerSetAudioTrack(id: number): Promise<void> {
  await invoke('player_set_audio_track', { id })
}

export async function playerIsAvailable(): Promise<boolean> {
  return await invoke('player_is_available')
}

export async function playerSetGeometry(x: number, y: number, width: number, height: number): Promise<void> {
  await invoke('player_set_geometry', { x, y, width, height })
}

export async function playerShow(): Promise<void> {
  await invoke('player_show')
}

export async function playerHide(): Promise<void> {
  await invoke('player_hide')
}

export async function playerHideSurface(): Promise<void> {
  await invoke('player_hide_surface')
}

export async function playerSetFullscreen(fullscreen: boolean): Promise<void> {
  await invoke('player_set_fullscreen', { fullscreen })
}

export async function playerIsFullscreen(): Promise<boolean> {
  return await invoke('player_is_fullscreen')
}

export async function playerIsVisible(): Promise<boolean> {
  return await invoke('player_is_visible')
}

export async function playerSyncOverlay(): Promise<void> {
  await invoke('player_sync_overlay')
}

export async function playerFrameStep(): Promise<void> {
  await invoke('player_frame_step')
}

export async function playerFrameBackStep(): Promise<void> {
  await invoke('player_frame_back_step')
}

export async function playerScreenshot(path: string): Promise<void> {
  await invoke('player_screenshot', { path })
}

export async function playerGetFramePreview(path: string | null, seconds: number, width?: number): Promise<string> {
  return await invoke('player_get_frame_preview', { path, seconds, width })
}

export interface MediaInfo {
  width: number
  height: number
  video_codec: string
  audio_codec: string
  file_size: number
  video_bitrate: number
  audio_bitrate: number
  fps: number
  sample_rate: number
  channels: number
  format_name: string
  duration: number
  format_long_name: string
  overall_bitrate: number
  video_profile: string
  pixel_format: string
  color_space: string
  color_primaries: string
  color_transfer: string
  video_bit_depth: number
  audio_channel_layout: string
  audio_language: string
  audio_track_count: number
  video_track_count: number
  subtitle_track_count: number
  video_frame_count: number
  sample_aspect_ratio: string
  display_aspect_ratio: string
}

export async function playerGetMediaInfo(path?: string): Promise<MediaInfo> {
  return await invoke('player_get_media_info', { path })
}

export interface AudioLevels {
  left_db: number
  right_db: number
  overall_db: number
  available: boolean
}

export async function playerGetAudioLevels(): Promise<AudioLevels> {
  return await invoke('player_get_audio_levels')
}
