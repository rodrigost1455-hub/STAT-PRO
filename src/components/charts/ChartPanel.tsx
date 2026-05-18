import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ChartPanelProps {
  title: string
  height?: number
  children: ReactNode
  className?: string
  subtitle?: string
  action?: ReactNode
}

export function ChartPanel({
  title, height = 220, children, className, subtitle, action,
}: ChartPanelProps) {
  return (
    <motion.div
      className={cn('chart-panel', className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start justify-between mb-3.5">
        <div>
          <div className="chart-title">{title}</div>
          {subtitle && (
            <div className="font-mono text-2xs text-tx-dim tracking-wide">{subtitle}</div>
          )}
        </div>
        {action}
      </div>
      <div style={{ height }}>{children}</div>
    </motion.div>
  )
}
