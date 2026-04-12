import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  FolderOpen,
  Save,
  FilePlus,
  FileDown,
  FolderPlus,
  ChevronDown,
  Upload,
} from 'lucide-react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useProjectMenuActions } from '@/components/project/useProjectMenuActions'
import { useUIStore } from '@/store/useUIStore'
import { useI18n } from '@/i18n'
import { formatShortcutDisplayForAction } from '@/utils/shortcuts'

export default function ProjectManager() {
  const { t } = useI18n()
  const shortcutBindings = useUIStore((state) => state.shortcutBindings)
  const {
    currentProject,
    handleNewProject,
    handleOpenProject,
    handleSave,
    handleSaveAs,
    handleImportFolder,
    handleImportFiles,
    handleRelocateVideos,
    handleRelinkOnly,
    handleExport,
    handleExportJudgeNotes,
  } = useProjectMenuActions()

  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const judgeName = currentProject?.judgeName?.trim() || t('juge')
  const projectName = currentProject?.name?.trim() || t('Projet')
  const exportJudgeFilename = `${projectName}_${judgeName}.json`

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const closeAndRun = async (action: () => void | Promise<void>) => {
    setOpen(false)
    await action()
  }

  return (
    <div className="relative" ref={menuRef}>
      <HoverTextTooltip text={t('Menu fichier')}>
        <button
          onClick={() => setOpen(!open)}
          aria-label={t('Menu fichier')}
          data-open={open ? 'true' : 'false'}
          className="app-header-trigger gap-1"
        >
          <span className="hidden sm:inline">{t('Fichier')}</span>
          <ChevronDown
            size={10}
            className={`app-header-trigger-chevron transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </HoverTextTooltip>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-1 w-64 max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-gray-700 bg-surface py-1 shadow-xl">
          <SectionLabel>{t('Concours')}</SectionLabel>
          <MenuItem
            icon={<FilePlus size={13} />}
            label={t('Nouveau concours')}
            shortcut={formatShortcutDisplayForAction('newProject', shortcutBindings, t)}
            onClick={() => closeAndRun(handleNewProject)}
          />
          <MenuItem
            icon={<FolderOpen size={13} />}
            label={t('Ouvrir...')}
            shortcut={formatShortcutDisplayForAction('openProject', shortcutBindings, t)}
            onClick={() => closeAndRun(handleOpenProject)}
          />

          {currentProject && (
            <>
              <div className="border-t border-gray-700 my-1" />
              <SectionLabel>{t('Import vidéo')}</SectionLabel>
              <MenuItem
                icon={<FolderPlus size={13} />}
                label={t('Importer un dossier...')}
                onClick={() => closeAndRun(handleImportFolder)}
              />
              <MenuItem
                icon={<FolderOpen size={13} />}
                label={t('Rattacher vidéos aux lignes...')}
                onClick={() => closeAndRun(handleRelinkOnly)}
              />
              <MenuItem
                icon={<FilePlus size={13} />}
                label={t('Importer des fichiers...')}
                onClick={() => closeAndRun(handleImportFiles)}
              />
              <MenuItem
                icon={<FolderOpen size={13} />}
                label={t('Relocaliser les vidéos...')}
                onClick={() => closeAndRun(handleRelocateVideos)}
              />
              <div className="border-t border-gray-700 my-1" />
              <SectionLabel>{t('Sauvegarde')}</SectionLabel>
              <MenuItem
                icon={<Save size={13} />}
                label={t('Sauvegarder')}
                shortcut={formatShortcutDisplayForAction('save', shortcutBindings, t)}
                onClick={() => closeAndRun(handleSave)}
              />
              <MenuItem
                icon={<Save size={13} />}
                label={t('Sauvegarder sous...')}
                shortcut={formatShortcutDisplayForAction('saveAs', shortcutBindings, t)}
                onClick={() => closeAndRun(handleSaveAs)}
              />
              <div className="border-t border-gray-700 my-1" />
              <SectionLabel>{t('Export')}</SectionLabel>
              <MenuItem
                icon={<FileDown size={13} />}
                label={t('Exporter concours (JSON)')}
                onClick={() => closeAndRun(handleExport)}
              />
              <MenuItem
                icon={<Upload size={13} />}
                label={t('Exporter notation ({filename})', { filename: exportJudgeFilename })}
                onClick={() => closeAndRun(handleExportJudgeNotes)}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pt-1 pb-0.5 text-[10px] uppercase tracking-wide text-gray-500">
      {children}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  shortcut,
  onClick,
}: {
  icon: ReactNode
  label: string
  shortcut?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-surface-light transition-colors flex items-center gap-2"
    >
      <span className="text-gray-500">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {shortcut && (
        <span className="shrink-0 text-[10px] text-gray-600">{shortcut}</span>
      )}
    </button>
  )
}
