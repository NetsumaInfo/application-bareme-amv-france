import { useWindowDrag } from '@/hooks/useWindowDrag'
import { WindowControls } from '@/components/window/WindowControls'

/**
 * Standalone draggable caption strip with window controls, for frameless
 * windows that have no header of their own to fold the controls into.
 */
export function WindowTitleBar({ title }: { title?: string }) {
  const onPointerDown = useWindowDrag()
  return (
    <div
      onPointerDown={onPointerDown}
      className="flex h-7 shrink-0 select-none items-center justify-between gap-2 border-b border-gray-700/50 bg-surface pl-3 pr-0"
    >
      {title ? (
        <span className="truncate text-[11px] font-medium text-gray-400">{title}</span>
      ) : (
        <span aria-hidden className="min-w-0 flex-1" />
      )}
      <WindowControls />
    </div>
  )
}
