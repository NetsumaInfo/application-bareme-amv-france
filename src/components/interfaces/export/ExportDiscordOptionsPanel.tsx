import { Check, Copy, Download, RefreshCw, Scissors } from 'lucide-react'
import type { ElementType } from 'react'
import { AppCheckbox } from '@/components/ui/AppCheckbox'
import { AppSelect } from '@/components/ui/AppSelect'
import { useI18n } from '@/i18n'
import {
  DISCORD_MESSAGE_LIMIT,
  type DiscordAnnouncementSettings,
} from '@/components/interfaces/export/discordAnnouncementTemplate'
import type { ExportContestCategoryOption } from '@/components/interfaces/export/types'

type DiscordCopyState = 'all' | 'chunk' | 'download' | 'error' | null

interface ExportDiscordOptionsPanelProps {
  mention: string
  textLength: number
  chunks: string[]
  selectedChunkIndex: number
  copyState: DiscordCopyState
  resultCount: number
  favoriteCount: number
  settings: DiscordAnnouncementSettings
  contestCategoryKey: string
  contestCategoryOptions: ExportContestCategoryOption[]
  onSetMention: (mention: string) => void
  onSelectChunk: (index: number) => void
  onPatchSettings: (patch: Partial<DiscordAnnouncementSettings>) => void
  onSetContestCategoryKey: (categoryKey: string) => void
  onCopyAll: () => void
  onCopySelectedChunk: () => void
  onDownloadText: () => void
  onResetAnnouncement: () => void
}

function ActionButton({
  icon: Icon,
  label,
  active = false,
  danger = false,
  onClick,
}: {
  icon: ElementType
  label: string
  active?: boolean
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] font-medium transition-colors active:scale-[0.99] ${
        danger
          ? 'text-rose-200 hover:bg-rose-500/10'
          : active
            ? 'bg-primary-600/20 text-primary-200'
            : 'text-gray-300 hover:bg-white/6 hover:text-white'
      }`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/6">
        <Icon size={13} />
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  )
}

function Metric({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'warning' }) {
  return (
    <div className="rounded-md border border-gray-700/45 bg-white/2.5 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-0.5 text-[13px] font-semibold ${tone === 'warning' ? 'text-amber-200' : 'text-white'}`}>
        {value}
      </div>
    </div>
  )
}

