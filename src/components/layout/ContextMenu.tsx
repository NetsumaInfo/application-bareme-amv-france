import { useEffect, useRef } from 'react'
import {
  Table,
  Table2,
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
  X,
  FilePlus,
  FolderOpen,
  FolderPlus,
  Upload,
  Image,
  FileText,
  Settings,
  BarChart3,
  Share2,
} from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useProjectStore } from '@/store/useProjectStore'
import {
  AppContextMenuItem,
  AppContextMenuPanel,
  AppContextMenuSeparator,
} from '@/components/ui/AppContextMenu'
import type { InterfaceMode, AppTab } from '@/types/notation'
import { formatShortcutDisplay } from '@/utils/shortcuts'
import { useI18n } from '@/i18n'
import type { LayoutContextScope } from '@/components/layout/hooks/useLayoutContextMenu'

interface ContextMenuProps {
  x: number
  y: number
  scope: LayoutContextScope
  onClose: () => void
  onOpenProject?: () => void
  onCreateProject?: () => void
  onOpenSettings?: () => void
  onCloseSettingsMenuTarget?: () => void
  onCloseProjectModal?: () => void
  onOpenBaremes?: () => void
  onCloseBaremeEditor?: () => void
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
  scope,
  onClose,
  onOpenProject,
  onCreateProject,
  onOpenSettings,
  onCloseSettingsMenuTarget,
  onCloseProjectModal,
  onOpenBaremes,
  onCloseBaremeEditor,
  onImportVideos,
  onImportJudge,
  onExportPNG,
  onExportPDF,
}: ContextMenuProps) {
  const { t } = useI18n()
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

  if (scope === 'create-project') {
    if (onCloseProjectModal) {
      items.push({
        label: t('Fermer la création du projet'),
        icon: X,
        onClick: () => { onCloseProjectModal(); onClose() },
      })
    }
    if (onOpenBaremes) {
      items.push({
        label: t('Gérer les barèmes'),
        icon: Settings,
        onClick: () => { onOpenBaremes(); onClose() },
      })
    }
  } else if (scope === 'settings') {
    if (onCloseSettingsMenuTarget) {
      items.push({
        label: t('Fermer les paramètres'),
        icon: X,
        onClick: () => { onCloseSettingsMenuTarget(); onClose() },
      })
    }
  } else if (scope === 'bareme-editor') {
    if (onCloseBaremeEditor) {
      items.push({
        label: t("Fermer l'éditeur de barèmes"),
        icon: X,
        onClick: () => { onCloseBaremeEditor(); onClose() },
      })
    }
  } else if (!currentProject || scope === 'welcome') {
    if (onCreateProject) {
      items.push({
        label: t('Nouveau projet'),
        icon: FilePlus,
        onClick: () => { onCreateProject(); onClose() },
      })
    }
    if (onOpenProject) {
      items.push({
        label: t('Ouvrir un projet'),
        icon: FolderOpen,
        onClick: () => { onOpenProject(); onClose() },
      })
    }
    if (onOpenSettings) {
      items.push({ separator: true, label: '' })
      items.push({
        label: t('Paramètres'),
        icon: Settings,
        onClick: () => { onOpenSettings(); onClose() },
      })
    }
    if (items.length === 0) {
      items.push({
        label: t('Aucune action disponible'),
        icon: Settings,
      })
    }
  } else if (currentTab === 'notation') {
    items.push({
      label: t('Vue tableur'),
      icon: Table,
      onClick: () => { switchInterface('spreadsheet' as InterfaceMode); onClose() },
      active: currentInterface === 'spreadsheet',
    })
    items.push({
      label: t('Vue notes'),
      icon: FileText,
      onClick: () => { switchInterface('notation' as InterfaceMode); onClose() },
      active: currentInterface === 'notation',
    })
    items.push({
      label: t('Vue mixte'),
      icon: Table,
      iconSecondary: FileText,
      onClick: () => { switchInterface('dual' as InterfaceMode); onClose() },
      active: currentInterface === 'dual',
    })
    items.push({ separator: true, label: '' })
    items.push({
      label: t('Clip suivant'),
      icon: ChevronRight,
      onClick: () => { nextClip(); onClose() },
      shortcut: formatShortcutDisplay(shortcutBindings.nextClip, t),
    })
    items.push({
      label: t('Clip précédent'),
      icon: ChevronLeft,
      onClick: () => { previousClip(); onClose() },
      shortcut: formatShortcutDisplay(shortcutBindings.prevClip, t),
    })
    items.push({ separator: true, label: '' })
    items.push({
      label: hasCurrentClipVideo
        ? (showPipVideo ? t('Masquer la vidéo PiP') : t('Afficher la vidéo PiP'))
        : t('Vidéo PiP indisponible (pas de média)'),
      icon: MonitorPlay,
      onClick: hasCurrentClipVideo ? () => { setShowPipVideo(!showPipVideo); onClose() } : undefined,
    })
    if (currentProject) {
      items.push({
        label: hasAnyLinkedVideo
          ? (currentProject.settings.showMiniatures ? t('Masquer miniatures') : t('Afficher miniatures'))
          : t('Miniatures indisponibles (pas de média)'),
        icon: Image,
        onClick: hasAnyLinkedVideo
          ? () => {
            updateSettings({ showMiniatures: !currentProject.settings.showMiniatures })
            onClose()
          }
          : undefined,
        shortcut: formatShortcutDisplay(shortcutBindings.toggleMiniatures, t),
      })

      if (currentInterface === 'spreadsheet' || currentInterface === 'dual') {
        items.push({
          label: currentProject.settings.showAddRowButton
            ? t('Masquer bouton')
            : t('Afficher bouton'),
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
        label: t('Importer des vidéos'),
        icon: FolderPlus,
        onClick: () => { onImportVideos(); onClose() },
      })
    }
  } else if (currentTab === 'resultats') {
    items.push({
      label: t('Aller à la Notation'),
      icon: Table,
      onClick: () => { switchTab('notation' as AppTab); onClose() },
    })
    items.push({
      label: t("Aller à l'Export"),
      icon: Share2,
      onClick: () => { switchTab('export' as AppTab); onClose() },
    })
    items.push({ separator: true, label: '' })
    if (onImportJudge) {
      items.push({
        label: t('Importer fichier juge'),
        icon: Upload,
        onClick: () => { onImportJudge(); onClose() },
      })
    }
    if (onExportPNG) {
      items.push({
        label: t('Exporter en PNG'),
        icon: Image,
        onClick: () => { onExportPNG(); onClose() },
      })
    }
    if (onExportPDF) {
      items.push({
        label: t('Exporter en PDF'),
        icon: FileText,
        onClick: () => { onExportPDF(); onClose() },
      })
    }
  } else if (currentTab === 'export') {
    items.push({
      label: t('Aller à la Notation'),
      icon: Table,
      onClick: () => { switchTab('notation' as AppTab); onClose() },
    })
    items.push({
      label: t('Aller au Résultat'),
      icon: BarChart3,
      onClick: () => { switchTab('resultats' as AppTab); onClose() },
    })
    if (onOpenSettings) {
      items.push({ separator: true, label: '' })
      items.push({
        label: t('Paramètres'),
        icon: Settings,
        onClick: () => { onOpenSettings(); onClose() },
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
    <AppContextMenuPanel
      ref={menuRef}
      x={adjustedStyle.left}
      y={adjustedStyle.top}
      minWidthClassName="min-w-[210px]"
    >
      {items.map((item, idx) => {
        if (item.separator) {
          return <AppContextMenuSeparator key={`sep-${idx}`} />
        }

        return (
          <AppContextMenuItem
            key={item.label}
            onClick={item.onClick}
            label={item.label}
            icon={item.icon}
            iconSecondary={item.iconSecondary}
            shortcut={item.shortcut}
            active={item.active}
            disabled={!item.onClick}
          />
        )
      })}
    </AppContextMenuPanel>
  )
}
