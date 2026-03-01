import { useI18n } from '@/i18n'

export function DetachedNotesLoading() {
  const { t } = useI18n()
  return (
    <div className="flex h-screen w-full flex-col bg-surface-dark text-gray-400">
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <div style={{ width: 24, height: 24, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p className="text-[13px]">{t('En attente des données...')}</p>
        <p className="text-[11px] text-gray-500">
          {t('Ouvrez un projet et sélectionnez un clip')}
        </p>
        <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
      </div>
    </div>
  )
}