export function ExportDiscordOptionsPanel({
  mention,
  textLength,
  chunks,
  selectedChunkIndex,
  copyState,
  resultCount,
  favoriteCount,
  settings,
  contestCategoryKey,
  contestCategoryOptions,
  onSetMention,
  onSelectChunk,
  onPatchSettings,
  onSetContestCategoryKey,
  onCopyAll,
  onCopySelectedChunk,
  onDownloadText,
  onResetAnnouncement,
}: ExportDiscordOptionsPanelProps) {
  const { t } = useI18n()
  const overLimit = textLength > DISCORD_MESSAGE_LIMIT
  const selectedChunk = chunks[selectedChunkIndex] ?? chunks[0] ?? ''

  const copyMessage = copyState === 'all'
    ? t('Annonce copiée')
    : copyState === 'chunk'
      ? t('Bloc copié')
      : copyState === 'download'
        ? t('Fichier texte préparé')
        : copyState === 'error'
          ? t('Copie impossible')
          : null

  const appendMention = (value: string) => {
    const clean = value.trim()
    if (!clean) return
    const current = mention.trim()
    onSetMention(current ? `${current} ${clean}` : clean)
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 px-3">
      <div className="space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#c7d2fe]">
          {t('Annonce Discord')}
        </div>
        <p className="text-[11px] leading-4 text-gray-400">
          {t('Éditez le message final, puis copiez le Markdown prêt pour Discord.')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Metric label={t('Caractères')} value={String(textLength)} tone={overLimit ? 'warning' : 'neutral'} />
        <Metric label={t('Blocs')} value={String(chunks.length)} tone={overLimit ? 'warning' : 'neutral'} />
        <Metric label={t('Résultats')} value={String(resultCount)} />
        <Metric label={t('Favoris')} value={String(favoriteCount)} />
        <Metric label={t('Limite')} value={String(DISCORD_MESSAGE_LIMIT)} />
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{t('Catégories clip')}</span>
        <AppSelect
          value={contestCategoryKey}
          onChange={onSetContestCategoryKey}
          ariaLabel={t('Catégories clip')}
          className="w-full"
          options={contestCategoryOptions.map((option) => ({ value: option.key, label: option.label }))}
        />
      </div>

      {overLimit ? (
        <div className="rounded-md border border-amber-400/25 bg-amber-500/10 px-2 py-2 text-[11px] leading-4 text-amber-100">
          {t('Le message dépasse 2000 caractères. Copiez les blocs générés dans l’ordre.')}
        </div>
      ) : null}

      <div className="space-y-2 rounded-md border border-gray-700/40 bg-black/15 px-2 py-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
          {t('Mentions / pings')}
        </div>
        <div className="text-[10px] leading-4 text-gray-400">
          {t('Utilisez @everyone, @here')}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => appendMention('@everyone')}
            className="rounded-md border border-gray-700/60 px-2 py-1 text-[10px] font-medium text-slate-200 transition-colors hover:bg-white/6"
          >
            @everyone
          </button>
          <button
            type="button"
            onClick={() => appendMention('@here')}
            className="rounded-md border border-gray-700/60 px-2 py-1 text-[10px] font-medium text-slate-200 transition-colors hover:bg-white/6"
          >
            @here
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <ActionButton
          icon={copyState === 'all' ? Check : Copy}
          label={t('Copier l’annonce')}
          active={copyState === 'all'}
          onClick={onCopyAll}
        />
        <ActionButton
          icon={copyState === 'chunk' ? Check : Scissors}
          label={t('Copier le bloc sélectionné')}
          active={copyState === 'chunk'}
          onClick={onCopySelectedChunk}
        />
        <ActionButton
          icon={copyState === 'download' ? Check : Download}
          label={t('Télécharger en TXT')}
          active={copyState === 'download'}
          onClick={onDownloadText}
        />
        <ActionButton
          icon={RefreshCw}
          label={t('Régénérer depuis les résultats')}
          danger
          onClick={onResetAnnouncement}
        />
        {copyMessage ? (
          <div className={`text-[10px] ${copyState === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>
            {copyMessage}
          </div>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{t('Bloc Discord')}</span>
          <AppSelect
            value={String(selectedChunkIndex)}
            onChange={(value) => onSelectChunk(Number(value))}
            ariaLabel={t('Bloc Discord')}
            className="w-32"
            options={chunks.map((chunk, index) => ({
              value: String(index),
              label: t('Bloc {index}', { index: index + 1 }),
              menuLabel: `${t('Bloc {index}', { index: index + 1 })} · ${chunk.length}`,
            }))}
          />
        </div>
        <div className="rounded-md border border-gray-700/40 bg-black/20 px-2 py-1.5 text-[10px] leading-4 text-gray-400">
          {t('{count} caractères dans ce bloc', { count: selectedChunk.length })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
          {t('Résultats')}
        </div>
        <label className="block space-y-1">
          <span className="text-[10px] text-gray-500">{t('Nombre de lignes')}</span>
          <input
            type="number"
            min={1}
            max={Math.max(resultCount, 1)}
            value={settings.topCount}
            onChange={(event) => {
              const value = Number(event.target.value)
              onPatchSettings({ topCount: Number.isFinite(value) ? Math.max(1, Math.round(value)) : 1 })
            }}
            className="h-7 w-full rounded-md border border-gray-700/55 bg-transparent px-2 text-[11px] text-white outline-hidden focus:border-primary-500"
          />
        </label>
        <AppCheckbox
          checked={settings.includeClipName}
          label={t('Afficher le nom du clip')}
          onChange={(checked) => onPatchSettings({ includeClipName: checked })}
        />
        <AppCheckbox
          checked={settings.includeFavorites}
          label={t('Afficher les favoris')}
          onChange={(checked) => onPatchSettings({ includeFavorites: checked })}
        />
        <div className="space-y-1">
          <span className="text-[10px] text-gray-500">{t('Scores')}</span>
          <AppSelect
            value={settings.scoreMode}
            onChange={(scoreMode) => onPatchSettings({ scoreMode })}
            ariaLabel={t('Scores')}
            className="w-full"
            options={[
              { value: 'hidden', label: t('Masqués') },
              { value: 'score', label: t('Score seul') },
              { value: 'score_total', label: t('Score / total') },
            ]}
          />
        </div>
      </div>

      <div className="space-y-2 pb-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
          {t('Formatage')}
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-gray-500">{t('Titre')}</span>
          <AppSelect
            value={settings.titleStyle}
            onChange={(titleStyle) => onPatchSettings({ titleStyle })}
            ariaLabel={t('Style du titre')}
            className="w-full"
            options={[
              { value: 'h1', label: t('Grand titre') },
              { value: 'h2', label: t('Titre moyen') },
              { value: 'h3', label: t('Petit titre') },
              { value: 'bold', label: t('Gras simple') },
            ]}
          />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-gray-500">{t('Classement')}</span>
          <AppSelect
            value={settings.rankingStyle}
            onChange={(rankingStyle) => onPatchSettings({ rankingStyle })}
            ariaLabel={t('Style du classement')}
            className="w-full"
            options={[
              { value: 'numbered', label: t('Liste numérotée') },
              { value: 'bullet', label: t('Puces + rang') },
              { value: 'compact', label: t('Compact') },
              { value: 'quote', label: t('Citation') },
            ]}
          />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-gray-500">{t('Texte des lignes')}</span>
          <AppSelect
            value={settings.rowTextStyle}
            onChange={(rowTextStyle) => onPatchSettings({ rowTextStyle })}
            ariaLabel={t('Style du texte des lignes')}
            className="w-full"
            options={[
              { value: 'plain', label: t('Normal') },
              { value: 'bold', label: t('Gras') },
              { value: 'italic', label: t('Italique') },
              { value: 'underline', label: t('Souligné') },
              { value: 'strike', label: t('Barré') },
              { value: 'spoiler', label: t('Spoiler') },
              { value: 'code', label: t('Code en ligne') },
            ]}
          />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-gray-500">{t('Décimales')}</span>
          <AppSelect
            value={String(settings.scoreDecimals)}
            onChange={(value) => onPatchSettings({ scoreDecimals: Number(value) })}
            ariaLabel={t('Décimales')}
            className="w-full"
            options={[
              { value: '0', label: '0' },
              { value: '1', label: '1' },
              { value: '2', label: '2' },
            ]}
          />
        </div>
      </div>

      <div className="space-y-1.5 rounded-md border border-gray-700/40 bg-black/15 px-2 py-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
          {t('Markdown Discord')}
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] leading-4 text-gray-400">
          <code>**{t('gras')}**</code>
          <code>*{t('italique')}*</code>
          <code>__{t('souligné')}__</code>
          <code>~~{t('barré')}~~</code>
          <code>||{t('spoiler')}||</code>
          <code>&gt; {t('citation')}</code>
          <code>- {t('liste')}</code>
          <code>[{t('lien')}](url)</code>
        </div>
      </div>
    </div>
  )
}
