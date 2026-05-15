import { useEffect, useRef } from 'react'
import type { FocusEvent, MutableRefObject } from 'react'
import { CheckCircle2, Star } from 'lucide-react'
import type { Clip } from '@/types/project'
import {
  getAuthorCollabLabel,
  getClipPrimaryLabel,
  getClipSecondaryLabel,
  splitAuthorPseudos,
} from '@/utils/formatters'
import { useProjectStore } from '@/store/useProjectStore'
import { ClipMiniaturePreview } from '@/components/interfaces/spreadsheet/miniaturePreview'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import { getClipContestCategory, getContestCategoryColor } from '@/utils/contestCategory'
import { withAlpha } from '@/utils/colors'

const PARTICIPANT_COLUMN_WIDTH_CLASS = 'w-[160px] min-w-[160px] max-w-[160px]'

interface SpreadsheetClipCellProps {
  clip: Clip
  clips: Clip[]
  isScored: boolean
  editingManualClipId: string | null
  stickyCellClassName: string
  showMiniatures: boolean
  thumbnailDefaultSeconds: number
  pendingManualCleanupTimeoutsRef: MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>
  onSetCurrentClip: (index: number) => void
  onOpenClipContextMenu: (clipId: string, x: number, y: number) => void
  onOpenPlayerAtFront: () => void
  onSetEditingManualClipId: (clipId: string | null) => void
  onManualClipBlur: (clipId: string, event: FocusEvent<HTMLDivElement>) => void
  onManualClipFieldChange: (
    clipId: string,
    field: 'author' | 'displayName' | 'contestCategory',
    value: string,
  ) => void
}

