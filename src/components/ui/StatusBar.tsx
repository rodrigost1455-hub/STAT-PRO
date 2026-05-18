import { cn } from '@/lib/utils'

interface StatusBarProps {
  value: number      // 0–100
  className?: string
  showLabel?: boolean
}

function getBarColor(v: number): string {
  if (v >= 90) return 'bg-pass'
  if (v >= 75) return 'bg-warn'
  return 'bg-fail'
}

export function StatusBar({ value, className, showLabel }: StatusBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1 bg-bg-surface rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-spring', getBarColor(value))}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-2xs text-tx-muted w-10 text-right mono-num">
          {value.toFixed(1)}%
        </span>
      )}
    </div>
  )
}
