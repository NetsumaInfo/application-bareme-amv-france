import { invoke } from '@tauri-apps/api/tauri'

export async function saveProjectFile(data: unknown, filePath: string): Promise<void> {
  await invoke('save_project', { data, filePath })
}

export async function loadProjectFile(filePath: string): Promise<unknown> {
  return await invoke('load_project', { filePath })
}

export async function exportJsonFile(data: unknown, filePath: string): Promise<void> {
  await invoke('export_json', { data, filePath })
}

export interface ProjectSummary {
  name: string
  judge_name: string
  updated_at: string
  file_path: string
}

export async function getDefaultProjectsFolder(): Promise<string> {
  return await invoke('get_default_projects_folder')
}

export async function getDefaultBaremesFolder(): Promise<string> {
  return await invoke('get_default_baremes_folder')
}

export async function listProjectsInFolder(folderPath: string): Promise<ProjectSummary[]> {
  return await invoke('list_projects_in_folder', { folderPath })
}

export async function ensureDirectoryExists(path: string): Promise<void> {
  await invoke('ensure_directory_exists', { path })
}

export async function saveBareme(data: unknown, baremeId: string): Promise<void> {
  await invoke('save_bareme', { data, baremeId })
}

export async function deleteBareme(baremeId: string): Promise<void> {
  await invoke('delete_bareme', { baremeId })
}

export async function loadBaremes(): Promise<unknown[]> {
  return await invoke('load_baremes')
}

export async function saveUserSettings(data: unknown): Promise<void> {
  await invoke('save_user_settings', { data })
}

export async function loadUserSettings(): Promise<unknown> {
  return await invoke('load_user_settings')
}
