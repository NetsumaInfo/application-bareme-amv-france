import type { TranslateFn } from '@/i18n/context'

export const DISCORD_MESSAGE_LIMIT = 2000

type DiscordTitleStyle = 'h1' | 'h2' | 'h3' | 'bold'
type DiscordRankingStyle = 'numbered' | 'bullet' | 'compact' | 'quote'
type DiscordScoreMode = 'hidden' | 'score' | 'score_total'
type DiscordRowTextStyle = 'plain' | 'bold' | 'italic' | 'underline' | 'strike' | 'spoiler' | 'code'

export interface DiscordAnnouncementContent {
  mention: string
  title: string
  intro: string
  rankingTitle: string
  favoritesTitle: string
  footer: string
}

export interface DiscordAnnouncementSettings {
  titleStyle: DiscordTitleStyle
  rankingStyle: DiscordRankingStyle
  scoreMode: DiscordScoreMode
  topCount: number
  scoreDecimals: number
  includeClipName: boolean
  includeFavorites: boolean
  rowTextStyle: DiscordRowTextStyle
}

export interface DiscordAnnouncementResultRow {
  clipId: string
  rank: number
  participant: string
  clipName: string
  score: number
  totalPoints: number
}

export interface DiscordAnnouncementFavoriteRow {
  clipId: string
  participant: string
  clipName: string
  comment: string
}

export function buildDiscordAnnouncementContent(t: TranslateFn, projectName?: string): DiscordAnnouncementContent {
  const safeProjectName = projectName?.trim() || t('concours')

  return {
    mention: '',
    title: t('Résultats {projectName}', { projectName: safeProjectName }),
    intro: t('Merci à tous pour vos participations. Voici le classement final.'),
    rankingTitle: t('RANKING :'),
    favoritesTitle: t('Coups de cœur :'),
    footer: t('Bravo à tout le monde et merci aux juges.'),
  }
}

export function buildDefaultDiscordAnnouncementSettings(rowCount: number): DiscordAnnouncementSettings {
  return {
    titleStyle: 'h1',
    rankingStyle: 'numbered',
    scoreMode: 'hidden',
    topCount: Math.max(1, Math.min(rowCount || 20, 50)),
    scoreDecimals: 1,
    includeClipName: true,
    includeFavorites: true,
    rowTextStyle: 'bold',
  }
}

function normalizeDiscordMentionToken(token: string): string {
  const clean = token.trim()
  if (!clean) return ''
  if (clean === '@everyone' || clean === '@here') return clean
  if (/^<@!?\d{17,20}>$/.test(clean)) return clean.replace(/^<@!(\d{17,20})>$/, '<@$1>')
  if (/^<@&\d{17,20}>$/.test(clean) || /^<#\d{17,20}>$/.test(clean)) return clean

  const userById = clean.match(/^@!?(\d{17,20})$/)
  if (userById) return `<@${userById[1]}>`

  const roleById = clean.match(/^@&(\d{17,20})$/)
  if (roleById) return `<@&${roleById[1]}>`

  const channelById = clean.match(/^#(\d{17,20})$/)
  if (channelById) return `<#${channelById[1]}>`

  return clean
}

export function normalizeDiscordMentionText(value: string): string {
  const clean = value.trim()
  if (!clean) return ''

  const separatorsPattern = /([\s,;]+)/g
  const separatorSegmentPattern = /^[\s,;]+$/
  const segments = clean.split(separatorsPattern)
  return segments
    .map((segment) => separatorSegmentPattern.test(segment) ? segment : normalizeDiscordMentionToken(segment))
    .join('')
    .trim()
}

function formatHeading(text: string, style: DiscordTitleStyle): string {
  const clean = text.trim()
  if (!clean) return ''

  if (style === 'h1') return `# **${clean}**`
  if (style === 'h2') return `## **${clean}**`
  if (style === 'h3') return `### **${clean}**`
  return `**${clean}**`
}

function applyDiscordInlineStyle(text: string, style: DiscordRowTextStyle): string {
  const clean = text.trim()
  if (!clean) return ''

  if (style === 'bold') return `**${clean}**`
  if (style === 'italic') return `*${clean}*`
  if (style === 'underline') return `__${clean}__`
  if (style === 'strike') return `~~${clean}~~`
  if (style === 'spoiler') return `||${clean}||`
  if (style === 'code') return `\`${clean.replace(/`/g, "'")}\``
  return clean
}

