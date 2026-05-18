import { useState, useCallback } from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { Play, FileDown, Plus, Minus } from 'lucide-react'

import { Field }         from '@/components/ui/Field'
import { KPICard }       from '@/components/ui/KPICard'
import { Badge }         from '@/components/ui/Badge'
import { SectionTitle }  from '@/components/ui/SectionTitle'
import { EmptyState }    from '@/components/ui/EmptyState'
import { ChartPanel }    from '@/components/charts/ChartPanel'
import { Sidebar, SidebarPanel } from '@/components/layout/Sidebar'
import { ModuleLayout }  from '@/components/layout/ModuleLayout'
import { CT, tooltipStyle, tickProps } from '@/components/charts/chartTheme'
import { mean, parseNum } from '@/lib/utils'
import { buildPDFHtml, openPDF } from '@/lib/pdf'
import type { StudyMeta, PChartRow, PChartPoint, PChartResult, SpcFlags, HistoryEntry } from '@/types'

interface PChartModuleProps { onSave: (e: HistoryEntry) => void }

function checkRules(pts: PChartPoint[], pbar: number): SpcFlags[] {
  const flags = pts.map(() => ({ oc: false, run7: false, trend: false }))
  pts.forEach((p, i) => { if (p.pi > p.ucl || p.pi < p.lcl) flags[i].oc = true })
  for (let i = 6; i < pts.length; i++) {
    const seg = pts.slice(i - 6, i + 1)
    if (seg.every(x => x.pi > pbar) || seg.every(x => x.pi < pbar))
      for (let j = i - 6; j <= i; j++) flags[j].run7 = true
  }
  for (let i = 5; i < pts.length; i++) {
    const seg = pts.slice(i - 5, i + 1)
    const up = seg.every((x, j) => j === 0 || x.pi >= seg[j-1].pi)
    const dn = seg.every((x, j) => j === 0 || x.pi <= seg[j-1].pi)
    if (up || dn) for (let j = i - 5; j <= i; j++) flags[j].trend = true
  }
  return flags
}

const SPC_RULES = [
  { key: 'oc',    label: 'Regla 1 · Punto fuera ±3σ',           desc: 'Out of Control' },
  { key: 'run7',  label: 'Regla 2 · 7 consecutivos mismo lado', desc: 'Run Rule' },
  { key: 'trend', label: 'Regla 3 · Tendencia 6 puntos',        desc: 'Trend Rule' },
] as const

