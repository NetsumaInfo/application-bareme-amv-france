import { invoke } from '@tauri-apps/api/core'

export interface VideoMetadata {
  file_name: string
  file_path: string
  extension: string
  size_bytes: number
}

export async function scanVideoFolder(folderPath: string): Promise<VideoMetadata[]> {
  return await invoke('scan_video_folder', { folderPath })
}
