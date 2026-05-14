import { useCallback, useEffect } from 'react'
import type { MouseEvent } from 'react'
import { useI18n } from '@/i18n'
import { openExternalUrl } from '@/services/tauri'
import { useAppUpdateStore } from '@/store/useAppUpdateStore'
import { GITHUB_REPOSITORY_URL, GITHUB_RELEASES_URL } from '@/constants/projectLinks'

const SUBTLE_BORDER = 'ring-1 ring-inset ring-primary-400/10'
const CARD = `rounded-xl bg-surface/40 p-4 ${SUBTLE_BORDER}`
const SECTION_LABEL = 'text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2'

export function SettingsAboutTab() {
  const { t, formatDate } = useI18n()
  const status = useAppUpdateStore((state) => state.status)
  const currentVersion = useAppUpdateStore((state) => state.currentVersion)
  const latestVersion = useAppUpdateStore((state) => state.latestVersion)
  const releaseUrl = useAppUpdateStore((state) => state.releaseUrl)
  const releaseName = useAppUpdateStore((state) => state.releaseName)
  const publishedAt = useAppUpdateStore((state) => state.publishedAt)
  const errorMessage = useAppUpdateStore((state) => state.errorMessage)
  const lastCheckedAt = useAppUpdateStore((state) => state.lastCheckedAt)
  const checkForUpdates = useAppUpdateStore((state) => state.checkForUpdates)

  const checkingUpdates = status === 'checking'
  const hasUpdateAvailable = status === 'update_available'
  const isUpToDate = status === 'up_to_date'
  const hasUpdateCheckError = status === 'error'
  const resolvedReleaseUrl = releaseUrl || GITHUB_RELEASES_URL
  const handleManualUpdateCheck = useCallback(() => {
    checkForUpdates(true).catch(() => {})
  }, [checkForUpdates])
  const handleOpenReleaseUrl = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    openExternalUrl(resolvedReleaseUrl).catch(() => {})
  }, [resolvedReleaseUrl])
  const handleOpenRepositoryUrl = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    openExternalUrl(GITHUB_REPOSITORY_URL).catch(() => {})
  }, [])

  useEffect(() => {
    checkForUpdates().catch(() => {})
  }, [checkForUpdates])

  return (
    <div className="space-y-5">
      <div className={CARD}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={SECTION_LABEL}>{t('Mises à jour')}</p>
            <p className="text-sm leading-relaxed text-gray-300">
              {t('Vérification automatique depuis GitHub Releases. Quand une nouvelle version sort, l’application vous la propose ici.')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleManualUpdateCheck}
            disabled={checkingUpdates}
            className="inline-flex items-center rounded-md border border-primary-400/25 bg-surface-light/70 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-surface-light hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkingUpdates ? t('Vérification...') : t('Vérifier maintenant')}
          </button>
        </div>

        <div className="mt-3 rounded-lg border border-primary-400/10 bg-black/20 px-3 py-2 text-xs text-gray-300">
          {hasUpdateAvailable ? (
            <div className="space-y-1.5">
              <p className="font-medium text-emerald-300">
                {t('Nouvelle version disponible : {version}', { version: latestVersion ?? '?' })}
              </p>
              <p>{t('Version installée : {version}', { version: currentVersion ?? '?' })}</p>
              {releaseName ? <p>{t('Release : {name}', { name: releaseName })}</p> : null}
              <p>
                {publishedAt
                  ? t('Publiée le : {date}', {
                    date: formatDate(publishedAt, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  })
                  : t('Date de publication indisponible.')}
              </p>
            </div>
          ) : null}

          {isUpToDate ? (
            <div className="space-y-1.5">
              <p className="font-medium text-emerald-300">{t('Vous utilisez déjà la dernière version disponible.')}</p>
              <p>{t('Version installée : {version}', { version: currentVersion ?? '?' })}</p>
            </div>
          ) : null}

          {hasUpdateCheckError ? (
            <div className="space-y-1.5">
              <p className="font-medium text-amber-300">{t('Impossible de vérifier les mises à jour pour le moment.')}</p>
              <p className="break-all">{errorMessage || t('Erreur inconnue.')}</p>
            </div>
          ) : null}

          {checkingUpdates ? (
            <p>{t('Vérification des mises à jour en cours...')}</p>
          ) : null}

          {status === 'idle' ? (
            <p>{t('État : en attente de vérification.')}</p>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
          {lastCheckedAt ? (
            <span>
              {t('Dernière vérification : {date}', {
                date: formatDate(lastCheckedAt, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              })}
            </span>
          ) : (
            <span>{t('Aucune vérification effectuée pour le moment.')}</span>
          )}

          <a
            href={resolvedReleaseUrl}
            target="_blank"
            rel="noreferrer"
            onClick={handleOpenReleaseUrl}
            className="inline-flex text-primary-300 underline decoration-primary-400/60 hover:text-primary-200"
          >
            {hasUpdateAvailable ? t('Télécharger la mise à jour') : t('Voir les releases GitHub')}
          </a>
        </div>
      </div>

      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('À propos de l’application')}</p>
        <div className="space-y-3 text-sm leading-relaxed text-gray-300">
          <p>
            {t('Cette application a été créée à partir d’un besoin simple : rendre la notation des concours AMV plus pratique, plus claire et plus agréable qu’avec un fichier Excel.')}
          </p>
          <p>
            {t('Quand on juge un concours, il ne suffit pas seulement de remplir des cases avec des notes. Il faut aussi pouvoir organiser les clips, regarder les vidéos facilement, créer ou utiliser un barème adapté, consulter les informations des médias, ajouter des commentaires, suivre ce qui a déjà été noté, puis obtenir des résultats propres à la fin.')}
          </p>
          <p>
            {t('L’idée de cette application est donc de réunir tout ce dont un juge peut avoir besoin dans un seul outil pensé spécialement pour les concours AMV : création de projet, import des clips, lecture vidéo, informations média, barèmes personnalisés, notation, commentaires, suivi de l’avancement, résultats finaux et exports.')}
          </p>
          <p>
            {t('L’objectif n’est pas seulement de remplacer Excel, mais de proposer un vrai espace de travail pour les juges AMV, avec une interface simple à utiliser pendant un concours et des outils adaptés aux besoins réels du jury.')}
          </p>
        </div>
      </div>

      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('Pourquoi ce projet existe')}</p>
        <div className="space-y-3 text-sm leading-relaxed text-gray-300">
          <p>
            {t('Le projet est parti d’un constat simple : Excel peut dépanner pour noter un concours, mais il n’est pas vraiment adapté à tout le travail autour de la notation AMV.')}
          </p>
          <p>
            {t('Entre les vidéos, les barèmes, les critères, les commentaires, les informations des médias, les résultats et les exports, on se retrouve vite avec plusieurs éléments séparés à gérer. Cela peut faire perdre du temps, créer de la confusion et rendre la vérification des notes plus difficile.')}
          </p>
          <p>
            {t('Cette application a donc été pensée pour centraliser tout le processus de jugement dans un seul endroit, depuis la préparation du concours jusqu’à l’export des résultats.')}
          </p>
          <p>
            {t('Le but est de rendre la notation plus fluide, plus fiable et plus confortable, tout en gardant une logique claire pour les juges comme pour les organisateurs.')}
          </p>
        </div>
      </div>

      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('Créateur')}</p>
        <p className="text-sm leading-relaxed text-gray-300">
          {t('Application développée par Netsuma pour aider les juges et organisateurs de concours AMV à gérer plus facilement leurs sessions de notation.')}
        </p>
        <p className="mt-2 text-sm text-gray-300">{t('Dépôt GitHub :')}</p>
        <a
          href={GITHUB_REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          onClick={handleOpenRepositoryUrl}
          className="mt-2 inline-flex text-xs text-primary-300 hover:text-primary-200 underline decoration-primary-400/60"
        >
          {t('https://github.com/NetsumaInfo/application-bareme-amv-france')}
        </a>
      </div>

      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('Remerciements')}</p>
        <div className="space-y-3 text-sm leading-relaxed text-gray-300">
          <p>
            {t('Merci à toutes les personnes qui ont testé l’application, proposé des idées, signalé des problèmes ou aidé à améliorer le projet.')}
          </p>
          <p>
            {t('Merci particulièrement à :')}
          </p>
          <p className="font-medium text-white">
            {t('Twister, Kuta, ShinRyu, Damis, Lightning')}
          </p>
        </div>
      </div>
    </div>
  )
}
