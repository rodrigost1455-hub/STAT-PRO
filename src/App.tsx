import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { TopNav }      from '@/components/layout/TopNav'
import { HistoryPanel } from '@/components/layout/HistoryPanel'

import SixpackModule from '@/modules/sixpack/SixpackModule'
import GRRModule     from '@/modules/grr/GRRModule'
import PChartModule  from '@/modules/pchart/PChartModule'

import type { ModuleId, HistoryEntry } from '@/types'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.15 } },
}

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('pchart')
  const [history,      setHistory]      = useState<HistoryEntry[]>([])
  const [showHistory,  setShowHistory]  = useState(false)

  const saveHistory = useCallback((entry: HistoryEntry) => {
    setHistory(prev => [...prev, entry])
  }, [])

  return (
    <div className="bg-bg-base min-h-screen text-tx-primary font-sans">
      <TopNav
        active={activeModule}
        setActive={setActiveModule}
        history={history}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
      />

      <AnimatePresence>
        {showHistory && (
          <HistoryPanel history={history} onClose={() => setShowHistory(false)} />
        )}
      </AnimatePresence>

      <main
        className="transition-all duration-200"
        style={{ marginRight: showHistory ? 320 : 0 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {activeModule === 'sixpack' && <SixpackModule onSave={saveHistory} />}
            {activeModule === 'grr'     && <GRRModule     onSave={saveHistory} />}
            {activeModule === 'pchart'  && <PChartModule  onSave={saveHistory} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
