import { AnimatePresence, motion } from 'motion/react'
import Header from '@/components/layout/Header'
import { WelcomeScreen } from '@/components/layout/WelcomeScreen'
import { NotationTabContent } from '@/components/layout/NotationTabContent'
import ResultatsInterface from '@/components/interfaces/ResultatsInterface'
import ExportInterface from '@/components/interfaces/ExportInterface'
import type { Project } from '@/types/project'
import type { AppTab } from '@/types/notation'

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
            {currentTab === 'notation' ? <NotationTabContent /> : null}
            {currentTab === 'resultats' ? <ResultatsInterface /> : null}
            {currentTab === 'export' ? <ExportInterface /> : null}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  )
}
