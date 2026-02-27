import { useEffect, useRef } from 'react'
import {
  Table,
  Table2,
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
  FolderPlus,
  Upload,
  Image,
  FileText,
} from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useProjectStore } from '@/store/useProjectStore'
import type { InterfaceMode, AppTab } from '@/types/notation'
import { formatShortcutDisplay } from '@/utils/shortcuts'

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
  iconSecondary?: typeof Table
  onClick?: () => void
  separator?: boolean
  active?: boolean
  shortcut?: string
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
    shortcutBindings,
  } = useUIStore()
  const { nextClip, previousClip, currentProject, updateSettings, clips, currentClipIndex } = useProjectStore()
  const hasCurrentClipVideo = Boolean(clips[currentClipIndex]?.filePath)
  const hasAnyLinkedVideo = clips.some((clip) => Boolean(clip.filePath))

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

  const items: MenuItem[] = []

  if (currentTab === 'notation') {
    items.push({
      label: 'Vue tableur',
      icon: Table,
      onClick: () => { switchInterface('spreadsheet' as InterfaceMode); onClose() },
      active: currentInterface === 'spreadsheet',
    })
    items.push({
      label: 'Vue notes',
      icon: FileText,
      onClick: () => { switchInterface('notation' as InterfaceMode); onClose() },
      active: currentInterface === 'notation',
    })
    items.push({
      label: 'Vue mixte',
      icon: Table,
      iconSecondary: FileText,
      onClick: () => { switchInterface('dual' as InterfaceMode); onClose() },
      active: currentInterface === 'dual',
    })
    items.push({ separator: true, label: '' })
    items.push({
      label: 'Clip suivant',
      icon: ChevronRight,
      onClick: () => { nextClip(); onClose() },
      shortcut: formatShortcutDisplay(shortcutBindings.nextClip),
    })
    items.push({
      label: 'Clip précédent',
      icon: ChevronLeft,
      onClick: () => { previousClip(); onClose() },
      shortcut: formatShortcutDisplay(shortcutBindings.prevClip),
    })
    items.push({ separator: true, label: '' })
    items.push({
      label: hasCurrentClipVideo
        ? (showPipVideo ? 'Masquer la vidéo PiP' : 'Afficher la vidéo PiP')
        : 'Vidéo PiP indisponible (pas de média)',
      icon: MonitorPlay,
      onClick: hasCurrentClipVideo ? () => { setShowPipVideo(!showPipVideo); onClose() } : undefined,
    })
    if (currentProject) {
      items.push({
        label: hasAnyLinkedVideo
          ? (currentProject.settings.showMiniatures ? 'Masquer miniatures' : 'Afficher miniatures')
          : 'Miniatures indisponibles (pas de média)',
        icon: Image,
        onClick: hasAnyLinkedVideo
          ? () => {
            updateSettings({ showMiniatures: !currentProject.settings.showMiniatures })
            onClose()
          }
          : undefined,
        shortcut: formatShortcutDisplay(shortcutBindings.toggleMiniatures),
      })

      if (currentInterface === 'spreadsheet' || currentInterface === 'dual') {
        items.push({
          label: currentProject.settings.showAddRowButton
            ? 'Masquer bouton'
            : 'Afficher bouton',
          icon: Table2,
          onClick: () => {
            updateSettings({ showAddRowButton: !currentProject.settings.showAddRowButton })
            onClose()
          },
        })
      }
    }
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
            title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
              !item.onClick
                ? 'text-gray-600 cursor-not-allowed'
                : item.active
                ? 'text-primary-400 bg-primary-600/10'
                : 'text-gray-300 hover:bg-surface-light hover:text-white'
            }`}
            disabled={!item.onClick}
          >
            {item.icon && (
              <span className="flex items-center gap-1">
                <item.icon size={13} />
                {item.iconSecondary && <item.iconSecondary size={13} />}
              </span>
            )}
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && <span className="text-[10px] text-gray-500">{item.shortcut}</span>}
          </button>
        )
      })}
    </div>
  )
}
