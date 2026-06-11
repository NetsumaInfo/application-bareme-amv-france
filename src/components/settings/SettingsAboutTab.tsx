import { useCallback, useEffect, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { getVersion, getTauriVersion } from '@tauri-apps/api/app'
import {
  RefreshCw,
  Github,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Cpu,
  Monitor,
  Tag,
  Heart,
  Youtube,
  Globe,
  Link2,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import appIconUrl from '@/assets/app-icon.png'
import netsumaAvatarUrl from '@/assets/netsuma.png'
import { openExternalUrl } from '@/services/tauri'
import { useAppUpdateStore } from '@/store/useAppUpdateStore'
import { GITHUB_REPOSITORY_URL, GITHUB_RELEASES_URL } from '@/constants/projectLinks'

const SUBTLE_BORDER = 'ring-1 ring-inset ring-primary-400/10'
const CARD = `rounded-xl bg-surface/40 p-4 ${SUBTLE_BORDER}`
const SECTION_LABEL = 'text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5'

type SocialKind = 'youtube' | 'x' | 'discord' | 'website' | 'linktree'
interface SocialRef { kind: SocialKind; url: string }
interface Person { name: string; links: SocialRef[] }

const NETSUMA_LINKS: SocialRef[] = [
  { kind: 'youtube', url: 'https://www.youtube.com/@netsuma_amv' },
  { kind: 'x', url: 'https://x.com/NetsumaAMV' },
]

const AMV_FRANCE_LINKS: SocialRef[] = [
  { kind: 'website', url: 'https://www.amv-france.com/' },
  { kind: 'youtube', url: 'https://www.youtube.com/@AmvFranceOfficial' },
  { kind: 'discord', url: 'https://discord.com/invite/VsMS7BC3AS' },
]

const CONTRIBUTORS: Person[] = [
  { name: 'Twister', links: [{ kind: 'linktree', url: 'https://linktr.ee/TwisterAMV' }] },
  { name: 'Kuta', links: [{ kind: 'youtube', url: 'https://www.youtube.com/@Kuta_CS' }, { kind: 'x', url: 'https://x.com/Kuta_Cream' }] },
  { name: 'ShinRyu', links: [{ kind: 'youtube', url: 'https://www.youtube.com/user/ShinRyuST' }, { kind: 'website', url: 'https://portfolio-jdelannoy.netlify.app/' }] },
  { name: 'Damis', links: [{ kind: 'youtube', url: 'https://www.youtube.com/@Damis_AMV' }, { kind: 'x', url: 'https://x.com/DamisAmv' }] },
  { name: 'Lightning', links: [{ kind: 'youtube', url: 'https://www.youtube.com/@LightningAMV_' }, { kind: 'x', url: 'https://x.com/Lightning_Vee' }] },
]

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.369a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.291.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

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

  const [appVersion, setAppVersion] = useState<string | null>(null)
  const [tauriVersion, setTauriVersion] = useState<string | null>(null)
  const [platform] = useState<string>(detectPlatform)
  const [copied, setCopied] = useState(false)

  const checkingUpdates = status === 'checking'
  const hasUpdateAvailable = status === 'update_available'
  const isUpToDate = status === 'up_to_date'
  const hasUpdateCheckError = status === 'error'
  const resolvedReleaseUrl = releaseUrl || GITHUB_RELEASES_URL
  const displayVersion = appVersion ?? currentVersion ?? '—'

  const socialLabel = useCallback((kind: SocialKind): string => {
    switch (kind) {
      case 'youtube': return 'YouTube'
      case 'x': return 'X'
      case 'discord': return 'Discord'
      case 'linktree': return 'Linktree'
      case 'website': return t('Site web')
    }
  }, [t])

  const socialTitle = useCallback((kind: SocialKind, url: string): string => {
    try {
      const u = new URL(url)
      const seg = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean)
      const last = seg[seg.length - 1] ?? ''
      switch (kind) {
        case 'x':
          return `X · @${last.replace(/^@/, '')}`
        case 'youtube': {
          const handle = seg.find((s) => s.startsWith('@'))
          if (handle) return `YouTube · ${handle}`
          const userIdx = seg.indexOf('user')
          if (userIdx >= 0 && seg[userIdx + 1]) return `YouTube · ${seg[userIdx + 1]}`
          return 'YouTube'
        }
        case 'linktree':
          return last ? `Linktree · ${last}` : 'Linktree'
        case 'website':
          return u.hostname.replace(/^www\./, '')
        case 'discord':
          return 'Discord'
      }
    } catch {
      return socialLabel(kind)
    }
    return socialLabel(kind)
  }, [socialLabel])

  const socialIcon = useCallback((kind: SocialKind): ReactNode => {
    switch (kind) {
      case 'youtube': return <Youtube className="h-3.5 w-3.5" />
      case 'website': return <Globe className="h-3.5 w-3.5" />
      case 'linktree': return <Link2 className="h-3.5 w-3.5" />
      case 'x': return <XIcon />
      case 'discord': return <DiscordIcon />
    }
  }, [])

  const handleOpen = useCallback((url: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    openExternalUrl(url).catch(() => {})
  }, [])

  const handleManualUpdateCheck = useCallback(() => {
    checkForUpdates(true).catch(() => {})
  }, [checkForUpdates])
  const handleCopySystemInfo = useCallback(() => {
    const info = [`AMV Notation v${displayVersion}`, `Tauri ${tauriVersion ?? '?'}`, platform].join(' · ')
    navigator.clipboard?.writeText(info).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }).catch(() => {})
  }, [displayVersion, tauriVersion, platform])

  useEffect(() => {
    checkForUpdates().catch(() => {})
  }, [checkForUpdates])

  useEffect(() => {
    let active = true
    getVersion().then((v) => { if (active) setAppVersion(v) }).catch(() => {})
    getTauriVersion().then((v) => { if (active) setTauriVersion(v) }).catch(() => {})
    return () => { active = false }
  }, [])

  const renderSocials = (links: SocialRef[]) => (
    <div className="flex items-center gap-1.5">
      {links.map(({ kind, url }) => {
        const label = socialTitle(kind, url)
        return (
          <HoverTextTooltip key={url} text={label} placement="above" anchor force>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              onClick={handleOpen(url)}
              aria-label={label}
              className="inline-grid h-7 w-7 place-items-center rounded-md bg-surface-light/40 text-gray-400 ring-1 ring-inset ring-primary-400/10 transition-colors hover:bg-surface-light hover:text-white hover:ring-primary-400/30"
            >
              {socialIcon(kind)}
            </a>
          </HoverTextTooltip>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className={`${CARD} bg-gradient-to-br from-primary-500/10 via-surface/40 to-surface/40`}>
        <div className="flex items-center gap-4">
          <img
            src={appIconUrl}
            alt={t('AMV Notation')}
            className="h-14 w-14 shrink-0 rounded-2xl bg-white/5 object-contain p-1 ring-1 ring-inset ring-primary-400/15"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-white">{t('AMV Notation')}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-400/15 px-2 py-0.5 text-[11px] font-semibold text-primary-200 ring-1 ring-inset ring-primary-400/20">
                <Tag className="h-3 w-3" />
                v{displayVersion}
              </span>
            </div>
            <p className="mt-1 text-sm leading-snug text-gray-300">
              {t('Espace de travail tout-en-un pour juger les concours AMV.')}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={GITHUB_REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            onClick={handleOpen(GITHUB_REPOSITORY_URL)}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary-400/25 bg-surface-light/70 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-surface-light hover:text-white"
          >
            <Github className="h-3.5 w-3.5" />
            {t('Code source')}
          </a>
          <a
            href={resolvedReleaseUrl}
            target="_blank"
            rel="noreferrer"
            onClick={handleOpen(resolvedReleaseUrl)}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary-400/25 bg-surface-light/70 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-surface-light hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            {t('Releases')}
          </a>
        </div>
      </div>

      {/* Mises à jour */}
      <div className={CARD}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={SECTION_LABEL}>
              <RefreshCw className="h-3 w-3" />
              {t('Mises à jour')}
            </p>
            <p className="text-sm leading-relaxed text-gray-300">
              {t('Vérification automatique depuis GitHub Releases. Quand une nouvelle version sort, l’application vous la propose ici.')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleManualUpdateCheck}
            disabled={checkingUpdates}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary-400/25 bg-surface-light/70 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-surface-light hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checkingUpdates ? 'animate-spin' : ''}`} />
            {checkingUpdates ? t('Vérification...') : t('Vérifier maintenant')}
          </button>
        </div>

        <div className="mt-3 rounded-lg border border-primary-400/10 bg-black/20 px-3 py-2 text-xs text-gray-300">
          {hasUpdateAvailable ? (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 font-medium text-emerald-300">
                <Download className="h-3.5 w-3.5" />
                {t('Nouvelle version disponible : {version}', { version: latestVersion ?? '?' })}
              </p>
              <p>{t('Version installée : {version}', { version: currentVersion ?? displayVersion })}</p>
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
              <p className="flex items-center gap-1.5 font-medium text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('Vous utilisez déjà la dernière version disponible.')}
              </p>
              <p>{t('Version installée : {version}', { version: currentVersion ?? displayVersion })}</p>
            </div>
          ) : null}

          {hasUpdateCheckError ? (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 font-medium text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t('Impossible de vérifier les mises à jour pour le moment.')}
              </p>
              <p className="break-all">{errorMessage || t('Erreur inconnue.')}</p>
            </div>
          ) : null}

          {checkingUpdates ? (
            <p className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('Vérification des mises à jour en cours...')}
            </p>
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
            onClick={handleOpen(resolvedReleaseUrl)}
            className="inline-flex items-center gap-1 text-primary-300 underline decoration-primary-400/60 hover:text-primary-200"
          >
            {hasUpdateAvailable ? t('Télécharger la mise à jour') : t('Voir les releases GitHub')}
          </a>
        </div>
      </div>

      {/* À propos */}
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

      {/* Pourquoi */}
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

      {/* Infos techniques */}
      <div className={CARD}>
        <div className="flex items-start justify-between gap-3">
          <p className={SECTION_LABEL}>
            <Cpu className="h-3 w-3" />
            {t('Informations techniques')}
          </p>
          <button
            type="button"
            onClick={handleCopySystemInfo}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary-400/25 bg-surface-light/70 px-2.5 py-1 text-[11px] font-medium text-gray-200 transition-colors hover:bg-surface-light hover:text-white"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
            {copied ? t('Copié') : t('Copier')}
          </button>
        </div>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-black/20 px-3 py-2">
            <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500">
              <Tag className="h-3 w-3" />
              {t('Version')}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-100">v{displayVersion}</dd>
          </div>
          <div className="rounded-lg bg-black/20 px-3 py-2">
            <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500">
              <Cpu className="h-3 w-3" />
              {t('Moteur')}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-100">Tauri {tauriVersion ?? '—'}</dd>
          </div>
          <div className="rounded-lg bg-black/20 px-3 py-2">
            <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500">
              <Monitor className="h-3 w-3" />
              {t('Plateforme')}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-100">{platform}</dd>
          </div>
        </dl>
      </div>

      {/* Créateur */}
      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('Créateur')}</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={netsumaAvatarUrl}
              alt="Netsuma"
              className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-inset ring-primary-400/20"
            />
            <div>
              <p className="text-sm font-semibold text-white">Netsuma</p>
              <p className="text-xs text-gray-400">{t('Créateur & développeur')}</p>
            </div>
          </div>
          {renderSocials(NETSUMA_LINKS)}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-gray-300">
          {t('Application développée par Netsuma pour aider les juges et organisateurs de concours AMV à gérer plus facilement leurs sessions de notation.')}
        </p>
        <a
          href={GITHUB_REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          onClick={handleOpen(GITHUB_REPOSITORY_URL)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary-300 hover:text-primary-200 underline decoration-primary-400/60"
        >
          <Github className="h-3.5 w-3.5" />
          {t('https://github.com/NetsumaInfo/application-bareme-amv-france')}
        </a>
      </div>

      {/* AMV France */}
      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('Communauté')}</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">AMV France</p>
            <p className="text-xs text-gray-400">{t('La communauté des créateurs et juges AMV francophones.')}</p>
          </div>
          {renderSocials(AMV_FRANCE_LINKS)}
        </div>
      </div>

      {/* Remerciements */}
      <div className={CARD}>
        <p className={SECTION_LABEL}>
          <Heart className="h-3 w-3" />
          {t('Remerciements')}
        </p>
        <p className="mb-3 text-sm leading-relaxed text-gray-300">
          {t('Merci à toutes les personnes qui ont testé l’application, proposé des idées, signalé des problèmes ou aidé à améliorer le projet.')}
        </p>
        <ul className="space-y-1.5">
          {CONTRIBUTORS.map((person) => (
            <li
              key={person.name}
              className="flex items-center justify-between gap-3 rounded-lg bg-black/15 px-3 py-2"
            >
              <span className="text-sm font-medium text-white">{person.name}</span>
              {renderSocials(person.links)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function detectPlatform(): string {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS'
  if (/Linux|X11/i.test(ua)) return 'Linux'
  return 'Desktop'
}
