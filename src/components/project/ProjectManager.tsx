import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  FolderOpen,
  Save,
  FilePlus,
  FileDown,
  FolderPlus,
  ChevronDown,
} from 'lucide-react'
import { useProjectMenuActions } from '@/components/project/useProjectMenuActions'

export default function ProjectManager() {
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
  const judgeName = currentProject?.judgeName?.trim() || 'juge'
  const projectName = currentProject?.name?.trim() || 'Projet'
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
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center px-2 py-1.5 text-xs rounded hover:bg-surface-light text-gray-300 hover:text-white transition-colors"
        title="Menu fichier"
      >
        <span className="hidden sm:inline">Fichier</span>
        <ChevronDown
          size={10}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-52 bg-surface border border-gray-700 rounded-lg shadow-xl z-50 py-1">
          <SectionLabel>Concours</SectionLabel>
          <MenuItem
            icon={<FilePlus size={13} />}
            label="Nouveau concours"
            shortcut="Ctrl+N"
            onClick={() => closeAndRun(handleNewProject)}
          />
          <MenuItem
            icon={<FolderOpen size={13} />}
            label="Ouvrir..."
            shortcut="Ctrl+O"
            onClick={() => closeAndRun(handleOpenProject)}
          />

          {currentProject && (
            <>
              <div className="border-t border-gray-700 my-1" />
              <SectionLabel>Import vidéo</SectionLabel>
              <MenuItem
                icon={<FolderPlus size={13} />}
                label="Importer un dossier..."
                onClick={() => closeAndRun(handleImportFolder)}
              />
              <MenuItem
                icon={<FolderOpen size={13} />}
                label="Rattacher vidéos aux lignes..."
                onClick={() => closeAndRun(handleRelinkOnly)}
              />
              <MenuItem
                icon={<FilePlus size={13} />}
                label="Importer des fichiers..."
                onClick={() => closeAndRun(handleImportFiles)}
              />
              <MenuItem
                icon={<FolderOpen size={13} />}
                label="Relocaliser les vidéos..."
                onClick={() => closeAndRun(handleRelocateVideos)}
              />
              <div className="border-t border-gray-700 my-1" />
              <SectionLabel>Sauvegarde</SectionLabel>
              <MenuItem
                icon={<Save size={13} />}
                label="Sauvegarder"
                shortcut="Ctrl+S"
                onClick={() => closeAndRun(handleSave)}
              />
              <MenuItem
                icon={<Save size={13} />}
                label="Sauvegarder sous..."
                onClick={() => closeAndRun(handleSaveAs)}
              />
              <div className="border-t border-gray-700 my-1" />
              <SectionLabel>Export</SectionLabel>
              <MenuItem
                icon={<FileDown size={13} />}
                label="Exporter concours (JSON)"
                onClick={() => closeAndRun(handleExport)}
              />
              <MenuItem
                icon={<FileDown size={13} />}
                label={`Exporter notation (${exportJudgeFilename})`}
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
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className="text-[10px] text-gray-600">{shortcut}</span>
      )}
    </button>
  )
}
