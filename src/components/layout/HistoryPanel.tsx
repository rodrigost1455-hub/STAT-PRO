import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { HistoryEntry } from '@/types'

interface HistoryPanelProps {
  history: HistoryEntry[]
  onClose: () => void
}

export function HistoryPanel({ history, onClose }: HistoryPanelProps) {
  const sorted = [...history].reverse()

  return (
    <motion.div
      className="fixed top-16 right-0 bottom-0 w-80 bg-bg-deep border-l border-border-base z-50 flex flex-col"
      initial={{ x: 16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 16, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-base flex items-center justify-between flex-shrink-0">
        <div>
          <div className="font-mono text-xs font-bold text-accent-bright tracking-widest uppercase">
            Historial
          </div>
          <div className="font-mono text-2xs text-tx-muted mt-0.5">
            {history.length} análisis realizados
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-border-base text-tx-muted hover:text-tx-primary hover:border-border-mid transition-all"
          aria-label="Cerrar historial"
        >
          <X size={12} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {sorted.length === 0 && (
          <div className="font-mono text-2xs text-tx-dim text-center mt-12 leading-relaxed">
            Sin estudios guardados.<br />
            Realiza un análisis para<br />ver el historial.
          </div>
        )}
        <AnimatePresence>
          {sorted.map((h, i) => (
            <motion.div
              key={h.ts}
              className="card p-3.5 cursor-default hover:border-border-mid transition-colors"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Badge variant="info">{h.module}</Badge>
                <span className="font-mono text-2xs text-tx-dim">{h.fecha}</span>
              </div>
              <div className="font-mono text-xs font-semibold text-tx-primary mb-2 truncate">
                {h.proceso || '—'}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {h.cpk && (
                  <Badge variant={parseFloat(h.cpk) >= 1.33 ? 'pass' : 'fail'}>
                    Cpk: {h.cpk}
                  </Badge>
                )}
                {h.acuerdo && (
                  <Badge variant={parseFloat(h.acuerdo) >= 90 ? 'pass' : 'fail'}>
                    {h.acuerdo}
                  </Badge>
                )}
                {h.pbar && <Badge variant="dim">p̄: {h.pbar}</Badge>}
                {h.ooc !== undefined && (
                  <Badge variant={h.ooc === 0 ? 'pass' : 'fail'}>
                    OOC: {h.ooc}
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
