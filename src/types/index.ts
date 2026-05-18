export type ModuleId = 'sixpack' | 'grr' | 'pchart'

export interface StudyMeta {
  proceso: string
  parte: string
  caracteristica: string
  fecha: string
  responsable: string
  cliente: string
  version: string
  unidad?: string
}

export interface HistoryEntry {
  module: string
  proceso: string
  fecha: string
  ts: number
  cpk?: string
  acuerdo?: string
  pbar?: string
  ooc?: number
}

/* ── Sixpack ── */
export interface SixpackSpec {
  lsl: string; usl: string; target: string
}

export interface SixpackResult {
  vals: number[]
  n: number
  xbar: number
  sigmaW: number
  sigmaO: number
  cp: number; cpk: number; pp: number; ppk: number; cpm: number | null
  zBench: number
  ppmW: number
  iUCL: number; iLCL: number; mrUCL: number; MRbar: number
  oosI: number
  min: number; max: number
  chartData: SixpackPoint[]
  bins: HistBin[]
  lsl: number; usl: number; tgt: number
}

export interface SixpackPoint {
  i: number; v: number; mr: number | null; oos: boolean
}

export interface HistBin {
  lo: number; hi: number; mid: string; count: number
  normalCount?: number
}

/* ── GRR ── */
export interface GRRConfig {
  partes: string; operadores: string; replicas: string
}

export interface GRRResult {
  agree: number; total: number
  overallPct: number
  opPcts: number[]
  kappa: number
}

/* ── P-Chart ── */
export interface PChartRow {
  id: number; n: string; d: string
}

export interface PChartPoint {
  id: number; ni: number; di: number; pi: number
  sigma: number; ucl: number; lcl: number
  flag: SpcFlags
}

export interface SpcFlags {
  oc: boolean; run7: boolean; trend: boolean
}

export interface PChartResult {
  pts: PChartPoint[]
  chartData: PChartPoint[]
  pbar: number
  totalD: number; totalN: number
  avgUCL: number; avgLCL: number
  ppm: number
  oocCount: number
  flags: SpcFlags[]
}
