import { useEffect, useEffectEvent, useRef } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n'

interface ProjectDeletionConfirmDialogProps {
  projectName: string
  projectDetails?: string
  isDeleting?: boolean
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

export function ProjectDeletionConfirmDialog({
  projectName,
  projectDetails,
  isDeleting = false,
  onCancel,
  onConfirm,
}: ProjectDeletionConfirmDialogProps) {
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    cancelButtonRef.current?.focus()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [])

  const requestCancel = useEffectEvent(() => {
    if (isDeleting) return
    onCancel()
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleCancel = (event: Event) => {
      event.preventDefault()
      requestCancel()
    }
    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) requestCancel()
    }
    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('click', handleBackdropClick)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('click', handleBackdropClick)
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="project-deletion-dialog-title"
      aria-describedby="project-deletion-dialog-description"
      className="m-0 fixed inset-0 z-80 h-full w-full max-h-none max-w-none items-center justify-center bg-black/65 px-4 open:flex backdrop:bg-transparent"
    >
      <div className="w-full max-w-md rounded-lg border border-gray-700 bg-surface p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-500/10 text-red-300">
            <AlertTriangle size={16} strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="project-deletion-dialog-title" className="text-[13px] font-semibold text-white">
              {t('Supprimer ce projet ?')}
            </h2>
            <p id="project-deletion-dialog-description" className="mt-1 text-[12px] leading-5 text-gray-400">
              {t('Le projet sera retiré de la liste et supprimé du disque.')}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-gray-700 bg-black/20 px-3 py-2">
          <p className="truncate text-[13px] font-medium text-white">{projectName}</p>
          {projectDetails ? (
            <p className="mt-0.5 truncate text-[11px] text-gray-500">{projectDetails}</p>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-md border border-gray-700 bg-white/4 px-3 py-1.5 text-[11px] font-medium text-gray-300 transition-colors hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('Annuler')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            aria-busy={isDeleting}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={12} />
            {t('Supprimer')}
          </button>
        </div>
      </div>
    </dialog>
  )
}
