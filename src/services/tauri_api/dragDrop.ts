import type { UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'

interface NativeFileDropHandlers {
  onDrop?: (paths: string[]) => void
  onHover?: () => void
  onCancel?: () => void
}

export async function listenNativeFileDrop({
  onDrop,
  onHover,
  onCancel,
}: NativeFileDropHandlers): Promise<UnlistenFn> {
  return getCurrentWindow().onDragDropEvent((event) => {
    const payload = event.payload
    if (payload.type === 'drop') {
      onDrop?.(payload.paths)
      return
    }
    if (payload.type === 'enter' || payload.type === 'over') {
      onHover?.()
      return
    }
    onCancel?.()
  })
}