export function SpreadsheetClipCell({
  clip,
  clips,
  isScored,
  editingManualClipId,
  stickyCellClassName,
  showMiniatures,
  thumbnailDefaultSeconds,
  pendingManualCleanupTimeoutsRef,
  onSetCurrentClip,
  onOpenClipContextMenu,
  onOpenPlayerAtFront,
  onSetEditingManualClipId,
  onManualClipBlur,
  onManualClipFieldChange,
}: SpreadsheetClipCellProps) {
  const { t } = useI18n()
  const multiPseudoDisplayMode = useProjectStore(
    (state) => state.currentProject?.settings.multiPseudoDisplayMode ?? 'all',
  )
  const contestCategoryPresets = useProjectStore(
    (state) => state.currentProject?.settings.contestCategoryPresets ?? [],
  )
  const contestCategoryColors = useProjectStore(
    (state) => state.currentProject?.settings.contestCategoryColors ?? {},
  )
  const authorInputRef = useRef<HTMLInputElement | null>(null)
  const wasEditingRef = useRef(false)

  const isManual = !clip.filePath
  const shouldShowInlineEditor = editingManualClipId === clip.id
    || (isManual && !clip.author?.trim() && !clip.displayName?.trim())

  useEffect(() => {
    const isEditing = editingManualClipId === clip.id
    if (isEditing && !wasEditingRef.current) {
      requestAnimationFrame(() => {
        authorInputRef.current?.focus()
        authorInputRef.current?.select()
      })
    }
    wasEditingRef.current = isEditing
  }, [clip.id, editingManualClipId])

  const focusClip = () => {
    const originalIndex = clips.findIndex((item) => item.id === clip.id)
    if (originalIndex !== -1) onSetCurrentClip(originalIndex)
  }

  const handleManualFieldFocus = () => {
    const pending = pendingManualCleanupTimeoutsRef.current.get(clip.id)
    if (pending) {
      clearTimeout(pending)
      pendingManualCleanupTimeoutsRef.current.delete(clip.id)
    }
    focusClip()
  }

  const clipPrimary = getClipPrimaryLabel(clip)
  const collabPseudos = splitAuthorPseudos(clip.author)
  const hasMultiplePseudos = collabPseudos.length > 1
  const fullPseudosLabel = collabPseudos.join(', ')
  const collabLabel = hasMultiplePseudos ? getAuthorCollabLabel(clip.author) : null

  const pseudoDisplayLabel = (() => {
    if (!hasMultiplePseudos) return clipPrimary
    if (multiPseudoDisplayMode === 'collab_mep') return collabLabel ?? clipPrimary
    if (multiPseudoDisplayMode === 'first_three') {
      if (collabPseudos.length <= 3) return fullPseudosLabel
      return `${collabPseudos.slice(0, 3).join(', ')}, ...`
    }
    return fullPseudosLabel
  })()

  const showCollabBadge = hasMultiplePseudos && multiPseudoDisplayMode === 'collab_mep' && Boolean(collabLabel)
  const showPseudoTooltip = hasMultiplePseudos && multiPseudoDisplayMode !== 'all'
  const allowPseudoWrap = hasMultiplePseudos && multiPseudoDisplayMode === 'all'
  const clipSecondaryLabel = getClipSecondaryLabel(clip)
  const hasStatusIcons = isScored || clip.favorite
  const hasBothStatusIcons = isScored && Boolean(clip.favorite)
  const statusIconsTopClass = clipSecondaryLabel ? 'top-[0.1rem]' : 'top-[0.02rem]'
  const statusIconsHeightClass = clipSecondaryLabel ? 'h-[1.65rem]' : 'h-[0.95rem]'
  const contentPaddingClass = hasStatusIcons ? 'pl-[0.95rem]' : ''
  const contestCategory = getClipContestCategory(clip)
  const contestCategoryIndex = contestCategory
    ? contestCategoryPresets.findIndex((category) => category === contestCategory)
    : -1
  const contestCategoryColor = contestCategory
    ? getContestCategoryColor(
        contestCategory,
        contestCategoryColors,
        contestCategoryIndex >= 0 ? contestCategoryIndex : 0,
      )
    : ''
  const contestCategoryRowTint = contestCategory ? withAlpha(contestCategoryColor, 0.08) : undefined
  const contestCategoryRowLine = contestCategory ? withAlpha(contestCategoryColor, 0.3) : undefined
  const hasContestCategoryPresets = contestCategoryPresets.some((category) => category.trim().length > 0)
  const shouldShowContestCategoryInput = hasContestCategoryPresets || Boolean(clip.contestCategory?.trim())

  const pseudoTextNode = showCollabBadge ? (
    <span className="inline-flex items-center rounded-sm px-1 py-px border border-primary-500/30 bg-primary-500/10 text-primary-100">
      {pseudoDisplayLabel}
    </span>
  ) : (
    pseudoDisplayLabel
  )

  return (
    <td
      className={`relative overflow-hidden px-2 py-1 border-r border-gray-800/60 group/clip ${PARTICIPANT_COLUMN_WIDTH_CLASS} ${stickyCellClassName}`}
      onDoubleClick={() => {
        if (!clip.filePath) {
          onSetEditingManualClipId(clip.id)
          return
        }
        onOpenPlayerAtFront()
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onOpenClipContextMenu(clip.id, event.clientX, event.clientY)
      }}
    >
      {contestCategory ? (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-px"
            style={{
              backgroundColor: contestCategoryRowLine,
            }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundColor: contestCategoryRowTint,
            }}
          />
        </>
      ) : null}

      <div className="relative z-1">
      {shouldShowInlineEditor ? (
        <div className="flex w-full min-w-0 flex-col gap-1" onBlur={(event) => onManualClipBlur(clip.id, event)}>
          <input
            ref={authorInputRef}
            type="text"
            value={clip.author ?? ''}
            placeholder={t('Participant')}
            onClick={(event) => event.stopPropagation()}
            onFocus={handleManualFieldFocus}
            onChange={(event) => onManualClipFieldChange(clip.id, 'author', event.target.value)}
            className="w-full px-1.5 py-0.5 rounded-sm border border-gray-700 bg-surface-dark/70 text-[10px] text-primary-300 placeholder:text-gray-500 focus:outline-hidden focus:border-primary-500"
          />
          <input
            type="text"
            value={clip.displayName ?? ''}
            placeholder={t('Nom du clip')}
            onClick={(event) => event.stopPropagation()}
            onFocus={handleManualFieldFocus}
            onChange={(event) => onManualClipFieldChange(clip.id, 'displayName', event.target.value)}
            className="w-full px-1.5 py-0.5 rounded-sm border border-gray-700 bg-surface-dark/70 text-[10px] text-gray-200 placeholder:text-gray-500 focus:outline-hidden focus:border-primary-500"
          />
          {shouldShowContestCategoryInput ? (
            <input
              type="text"
              value={clip.contestCategory ?? ''}
              placeholder={t('Catégorie clip')}
              onClick={(event) => event.stopPropagation()}
              onFocus={handleManualFieldFocus}
              onChange={(event) => onManualClipFieldChange(clip.id, 'contestCategory', event.target.value)}
              className="w-full px-1.5 py-0.5 rounded-sm border border-gray-700 bg-surface-dark/70 text-[10px] text-gray-300 placeholder:text-gray-500 focus:outline-hidden focus:border-primary-500"
            />
          ) : null}
        </div>
      ) : (
        <div className={`relative flex flex-col min-w-0 leading-tight ${contentPaddingClass}`}>
          <span className={`${allowPseudoWrap ? 'text-primary-300 text-[11px] font-semibold wrap-break-word' : 'truncate text-primary-300 text-[11px] font-semibold'}`}>
            {showPseudoTooltip ? (
              <HoverTextTooltip text={fullPseudosLabel}>
                <span className="inline-flex min-w-0 max-w-full">{pseudoTextNode}</span>
              </HoverTextTooltip>
            ) : (
              pseudoTextNode
            )}
          </span>
          {clipSecondaryLabel ? (
            <span className="truncate text-[9px] text-gray-500">{clipSecondaryLabel}</span>
          ) : null}
          {hasStatusIcons ? (
            <span className={`pointer-events-none absolute left-0 z-2 inline-flex w-3.5 flex-col items-center ${statusIconsHeightClass} ${statusIconsTopClass} ${hasBothStatusIcons ? 'justify-between' : 'justify-center'}`}>
              {isScored ? (
                <HoverTextTooltip text={t('Noté')}>
                  <span
                    className="pointer-events-auto inline-flex h-3.5 w-3.5 items-center justify-center text-emerald-300"
                    aria-label={t('Noté')}
                  >
                    <CheckCircle2 size={8} aria-hidden="true" />
                  </span>
                </HoverTextTooltip>
              ) : null}
              {clip.favorite ? (
                <HoverTextTooltip text={clip.favoriteComment?.trim() || t('Favori')}>
                  <span
                    className="pointer-events-auto inline-flex h-3.5 w-3.5 items-center justify-center text-amber-300"
                    aria-label={t('Favori')}
                  >
                    <Star size={8} fill="currentColor" aria-hidden="true" />
                  </span>
                </HoverTextTooltip>
              ) : null}
            </span>
          ) : null}
          {clip.filePath && showMiniatures ? (
            <ClipMiniaturePreview
              clip={clip}
              enabled={showMiniatures}
              defaultSeconds={thumbnailDefaultSeconds}
            />
          ) : null}
        </div>
      )}
      </div>
    </td>
  )
}
