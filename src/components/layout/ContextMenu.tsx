import { useEffect, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ChevronLeft,
  ChevronRight,
  X,
  FilePlus,
  FolderOpen,
  FolderPlus,
  Upload,
  Settings,
} from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useProjectStore } from '@/store/useProjectStore'
import {
  AppContextMenuItem,
  AppContextMenuPanel,
  AppContextMenuSeparator,
} from '@/components/ui/AppContextMenu'
import type { AppTab, InterfaceMode } from '@/types/notation'
import { formatShortcutDisplay, type ShortcutAction } from '@/utils/shortcuts'
import { useI18n, type TranslateFn } from '@/i18n'
import type { LayoutContextScope } from '@/components/layout/hooks/useLayoutContextMenu'
import { UI_ICONS } from '@/components/ui/actionIcons'

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

type MenuEntry =
  | { type: 'separator'; key: string }
  | {
      type: 'item'
      key: string
      label: string
      icon?: LucideIcon
      iconSecondary?: LucideIcon
      onClick?: () => void
      active?: boolean
      shortcut?: string
    }

interface BuildContextMenuItemsParams extends Omit<ContextMenuProps, 'x' | 'y'> {
  t: TranslateFn
  currentTab: AppTab
  switchTab: (tab: AppTab) => void
  currentInterface: InterfaceMode
  switchInterface: (mode: InterfaceMode) => void
  showPipVideo: boolean
  setShowPipVideo: (show: boolean) => void
  shortcutBindings: Record<ShortcutAction, string>
  nextClip: () => void
  previousClip: () => void
  currentProject: ReturnType<typeof useProjectStore.getState>['currentProject']
  updateSettings: ReturnType<typeof useProjectStore.getState>['updateSettings']
  hasCurrentClipVideo: boolean
  hasAnyLinkedVideo: boolean
  showQuickActions: boolean
}

function item(entry: Omit<Extract<MenuEntry, { type: 'item' }>, 'type'>): MenuEntry {
  return { type: 'item', ...entry }
}

function separator(key: string): MenuEntry {
  return { type: 'separator', key }
}

function closeAfter(action: () => void, onClose: () => void) {
  return () => {
    action()
    onClose()
  }
}