export default function PChartModule({ onSave }: PChartModuleProps) {
  const [meta, setMeta] = useState<StudyMeta>({
    proceso:'', parte:'', caracteristica:'',
    fecha: new Date().toLocaleDateString('es-MX'),
    responsable:'', cliente:'', version:'Rev.1', unidad:'',
  })
  const [numSg, setNumSg] = useState('20')
  const [rows, setRows] = useState<PChartRow[]>(
    Array.from({ length: 20 }, (_, i) => ({ id: i+1, n:'', d:'' }))
  )
  const [result, setResult] = useState<PChartResult | null>(null)
  const [err, setErr] = useState('')

  const updateRows = useCallback((count: string) => {
    const c = Math.max(3, parseInt(count) || 20)
    setNumSg(String(c))
    setRows(prev => Array.from({ length: c }, (_, i) => prev[i] || { id: i+1, n:'', d:'' }))
  }, [])

  const setRow = (i: number, field: 'n'|'d', val: string) => {
    setRows(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: val }; return n })
  }

  const compute = () => {
    setErr('')
    const valid = rows.filter(r => r.n !== '' && r.d !== '')
    if (valid.length < 3) { setErr('Mínimo 3 subgrupos con datos completos.'); return }
    const parsed = valid.map(r => {
      const ni = parseNum(r.n), di = parseNum(r.d)
      if (!ni || di === null || ni <= 0 || di < 0 || di > ni) return null
      return { id: r.id, ni, di, pi: di/ni }
    })
    if (parsed.some(x => !x)) { setErr('Error: d debe ser ≤ n y n > 0.'); return }
    const pts = parsed.filter(Boolean) as { id:number; ni:number; di:number; pi:number }[]
    const totalD = pts.reduce((a, b) => a + b.di, 0)
    const totalN = pts.reduce((a, b) => a + b.ni, 0)
    const pbar = totalD / totalN
    const full: PChartPoint[] = pts.map(({ id, ni, di, pi }) => {
      const sigma = Math.sqrt(pbar * (1 - pbar) / ni)
      return { id, ni, di, pi, sigma, ucl: Math.min(1, pbar + 3*sigma), lcl: Math.max(0, pbar - 3*sigma), flag: { oc:false, run7:false, trend:false } }
    })
    const flags = checkRules(full, pbar)
    full.forEach((p, i) => { p.flag = flags[i] })
    const oocCount = flags.filter(f => f.oc || f.run7 || f.trend).length
    setResult({
      pts: full, chartData: full,
      pbar, totalD, totalN,
      avgUCL: mean(full.map(p => p.ucl)),
      avgLCL: mean(full.map(p => p.lcl)),
      ppm: Math.round(pbar * 1e6),
      oocCount, flags,
    })
    onSave({
      module:'P-Chart', proceso: meta.proceso, fecha: meta.fecha, ts: Date.now(),
      pbar:`${(pbar*100).toFixed(2)}%`, ooc: oocCount,
    })
  }

  const exportPDF = () => {
    if (!result) return
    const r = result
    const tableRows = r.pts.map((p, i) => `
      <tr>
        <td>${p.id}</td><td>${p.ni}</td><td>${p.di}</td>
        <td>${(p.pi*100).toFixed(2)}%</td>
        <td>${(p.ucl*100).toFixed(2)}%</td>
        <td>${(p.lcl*100).toFixed(2)}%</td>
        <td style="color:${r.flags[i].oc?'red':r.flags[i].run7||r.flags[i].trend?'orange':'green'}">
          ${r.flags[i].oc?'⚠ OOC':r.flags[i].run7?'↔ RUN7':r.flags[i].trend?'↗ TREND':'✓ OK'}
        </td>
      </tr>`).join('')
    const html = buildPDFHtml({
      title: 'ESTUDIO DE CONTROL ESTADÍSTICO — P-CHART',
      ref: `PCHART-${Date.now()}`,
      meta,
      body: `
        <h3>RESULTADOS ESTADÍSTICOS</h3>
        <table>
          <tr><th>Parámetro</th><th>Valor</th></tr>
          <tr><td>p̄ (Proporción media defectiva)</td><td>${(r.pbar*100).toFixed(4)}%</td></tr>
          <tr><td>UCL promedio</td><td>${(r.avgUCL*100).toFixed(4)}%</td></tr>
          <tr><td>LCL promedio</td><td>${(r.avgLCL*100).toFixed(4)}%</td></tr>
          <tr><td>Total defectos</td><td>${r.totalD}</td></tr>
          <tr><td>Total inspeccionado</td><td>${r.totalN}</td></tr>
          <tr><td>PPM</td><td>${r.ppm.toLocaleString()}</td></tr>
          <tr><td>Subgrupos fuera de control</td><td>${r.oocCount}</td></tr>
        </table>
        <h3>TABLA DE DATOS POR SUBGRUPO</h3>
        <table>
          <tr><th>Subgrupo</th><th>n</th><th>d</th><th>pᵢ</th><th>UCL</th><th>LCL</th><th>Estado</th></tr>
          ${tableRows}
        </table>
        <h3>CONCLUSIÓN</h3>
        <p>El proceso "${meta.proceso}" presenta una proporción promedio defectiva de
        <strong>${(r.pbar*100).toFixed(4)}%</strong> (${r.ppm.toLocaleString()} PPM).
        El proceso se clasifica como <strong>${r.oocCount===0?'ESTABLE':'INESTABLE'}</strong>.</p>
      `,
    })
    openPDF(html)
  }

  return (
    <ModuleLayout
      sidebar={
        <Sidebar>
          <SidebarPanel>
            <SectionTitle>Identificación del Estudio</SectionTitle>
            <div className="flex flex-col gap-2.5">
              {([['proceso','Proceso / Máquina'],['parte','No. de Parte'],['caracteristica','Característica'],['fecha','Fecha'],['responsable','Responsable'],['cliente','Cliente'],['version','Versión']] as [keyof StudyMeta, string][]).map(([k, l]) => (
                <Field key={k} label={l} value={meta[k] ?? ''} onChange={v => setMeta(p => ({ ...p, [k]: v }))} small />
              ))}
            </div>
          </SidebarPanel>

          <SidebarPanel>
            <SectionTitle>Configuración de Subgrupos</SectionTitle>
            <div className="flex items-end gap-2">
              <Field label="Número de Subgrupos" value={numSg} onChange={updateRows} type="number" className="flex-1" />
              <div className="flex gap-1 mb-0.5">
                <button onClick={() => updateRows(String(parseInt(numSg) - 1))} className="btn-ghost px-2 py-1.5">
                  <Minus size={10} />
                </button>
                <button onClick={() => updateRows(String(parseInt(numSg) + 1))} className="btn-ghost px-2 py-1.5">
                  <Plus size={10} />
                </button>
              </div>
            </div>
            <div className="mt-3 bg-bg-surface rounded-md p-3 border border-border-base">
              <div className="font-mono text-2xs text-accent tracking-widest uppercase mb-2">Fórmulas P-Chart</div>
              {['p̄ = Σd / Σn', 'σᵢ = √[p̄(1−p̄)/nᵢ]', 'UCL = p̄ + 3σᵢ', 'LCL = max(0, p̄ − 3σᵢ)'].map(f => (
                <div key={f} className="font-mono text-2xs text-tx-muted py-0.5 italic">{f}</div>
              ))}
            </div>
          </SidebarPanel>

          {err && <div className="err-box">{err}</div>}

          <button className="btn-primary" onClick={compute}>
            <Play size={11} className="inline mr-2 -mt-0.5" />
            Generar P-Chart
          </button>
          {result && (
            <button className="btn-success" onClick={exportPDF}>
              <FileDown size={11} className="inline mr-2 -mt-0.5" />
              Exportar PDF Corporativo
            </button>
          )}
        </Sidebar>
      }
    >
      {/* Data Entry Table */}
      <div className="card p-4">
        <SectionTitle>
          Datos por Subgrupo — Inspección por Atributos
          <span className="ml-2 font-mono text-2xs text-tx-dim">({rows.length} subgrupos)</span>
        </SectionTitle>
        <div className="overflow-auto max-h-72">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-20">Subgrupo</th>
                <th>n (Total)</th>
                <th>d (Defectos)</th>
                <th>pᵢ = d/n</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const pi = (row.n && row.d) ? (parseNum(row.d)! / parseNum(row.n)!) : null
                const flagged = result?.chartData[i]?.flag
                return (
                  <tr key={row.id}>
                    <td className="text-accent font-bold font-mono">{row.id}</td>
                    <td>
                      <input value={row.n} onChange={e => setRow(i, 'n', e.target.value)}
                        type="number" className="cell-input w-20" />
                    </td>
                    <td>
                      <input value={row.d} onChange={e => setRow(i, 'd', e.target.value)}
                        type="number" className="cell-input w-16" />
                    </td>
                    <td className={`font-mono text-xs mono-num ${pi !== null ? (pi > 0 ? 'text-warn' : 'text-pass') : 'text-tx-dim'}`}>
                      {pi !== null ? `${(pi * 100).toFixed(2)}%` : '—'}
                    </td>
                    <td>
                      {flagged ? (
                        <Badge variant={flagged.oc ? 'fail' : flagged.run7 || flagged.trend ? 'warn' : 'pass'}>
                          {flagged.oc ? 'OOC' : flagged.run7 ? 'RUN-7' : flagged.trend ? 'TREND' : 'OK'}
                        </Badge>
                      ) : <Badge variant="dim">—</Badge>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!result && (
        <EmptyState
          icon="◆"
          title="Sin gráfica generada"
          description="Ingresa datos por subgrupo y presiona Generar P-Chart"
        />
      )}

      {result && (
        <motion.div className="flex flex-col gap-3.5" initial={{ opacity:0 }} animate={{ opacity:1 }}>
          {/* KPI Row */}
          <div className="grid grid-cols-4 gap-3">
            <KPICard label="p̄ Media Defectiva"    value={`${(result.pbar*100).toFixed(3)}%`} />
            <KPICard label="PPM Defectivo"          value={result.ppm.toLocaleString()} pass={result.ppm < 1000} warn={result.ppm >= 1000 && result.ppm < 5000} />
            <KPICard label="Subgrupos OOC"          value={String(result.oocCount)} pass={result.oocCount === 0} />
            <KPICard label="Total Defectos"         value={result.totalD.toLocaleString()} />
          </div>

          {/* P-Chart */}
          <ChartPanel
            title="P-Chart · Proporción Defectiva por Subgrupo"
            subtitle="Reglas SPC Western Electric — OOC=rojo · RUN-7=ámbar · Tendencia=ámbar"
            height={310}
          >
            <ResponsiveContainer>
              <ComposedChart data={result.chartData} margin={{ top:10, right:24, bottom:20, left:10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} />
                <XAxis dataKey="id" {...tickProps}
                  label={{ value:'Subgrupo', fill: CT.muted, fontSize:9, position:'insideBottom', offset:-10 }} />
                <YAxis tickFormatter={(v: number) => `${(v*100).toFixed(1)}%`} {...tickProps} width={55} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: any, n: string) => [`${(+v*100).toFixed(4)}%`, n]}
                  labelFormatter={(l: any) => `Subgrupo ${l}`}
                />
                <ReferenceLine y={result.pbar} stroke={CT.green} strokeDasharray="4 2" strokeWidth={1.5}
                  label={{ value:`p̄=${(result.pbar*100).toFixed(3)}%`, position:'right', fill:CT.green, fontSize:9, fontFamily:'JetBrains Mono, monospace' }} />
                <Line type="monotone" dataKey="ucl" stroke={CT.red} strokeDasharray="6 3" strokeWidth={1.5} dot={false} name="UCL" />
                <Line type="monotone" dataKey="lcl" stroke={CT.red} strokeDasharray="6 3" strokeWidth={1.5} dot={false} name="LCL" />
                <Line
                  type="monotone" dataKey="pi" stroke={CT.accent} strokeWidth={2} name="pᵢ"
                  dot={(p: any) => {
                    const { cx, cy, payload } = p
                    const col = payload.flag.oc ? CT.red : (payload.flag.run7 || payload.flag.trend) ? CT.amber : CT.accent
                    return (
                      <circle key={payload.id} cx={cx} cy={cy}
                        r={payload.flag.oc ? 6 : 4}
                        fill={col} stroke="#060A14" strokeWidth={1.5} />
                    )
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartPanel>

          {/* SPC Rules */}
          <div className="grid grid-cols-3 gap-3">
            {SPC_RULES.map(({ key, label }) => {
              const count = result.flags.filter(f => f[key]).length
              const pass  = count === 0
              return (
                <div key={key} className={pass ? 'rule-card-pass' : 'rule-card-fail'}>
                  <div className="font-mono text-2xs text-tx-muted mb-2 leading-relaxed">{label}</div>
                  <div className={`font-mono text-2xl font-bold mono-num ${pass ? 'text-pass' : 'text-fail'}`}>
                    {count} pts
                  </div>
                  <div className={`font-mono text-2xs tracking-widest mt-1.5 font-semibold ${pass ? 'text-pass' : 'text-fail'}`}>
                    {pass ? '✓ NO DETECTADO' : '⚠ DETECTADO'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Conclusion */}
          <motion.div
            className={result.oocCount === 0 ? 'card-pass p-5' : 'card-fail p-5'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="font-mono text-2xs text-tx-muted tracking-[2px] uppercase mb-2">
              Conclusión Automática · SPC
            </div>
            <div className="font-sans text-sm text-tx-primary leading-relaxed">
              El proceso{' '}
              <strong className="text-accent-bright font-mono">{meta.proceso || 'analizado'}</strong>
              {' '}presenta una proporción promedio defectiva de{' '}
              <strong className="text-warn font-mono">{(result.pbar*100).toFixed(4)}%</strong>
              {' '}({result.ppm.toLocaleString()} PPM). Se clasifica como{' '}
              <strong className={`text-base ${result.oocCount === 0 ? 'text-pass' : 'text-fail'}`}>
                {result.oocCount === 0 ? '✓ ESTABLE' : '✗ INESTABLE'}
              </strong>{' '}
              bajo criterios SPC Western Electric.
            </div>
          </motion.div>
        </motion.div>
      )}
    </ModuleLayout>
  )
}
