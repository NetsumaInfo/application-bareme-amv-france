import { AnimatePresence, motion } from 'motion/react'
import SpreadsheetInterface from '@/components/interfaces/SpreadsheetInterface'
import NotationInterface from '@/components/interfaces/NotationInterface'
import { useUIStore } from '@/store/useUIStore'

function ScoringInterface() {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="notes"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="flex flex-col h-full flex-1 min-w-0 w-full"
      >
        <NotationInterface />
      </motion.div>
    </AnimatePresence>
  )
}

export function NotationTabContent() {
  const { currentInterface } = useUIStore()
  const isSpreadsheetMode = currentInterface === 'spreadsheet' || currentInterface === 'dual'

  if (isSpreadsheetMode) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <SpreadsheetInterface />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <ScoringInterface />
    </div>
  )
}
