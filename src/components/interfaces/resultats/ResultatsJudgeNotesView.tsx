import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Play } from 'lucide-react'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import {
  type CategoryGroup,
  type JudgeSource,
  type NoteLike,
} from '@/utils/results'
import { withAlpha } from '@/utils/colors'
import { TimecodeInlineText } from '@/components/notes/TimecodeInlineText'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import type { Clip } from '@/types/project'
import { useI18n } from '@/i18n'
import { useZoomScale } from '@/hooks/useZoomScale'

type JudgeNoteLike = NoteLike & {
  criterionNotes?: Record<string, string>
  categoryNotes?: Record<string, string>
  textNotes?: string
}

interface ResultatsJudgeNotesViewProps {
  clips: Clip[]
  selectedClipId: string | null
  judges: JudgeSource[]
  categoryGroups: CategoryGroup[]
  judgeColors: Record<string, string>
  onSelectClip: (clipId: string) => void
  onJumpToTimecode: (clipId: string, seconds: number) => void
  onTimecodeHover: (params: { seconds: number; anchorRect: DOMRect }) => void
  onTimecodeLeave: () => void
  onOpenPlayer?: (clipId: string) => void
  onDetach?: () => void
  detached?: boolean
}

interface ClipOption {
  clip: Clip
  label: string
}

interface TimecodeHandlers {
  onJumpToTimecode: (clipId: string, seconds: number) => void
  onTimecodeHover: (params: { seconds: number; anchorRect: DOMRect }) => void
  onTimecodeLeave: () => void
}

