import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useClipDeletionStore } from '@/store/useClipDeletionStore'
import { AppCheckbox } from '@/components/ui/AppCheckbox'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { useI18n } from '@/i18n'

export function ClipDeletionConfirmDialog() {
  const { t } = useI18n()
  const pendingClipId = useClipDeletionStore((state) => state.pendingClipId)
  const cancelClipDeletion = useClipDeletionStore((state) => state.cancelClipDeletion)
  const confirmClipDeletion = useClipDeletionStore((state) => state.confirmClipDeletion)
  const clips = useProjectStore((state) => state.clips)
  const [disableFutureWarnings, setDisableFutureWarnings] = useState(false)

  const clip = useMemo(
    () => clips.find((item) => item.id === pendingClipId) ?? null,
    [clips, pendingClipId],
  )

  if (!pendingClipId || !clip) {
    return null
  }

  const title = clip.filePath ? t('Supprimer la vidéo ?') : t('Supprimer le participant ?')
  const clipSecondaryLabel = getClipSecondaryLabel(clip)

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/60 px-4">
      <div
        className="relative w-full max-w-md rounded-[12px] bg-surface px-2.5 py-2 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clip-deletion-dialog-title"
      >
        <div className="min-w-0">
          <div className="relative pl-9">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff8fa1]">
              <AlertTriangle size={13} strokeWidth={2.35} />
            </span>
            <h2 id="clip-deletion-dialog-title" className="text-[13px] font-medium leading-none text-white">
              {title}
            </h2>
          </div>
          <div className="relative mt-1.5 rounded-[10px] bg-black/18 px-3 py-1.5 pl-4">
            <div className="pointer-events-none absolute inset-0 rounded-[10px] ring-1 ring-primary-400/10" />
            <p className="truncate text-[13px] font-medium text-primary-300">{getClipPrimaryLabel(clip)}</p>
            {clipSecondaryLabel ? (
              <p className="mt-0.5 truncate text-[10px] text-gray-500">{clipSecondaryLabel}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <AppCheckbox
            checked={disableFutureWarnings}
            onChange={setDisableFutureWarnings}
            label={t('Ne plus afficher cet avertissement')}
            className="min-w-0 flex-1 pl-4"
          />

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDisableFutureWarnings(false)
                cancelClipDeletion()
              }}
              className="rounded-lg bg-white/6 px-2.5 py-1.5 text-[11px] font-medium text-gray-300 transition-colors hover:bg-white/9 hover:text-white"
            >
              {t('Annuler')}
            </button>
            <button
              type="button"
              onClick={() => {
                confirmClipDeletion(disableFutureWarnings)
                setDisableFutureWarnings(false)
              }}
              className="px-1 py-1.5 text-[11px] font-semibold text-[#ff5c77] transition-colors hover:text-[#ffb8c4]"
            >
              {clip.filePath ? t('Supprimer la vidéo') : t('Supprimer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
