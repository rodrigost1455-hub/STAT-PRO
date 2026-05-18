import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ModuleLayoutProps {
  sidebar: ReactNode
  children: ReactNode
  className?: string
}

export function ModuleLayout({ sidebar, children, className }: ModuleLayoutProps) {
  return (
    <div
      className={cn(
        'flex gap-5 overflow-hidden',
        'h-[calc(100vh-64px)] px-6 py-5',
        className
      )}
    >
      {sidebar}
      <div className="flex-1 min-w-0 flex flex-col gap-3.5 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
