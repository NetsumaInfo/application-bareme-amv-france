import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { sanitizeColor, withAlpha } from '@/utils/colors'
import { ColorSwatchPicker } from '@/components/ui/ColorSwatchPicker'
import { COLOR_MEMORY_KEYS } from '@/utils/colorPickerStorage'
import { useZoomScale } from '@/hooks/useZoomScale'
import { useI18n } from '@/i18n'

interface BaremeCriterionCategoryFieldProps {
  criterionId: string
  index: number
  rawCategory: string
  readOnly: boolean
  color: string
  getCategoryColor: (category: string) => string
  categorySuggestions: string[]
  onCategoryFieldChange: (index: number, criterionId: string, value: string) => void
  onCategoryFieldFocus: (criterionId: string) => void
  onCategoryFieldBlur: (criterionId: string) => void
  onCommitCategoryColor: (category: string) => void
  onSetCategoryColor: (category: string, color: string) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function BaremeCriterionCategoryField({
  criterionId,
  index,
  rawCategory,
  readOnly,
  color,
  getCategoryColor,
  categorySuggestions,
  onCategoryFieldChange,
  onCategoryFieldFocus,
  onCategoryFieldBlur,
  onCommitCategoryColor,
  onSetCategoryColor,
}: BaremeCriterionCategoryFieldProps) {
  const { t } = useI18n()
  const zoomScale = useZoomScale()

  const trimmedCategory = rawCategory.trim()
  const liveColor = trimmedCategory ? getCategoryColor(trimmedCategory) : color

  const categoryListboxId = useId()
  const categoryFieldRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [categoryActiveIndex, setCategoryActiveIndex] = useState(-1)
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0, width: 240, maxHeight: 224 })

  const categoryQuery = rawCategory.toLocaleLowerCase()
  const categoryMatches = useMemo(() => {
    const filtered = categorySuggestions.filter((category) => {
      const lower = category.toLocaleLowerCase()
      if (lower === categoryQuery) return false
      return categoryQuery ? lower.includes(categoryQuery) : true
    })
    return filtered.slice(0, 8)
  }, [categorySuggestions, categoryQuery])

  const showCategoryMenu = !readOnly && categoryMenuOpen && categoryMatches.length > 0

  const updateMenuPosition = useCallback(() => {
    const anchor = categoryFieldRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const viewportPadding = 8
    const viewportWidth = window.innerWidth * zoomScale
    const viewportHeight = window.innerHeight * zoomScale
    const width = Math.min(Math.max(rect.width, 240), Math.max(160, viewportWidth - viewportPadding * 2))
    const measuredHeight = menuRef.current?.offsetHeight ?? Math.min(224, categoryMatches.length * 32 + 40)
    const spaceBelow = viewportHeight - rect.bottom - viewportPadding
    const spaceAbove = rect.top - viewportPadding
    const openUpwards = spaceBelow < measuredHeight && spaceAbove > spaceBelow
    const maxHeight = Math.max(72, Math.min(224, (openUpwards ? spaceAbove : spaceBelow) - 8))
    const visibleHeight = Math.min(measuredHeight, maxHeight)
    const maxLeft = Math.max(viewportPadding, viewportWidth - width - viewportPadding)
    const left = clamp(rect.left, viewportPadding, maxLeft)
    const rawTop = openUpwards ? rect.top - visibleHeight - 6 : rect.bottom + 6
    const top = clamp(rawTop, viewportPadding, Math.max(viewportPadding, viewportHeight - visibleHeight - viewportPadding))

    setMenuPosition({ left, top, width, maxHeight })
  }, [categoryMatches.length, zoomScale])

  const handleReposition = useEffectEvent(() => updateMenuPosition())

  useLayoutEffect(() => {
    if (!showCategoryMenu) return

    const animationFrame = window.requestAnimationFrame(handleReposition)
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [showCategoryMenu])

  useEffect(() => {
    if (!categoryMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (categoryFieldRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setCategoryMenuOpen(false)
      setCategoryActiveIndex(-1)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [categoryMenuOpen])

  const pickCategory = (category: string) => {
    onCategoryFieldChange(index, criterionId, category)
    onCommitCategoryColor(category)
    setCategoryMenuOpen(false)
    setCategoryActiveIndex(-1)
  }

  const handleCategoryKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && categoryMatches.length > 0) {
      event.preventDefault()
      if (!categoryMenuOpen) {
        setCategoryMenuOpen(true)
        setCategoryActiveIndex(0)
        return
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setCategoryActiveIndex((current) => {
        const base = current >= 0 ? current : 0
        return (base + direction + categoryMatches.length) % categoryMatches.length
      })
      return
    }

    if (event.key === 'Enter' && categoryMenuOpen && categoryActiveIndex >= 0 && categoryMatches[categoryActiveIndex]) {
      event.preventDefault()
      pickCategory(categoryMatches[categoryActiveIndex])
      return
    }

    if (event.key === 'Escape' && categoryMenuOpen) {
      event.stopPropagation()
      setCategoryMenuOpen(false)
      setCategoryActiveIndex(-1)
    }
  }

  const suggestionsMenu = showCategoryMenu && typeof document !== 'undefined'
    ? createPortal(
      <div
        ref={menuRef}
        className="fixed z-2300 overflow-hidden rounded-lg bg-surface p-1.5 shadow-2xl ring-1 ring-inset ring-primary-400/10"
        style={{
          left: `${menuPosition.left}px`,
          top: `${menuPosition.top}px`,
          width: `${menuPosition.width}px`,
        }}
      >
        <div className="px-1.5 pb-1 pt-0.5">
          <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            {t('Catégories existantes')}
          </span>
        </div>
        {/* react-doctor-disable-next-line react-doctor/prefer-tag-over-role -- custom ARIA listbox/combobox hosts interactive button children; native datalist/option cannot replace it without breaking the widget */}
        <div
          id={categoryListboxId}
          role="listbox"
          className="overflow-y-auto"
          style={{ maxHeight: `${menuPosition.maxHeight}px` }}
        >
          {categoryMatches.map((category, matchIndex) => {
            const active = matchIndex === categoryActiveIndex
            return (
              <button
                key={category}
                type="button"
                role="option"
                aria-selected={active}
                onMouseEnter={() => setCategoryActiveIndex(matchIndex)}
                onMouseDown={(event) => {
                  event.preventDefault()
                  pickCategory(category)
                }}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                  active ? 'bg-primary-600/15 text-white' : 'text-gray-300 hover:bg-white/4 hover:text-white'
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: withAlpha(getCategoryColor(category), 0.95) }}
                  aria-hidden="true"
                />
                <span className="min-w-0 truncate">{category}</span>
              </button>
            )
          })}
        </div>
      </div>,
      document.body,
    )
    : null

  return (
    <div className="md:col-span-4">
      <label className="mb-1 block text-[11px] font-medium text-gray-400">{t('Catégorie')}</label>
      <div className="flex items-center gap-2">
        <div ref={categoryFieldRef} className="relative flex-1">
          <input
            data-bareme-category-input={criterionId}
            aria-label={t('Catégorie')}
            value={rawCategory}
            onChange={(event) => {
              onCategoryFieldChange(index, criterionId, event.target.value)
              setCategoryActiveIndex(-1)
              if (!categoryMenuOpen) setCategoryMenuOpen(true)
            }}
            onFocus={() => {
              onCategoryFieldFocus(criterionId)
              if (categoryMatches.length > 0) setCategoryMenuOpen(true)
            }}
            onBlur={(event) => {
              onCommitCategoryColor(event.target.value)
              onCategoryFieldBlur(criterionId)
            }}
            onKeyDown={handleCategoryKeyDown}
            // react-doctor-disable-next-line react-doctor/no-redundant-roles -- role is the required ARIA combobox authoring pattern (anchors aria-expanded/controls); a plain input implicit role is textbox not combobox
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showCategoryMenu}
            aria-controls={showCategoryMenu ? categoryListboxId : undefined}
            autoComplete="off"
            placeholder={t('Montage')}
            className="w-full rounded-lg border bg-surface px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-hidden"
            style={{ borderColor: withAlpha(liveColor, 0.45) }}
            disabled={readOnly}
          />
          {suggestionsMenu}
        </div>
        <ColorSwatchPicker
          value={sanitizeColor(liveColor)}
          onChange={(nextColor) => {
            if (!rawCategory) return
            onSetCategoryColor(rawCategory, nextColor)
          }}
          disabled={readOnly || !rawCategory}
          title={rawCategory ? t('Couleur de {category}', { category: rawCategory }) : t('Saisis une catégorie d’abord')}
          memoryKey={COLOR_MEMORY_KEYS.recentBaremeColors}
        />
      </div>
    </div>
  )
}
