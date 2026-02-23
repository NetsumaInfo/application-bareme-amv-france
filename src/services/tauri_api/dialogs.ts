import { open, save } from '@tauri-apps/api/dialog'

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

export async function openJsonDialog(): Promise<string | null> {
  const result = await open({
    filters: [{ name: 'JSON', extensions: ['json'] }],
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

export async function saveScreenshotDialog(defaultName?: string): Promise<string | null> {
  const result = await save({
    filters: [{ name: 'Image PNG', extensions: ['png'] }],
    defaultPath: defaultName,
  })
  return result
}

export async function openVideoFilesDialog(): Promise<string[] | null> {
  const result = await open({
    filters: [{
      name: 'Fichiers vidéo',
      extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'm4v', 'amv'],
    }],
    multiple: true,
  })
  return Array.isArray(result) ? result : null
}
