import { AlertTriangle, Download, FilePlus, FolderPlus, Table2 } from 'lucide-react'
import { AppCheckbox } from '@/components/ui/AppCheckbox'
import { useI18n } from '@/i18n'
import type { ClipNamePattern } from '@/types/project'
import { ALL_CONTEST_CATEGORY_KEY } from '@/utils/contestCategory'

interface NoVideoStateProps {
  isDragOver: boolean
  clipNamePattern: ClipNamePattern
  contestCategoryTabs: Array<{
    key: string
    label: string
    color: string
  }>
  activeContestCategoryView: string
  showNoVideoTableModal: boolean
  noVideoTableAccepted: boolean
  noVideoTableInput: string
  noVideoTableError: string | null
  onSelectContestCategoryView: (categoryKey: string) => void
  onImportFolder: () => void
  onImportFiles: () => void
  onOpenNoVideoModal: () => void
  onCloseNoVideoModal: () => void
  onNoVideoTableAcceptedChange: (nextValue: boolean) => void
  onNoVideoTableInputChange: (nextValue: string) => void
  onCreateNoVideoTable: () => void
}

export function NoVideoState({
  isDragOver,
  clipNamePattern,
  contestCategoryTabs,
  activeContestCategoryView,
  showNoVideoTableModal,
  noVideoTableAccepted,
  noVideoTableInput,
  noVideoTableError,
  onSelectContestCategoryView,
  onImportFolder,
  onImportFiles,
  onOpenNoVideoModal,
  onCloseNoVideoModal,
  onNoVideoTableAcceptedChange,
  onNoVideoTableInputChange,
  onCreateNoVideoTable,
}: NoVideoStateProps) {
  const { t } = useI18n()
  const tableInputLabel = clipNamePattern === 'clip_pseudo'
    ? t('Une ligne par participant: Clip - Pseudo ou juste Clip')
    : t('Une ligne par participant: Pseudo - Clip ou juste Clip')
  const tableInputPlaceholder = clipNamePattern === 'clip_pseudo'
    ? t('Havoc - Netsuma\nsoul bloom - UdSnow\nCOLORs - YiFan')
    : t('Netsuma - Havoc\nUdSnow - soul bloom\nYiFan - COLORs')
  const linkingFormatExample = clipNamePattern === 'clip_pseudo'
    ? t('Nom du clip - Pseudo')
    : t('Pseudo - Nom du clip')

  return (
    <div
      className={`flex flex-col items-center justify-center h-full gap-4 transition-colors ${isDragOver ? 'bg-primary-600/8' : ''
        }`}
    >
      <div
        className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed transition-colors ${isDragOver ? 'border-primary-300 bg-primary-600/4' : 'border-gray-700'
          }`}
      >
        {isDragOver ? (
          <>
            <Download size={32} className="text-primary-300" />
            <p className="text-primary-300 text-sm font-medium">{t('Déposez vos fichiers ici')}</p>
          </>
        ) : (
          <>
            <p className="text-gray-500 text-sm">{t('Glissez-déposez des vidéos ici, ou')}</p>
            {contestCategoryTabs.length > 1 ? (
              <div className="flex max-w-[30rem] flex-wrap items-center justify-center gap-1">
                {contestCategoryTabs.map((tab) => {
                  const active = activeContestCategoryView === tab.key
                  const isAll = tab.key === ALL_CONTEST_CATEGORY_KEY
                  return (
                    <button
                      key={`no-video-category-${tab.key}`}
                      type="button"
                      onClick={() => onSelectContestCategoryView(tab.key)}
                      title={
                        isAll
                          ? t('Afficher tous les clips')
                          : t('Filtrer sur la catégorie {category}', { category: tab.label })
                      }
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                        active
                          ? 'border-white/20 bg-surface-dark/90'
                          : 'border-gray-700 bg-surface-dark/55 hover:border-gray-600 hover:bg-surface-light/50'
                      }`}
                      style={{ color: tab.color }}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            ) : null}
            <div className="flex gap-2">
              <button
                onClick={onImportFolder}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
              >
                <FolderPlus size={16} />
                {t('Importer un dossier')}
              </button>
              <button
                onClick={onImportFiles}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-300 text-primary-300 hover:bg-primary-300/8 text-sm font-medium transition-colors"
              >
                <FilePlus size={16} />
                {t('Importer des fichiers')}
              </button>
            </div>
            <button
              onClick={onOpenNoVideoModal}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-surface-light text-sm font-medium transition-colors"
            >
              <Table2 size={16} />
              {t('Créer un tableau sans vidéos')}
            </button>
          </>
        )}
      </div>

      {showNoVideoTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-2xl bg-surface border border-gray-700 rounded-xl p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-3">{t('Créer un tableau sans vidéos')}</h3>
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <p>
                  {t('Mode sans vidéo: vous pouvez noter, calculer et exporter les résultats. La lecture vidéo, MediaInfo et les fonctions frame/timecode liées au lecteur seront indisponibles tant que les fichiers ne sont pas importés. Pour lier automatiquement plus tard, utilisez le même format de nom (ex: {format}). Vous pouvez laisser cette zone vide et créer/éditer les lignes ensuite directement dans le tableur.', {
                    format: linkingFormatExample,
                  })}
                </p>
              </div>
            </div>

            <AppCheckbox
              checked={noVideoTableAccepted}
              onChange={onNoVideoTableAcceptedChange}
              label={t('J’ai compris les limites du mode sans vidéos.')}
              className="mb-3 text-xs"
            />

            <label className="block text-xs text-gray-400 mb-1">
              {tableInputLabel}
            </label>
            <textarea
              value={noVideoTableInput}
              onChange={(event) => onNoVideoTableInputChange(event.target.value)}
              placeholder={tableInputPlaceholder}
              className="w-full min-h-[220px] resize-y rounded-lg border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-primary-500"
            />
            {noVideoTableError && <p className="mt-2 text-xs text-red-400">{noVideoTableError}</p>}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={onCloseNoVideoModal}
                className="px-4 py-2 rounded-lg bg-surface-light text-gray-300 hover:text-white text-sm"
              >
                {t('Annuler')}
              </button>
              <button
                onClick={onCreateNoVideoTable}
                disabled={!noVideoTableAccepted}
                className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium"
              >
                {t('Créer le tableau')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
