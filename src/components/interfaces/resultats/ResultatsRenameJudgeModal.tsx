import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

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
    >
      <div
        className="w-full max-w-md rounded-xl border border-gray-700 bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 text-gray-400 hover:bg-surface-light hover:text-white transition-colors"
            title="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <form
          className="p-4"
          onSubmit={(event) => {
            event.preventDefault()
            onConfirm()
          }}
        >
          <label className="mb-1.5 block text-xs text-gray-400">Nom du juge</label>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(event) => onChangeValue(event.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
            placeholder="Nom du juge"
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
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
            >
              Renommer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
