import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { JudgeNameInput } from '@/components/ui/JudgeNameInput'
import { useI18n } from '@/i18n'

interface ResultatsRenameJudgeModalProps {
  title: string
  value: string
  errorMessage: string | null
  onChangeValue: (nextValue: string) => void
  onCancel: () => void
  onConfirm: () => void
}

export function ResultatsRenameJudgeModal({
  title,
  value,
  errorMessage,
  onChangeValue,
  onCancel,
  onConfirm,
}: ResultatsRenameJudgeModalProps) {
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) onCancel()
    }
    dialog.addEventListener('click', handleBackdropClick)
    return () => dialog.removeEventListener('click', handleBackdropClick)
  }, [onCancel])

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      className="z-120 m-auto w-full max-w-md rounded-xl border border-gray-700 bg-surface p-0 text-left shadow-2xl backdrop:bg-black/60"
    >
      <div
        className="w-full"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <HoverTextTooltip text={t('Fermer')}>
            <button
              type="button"
              onClick={onCancel}
              aria-label={t('Fermer')}
              className="rounded-sm p-1 text-gray-400 hover:bg-surface-light hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </HoverTextTooltip>
        </div>

        <div
          className="p-4"
        >
          <label className="mb-1.5 block text-xs text-gray-400">{t('Nom du juge')}</label>
          <JudgeNameInput
            value={value}
            onChange={onChangeValue}
            onEnter={onConfirm}
            autoFocus
            placeholder={t('Nom du juge')}
            inputClassName="w-full rounded-lg border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white outline-hidden focus:border-primary-500"
          />
          {errorMessage && (
            <p className="mt-1.5 text-xs text-accent">{errorMessage}</p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg bg-surface-light px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              {t('Annuler')}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
            >
              {t('Renommer')}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
