import { lazy, Suspense } from 'react'
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react'
import { useUIStore } from '@/store/useUIStore'

const SpreadsheetInterface = lazy(() => import('@/components/interfaces/SpreadsheetInterface'))
const NotationInterface = lazy(() => import('@/components/interfaces/NotationInterface'))

function NotationLoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center text-xs text-gray-500" />
  )
}

function ScoringInterface() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait">
        <m.div
          key="notes"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.12 }}
          className="flex flex-col h-full flex-1 min-w-0 w-full"
        >
          <NotationInterface />
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  )
}

export function NotationTabContent() {
  const { currentInterface } = useUIStore()
  const isSpreadsheetMode = currentInterface === 'spreadsheet' || currentInterface === 'dual'

  if (isSpreadsheetMode) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<NotationLoadingFallback />}>
            <SpreadsheetInterface />
          </Suspense>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <Suspense fallback={<NotationLoadingFallback />}>
        <ScoringInterface />
      </Suspense>
    </div>
  )
}
