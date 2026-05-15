import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Hash, MessageSquareText, Star } from 'lucide-react'
import { useI18n } from '@/i18n'
import {
  DISCORD_MESSAGE_LIMIT,
  buildDiscordResultDefaultText,
  normalizeDiscordMentionText,
  type DiscordAnnouncementFavoriteRow,
  type DiscordAnnouncementContent,
  type DiscordAnnouncementResultRow,
  type DiscordAnnouncementSettings,
} from '@/components/interfaces/export/discordAnnouncementTemplate'

interface ExportDiscordPreviewPanelProps {
  content: DiscordAnnouncementContent
  settings: DiscordAnnouncementSettings
  rows: DiscordAnnouncementResultRow[]
  favoriteRows: DiscordAnnouncementFavoriteRow[]
  rowOverrides: Record<string, string>
  selectedChunkIndex: number
  chunks: string[]
  onPatchContent: (patch: Partial<DiscordAnnouncementContent>) => void
  onSetRowOverride: (clipId: string, value: string) => void
}

interface EditableTextProps {
  value: string
  placeholder: string
  className: string
  multiline?: boolean
  spellCheck?: boolean
  ariaLabel: string
  onChange: (value: string) => void
}

function normalizeEditableText(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/\r\n/g, '\n')
}

function EditableText({
  value,
  placeholder,
  className,
  multiline = false,
  spellCheck = false,
  ariaLabel,
  onChange,
}: EditableTextProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node || document.activeElement === node) return
    if (normalizeEditableText(node.innerText) !== value) {
      node.innerText = value
    }
  }, [value])

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, multiline ? text : text.replace(/\s+/g, ' '))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (multiline || event.key !== 'Enter') return
    event.preventDefault()
    event.currentTarget.blur()
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={ariaLabel}
      aria-multiline={multiline}
      spellCheck={spellCheck}
      data-native-context="true"
      data-placeholder={placeholder}
      onInput={(event) => onChange(normalizeEditableText(event.currentTarget.innerText))}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      className={`${className} rounded-[4px] outline-hidden transition-colors empty:before:text-slate-500 empty:before:content-[attr(data-placeholder)] focus:bg-white/[0.035] focus:ring-1 focus:ring-[#5865f2]/55`}
    />
  )
}

function getTitleClassName(style: DiscordAnnouncementSettings['titleStyle']): string {
  if (style === 'h1') return 'text-[28px] font-bold leading-9 text-slate-50'
  if (style === 'h2') return 'text-[22px] font-bold leading-7 text-slate-50'
  if (style === 'h3') return 'text-[18px] font-bold leading-6 text-slate-50'
  return 'text-[17px] font-bold leading-6 text-slate-50'
}

function getScoreLabel(row: DiscordAnnouncementResultRow, settings: DiscordAnnouncementSettings): string {
  if (settings.scoreMode === 'hidden') return ''
  const score = row.score.toFixed(settings.scoreDecimals)
  if (settings.scoreMode === 'score_total' && row.totalPoints > 0) return `${score}/${row.totalPoints}`
  return score
}

function getRankMarker(rank: number, settings: DiscordAnnouncementSettings): string {
  if (settings.rankingStyle === 'bullet') return '•'
  if (settings.rankingStyle === 'compact') return `${rank}:`
  if (settings.rankingStyle === 'quote') return `> ${rank}.`
  return `${rank}.`
}

function getRowTextClassName(style: DiscordAnnouncementSettings['rowTextStyle']): string {
  if (style === 'italic') return 'italic'
  if (style === 'underline') return 'underline'
  if (style === 'strike') return 'line-through'
  if (style === 'code') return 'font-mono rounded-sm bg-black/25 px-1.5 py-0.5 text-[13px]'
  if (style === 'spoiler') return 'rounded-sm bg-slate-900 px-1.5 py-0.5 text-transparent hover:text-slate-100'
  return ''
}

