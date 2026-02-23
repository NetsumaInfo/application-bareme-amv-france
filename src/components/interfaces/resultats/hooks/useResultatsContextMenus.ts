import { useEffect, useRef, useState } from 'react'

export function useResultatsContextMenus() {
  const [memberContextMenu, setMemberContextMenu] = useState<{ index: number; x: number; y: number } | null>(null)
  const [clipContextMenu, setClipContextMenu] = useState<{ clipId: string; x: number; y: number } | null>(null)
  const memberContextMenuRef = useRef<HTMLDivElement | null>(null)
  const clipContextMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!memberContextMenu) return
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (memberContextMenuRef.current?.contains(target)) return
      setMemberContextMenu(null)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [memberContextMenu])

  useEffect(() => {
    if (!clipContextMenu) return
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (clipContextMenuRef.current?.contains(target)) return
      setClipContextMenu(null)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [clipContextMenu])

  return {
    memberContextMenu,
    clipContextMenu,
    memberContextMenuRef,
    clipContextMenuRef,
    setMemberContextMenu,
    setClipContextMenu,
  }
}
