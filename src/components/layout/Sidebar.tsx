import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface SidebarProps {
  children: ReactNode
  width?: number
  className?: string
}

export function Sidebar({ children, width = 296, className }: SidebarProps) {
  return (
    <motion.aside
      className={cn(
        'flex flex-col gap-3 overflow-y-auto flex-shrink-0 pr-1',
        className
      )}
      style={{ width }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.aside>
  )
}

interface SidebarPanelProps {
  children: ReactNode
  className?: string
}

export function SidebarPanel({ children, className }: SidebarPanelProps) {
  return (
    <div className={cn('card p-4', className)}>
      {children}
    </div>
  )
}