function formatScore(row: DiscordAnnouncementResultRow, settings: DiscordAnnouncementSettings): string {
  if (settings.scoreMode === 'hidden') return ''

  const score = row.score.toFixed(settings.scoreDecimals)
  if (settings.scoreMode === 'score_total' && row.totalPoints > 0) {
    return ` — ${score}/${row.totalPoints}`
  }
  return ` — ${score}`
}

export function buildDiscordResultDefaultText(
  row: DiscordAnnouncementResultRow,
  settings: Pick<DiscordAnnouncementSettings, 'includeClipName'>,
): string {
  const participant = row.participant.trim() || 'Participant'
  const clipName = row.clipName.trim()
  if (!settings.includeClipName || !clipName) return participant
  return `${participant} – ${clipName}`
}

function formatRankingLine(
  row: DiscordAnnouncementResultRow,
  text: string,
  settings: DiscordAnnouncementSettings,
): string {
  const lineText = text.trim() || buildDiscordResultDefaultText(row, settings)
  const score = formatScore(row, settings)
  const styledLineText = applyDiscordInlineStyle(lineText, settings.rowTextStyle)

  if (settings.rankingStyle === 'bullet') {
    return `- ${row.rank}. ${styledLineText}${score}`
  }

  if (settings.rankingStyle === 'compact') {
    return `${row.rank} : ${styledLineText}${score}`
  }

  if (settings.rankingStyle === 'quote') {
    return `> ${row.rank}. ${styledLineText}${score}`
  }

  return `${row.rank}. ${styledLineText}${score}`
}

function formatFavoriteLine(row: DiscordAnnouncementFavoriteRow): string {
  const participant = row.participant.trim() || 'Participant'
  const clipName = row.clipName.trim()
  const comment = row.comment.trim()
  const title = clipName ? `**${participant}** - ${clipName}` : `**${participant}**`
  return comment ? `- ${title}: ${comment}` : `- ${title}`
}

export function serializeDiscordResultAnnouncement({
  content,
  rows,
  favoriteRows = [],
  rowOverrides,
  settings,
}: {
  content: DiscordAnnouncementContent
  rows: DiscordAnnouncementResultRow[]
  favoriteRows?: DiscordAnnouncementFavoriteRow[]
  rowOverrides: Record<string, string>
  settings: DiscordAnnouncementSettings
}): string {
  const visibleRows = rows.slice(0, Math.max(1, settings.topCount))
  const lines: string[] = []
  const mentionLine = normalizeDiscordMentionText(content.mention)

  if (mentionLine) lines.push(mentionLine, '')
  if (content.title.trim()) lines.push(formatHeading(content.title, settings.titleStyle), '')
  if (content.intro.trim()) lines.push(content.intro.trim(), '')
  if (content.rankingTitle.trim()) lines.push(`**${content.rankingTitle.trim()}**`, '')

  if (visibleRows.length > 0) {
    for (const row of visibleRows) {
      lines.push(formatRankingLine(
        row,
        rowOverrides[row.clipId] ?? buildDiscordResultDefaultText(row, settings),
        settings,
      ))
    }
  } else {
    lines.push('- Aucun résultat disponible')
  }

  if (settings.includeFavorites && favoriteRows.length > 0) {
    lines.push('', `**${content.favoritesTitle.trim() || 'Coups de cœur :'}**`, '')
    for (const row of favoriteRows) {
      lines.push(formatFavoriteLine(row))
    }
  }

  if (content.footer.trim()) lines.push('', content.footer.trim())

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function splitDiscordMessages(text: string, limit = DISCORD_MESSAGE_LIMIT): string[] {
  if (text.length <= limit) return [text]

  const chunks: string[] = []
  let remaining = text.trim()

  while (remaining.length > limit) {
    const candidate = remaining.slice(0, limit)
    const paragraphBreak = candidate.lastIndexOf('\n\n')
    const lineBreak = candidate.lastIndexOf('\n')
    const spaceBreak = candidate.lastIndexOf(' ')
    const splitAt = paragraphBreak > limit * 0.55
      ? paragraphBreak + 2
      : lineBreak > limit * 0.55
        ? lineBreak + 1
        : spaceBreak > limit * 0.55
          ? spaceBreak + 1
          : limit

    chunks.push(remaining.slice(0, splitAt).trimEnd())
    remaining = remaining.slice(splitAt).trimStart()
  }

  if (remaining.length > 0) chunks.push(remaining)
  return chunks.length > 0 ? chunks : ['']
}
