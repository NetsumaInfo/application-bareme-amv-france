import { useEffect, useRef } from 'react'
import {
  Table,
  LayoutGrid,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
  FolderPlus,
  Upload,
  Image,
  FileText,
  Play,
  CheckCircle,
} from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useProjectStore } from '@/store/useProjectStore'
import type { InterfaceMode, AppTab } from '@/types/notation'

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onImportVideos?: () => void
  onImportJudge?: () => void
  onExportPNG?: () => void
  onExportPDF?: () => void
}

interface MenuItem {
  label: string
  icon?: typeof Table
  onClick?: () => void
  separator?: boolean
  active?: boolean
}

export default function ContextMenu({
  x,
  y,
  onClose,
  onImportVideos,
  onImportJudge,
  onExportPNG,
  onExportPDF,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const {
    currentTab,
    switchTab,
    currentInterface,
    switchInterface,
    showPipVideo,
    setShowPipVideo,
  } = useUIStore()
  const { nextClip, previousClip, currentClipIndex, clips, markClipScored } = useProjectStore()

  useEffect(() => {
    const handleClick = () => onClose()
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  const currentClip = clips[currentClipIndex]

  const items: MenuItem[] = []

  if (currentTab === 'notation') {
    items.push({
      label: 'Vue tableur',
      icon: Table,
      onClick: () => { switchInterface('spreadsheet' as InterfaceMode); onClose() },
      active: currentInterface === 'spreadsheet',
    })
    items.push({
      label: 'Vue moderne',
      icon: LayoutGrid,
      onClick: () => { switchInterface('modern' as InterfaceMode); onClose() },
      active: currentInterface === 'modern',
    })
    items.push({
      label: 'Vue notation',
      icon: Maximize2,
      onClick: () => { switchInterface('notation' as InterfaceMode); onClose() },
      active: currentInterface === 'notation',
    })
    items.push({ separator: true, label: '' })
    items.push({
      label: 'Clip suivant',
      icon: ChevronRight,
      onClick: () => { nextClip(); onClose() },
    })
    items.push({
      label: 'Clip précédent',
      icon: ChevronLeft,
      onClick: () => { previousClip(); onClose() },
    })
    if (currentClip) {
      items.push({ separator: true, label: '' })
      items.push({
        label: 'Lire ce clip',
        icon: Play,
        onClick: () => { onClose() },
      })
      if (!currentClip.scored) {
        items.push({
          label: 'Marquer comme noté',
          icon: CheckCircle,
          onClick: () => { markClipScored(currentClip.id); onClose() },
        })
      }
    }
    items.push({ separator: true, label: '' })
    items.push({
      label: showPipVideo ? 'Masquer la vidéo PiP' : 'Afficher la vidéo PiP',
      icon: MonitorPlay,
      onClick: () => { setShowPipVideo(!showPipVideo); onClose() },
    })
    if (onImportVideos) {
      items.push({
        label: 'Importer des vidéos',
        icon: FolderPlus,
        onClick: () => { onImportVideos(); onClose() },
      })
    }
  } else if (currentTab === 'resultats') {
    items.push({
      label: 'Aller à la Notation',
      icon: Table,
      onClick: () => { switchTab('notation' as AppTab); onClose() },
    })
    items.push({ separator: true, label: '' })
    if (onImportJudge) {
      items.push({
        label: 'Importer fichier juge',
        icon: Upload,
        onClick: () => { onImportJudge(); onClose() },
      })
    }
    if (onExportPNG) {
      items.push({
        label: 'Exporter en PNG',
        icon: Image,
        onClick: () => { onExportPNG(); onClose() },
      })
    }
    if (onExportPDF) {
      items.push({
        label: 'Exporter en PDF',
        icon: FileText,
        onClick: () => { onExportPDF(); onClose() },
      })
    }
  }

  // Keep menu inside viewport
  const adjustedStyle = (() => {
    const menuWidth = 220
    const estimatedHeight = Math.max(150, items.length * 30 + 8)
    let adjustedX = x
    let adjustedY = y
    if (x + menuWidth > window.innerWidth) adjustedX = window.innerWidth - menuWidth - 8
    if (y + estimatedHeight > window.innerHeight) adjustedY = window.innerHeight - estimatedHeight - 8
    if (adjustedX < 8) adjustedX = 8
    if (adjustedY < 8) adjustedY = 8
    return { left: adjustedX, top: adjustedY }
  })()

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-surface border border-gray-600 rounded-lg shadow-2xl py-1 min-w-[200px]"
      style={adjustedStyle}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, idx) => {
        if (item.separator) {
          return <div key={`sep-${idx}`} className="h-px bg-gray-700 my-1" />
        }

        return (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
              item.active
                ? 'text-primary-400 bg-primary-600/10'
                : 'text-gray-300 hover:bg-surface-light hover:text-white'
            }`}
          >
            {item.icon && <item.icon size={13} />}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
