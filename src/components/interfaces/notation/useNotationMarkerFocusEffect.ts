import { useEffect } from 'react'
import type { Bareme } from '@/types/bareme'
import type { Clip } from '@/types/project'

interface UseNotationMarkerFocusEffectOptions {
  currentClip: Clip | undefined
  currentBareme: Bareme | null
  categoryTextareaRefs: React.MutableRefObject<Map<string, HTMLTextAreaElement>>
  globalTextareaRef: React.MutableRefObject<HTMLTextAreaElement | null>
  setExpandedCategory: (category: string | null) => void
}

export function useNotationMarkerFocusEffect({
  currentClip,
  currentBareme,
  categoryTextareaRefs,
  globalTextareaRef,
  setExpandedCategory,
}: UseNotationMarkerFocusEffectOptions) {
  useEffect(() => {
    const onFocusMarker = (event: Event) => {
      const custom = event as CustomEvent<{
        clipId?: string
        category?: string | null
        criterionId?: string | null
      }>
      if (!currentClip) return
      if (!custom.detail?.clipId || custom.detail.clipId !== currentClip.id) return

      let targetCategory = custom.detail.category ?? null
      if (!targetCategory && custom.detail.criterionId) {
        targetCategory = currentBareme?.criteria.find(
          (criterion) => criterion.id === custom.detail.criterionId,
        )?.category ?? null
      }

      if (targetCategory) {
        setExpandedCategory(targetCategory)
        setTimeout(() => {
          categoryTextareaRefs.current.get(targetCategory || '')?.focus()
        }, 40)
        return
      }

      setTimeout(() => {
        globalTextareaRef.current?.focus()
      }, 40)
    }

    window.addEventListener('amv:focus-note-marker', onFocusMarker as EventListener)
    return () => {
      window.removeEventListener('amv:focus-note-marker', onFocusMarker as EventListener)
    }
  }, [categoryTextareaRefs, currentBareme?.criteria, currentClip, globalTextareaRef, setExpandedCategory])
}
