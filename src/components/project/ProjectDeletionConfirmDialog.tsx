import { useEffect, useRef } from 'react'
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
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const previousFocusedElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    const getFocusableElements = () => Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true')

    const initialFocus = cancelButtonRef.current ?? getFocusableElements()[0] ?? dialog
    initialFocus.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isDeleting) return
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

      if (event.shiftKey) {
        if (activeElement === firstElement || !dialog.contains(activeElement)) {
          event.preventDefault()
          lastElement.focus()
        }
        return
      }

      if (activeElement === lastElement || !dialog.contains(activeElement)) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (previousFocusedElement?.isConnected) {
        previousFocusedElement.focus()
      }
    }
  }, [isDeleting, onCancel])

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-black/65 px-4"
      onClick={() => {
        if (!isDeleting) {
          onCancel()
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          if (!isDeleting) {
            onCancel()
          }
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={t('Fermer')}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-lg border border-gray-700 bg-surface p-4 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-deletion-dialog-title"
        aria-describedby="project-deletion-dialog-description"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
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
    </div>
  )
}
