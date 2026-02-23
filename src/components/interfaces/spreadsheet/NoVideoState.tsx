import { AlertTriangle, Download, FilePlus, FolderPlus, Table2 } from 'lucide-react'

interface NoVideoStateProps {
  isDragOver: boolean
  showNoVideoTableModal: boolean
  noVideoTableAccepted: boolean
  noVideoTableInput: string
  noVideoTableError: string | null
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
  showNoVideoTableModal,
  noVideoTableAccepted,
  noVideoTableInput,
  noVideoTableError,
  onImportFolder,
  onImportFiles,
  onOpenNoVideoModal,
  onCloseNoVideoModal,
  onNoVideoTableAcceptedChange,
  onNoVideoTableInputChange,
  onCreateNoVideoTable,
}: NoVideoStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center h-full gap-4 transition-colors ${isDragOver ? 'bg-primary-600/10' : ''
        }`}
    >
      <div
        className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed transition-colors ${isDragOver ? 'border-primary-400 bg-primary-600/5' : 'border-gray-700'
          }`}
      >
        {isDragOver ? (
          <>
            <Download size={32} className="text-primary-400" />
            <p className="text-primary-400 text-sm font-medium">Déposez vos fichiers ici</p>
          </>
        ) : (
          <>
            <p className="text-gray-500 text-sm">Glissez-déposez des vidéos ici, ou</p>
            <div className="flex gap-2">
              <button
                onClick={onImportFolder}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
              >
                <FolderPlus size={16} />
                Importer un dossier
              </button>
              <button
                onClick={onImportFiles}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-600 text-primary-500 hover:bg-primary-600/10 text-sm font-medium transition-colors"
              >
                <FilePlus size={16} />
                Importer des fichiers
              </button>
            </div>
            <button
              onClick={onOpenNoVideoModal}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-surface-light text-sm font-medium transition-colors"
            >
              <Table2 size={16} />
              Créer un tableau sans vidéos
            </button>
          </>
        )}
      </div>

      {showNoVideoTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-2xl bg-surface border border-gray-700 rounded-xl p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-3">Créer un tableau sans vidéos</h3>
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <p>
                  Mode sans vidéo: vous pouvez noter, calculer et exporter les résultats.
                  La lecture vidéo, MediaInfo et les fonctions frame/timecode liées au lecteur seront indisponibles
                  tant que les fichiers ne sont pas importés. Pour lier automatiquement plus tard, utilisez le même
                  format de nom (ex: <span className="font-mono">Pseudo - Nom du clip</span>).
                  Vous pouvez laisser cette zone vide et créer/éditer les lignes ensuite directement dans le tableur.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-300 mb-3">
              <input
                type="checkbox"
                checked={noVideoTableAccepted}
                onChange={(event) => onNoVideoTableAcceptedChange(event.target.checked)}
                className="rounded border-gray-600 bg-surface-dark text-primary-500 focus:ring-primary-500"
              />
              J’ai compris les limites du mode sans vidéos.
            </label>

            <label className="block text-xs text-gray-400 mb-1">
              Une ligne par participant: <span className="font-mono">Pseudo - Clip</span> ou juste <span className="font-mono">Clip</span>
            </label>
            <textarea
              value={noVideoTableInput}
              onChange={(event) => onNoVideoTableInputChange(event.target.value)}
              placeholder={'Netsuma - Havoc\nUdSnow - soul bloom\nYiFan - COLORs'}
              className="w-full min-h-[220px] resize-y rounded-lg border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-primary-500"
            />
            {noVideoTableError && <p className="mt-2 text-xs text-red-400">{noVideoTableError}</p>}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={onCloseNoVideoModal}
                className="px-4 py-2 rounded-lg bg-surface-light text-gray-300 hover:text-white text-sm"
              >
                Annuler
              </button>
              <button
                onClick={onCreateNoVideoTable}
                disabled={!noVideoTableAccepted}
                className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium"
              >
                Créer le tableau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
