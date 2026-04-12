import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
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
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onCancel()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={t('Fermer')}
    >
      <div
        className="w-full max-w-md rounded-xl border border-gray-700 bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <HoverTextTooltip text={t('Fermer')}>
            <button
              type="button"
              onClick={onCancel}
              aria-label={t('Fermer')}
              className="rounded p-1 text-gray-400 hover:bg-surface-light hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </HoverTextTooltip>
        </div>

        <div
          className="p-4"
        >
          <label className="mb-1.5 block text-xs text-gray-400">{t('Nom du juge')}</label>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(event) => onChangeValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                onConfirm()
              }
            }}
            className="w-full rounded-lg border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
            placeholder={t('Nom du juge')}
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
    </div>
  )
}
