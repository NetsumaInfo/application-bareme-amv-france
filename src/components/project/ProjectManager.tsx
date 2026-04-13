import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  FolderOpen,
  Save,
  FilePlus,
  Download,
  FolderPlus,
  ChevronDown,
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
    <div className="relative inline-flex items-center" ref={menuRef}>
      <HoverTextTooltip text={t('Menu fichier')}>
        <button
          onClick={() => setOpen(!open)}
          aria-label={t('Menu fichier')}
          data-open={open ? 'true' : 'false'}
          className="app-header-trigger gap-0.5"
        >
          <span className="inline-flex items-center gap-0.5 leading-none">
            <span className="hidden leading-none sm:inline">{t('Fichier')}</span>
            <ChevronDown
              size={10}
              className={`app-header-trigger-chevron shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </span>
        </button>
      </HoverTextTooltip>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-1 w-64 max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-gray-700 bg-surface py-1 shadow-xl">
          <SectionLabel>{t('Concours')}</SectionLabel>
          <MenuItem
            icon={<FilePlus size={13} />}
            label={t('Nouveau concours')}
            tooltip={t('Créer un nouveau concours avec un projet vide.')}
            shortcut={formatShortcutDisplayForAction('newProject', shortcutBindings, t)}
            onClick={() => closeAndRun(handleNewProject)}
          />
          <MenuItem
            icon={<FolderOpen size={13} />}
            label={t('Ouvrir...')}
            tooltip={t('Ouvrir un fichier de projet concours existant.')}
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
                tooltip={t('Importer toutes les vidéos d’un dossier dans le concours.')}
                onClick={() => closeAndRun(handleImportFolder)}
              />
              <MenuItem
                icon={<FolderOpen size={13} />}
                label={t('Rattacher vidéos aux lignes...')}
                tooltip={t('Associer des fichiers vidéo existants aux participants déjà listés.')}
                onClick={() => closeAndRun(handleRelinkOnly)}
              />
              <MenuItem
                icon={<FilePlus size={13} />}
                label={t('Importer des fichiers...')}
                tooltip={t('Importer une sélection de fichiers vidéo dans le concours.')}
                onClick={() => closeAndRun(handleImportFiles)}
              />
              <MenuItem
                icon={<FolderOpen size={13} />}
                label={t('Relocaliser les vidéos...')}
                tooltip={t('Retrouver les vidéos quand leurs chemins ont changé.')}
                onClick={() => closeAndRun(handleRelocateVideos)}
              />
              <div className="border-t border-gray-700 my-1" />
              <SectionLabel>{t('Sauvegarde')}</SectionLabel>
              <MenuItem
                icon={<Save size={13} />}
                label={t('Sauvegarder')}
                tooltip={t('Enregistrer les modifications dans le fichier projet courant.')}
                shortcut={formatShortcutDisplayForAction('save', shortcutBindings, t)}
                onClick={() => closeAndRun(handleSave)}
              />
              <MenuItem
                icon={<Save size={13} />}
                label={t('Sauvegarder sous...')}
                tooltip={t('Enregistrer une copie du projet sous un nouveau nom ou emplacement.')}
                shortcut={formatShortcutDisplayForAction('saveAs', shortcutBindings, t)}
                onClick={() => closeAndRun(handleSaveAs)}
              />
              <div className="border-t border-gray-700 my-1" />
              <SectionLabel>{t('Export')}</SectionLabel>
              <MenuItem
                icon={<Download size={13} />}
                label={t('Exporter concours (JSON)')}
                tooltip={t('Export complet du concours avec clips, notes et barème intégré.')}
                onClick={() => closeAndRun(handleExport)}
              />
              <MenuItem
                icon={<Download size={13} />}
                label={t('Exporter notation ({filename})', { filename: exportJudgeFilename })}
                tooltip={t('Export des notes du juge courant au format JSON.')}
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
  tooltip,
  shortcut,
  onClick,
}: {
  icon: ReactNode
  label: string
  tooltip?: string
  shortcut?: string
  onClick: () => void
}) {
  const button = (
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

  if (!tooltip?.trim()) {
    return button
  }

  return <HoverTextTooltip text={tooltip}>{button}</HoverTextTooltip>
}
