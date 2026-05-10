import { open, save } from '@tauri-apps/plugin-dialog'
import { join } from '@tauri-apps/api/path'

export async function openProjectDialog(): Promise<string | null> {
  const result = await open({
    filters: [{ name: 'Projet AMV Notation', extensions: ['json'] }],
    multiple: false,
  })
  return typeof result === 'string' ? result : null
}

async function buildDefaultPath(defaultName?: string, defaultFolder?: string): Promise<string | undefined> {
  const fileName = defaultName ? `${defaultName}.json` : undefined
  if (!fileName) return defaultFolder
  return defaultFolder ? await join(defaultFolder, fileName) : fileName
}

export async function saveProjectDialog(defaultName?: string, defaultFolder?: string): Promise<string | null> {
  const result = await save({
    filters: [{ name: 'Projet AMV Notation', extensions: ['json'] }],
    defaultPath: await buildDefaultPath(defaultName, defaultFolder),
  })
  return result
}

export async function openFolderDialog(defaultPath?: string): Promise<string | null> {
  const result = await open({
    directory: true,
    multiple: false,
    defaultPath,
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

export async function openJsonFilesDialog(): Promise<string[] | null> {
  const result = await open({
    filters: [{ name: 'JSON', extensions: ['json'] }],
    multiple: true,
  })
  if (Array.isArray(result)) return result
  return typeof result === 'string' ? [result] : null
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
