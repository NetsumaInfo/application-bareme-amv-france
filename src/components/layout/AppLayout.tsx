import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Header from './Header'
import Sidebar from './Sidebar'
import VideoPlayer from '@/components/player/VideoPlayer'
import SpreadsheetInterface from '@/components/interfaces/SpreadsheetInterface'
import ModernInterface from '@/components/interfaces/ModernInterface'
import NotationInterface from '@/components/interfaces/NotationInterface'
import CreateProjectModal from '@/components/project/CreateProjectModal'
import SettingsPanel from '@/components/settings/SettingsPanel'
import BaremeEditor from '@/components/scoring/BaremeEditor'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { usePlayer } from '@/hooks/usePlayer'

function WelcomeScreen() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">AMV Notation</h2>
        <p className="text-gray-400 mb-6">
          Créez un nouveau projet ou ouvrez un projet existant pour commencer
        </p>
        <div className="flex flex-col gap-2 text-sm text-gray-500">
          <p>
            <kbd className="px-1.5 py-0.5 bg-surface rounded text-gray-400 text-xs">
              Ctrl+N
            </kbd>{' '}
            Nouveau projet
          </p>
          <p>
            <kbd className="px-1.5 py-0.5 bg-surface rounded text-gray-400 text-xs">
              Ctrl+O
            </kbd>{' '}
            Ouvrir un projet
          </p>
        </div>
      </div>
    </div>
  )
}

function ScoringInterface() {
  const { currentInterface } = useUIStore()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentInterface}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col h-full"
      >
        {currentInterface === 'spreadsheet' && <SpreadsheetInterface />}
        {currentInterface === 'modern' && <ModernInterface />}
        {currentInterface === 'notation' && <NotationInterface />}
      </motion.div>
    </AnimatePresence>
  )
}

export default function AppLayout() {
  const { currentProject, nextClip, previousClip } = useProjectStore()
  const { currentInterface, switchInterface, sidebarCollapsed } = useUIStore()
  const { togglePause, seekRelative } = usePlayer()
  const [showSettings, setShowSettings] = useState(false)

  // Auto-save
  useAutoSave()

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    ' ': togglePause,
    arrowright: () => seekRelative(5),
    arrowleft: () => seekRelative(-5),
    'shift+arrowright': () => seekRelative(30),
    'shift+arrowleft': () => seekRelative(-30),
    n: nextClip,
    p: previousClip,
    'ctrl+1': () => switchInterface('spreadsheet'),
    'ctrl+2': () => switchInterface('modern'),
    'ctrl+3': () => switchInterface('notation'),
  })

  const isNotationMode = currentInterface === 'notation'

  return (
    <div className="flex flex-col h-screen bg-surface-dark text-gray-200">
      <Header onOpenSettings={() => setShowSettings(true)} />

      {!currentProject ? (
        <WelcomeScreen />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - hidden in notation mode or when collapsed */}
          {!isNotationMode && !sidebarCollapsed && <Sidebar />}

          {/* Main content */}
          <div className="flex flex-1 overflow-hidden">
            {isNotationMode ? (
              /* Notation mode: large video + narrow panel */
              <>
                <div className="flex flex-col flex-1 p-3 gap-2 overflow-hidden">
                  <VideoPlayer />
                </div>
                <div className="flex flex-col w-72 border-l border-gray-700 overflow-hidden">
                  <ScoringInterface />
                </div>
              </>
            ) : (
              /* Standard mode: 50/50 split */
              <>
                <div className="flex flex-col w-1/2 p-3 gap-2 overflow-hidden">
                  <VideoPlayer />
                </div>
                <div className="flex flex-col w-1/2 border-l border-gray-700 overflow-hidden">
                  <ScoringInterface />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateProjectModal />
      <BaremeEditor />
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}