function buildContextMenuItems({
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
  t,
  currentTab,
  switchTab,
  currentInterface,
  switchInterface,
  showPipVideo,
  setShowPipVideo,
  shortcutBindings,
  nextClip,
  previousClip,
  currentProject,
  updateSettings,
  hasCurrentClipVideo,
  hasAnyLinkedVideo,
  showQuickActions,
}: BuildContextMenuItemsParams): MenuEntry[] {
  const entries: MenuEntry[] = []
  const spreadsheetIcon = UI_ICONS.spreadsheet
  const commentsIcon = UI_ICONS.generalNote
  const pipIcon = UI_ICONS.pip
  const miniaturesIcon = UI_ICONS.miniatures
  const shareIcon = UI_ICONS.share
  const showIcon = UI_ICONS.show
  const hideIcon = UI_ICONS.hide

  if (scope === 'create-project') {
    if (onCloseProjectModal) {
      entries.push(item({
        key: 'close-create-project',
        label: t('Fermer la création du projet'),
        icon: X,
        onClick: closeAfter(onCloseProjectModal, onClose),
      }))
    }
    if (onOpenBaremes) {
      entries.push(item({
        key: 'open-baremes',
        label: t('Gérer les barèmes'),
        icon: Settings,
        onClick: closeAfter(onOpenBaremes, onClose),
      }))
    }
    return entries
  }

  if (scope === 'settings') {
    return onCloseSettingsMenuTarget
      ? [item({
          key: 'close-settings',
          label: t('Fermer les paramètres'),
          icon: X,
          onClick: closeAfter(onCloseSettingsMenuTarget, onClose),
        })]
      : entries
  }

  if (scope === 'bareme-editor') {
    return onCloseBaremeEditor
      ? [item({
          key: 'close-bareme-editor',
          label: t("Fermer l'éditeur de barèmes"),
          icon: X,
          onClick: closeAfter(onCloseBaremeEditor, onClose),
        })]
      : entries
  }

  if (!currentProject || scope === 'welcome') {
    if (onCreateProject) {
      entries.push(item({
        key: 'new-project',
        label: t('Nouveau projet'),
        icon: FilePlus,
        onClick: closeAfter(onCreateProject, onClose),
      }))
    }
    if (onOpenProject) {
      entries.push(item({
        key: 'open-project',
        label: t('Ouvrir un projet'),
        icon: FolderOpen,
        onClick: closeAfter(onOpenProject, onClose),
      }))
    }
    if (onOpenSettings) {
      entries.push(separator('welcome-settings-separator'))
      entries.push(item({
        key: 'settings',
        label: t('Paramètres'),
        icon: Settings,
        onClick: closeAfter(onOpenSettings, onClose),
      }))
    }
    return entries.length > 0
      ? entries
      : [item({ key: 'no-action', label: t('Aucune action disponible'), icon: Settings })]
  }

  if (currentTab === 'notation') {
    entries.push(
      item({
        key: 'view-spreadsheet',
        label: t('Vue tableur'),
        icon: spreadsheetIcon,
        onClick: closeAfter(() => switchInterface('spreadsheet'), onClose),
        active: currentInterface === 'spreadsheet',
      }),
      item({
        key: 'view-notation',
        label: t('Vue commentaires'),
        icon: commentsIcon,
        onClick: closeAfter(() => switchInterface('notation'), onClose),
        active: currentInterface === 'notation',
      }),
      item({
        key: 'view-dual',
        label: t('Vue mixte'),
        icon: spreadsheetIcon,
        iconSecondary: commentsIcon,
        onClick: closeAfter(() => switchInterface('dual'), onClose),
        active: currentInterface === 'dual',
      }),
      separator('notation-navigation-separator'),
      item({
        key: 'next-clip',
        label: t('Clip suivant'),
        icon: ChevronRight,
        onClick: closeAfter(nextClip, onClose),
        shortcut: formatShortcutDisplay(shortcutBindings.nextClip, t),
      }),
      item({
        key: 'previous-clip',
        label: t('Clip précédent'),
        icon: ChevronLeft,
        onClick: closeAfter(previousClip, onClose),
        shortcut: formatShortcutDisplay(shortcutBindings.prevClip, t),
      }),
      separator('notation-video-separator'),
      item({
        key: 'toggle-pip',
        label: hasCurrentClipVideo
          ? (showPipVideo ? t('Masquer la vidéo PiP') : t('Afficher la vidéo PiP'))
          : t('Vidéo PiP indisponible (pas de média)'),
        icon: pipIcon,
        onClick: hasCurrentClipVideo
          ? closeAfter(() => setShowPipVideo(!showPipVideo), onClose)
          : undefined,
      }),
      item({
        key: 'toggle-miniatures',
        label: hasAnyLinkedVideo
          ? (currentProject.settings.showMiniatures ? t('Masquer les miniatures') : t('Afficher les miniatures'))
          : t('Miniatures indisponibles (pas de média)'),
        icon: miniaturesIcon,
        iconSecondary: hasAnyLinkedVideo ? (currentProject.settings.showMiniatures ? hideIcon : showIcon) : undefined,
        onClick: hasAnyLinkedVideo
          ? closeAfter(() => updateSettings({ showMiniatures: !currentProject.settings.showMiniatures }), onClose)
          : undefined,
        shortcut: formatShortcutDisplay(shortcutBindings.toggleMiniatures, t),
      }),
    )

    if (currentInterface === 'spreadsheet' || currentInterface === 'dual') {
      entries.push(item({
        key: 'toggle-quick-actions',
        label: showQuickActions ? t('Masquer les actions rapides') : t('Afficher les actions rapides'),
        icon: showQuickActions ? hideIcon : showIcon,
        onClick: closeAfter(() => updateSettings({ showQuickActions: !showQuickActions }), onClose),
      }))
    }
    if (onImportVideos) {
      entries.push(item({
        key: 'import-videos',
        label: t('Importer des vidéos'),
        icon: FolderPlus,
        onClick: closeAfter(onImportVideos, onClose),
      }))
    }
    return entries
  }

  if (currentTab === 'resultats') {
    entries.push(
      item({
        key: 'go-notation',
        label: t('Aller à la Notation'),
        icon: commentsIcon,
        onClick: closeAfter(() => switchTab('notation'), onClose),
      }),
      item({
        key: 'go-export',
        label: t("Aller à l'Export"),
        icon: shareIcon,
        onClick: closeAfter(() => switchTab('export'), onClose),
      }),
      separator('resultats-actions-separator'),
    )
    if (onImportJudge) {
      entries.push(item({
        key: 'import-judge',
        label: t('Importer fichier juge'),
        icon: Upload,
        onClick: closeAfter(onImportJudge, onClose),
      }))
    }
    if (onExportPNG) {
      entries.push(item({
        key: 'export-png',
        label: t('Exporter en PNG'),
        icon: miniaturesIcon,
        onClick: closeAfter(onExportPNG, onClose),
      }))
    }
    if (onExportPDF) {
      entries.push(item({
        key: 'export-pdf',
        label: t('Exporter en PDF'),
        icon: UI_ICONS.generalNote,
        onClick: closeAfter(onExportPDF, onClose),
      }))
    }
    return entries
  }

  if (currentTab === 'export') {
    entries.push(
      item({
        key: 'go-notation',
        label: t('Aller à la Notation'),
        icon: commentsIcon,
        onClick: closeAfter(() => switchTab('notation'), onClose),
      }),
      item({
        key: 'go-resultats',
        label: t('Aller au Résultat'),
        icon: UI_ICONS.results,
        onClick: closeAfter(() => switchTab('resultats'), onClose),
      }),
    )
    if (onOpenSettings) {
      entries.push(separator('export-settings-separator'))
      entries.push(item({
        key: 'settings',
        label: t('Paramètres'),
        icon: Settings,
        onClick: closeAfter(onOpenSettings, onClose),
      }))
    }
  }

  return entries
}

export default function ContextMenu(props: ContextMenuProps) {
  const {
    x,
    y,
    onClose,
  } = props
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
  const showQuickActions = currentProject?.settings.showQuickActions ?? true

  useEffect(() => {
    const handleClick = () => onClose()
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  const entries = buildContextMenuItems({
    ...props,
    t,
    currentTab,
    switchTab,
    currentInterface,
    switchInterface,
    showPipVideo,
    setShowPipVideo,
    shortcutBindings,
    nextClip,
    previousClip,
    currentProject,
    updateSettings,
    hasCurrentClipVideo,
    hasAnyLinkedVideo,
    showQuickActions,
  })

  return (
    <AppContextMenuPanel
      ref={menuRef}
      x={x}
      y={y}
      minWidthClassName="min-w-[210px]"
    >
      {entries.map((entry) => (
        entry.type === 'separator' ? (
          <AppContextMenuSeparator key={entry.key} />
        ) : (
          <AppContextMenuItem
            key={entry.key}
            onClick={entry.onClick}
            label={entry.label}
            icon={entry.icon}
            iconSecondary={entry.iconSecondary}
            shortcut={entry.shortcut}
            active={entry.active}
            disabled={!entry.onClick}
          />
        )
      ))}
    </AppContextMenuPanel>
  )
}
