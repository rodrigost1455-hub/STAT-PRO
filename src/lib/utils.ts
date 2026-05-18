import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ── Statistical helpers ── */
export function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function stdev(arr: number[]): number {
  const m = mean(arr)
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1))
}

export function parseNum(v: unknown): number | null {
  const n = parseFloat(String(v))
  return isNaN(n) ? null : n
}

/** Abramowitz & Stegun approximation of the normal CDF */
export function normCdf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)
  const t = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return 0.5 * (1 + sign * y)
}

/** Format a number for display — mono tabular */
export function fmt(n: number, digits = 4): string {
  return n.toFixed(digits)
}

export function fmtPct(n: number, digits = 2): string {
  return `${(n * 100).toFixed(digits)}%`
}

export function fmtPPM(n: number): string {
  return Math.round(n).toLocaleString()
}

/** Determine capability class from Cpk value */
export type CapClass = 'excellent' | 'capable' | 'marginal' | 'incapable'
export function capClass(cpk: number): CapClass {
  if (cpk >= 1.67) return 'excellent'
  if (cpk >= 1.33) return 'capable'
  if (cpk >= 1.00) return 'marginal'
  return 'incapable'
}
export const CAP_LABELS: Record<CapClass, string> = {
  excellent:  'EXCELENTE',
  capable:    'CAPAZ',
  marginal:   'MARGINAL',
  incapable:  'NO CAPAZ',
}

/** Histogram bins */
export interface HistBin {
  lo: number; hi: number; mid: string; count: number
}
export function histogram(vals: number[], bins = 10): HistBin[] {
  const min = Math.min(...vals), max = Math.max(...vals)
  const bw = (max - min) / bins
  return Array.from({ length: bins }, (_, i) => {
    const lo = min + i * bw, hi = lo + bw
    return {
      lo, hi,
      mid: ((lo + hi) / 2).toFixed(3),
      count: vals.filter(v => v >= lo && (i === bins - 1 ? v <= hi : v < hi)).length,
    }
  })
}

/** Build histogram with normal curve overlay */
export function histWithCurve(vals: number[], bins = 10) {
  const hist = histogram(vals, bins)
  const m = mean(vals), s = stdev(vals), n = vals.length
  const bw = hist[0] ? hist[0].hi - hist[0].lo : 1
  return hist.map(b => ({
    ...b,
    normal: normCdf((b.hi - m) / s) - normCdf((b.lo - m) / s),
    normalCount: (normCdf((b.hi - m) / s) - normCdf((b.lo - m) / s)) * n,
  }))
}
