import { lazy, Suspense } from 'react'
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react'
import Header from '@/components/layout/Header'
import { WelcomeScreen } from '@/components/layout/WelcomeScreen'
import type { Project } from '@/types/project'
import type { AppTab } from '@/types/notation'
import { useI18n } from '@/i18n'

const NotationTabContent = lazy(async () => {
  const module = await import('@/components/layout/NotationTabContent')
  return { default: module.NotationTabContent }
})

const ResultatsInterface = lazy(() => import('@/components/interfaces/ResultatsInterface'))
const ExportInterface = lazy(() => import('@/components/interfaces/ExportInterface'))

function TabLoadingFallback() {
  const { t } = useI18n()
  return (
    <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
      {t('Chargement...')}
    </div>
  )
}

interface AppMainContentProps {
  currentProject: Project | null
  currentTab: AppTab
  onOpenSettings: () => void
}

export function AppMainContent({
  currentProject,
  currentTab,
  onOpenSettings,
}: AppMainContentProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <>
      <Header onOpenSettings={onOpenSettings} />

      {!currentProject ? (
        <WelcomeScreen />
      ) : (
        <LazyMotion features={domAnimation}>
          <AnimatePresence mode="wait">
            <m.div
              key={currentTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.12 }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <Suspense fallback={<TabLoadingFallback />}>
                {currentTab === 'notation' ? <NotationTabContent /> : null}
                {currentTab === 'resultats' ? <ResultatsInterface /> : null}
                {currentTab === 'export' ? <ExportInterface /> : null}
              </Suspense>
            </m.div>
          </AnimatePresence>
        </LazyMotion>
      )}
    </>
  )
}
