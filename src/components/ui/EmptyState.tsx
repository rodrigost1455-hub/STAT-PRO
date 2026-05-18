import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <motion.div
      className="card border-dashed flex flex-col items-center justify-center gap-3 py-16 px-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-4xl opacity-20">{icon}</div>
      <div className="font-mono text-xs text-tx-muted text-center leading-relaxed font-semibold tracking-wide">
        {title}
      </div>
      {description && (
        <div className="font-mono text-2xs text-tx-dim text-center leading-relaxed max-w-xs">
          {description}
        </div>
      )}
    </motion.div>
  )
}
