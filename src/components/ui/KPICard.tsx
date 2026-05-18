import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type KPIVariant = 'pass' | 'fail' | 'warn' | 'info' | 'neutral'

interface KPICardProps {
  label: string
  value: string | number
  unit?: string
  sub?: string
  variant?: KPIVariant
  /** True/false shorthand maps to pass/fail */
  pass?: boolean
  warn?: boolean
  icon?: ReactNode
  className?: string
}

const variantMap: Record<KPIVariant, string> = {
  pass:    'card-pass',
  fail:    'card-fail',
  warn:    'card-warn',
  info:    'bg-info-bg border-info-border',
  neutral: 'card',
}

const valueColor: Record<KPIVariant, string> = {
  pass:    'text-pass',
  fail:    'text-fail',
  warn:    'text-warn',
  info:    'text-info',
  neutral: 'text-accent-bright',
}

const subColor: Record<KPIVariant, string> = {
  pass:    'text-pass/80',
  fail:    'text-fail/80',
  warn:    'text-warn/80',
  info:    'text-info/80',
  neutral: 'text-tx-muted',
}

function resolveVariant(pass?: boolean, warn?: boolean, variant?: KPIVariant): KPIVariant {
  if (variant) return variant
  if (pass === true) return 'pass'
  if (pass === false) return 'fail'
  if (warn) return 'warn'
  return 'neutral'
}

export function KPICard({
  label, value, unit, sub, pass, warn, variant, icon, className,
}: KPICardProps) {
  const v = resolveVariant(pass, warn, variant)
  return (
    <motion.div
      className={cn('kpi-card', variantMap[v], className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start justify-between">
        <span className="kpi-label">{label}</span>
        {icon && <span className="text-tx-muted opacity-60 text-base">{icon}</span>}
      </div>
      <div className={cn('kpi-value mono-num', valueColor[v])}>{value}</div>
      {unit && (
        <div className="font-mono text-2xs text-tx-muted mt-0.5">{unit}</div>
      )}
      {sub && (
        <div className={cn('kpi-sub font-semibold', subColor[v])}>{sub}</div>
      )}
    </motion.div>
  )
}
