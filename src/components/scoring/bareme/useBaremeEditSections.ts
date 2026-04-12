import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { TranslateFn } from '@/i18n'
import type { Criterion } from '@/types/bareme'

const UNCATEGORIZED_SECTION_KEY = '__uncategorized__'

interface BaremeCriterionSection {
  key: string
  label: string
  color: string
  total: number
  items: Array<{ criterion: Criterion; index: number }>
}

interface UseBaremeEditSectionsParams {
  criteria: Criterion[]
  spotlightCriterionId: string | null
  getCategoryColor: (category: string) => string
  onUpdateCriterionCategory: (index: number, category: string) => void
  t: TranslateFn
}

function normalizeSectionKey(category?: string) {
  const rawCategory = category?.trim() || ''
  return rawCategory || UNCATEGORIZED_SECTION_KEY
}

function getCriterionMotionTarget(criterionId: string) {
  const card = document.querySelector<HTMLElement>(
    `[data-bareme-criterion-id="${CSS.escape(criterionId)}"]`,
  )
  if (!card) return null

  const scrollContainer = card.closest<HTMLElement>('[data-bareme-scroll-container="true"]')
  if (!scrollContainer) {
    const cardRect = card.getBoundingClientRect()
    return {
      card,
      scrollContainer: null,
      startScrollTop: window.scrollY,
      targetScrollTop: Math.max(0, window.scrollY + cardRect.top - (window.innerHeight - cardRect.height) / 2),
      rect: cardRect,
    }
  }

  const containerRect = scrollContainer.getBoundingClientRect()
  const cardRect = card.getBoundingClientRect()
  const nextTop = cardRect.top - containerRect.top + scrollContainer.scrollTop
  const targetTop = Math.max(0, nextTop - (scrollContainer.clientHeight - cardRect.height) / 2)

  return {
    card,
    scrollContainer,
    startScrollTop: scrollContainer.scrollTop,
    targetScrollTop: targetTop,
    rect: cardRect,
  }
}

function easeMotion(value: number) {
  return 0.5 - Math.cos(Math.PI * value) / 2
}

