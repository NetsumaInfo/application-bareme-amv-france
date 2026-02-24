import { lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Header from '@/components/layout/Header'
import { WelcomeScreen } from '@/components/layout/WelcomeScreen'
import type { Project } from '@/types/project'
import type { AppTab } from '@/types/notation'

const NotationTabContent = lazy(async () => {
  const module = await import('@/components/layout/NotationTabContent')
  return { default: module.NotationTabContent }
})

const ResultatsInterface = lazy(() => import('@/components/interfaces/ResultatsInterface'))
const ExportInterface = lazy(() => import('@/components/interfaces/ExportInterface'))

function TabLoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
      Chargement...
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
  return (
    <>
      <Header onOpenSettings={onOpenSettings} />

      {!currentProject ? (
        <WelcomeScreen />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <Suspense fallback={<TabLoadingFallback />}>
              {currentTab === 'notation' ? <NotationTabContent /> : null}
              {currentTab === 'resultats' ? <ResultatsInterface /> : null}
              {currentTab === 'export' ? <ExportInterface /> : null}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  )
}
