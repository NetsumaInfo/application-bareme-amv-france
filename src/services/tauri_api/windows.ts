import { invoke } from '@tauri-apps/api/tauri'

export async function openNotesWindow(): Promise<void> {
  await invoke('open_notes_window')
}

export async function closeNotesWindow(): Promise<void> {
  await invoke('close_notes_window')
}

export async function openResultatsJudgeNotesWindow(): Promise<void> {
  await invoke('open_resultats_judge_notes_window')
}

export async function warmAuxWindows(): Promise<void> {
  await invoke('warm_aux_windows')
}