export function ExportDiscordPreviewPanel({
  content,
  settings,
  rows,
  favoriteRows,
  rowOverrides,
  selectedChunkIndex,
  chunks,
  onPatchContent,
  onSetRowOverride,
}: ExportDiscordPreviewPanelProps) {
  const { t, formatDate } = useI18n()
  const visibleRows = rows.slice(0, Math.max(1, settings.topCount))
  const visibleFavoriteRows = settings.includeFavorites ? favoriteRows : []
  const selectedChunk = chunks[selectedChunkIndex] ?? chunks[0] ?? ''
  const normalizedMention = normalizeDiscordMentionText(content.mention)
  const overLimit = chunks.length > 1
  const rowTextClassName = getRowTextClassName(settings.rowTextStyle)

  return (
    <div data-screenshot-zone="export-discord" className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#313338]">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-black/25 bg-[#313338] px-4">
        <div className="flex min-w-0 items-center gap-2 text-slate-100">
          <Hash size={19} className="shrink-0 text-slate-400" />
          <span className="truncate text-[15px] font-semibold">{t('resultats')}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>{t('{count} résultats', { count: rows.length })}</span>
          <span className={overLimit ? 'text-amber-200' : 'text-slate-400'}>
            {overLimit
              ? t('{count} blocs Discord', { count: chunks.length })
              : t('{count} caractères', { count: selectedChunk.length })}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-5">
        <div className="mx-auto max-w-[980px]">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#5865f2] text-[16px] font-bold text-white">
              A
            </div>

            <article className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-baseline gap-2">
                <span className="text-[14px] font-semibold text-white">{t('Annonce')}</span>
                <span className="text-[11px] text-slate-400">
                  {t('Aujourd’hui à {time}', {
                    time: formatDate(new Date(), { hour: '2-digit', minute: '2-digit' }),
                  })}
                </span>
              </div>

              <div className="space-y-4 rounded-md bg-[#2b2d31] px-5 py-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                <EditableText
                  value={content.mention}
                  placeholder={t('@everyone, rôle ou salon optionnel')}
                  ariaLabel={t('Mention Discord')}
                  onChange={(mention) => onPatchContent({ mention })}
                  className="min-h-[22px] text-[14px] font-medium leading-6 text-[#dbe0ff]"
                />
                {normalizedMention && normalizedMention !== content.mention.trim() ? (
                  <div className="rounded-md border border-[#5865f2]/25 bg-[#5865f2]/10 px-2 py-1 text-[11px] leading-4 text-[#dbe0ff]">
                    {t('Mention normalisée: {value}', { value: normalizedMention })}
                  </div>
                ) : null}

                <EditableText
                  value={content.title}
                  placeholder={t('Titre de l’annonce')}
                  ariaLabel={t('Titre de l’annonce')}
                  onChange={(title) => onPatchContent({ title })}
                  className={getTitleClassName(settings.titleStyle)}
                />

                <EditableText
                  value={content.intro}
                  placeholder={t('Texte d’introduction')}
                  ariaLabel={t('Texte d’introduction')}
                  multiline
                  spellCheck
                  onChange={(intro) => onPatchContent({ intro })}
                  className="min-h-[28px] whitespace-pre-wrap text-[15px] leading-7 text-slate-200"
                />

                <div className="space-y-2">
                  <EditableText
                    value={content.rankingTitle}
                    placeholder={t('Titre du classement')}
                    ariaLabel={t('Titre du classement')}
                    onChange={(rankingTitle) => onPatchContent({ rankingTitle })}
                    className="min-h-[26px] text-[20px] font-bold leading-7 text-slate-50"
                  />

                  <div className="space-y-1">
                    {visibleRows.length > 0 ? visibleRows.map((row) => {
                      const scoreLabel = getScoreLabel(row, settings)
                      const value = rowOverrides[row.clipId] ?? buildDiscordResultDefaultText(row, settings)
                      const isTopThree = row.rank <= 3

                      return (
                        <div
                          key={row.clipId}
                          className={`group grid grid-cols-[42px_minmax(0,1fr)_auto] items-start gap-2 rounded-md border px-2 py-1.5 transition-colors hover:bg-white/[0.035] ${
                            isTopThree ? 'border-[#5865f2]/25 bg-[#363940]' : 'border-transparent'
                          }`}
                        >
                          <span className="rounded-md bg-black/16 px-1.5 py-0.5 text-center text-[13px] font-semibold leading-5 text-slate-300">
                            {getRankMarker(row.rank, settings)}
                          </span>
                          <EditableText
                            value={value}
                            placeholder={t('Participant – Clip')}
                            ariaLabel={t('Ligne de classement {rank}', { rank: row.rank })}
                            onChange={(line) => onSetRowOverride(row.clipId, line)}
                            className={`min-h-[24px] text-[15px] leading-6 text-slate-100 ${settings.rowTextStyle === 'bold' ? 'font-semibold' : ''} ${rowTextClassName}`}
                          />
                          {scoreLabel ? (
                            <span className="rounded-md bg-white/5.5 px-2 py-1 text-[12px] font-semibold leading-4 text-slate-200">
                              {scoreLabel}
                            </span>
                          ) : null}
                        </div>
                      )
                    }) : (
                      <div className="rounded-md border border-dashed border-slate-600/70 px-3 py-4 text-[13px] text-slate-400">
                        {t('Aucun résultat disponible pour générer le classement.')}
                      </div>
                    )}
                  </div>
                </div>

                {visibleFavoriteRows.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Star size={15} fill="currentColor" className="text-amber-200" />
                      <EditableText
                        value={content.favoritesTitle}
                        placeholder={t('Titre des favoris')}
                        ariaLabel={t('Titre des favoris')}
                        onChange={(favoritesTitle) => onPatchContent({ favoritesTitle })}
                        className="min-h-[24px] text-[18px] font-bold leading-6 text-amber-100"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      {visibleFavoriteRows.map((row) => {
                        const clipName = row.clipName.trim()
                        const title = clipName ? `${row.participant} - ${clipName}` : row.participant
                        const comment = row.comment.trim()

                        return (
                          <div
                            key={`favorite-${row.clipId}`}
                            className="rounded-md border border-amber-300/16 bg-amber-300/8 px-3 py-2"
                          >
                            <div className="text-[13px] font-semibold leading-5 text-amber-100">
                              {title}
                            </div>
                            {comment ? (
                              <div className="mt-1 whitespace-pre-wrap text-[12px] leading-5 text-slate-300">
                                {comment}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                <EditableText
                  value={content.footer}
                  placeholder={t('Message de fin')}
                  ariaLabel={t('Message de fin')}
                  multiline
                  spellCheck
                  onChange={(footer) => onPatchContent({ footer })}
                  className="min-h-[28px] whitespace-pre-wrap text-[14px] leading-6 text-slate-300"
                />
              </div>
            </article>
          </div>

          {overLimit ? (
            <div className="mt-4 rounded-md border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[12px] leading-5 text-amber-100">
              <div className="flex items-center gap-2 font-semibold">
                <MessageSquareText size={14} />
                {t('Publication en plusieurs messages')}
              </div>
              <div className="mt-1">
                {t('Le bloc sélectionné contient {count} caractères sur {limit}.', {
                  count: selectedChunk.length,
                  limit: DISCORD_MESSAGE_LIMIT,
                })}
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  )
}