function normalizeText(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function InlineNote({
  clipId,
  text,
  color,
  handlers,
}: {
  clipId: string
  text: string
  color: string
  handlers: TimecodeHandlers
}) {
  const { t } = useI18n()
  if (!text) return <div className="text-[11px] text-gray-500">{t('Aucune note')}</div>

  return (
    <TimecodeInlineText
      text={text}
      color={color}
      onTimecodeSelect={(item) => handlers.onJumpToTimecode(clipId, item.seconds)}
      onTimecodeHover={({ item, anchorRect }) => {
        handlers.onTimecodeHover({ seconds: item.seconds, anchorRect })
      }}
      onTimecodeLeave={handlers.onTimecodeLeave}
    />
  )
}

function ClipMenu({
  selectedClip,
  clipOptions,
  menuStyle,
  menuRef,
  onSelectClip,
  onClose,
}: {
  selectedClip: Clip
  clipOptions: ClipOption[]
  menuStyle: { top: number; left: number; width: number; maxHeight: number }
  menuRef: React.RefObject<HTMLDivElement | null>
  onSelectClip: (clipId: string) => void
  onClose: () => void
}) {
  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[2100] overflow-hidden rounded-md border border-gray-800 bg-[#0a0d12] shadow-2xl"
      style={{ top: `${menuStyle.top}px`, left: `${menuStyle.left}px`, width: `${menuStyle.width}px` }}
    >
      <div
        className="overflow-y-auto p-1"
        style={{ maxHeight: `${menuStyle.maxHeight}px` }}
        role="listbox"
        aria-activedescendant={`judge-notes-clip-option-${selectedClip.id}`}
      >
        {clipOptions.map(({ clip, label }) => {
          const isSelected = clip.id === selectedClip.id
          return (
            <button
              key={`judge-notes-clip-${clip.id}`}
              id={`judge-notes-clip-option-${clip.id}`}
              type="button"
              onClick={() => {
                onSelectClip(clip.id)
                onClose()
              }}
              className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                isSelected
                  ? 'bg-white/[0.04] text-white'
                  : 'text-gray-300 hover:bg-white/[0.03] hover:text-white'
              }`}
              role="option"
              aria-selected={isSelected}
            >
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {isSelected ? <Check size={13} className="shrink-0 text-gray-400" /> : null}
            </button>
          )
        })}
      </div>
    </div>,
    document.body,
  )
}

function JudgeNotesToolbar({
  selectedClip,
  effectiveClipIndex,
  clipCount,
  clipOptions,
  clipMenuOpen,
  clipMenuButtonRef,
  onToggleClipMenu,
  onSelectClipByIndex,
  onOpenPlayer,
  onDetach,
  detached,
}: {
  selectedClip: Clip
  effectiveClipIndex: number
  clipCount: number
  clipOptions: ClipOption[]
  clipMenuOpen: boolean
  clipMenuButtonRef: React.RefObject<HTMLButtonElement | null>
  onToggleClipMenu: () => void
  onSelectClipByIndex: (index: number) => void
  onOpenPlayer?: (clipId: string) => void
  onDetach?: () => void
  detached: boolean
}) {
  const { t } = useI18n()

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-gray-700/50 px-2 py-1">
      <HoverTextTooltip text={t('Clip précédent')}>
        <button
          type="button"
          onClick={() => onSelectClipByIndex(Math.max(0, effectiveClipIndex - 1))}
          className="inline-flex h-5 w-5 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-default disabled:opacity-30"
          disabled={effectiveClipIndex <= 0 || clipCount < 2}
          aria-label={t('Clip précédent')}
        >
          <ChevronLeft size={14} className="mx-auto" />
        </button>
      </HoverTextTooltip>

      <div className="relative min-w-[220px] max-w-[360px] flex-1">
        <button
          ref={clipMenuButtonRef}
          type="button"
          onClick={onToggleClipMenu}
          className="flex h-6 w-full items-center gap-2 rounded-md bg-transparent px-2 text-left text-[11px] text-gray-200 transition-colors hover:bg-white/[0.03] focus:outline-none"
          aria-label={clipOptions[effectiveClipIndex]?.label ?? selectedClip.id}
          aria-haspopup="listbox"
          aria-expanded={clipMenuOpen}
        >
          <span className="min-w-0 flex-1 truncate">
            {clipOptions[effectiveClipIndex]?.label ?? selectedClip.id}
          </span>
          <ChevronDown size={12} className={`shrink-0 text-gray-500 transition-transform ${clipMenuOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <HoverTextTooltip text={t('Clip suivant')}>
        <button
          type="button"
          onClick={() => onSelectClipByIndex(Math.min(clipCount - 1, effectiveClipIndex + 1))}
          className="inline-flex h-5 w-5 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-default disabled:opacity-30"
          disabled={effectiveClipIndex >= clipCount - 1 || clipCount < 2}
          aria-label={t('Clip suivant')}
        >
          <ChevronRight size={14} className="mx-auto" />
        </button>
      </HoverTextTooltip>

      <HoverTextTooltip text={selectedClip.filePath ? t('Ouvrir le lecteur vidéo') : t('Aucune vidéo liée')}>
        <button
          type="button"
          onClick={() => {
            if (!selectedClip.filePath) return
            onOpenPlayer?.(selectedClip.id)
          }}
          className="inline-flex h-5 w-5 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={selectedClip.filePath ? t('Ouvrir le lecteur vidéo') : t('Aucune vidéo liée')}
          disabled={!selectedClip.filePath}
        >
          <Play size={12} className="mx-auto" />
        </button>
      </HoverTextTooltip>

      {onDetach && !detached ? (
        <HoverTextTooltip text={t('Ouvrir dans une fenêtre détachée')}>
          <button
            type="button"
            onClick={onDetach}
            className="ml-auto inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ExternalLink size={12} />
            {t('Détacher')}
          </button>
        </HoverTextTooltip>
      ) : null}
    </div>
  )
}

function JudgePills({ judges, judgeColors }: { judges: JudgeSource[]; judgeColors: Record<string, string> }) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2.5 border-b border-gray-700/40 px-2 py-1">
      {judges.map((judge) => {
        const color = judgeColors[judge.key] ?? '#60a5fa'
        return (
          <div key={`judge-pill-${judge.key}`} className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span style={{ color }}>{judge.judgeName}</span>
          </div>
        )
      })}
    </div>
  )
}

function ResultatsJudgeCategorySection({
  selectedClip,
  group,
  judges,
  judgeColors,
  handlers,
}: {
  selectedClip: Clip
  group: CategoryGroup
  judges: JudgeSource[]
  judgeColors: Record<string, string>
  handlers: TimecodeHandlers
}) {
  const { t } = useI18n()

  return (
    <section className="overflow-hidden rounded-md border border-gray-700/60 bg-surface-dark/20">
      <div className="border-b border-gray-700/60 px-2.5 py-1.5" style={{ backgroundColor: withAlpha(group.color, 0.1) }}>
        <div className="text-[11px] font-semibold" style={{ color: group.color }}>{group.category}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="w-[150px] min-w-[150px] border-b border-r border-gray-800/60 bg-surface px-2 py-1.5 text-left text-[10px] font-medium text-gray-500">
                {t('Sous-catégorie')}
              </th>
              {judges.map((judge) => {
                const color = judgeColors[judge.key] ?? '#60a5fa'
                return (
                  <th
                    key={`criterion-head-${selectedClip.id}-${group.category}-${judge.key}`}
                    className="w-[220px] min-w-[220px] border-b border-r border-gray-800/60 bg-surface px-2 py-1.5 text-center text-[10px] font-medium"
                    style={{ color }}
                  >
                    {judge.judgeName}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {group.criteria.map((criterion) => (
              <tr key={`criterion-row-${selectedClip.id}-${group.category}-${criterion.id}`} className="align-top">
                <td className="border-b border-r border-gray-800/60 bg-surface-dark/25 px-2 py-1.5">
                  <HoverTextTooltip text={criterion.name}>
                    <div className="text-gray-200 font-medium truncate">{criterion.name}</div>
                  </HoverTextTooltip>
                  {criterion.description ? (
                    <HoverTextTooltip text={criterion.description}>
                      <div className="text-[10px] text-gray-500 mt-0.5 truncate">{criterion.description}</div>
                    </HoverTextTooltip>
                  ) : null}
                </td>
                {judges.map((judge) => {
                  const color = judgeColors[judge.key] ?? '#60a5fa'
                  const note = judge.notes[selectedClip.id] as JudgeNoteLike | undefined
                  const criterionNote = normalizeText(note?.criterionNotes?.[criterion.id])
                  return (
                    <td
                      key={`criterion-cell-${selectedClip.id}-${group.category}-${criterion.id}-${judge.key}`}
                      className="border-b border-r border-gray-800/60 px-2 py-1.5"
                      style={{ backgroundColor: withAlpha(color, 0.025) }}
                    >
                      <InlineNote clipId={selectedClip.id} text={criterionNote} color={color} handlers={handlers} />
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="align-top">
              <td className="border-b border-r border-gray-800/60 bg-surface-dark/25 px-2 py-1.5">
                <div className="text-gray-200 font-medium">{t('Note catégorie')}</div>
              </td>
              {judges.map((judge) => {
                const color = judgeColors[judge.key] ?? '#60a5fa'
                const note = judge.notes[selectedClip.id] as JudgeNoteLike | undefined
                const categoryNote = normalizeText(note?.categoryNotes?.[group.category])
                return (
                  <td
                    key={`category-note-${selectedClip.id}-${group.category}-${judge.key}`}
                    className="border-b border-r border-gray-800/60 px-2 py-1.5"
                    style={{ backgroundColor: withAlpha(color, 0.025) }}
                  >
                    <InlineNote clipId={selectedClip.id} text={categoryNote} color={color} handlers={handlers} />
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

function GlobalNotesSection({
  selectedClip,
  judges,
  judgeColors,
  handlers,
}: {
  selectedClip: Clip
  judges: JudgeSource[]
  judgeColors: Record<string, string>
  handlers: TimecodeHandlers
}) {
  const { t } = useI18n()

  return (
    <section className="overflow-hidden rounded-md border border-gray-700/60 bg-surface-dark/20">
      <div className="border-b border-gray-700/60 bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-gray-300">
        {t('Notes générales')}
      </div>
      <div className="grid grid-cols-1 gap-2 p-2 lg:grid-cols-2">
        {judges.map((judge) => {
          const color = judgeColors[judge.key] ?? '#60a5fa'
          const note = judge.notes[selectedClip.id] as JudgeNoteLike | undefined
          const text = normalizeText(note?.textNotes)
          return (
            <div
              key={`global-note-${selectedClip.id}-${judge.key}`}
              className="rounded-md border border-gray-800/60 bg-surface px-2.5 py-2"
              style={{ boxShadow: `inset 2px 0 0 0 ${withAlpha(color, 0.9)}` }}
            >
              <div className="mb-1 text-[10px] font-medium" style={{ color }}>{judge.judgeName}</div>
              <InlineNote clipId={selectedClip.id} text={text} color={color} handlers={handlers} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function ResultatsJudgeNotesView({
  clips,
  selectedClipId,
  judges,
  categoryGroups,
  judgeColors,
  onSelectClip,
  onJumpToTimecode,
  onTimecodeHover,
  onTimecodeLeave,
  onOpenPlayer,
  onDetach,
  detached = false,
}: ResultatsJudgeNotesViewProps) {
  const { t } = useI18n()
  const zoomScale = useZoomScale()
  const [clipMenuOpen, setClipMenuOpen] = useState(false)
  const [clipMenuStyle, setClipMenuStyle] = useState({ top: 0, left: 0, width: 280, maxHeight: 280 })
  const clipMenuButtonRef = useRef<HTMLButtonElement | null>(null)
  const clipMenuRef = useRef<HTMLDivElement | null>(null)
  const selectedClip = clips.find((clip) => clip.id === selectedClipId) ?? clips[0]
  const selectedClipIndex = clips.findIndex((clip) => clip.id === selectedClip?.id)
  const effectiveClipIndex = selectedClipIndex >= 0 ? selectedClipIndex : 0
  const clipOptions = useMemo(() => clips.map((clip, index) => {
    const primary = getClipPrimaryLabel(clip)
    const secondary = getClipSecondaryLabel(clip)
    return { clip, label: secondary ? `${index + 1}. ${primary} - ${secondary}` : `${index + 1}. ${primary}` }
  }), [clips])
  const timecodeHandlers = useMemo(() => ({ onJumpToTimecode, onTimecodeHover, onTimecodeLeave }), [
    onJumpToTimecode,
    onTimecodeHover,
    onTimecodeLeave,
  ])

  const updateClipMenuPosition = useCallback(() => {
    const button = clipMenuButtonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const normalizedRect = {
      left: rect.left / zoomScale,
      top: rect.top / zoomScale,
      bottom: rect.bottom / zoomScale,
      width: rect.width / zoomScale,
    }
    const width = Math.max(260, normalizedRect.width)
    const viewportPadding = 10
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const estimatedHeight = Math.min(300, Math.max(96, clipOptions.length * 32 + 10))
    const spaceBelow = viewportHeight - normalizedRect.bottom - viewportPadding
    const spaceAbove = normalizedRect.top - viewportPadding
    const openUpwards = spaceBelow < estimatedHeight && spaceAbove > spaceBelow
    const maxHeight = Math.max(96, Math.min(300, openUpwards ? spaceAbove - 8 : spaceBelow - 8))
    const left = clamp(normalizedRect.left, viewportPadding, viewportWidth - width - viewportPadding)
    const top = openUpwards
      ? Math.max(viewportPadding, normalizedRect.top - Math.min(estimatedHeight, maxHeight) - 8)
      : normalizedRect.bottom + 8

    setClipMenuStyle({ top, left, width, maxHeight })
  }, [clipOptions.length, zoomScale])

  useEffect(() => {
    if (!clipMenuOpen) return
    updateClipMenuPosition()

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (clipMenuButtonRef.current?.contains(target) || clipMenuRef.current?.contains(target)) return
      setClipMenuOpen(false)
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setClipMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', updateClipMenuPosition)
    window.addEventListener('scroll', updateClipMenuPosition, true)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('resize', updateClipMenuPosition)
      window.removeEventListener('scroll', updateClipMenuPosition, true)
    }
  }, [clipMenuOpen, updateClipMenuPosition])

  if (!selectedClip) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-md border border-gray-700/60 bg-surface text-sm text-gray-500">
        {t('Aucun clip')}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <JudgeNotesToolbar
        selectedClip={selectedClip}
        effectiveClipIndex={effectiveClipIndex}
        clipCount={clips.length}
        clipOptions={clipOptions}
        clipMenuOpen={clipMenuOpen}
        clipMenuButtonRef={clipMenuButtonRef}
        onToggleClipMenu={() => {
          if (!clipMenuOpen) updateClipMenuPosition()
          setClipMenuOpen((current) => !current)
        }}
        onSelectClipByIndex={(index) => onSelectClip(clips[index].id)}
        onOpenPlayer={onOpenPlayer}
        onDetach={onDetach}
        detached={detached}
      />
      {clipMenuOpen ? (
        <ClipMenu
          selectedClip={selectedClip}
          clipOptions={clipOptions}
          menuStyle={clipMenuStyle}
          menuRef={clipMenuRef}
          onSelectClip={onSelectClip}
          onClose={() => setClipMenuOpen(false)}
        />
      ) : null}
      <JudgePills judges={judges} judgeColors={judgeColors} />

      <div className="flex-1 space-y-1.5 overflow-auto px-0 py-1.5">
        {categoryGroups.map((group) => (
          <ResultatsJudgeCategorySection
            key={`detail-${selectedClip.id}-${group.category}`}
            selectedClip={selectedClip}
            group={group}
            judges={judges}
            judgeColors={judgeColors}
            handlers={timecodeHandlers}
          />
        ))}
        <GlobalNotesSection
          selectedClip={selectedClip}
          judges={judges}
          judgeColors={judgeColors}
          handlers={timecodeHandlers}
        />
      </div>
    </div>
  )
}
