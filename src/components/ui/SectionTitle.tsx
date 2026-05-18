import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface SectionTitleProps {
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function SectionTitle({ children, className, action }: SectionTitleProps) {
  return (
    <div className={cn('flex items-center justify-between pb-2.5 mb-3.5 border-b border-border-base', className)}>
      <span className="font-mono text-2xs font-semibold tracking-[2.5px] uppercase text-accent">
        {children}
      </span>
      {action}
    </div>
  )
}
