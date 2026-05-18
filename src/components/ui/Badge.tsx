import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type BadgeVariant = 'pass' | 'fail' | 'warn' | 'info' | 'dim'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cn(`badge-${variant}`, className)}>
      {children}
    </span>
  )
}
