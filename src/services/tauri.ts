import { invoke } from '@tauri-apps/api/tauri'
import { open, save } from '@tauri-apps/api/dialog'

// --- Player Commands ---

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

// --- Project Commands ---

export async function saveProjectFile(data: unknown, filePath: string): Promise<void> {
  await invoke('save_project', { data, filePath })
}

export async function loadProjectFile(filePath: string): Promise<unknown> {
  return await invoke('load_project', { filePath })
}

export async function exportJsonFile(data: unknown, filePath: string): Promise<void> {
  await invoke('export_json', { data, filePath })
}

// --- Video Commands ---

export interface VideoMetadata {
  file_name: string
  file_path: string
  extension: string
  size_bytes: number
}

export async function scanVideoFolder(folderPath: string): Promise<VideoMetadata[]> {
  return await invoke('scan_video_folder', { folderPath })
}

// --- Dialog Helpers ---

export async function openProjectDialog(): Promise<string | null> {
  const result = await open({
    filters: [{ name: 'Projet AMV Notation', extensions: ['json'] }],
    multiple: false,
  })
  return typeof result === 'string' ? result : null
}

export async function saveProjectDialog(defaultName?: string): Promise<string | null> {
  const result = await save({
    filters: [{ name: 'Projet AMV Notation', extensions: ['json'] }],
    defaultPath: defaultName ? `${defaultName}.json` : undefined,
  })
  return result
}

export async function openFolderDialog(): Promise<string | null> {
  const result = await open({
    directory: true,
    multiple: false,
  })
  return typeof result === 'string' ? result : null
}

export async function saveJsonDialog(defaultName?: string): Promise<string | null> {
  const result = await save({
    filters: [{ name: 'JSON', extensions: ['json'] }],
    defaultPath: defaultName,
  })
  return result
}