export function useBaremeEditSections({
  criteria,
  spotlightCriterionId,
  getCategoryColor,
  onUpdateCriterionCategory,
  t,
}: UseBaremeEditSectionsParams) {
  const [editingCategoryAnchor, setEditingCategoryAnchor] = useState<{
    criterionId: string
    sectionKey: string
  } | null>(null)
  const pendingCriterionMotionRef = useRef<{
    criterionId: string
    top: number
    left: number
    restoreCategoryFocus: boolean
    selectionStart: number | null
    selectionEnd: number | null
  } | null>(null)
  const previousSpotlightRef = useRef<{ criterionId: string | null; sectionIndex: number | null }>({
    criterionId: null,
    sectionIndex: null,
  })

  const activeEditingCategoryAnchor = editingCategoryAnchor && criteria.some(
    (criterion) => criterion.id === editingCategoryAnchor.criterionId,
  )
    ? editingCategoryAnchor
    : null

  const getCriterionSectionKey = useCallback((criterion: Criterion, rawCategoryOverride?: string) => {
    const nextKey = normalizeSectionKey(rawCategoryOverride ?? criterion.category)

    if (activeEditingCategoryAnchor?.criterionId === criterion.id) {
      if (nextKey === UNCATEGORIZED_SECTION_KEY) return nextKey

      const joinsExistingCategory = criteria.some(
        (item) => item.id !== criterion.id && normalizeSectionKey(item.category) === nextKey,
      )

      if (!joinsExistingCategory) return activeEditingCategoryAnchor.sectionKey
    }

    return nextKey
  }, [activeEditingCategoryAnchor, criteria])

  const captureCriterionMotion = useCallback((criterionId: string, restoreCategoryFocus: boolean) => {
    const criterionCard = document.querySelector<HTMLElement>(
      `[data-bareme-criterion-id="${CSS.escape(criterionId)}"]`,
    )
    if (!criterionCard) return

    const rect = criterionCard.getBoundingClientRect()
    const categoryInput = document.querySelector<HTMLInputElement>(
      `[data-bareme-category-input="${CSS.escape(criterionId)}"]`,
    )

    pendingCriterionMotionRef.current = {
      criterionId,
      top: rect.top,
      left: rect.left,
      restoreCategoryFocus,
      selectionStart: restoreCategoryFocus ? categoryInput?.selectionStart ?? null : null,
      selectionEnd: restoreCategoryFocus ? categoryInput?.selectionEnd ?? null : null,
    }
  }, [])

  const handleCategoryFieldFocus = useCallback((criterionId: string) => {
    const criterion = criteria.find((item) => item.id === criterionId)
    if (!criterion) return
    setEditingCategoryAnchor({ criterionId, sectionKey: getCriterionSectionKey(criterion) })
  }, [criteria, getCriterionSectionKey])

  const handleCategoryFieldChange = useCallback((index: number, criterionId: string, value: string) => {
    const criterion = criteria[index]
    if (!criterion) return

    const currentSectionKey = getCriterionSectionKey(criterion)
    const nextSectionKey = getCriterionSectionKey(criterion, value)

    if (currentSectionKey !== nextSectionKey) {
      captureCriterionMotion(criterionId, true)
      setEditingCategoryAnchor({ criterionId, sectionKey: nextSectionKey })
    }

    onUpdateCriterionCategory(index, value)
  }, [captureCriterionMotion, criteria, getCriterionSectionKey, onUpdateCriterionCategory])

  const handleCategoryFieldBlur = useCallback((criterionId: string) => {
    const criterion = criteria.find((item) => item.id === criterionId)
    if (!criterion) {
      setEditingCategoryAnchor((current) => current?.criterionId === criterionId ? null : current)
      return
    }

    const currentSectionKey = getCriterionSectionKey(criterion)
    const nextSectionKey = normalizeSectionKey(criterion.category)

    if (currentSectionKey !== nextSectionKey) {
      captureCriterionMotion(criterionId, false)
    }

    setEditingCategoryAnchor((current) => current?.criterionId === criterionId ? null : current)
  }, [captureCriterionMotion, criteria, getCriterionSectionKey])

  const criterionSections = useMemo(() => criteria.reduce<BaremeCriterionSection[]>((sections, criterion, index) => {
    const key = getCriterionSectionKey(criterion)
    const label = key === UNCATEGORIZED_SECTION_KEY ? t('Sans catégorie') : key
    const existingSection = sections.find((section) => section.key === key)

    if (existingSection) {
      existingSection.total += criterion.max ?? 10
      existingSection.items.push({ criterion, index })
      return sections
    }

    sections.push({
      key,
      label,
      color: key === UNCATEGORIZED_SECTION_KEY ? '#64748b' : getCategoryColor(key),
      total: criterion.max ?? 10,
      items: [{ criterion, index }],
    })

    return sections
  }, []), [criteria, getCategoryColor, getCriterionSectionKey, t])

  useLayoutEffect(() => {
    const pendingMotion = pendingCriterionMotionRef.current
    if (!pendingMotion) return

    const motionTarget = getCriterionMotionTarget(pendingMotion.criterionId)
    if (!motionTarget) {
      pendingCriterionMotionRef.current = null
      return
    }

    const { card, scrollContainer, startScrollTop, targetScrollTop } = motionTarget
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const initialRect = card.getBoundingClientRect()
    const deltaY = pendingMotion.top - initialRect.top
    const deltaX = pendingMotion.left - initialRect.left

    if (pendingMotion.restoreCategoryFocus) {
      const categoryInput = document.querySelector<HTMLInputElement>(
        `[data-bareme-category-input="${CSS.escape(pendingMotion.criterionId)}"]`,
      )
      if (categoryInput) {
        categoryInput.focus({ preventScroll: true })
        if (pendingMotion.selectionStart !== null && pendingMotion.selectionEnd !== null) {
          categoryInput.setSelectionRange(pendingMotion.selectionStart, pendingMotion.selectionEnd)
        }
      }
    }

    if (prefersReducedMotion) {
      if (scrollContainer) {
        scrollContainer.scrollTop = targetScrollTop
      } else {
        window.scrollTo({ top: targetScrollTop, behavior: 'auto' })
      }
      pendingCriterionMotionRef.current = null
      return
    }

    const duration = 1280
    const startTime = performance.now()
    let animationFrame = 0

    card.style.transform = `translate(${deltaX}px, ${deltaY}px)`
    card.style.opacity = '0.92'
    card.style.filter = 'brightness(1.07) saturate(1.05)'
    card.style.willChange = 'transform, opacity, filter'

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration)
      const eased = easeMotion(progress)

      if (scrollContainer) {
        scrollContainer.scrollTop = startScrollTop + (targetScrollTop - startScrollTop) * eased
      } else {
        window.scrollTo({
          top: startScrollTop + (targetScrollTop - startScrollTop) * eased,
          behavior: 'auto',
        })
      }

      const remaining = 1 - eased
      card.style.transform = `translate(${deltaX * remaining}px, ${deltaY * remaining}px)`
      card.style.opacity = String(0.92 + 0.08 * eased)
      card.style.filter = `brightness(${1.07 - 0.07 * eased}) saturate(${1.05 - 0.05 * eased})`

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step)
        return
      }

      card.style.transform = ''
      card.style.opacity = ''
      card.style.filter = ''
      card.style.willChange = ''
      pendingCriterionMotionRef.current = null
    }

    animationFrame = window.requestAnimationFrame(step)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      card.style.transform = ''
      card.style.opacity = ''
      card.style.filter = ''
      card.style.willChange = ''
      pendingCriterionMotionRef.current = null
    }
  }, [criterionSections])

  useEffect(() => {
    if (!spotlightCriterionId) {
      previousSpotlightRef.current = { criterionId: null, sectionIndex: null }
      return
    }

    const sectionIndex = criterionSections.findIndex((section) =>
      section.items.some((item) => item.criterion.id === spotlightCriterionId),
    )
    if (sectionIndex < 0) return

    const shouldCenter =
      previousSpotlightRef.current.criterionId !== spotlightCriterionId ||
      previousSpotlightRef.current.sectionIndex !== sectionIndex

    previousSpotlightRef.current = { criterionId: spotlightCriterionId, sectionIndex }
    if (!shouldCenter) return
    if (pendingCriterionMotionRef.current?.criterionId === spotlightCriterionId) return

    const motionTarget = getCriterionMotionTarget(spotlightCriterionId)
    if (!motionTarget) return
    const { scrollContainer, startScrollTop, targetScrollTop } = motionTarget
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      if (scrollContainer) {
        scrollContainer.scrollTop = targetScrollTop
      } else {
        window.scrollTo({ top: targetScrollTop, behavior: 'auto' })
      }
      return
    }

    const duration = 520
    const startedAt = performance.now()
    let animationFrame = 0

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      const eased = easeMotion(progress)
      const nextTop = startScrollTop + (targetScrollTop - startScrollTop) * eased

      if (scrollContainer) {
        scrollContainer.scrollTop = nextTop
      } else {
        window.scrollTo({ top: nextTop, behavior: 'auto' })
      }

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step)
      }
    }

    animationFrame = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [criterionSections, spotlightCriterionId])

  return {
    criterionSections,
    handleCategoryFieldChange,
    handleCategoryFieldFocus,
    handleCategoryFieldBlur,
  }
}
