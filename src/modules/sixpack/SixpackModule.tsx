import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, BarChart, Bar, Cell,
  ComposedChart, Line as ReLine,
} from 'recharts'
import { motion } from 'framer-motion'
import { Play, FileDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'

import { Field }         from '@/components/ui/Field'
import { KPICard }       from '@/components/ui/KPICard'
import { SectionTitle }  from '@/components/ui/SectionTitle'
import { EmptyState }    from '@/components/ui/EmptyState'
import { ChartPanel }    from '@/components/charts/ChartPanel'
import { Sidebar, SidebarPanel } from '@/components/layout/Sidebar'
import { ModuleLayout }  from '@/components/layout/ModuleLayout'
import { CT, tooltipStyle, tickProps } from '@/components/charts/chartTheme'

import {
  mean, stdev, parseNum, normCdf, fmt, fmtPct, fmtPPM,
  capClass, CAP_LABELS, histWithCurve,
} from '@/lib/utils'
import { buildPDFHtml, openPDF } from '@/lib/pdf'
import type { StudyMeta, SixpackSpec, SixpackResult, HistoryEntry } from '@/types'

const META_FIELDS: [keyof StudyMeta, string][] = [
  ['proceso','Proceso / Máquina'], ['parte','No. de Parte'],
  ['caracteristica','Característica'], ['unidad','Unidad'],
  ['fecha','Fecha'], ['responsable','Responsable'],
  ['cliente','Cliente'], ['version','Versión'],
]

const WIDE_FIELDS = new Set(['proceso','caracteristica','responsable'])

interface SixpackModuleProps { onSave: (e: HistoryEntry) => void }

export default function SixpackModule({ onSave }: SixpackModuleProps) {
  const [meta, setMeta] = useState<StudyMeta>({
    proceso:'', parte:'', caracteristica:'', unidad:'Nm',
    fecha: new Date().toLocaleDateString('es-MX'),
    responsable:'', cliente:'', version:'Rev.1',
  })
  const [spec, setSpec] = useState<SixpackSpec>({ lsl:'', usl:'', target:'' })
  const [raw, setRaw]   = useState('')
  const [result, setResult] = useState<SixpackResult | null>(null)
  const [err, setErr]   = useState('')

  const compute = () => {
    setErr('')
    const vals = raw.split(/[\s,;\n]+/).map(parseNum).filter((v): v is number => v !== null)
    if (vals.length < 5) { setErr('Mínimo 5 observaciones requeridas.'); return }
    const lsl = parseNum(spec.lsl), usl = parseNum(spec.usl)
    if (!lsl || !usl) { setErr('LSL y USL son requeridos.'); return }
    const tgt = parseNum(spec.target) ?? (lsl + usl) / 2
    const n = vals.length, xbar = mean(vals)
    const MRs   = vals.slice(1).map((v, i) => Math.abs(v - vals[i]))
    const MRbar = mean(MRs)
    const d2 = 1.128, D4 = 3.267
    const sigmaW = MRbar / d2, sigmaO = stdev(vals)
    const cp  = (usl - lsl) / (6 * sigmaW)
    const cpk = Math.min((usl - xbar) / (3 * sigmaW), (xbar - lsl) / (3 * sigmaW))
    const pp  = (usl - lsl) / (6 * sigmaO)
    const ppk = Math.min((usl - xbar) / (3 * sigmaO), (xbar - lsl) / (3 * sigmaO))
    const cpm = (usl - lsl) / (6 * Math.sqrt(sigmaO ** 2 + (xbar - tgt) ** 2))
    const zBench = Math.min((usl - xbar) / sigmaW, (xbar - lsl) / sigmaW)
    const ppmW   = Math.round((1 - normCdf(zBench)) * 2 * 1e6)
    const iUCL = xbar + 3 * sigmaW, iLCL = xbar - 3 * sigmaW
    const mrUCL = D4 * MRbar
    const oosI = vals.filter(v => v > iUCL || v < iLCL).length
    const chartData = vals.map((v, i) => ({
      i: i + 1, v, mr: i > 0 ? Math.abs(v - vals[i - 1]) : null,
      oos: v > iUCL || v < iLCL,
    }))
    const bins = histWithCurve(vals, 10)
    setResult({
      vals, n, xbar, sigmaW, sigmaO, cp, cpk, pp, ppk, cpm,
      zBench, ppmW, iUCL, iLCL, mrUCL, MRbar, oosI,
      min: Math.min(...vals), max: Math.max(...vals),
      chartData, bins: bins as SixpackResult['bins'], lsl, usl, tgt,
    })
    onSave({
      module:'Sixpack', proceso: meta.proceso, fecha: meta.fecha,
      ts: Date.now(), cpk: cpk.toFixed(3),
    })
  }

  const exportPDF = () => {
    if (!result) return
    const r = result
    const rows = r.vals.map((v, i) => `<tr><td>${i+1}</td><td>${v.toFixed(4)}</td></tr>`).join('')
    const html = buildPDFHtml({
      title: 'ESTUDIO DE CAPACIDAD DE PROCESO — SIXPACK',
      ref: `CPK-${Date.now()}`,
      meta,
      body: `
        <h3>ESPECIFICACIONES</h3>
        <table>
          <tr><td>LSL</td><td>${r.lsl} ${meta.unidad}</td>
              <td>USL</td><td>${r.usl} ${meta.unidad}</td></tr>
          <tr><td>Target</td><td>${r.tgt} ${meta.unidad}</td>
              <td>Tolerancia</td><td>${(r.usl-r.lsl).toFixed(4)} ${meta.unidad}</td></tr>
        </table>
        <h3>RESULTADOS</h3>
        <table>
          <tr><th>Parámetro</th><th>Valor</th><th>Estado</th></tr>
          <tr><td>Cp</td><td>${r.cp.toFixed(3)}</td><td>${r.cp>=1.67?'✓ EXCELENTE':r.cp>=1.33?'✓ CAPAZ':'✗ NO CAPAZ'}</td></tr>
          <tr><td>Cpk</td><td>${r.cpk.toFixed(3)}</td><td>${r.cpk>=1.67?'✓ EXCELENTE':r.cpk>=1.33?'✓ CAPAZ':'✗ NO CAPAZ'}</td></tr>
          <tr><td>Pp</td><td>${r.pp.toFixed(3)}</td><td>${r.pp>=1.67?'✓ EXCELENTE':r.pp>=1.33?'✓ CAPAZ':'✗ NO CAPAZ'}</td></tr>
          <tr><td>Ppk</td><td>${r.ppk.toFixed(3)}</td><td>${r.ppk>=1.67?'✓ EXCELENTE':r.ppk>=1.33?'✓ CAPAZ':'✗ NO CAPAZ'}</td></tr>
          <tr><td>X̄</td><td>${r.xbar.toFixed(5)} ${meta.unidad}</td><td>—</td></tr>
          <tr><td>σ Within</td><td>${r.sigmaW.toFixed(5)}</td><td>—</td></tr>
          <tr><td>σ Overall</td><td>${r.sigmaO.toFixed(5)}</td><td>—</td></tr>
          <tr><td>Z Bench</td><td>${r.zBench.toFixed(4)}</td><td>—</td></tr>
          <tr><td>PPM Within</td><td>${r.ppmW}</td><td>${r.ppmW===0?'✓ OK':'⚠ REVISAR'}</td></tr>
          <tr><td>OOS</td><td>${r.oosI} (${(r.oosI/r.n*100).toFixed(1)}%)</td><td>${r.oosI===0?'✓ OK':'⚠ REVISAR'}</td></tr>
        </table>
        <h3>DATOS (n=${r.n})</h3>
        <table><tr><th>#</th><th>Valor (${meta.unidad})</th></tr>${rows}</table>
        <h3>CONCLUSIÓN</h3>
        <p>El proceso "${meta.proceso}" presenta Cpk = ${r.cpk.toFixed(3)}, clasificado como
        <strong>${CAP_LABELS[capClass(r.cpk)]}</strong> bajo IATF 16949 (Cpk ≥ 1.33).
        PPM teórico: ${r.ppmW}.</p>
      `,
    })
    openPDF(html)
  }

  const cls = result ? capClass(result.cpk) : null

  return (
    <ModuleLayout
      sidebar={
        <Sidebar>
          <SidebarPanel>
            <SectionTitle>Identificación del Estudio</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5">
              {META_FIELDS.map(([k, l]) => (
                <div key={k} className={WIDE_FIELDS.has(k) ? 'col-span-2' : ''}>
                  <Field label={l} value={meta[k] ?? ''} onChange={v => setMeta(p => ({ ...p, [k]: v }))} small />
                </div>
              ))}
            </div>
          </SidebarPanel>

          <SidebarPanel>
            <SectionTitle>Especificaciones</SectionTitle>
            <div className="flex flex-col gap-2.5">
              <Field label="LSL — Límite Inferior" value={spec.lsl} onChange={v => setSpec(p => ({...p, lsl:v}))} type="number" unit={meta.unidad} />
              <Field label="USL — Límite Superior" value={spec.usl} onChange={v => setSpec(p => ({...p, usl:v}))} type="number" unit={meta.unidad} />
              <Field label="Target (opcional)"      value={spec.target} onChange={v => setSpec(p => ({...p, target:v}))} type="number" unit={meta.unidad} />
            </div>
          </SidebarPanel>

          <SidebarPanel>
            <SectionTitle>Datos de Proceso</SectionTitle>
            <textarea
              value={raw}
              onChange={e => setRaw(e.target.value)}
              placeholder={'10.45, 10.50, 10.52\n(coma · espacio · nueva línea)'}
              className="w-full min-h-[110px] bg-bg-surface border border-border-base rounded-md text-tx-primary font-mono text-xs p-2.5 resize-y outline-none focus:border-accent hover:border-border-mid transition-colors placeholder:text-tx-dim"
            />
            <div className="font-mono text-2xs text-tx-dim mt-2 tracking-wide">
              Mínimo 5 observaciones
            </div>
          </SidebarPanel>

          {err && <div className="err-box">{err}</div>}

          <button className="btn-primary" onClick={compute}>
            <Play size={11} className="inline mr-2 -mt-0.5" />
            Calcular Capacidad
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
      {!result && (
        <EmptyState
          icon="◈"
          title="Sin datos de proceso"
          description="Ingresa especificaciones y observaciones, luego presiona Calcular Capacidad"
        />
      )}

      {result && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-5 gap-3">
            <KPICard label="Cp"  value={fmt(result.cp,3)}  pass={result.cp>=1.33}  sub={result.cp>=1.67?'EXCELENTE':result.cp>=1.33?'CAPAZ':'NO CAPAZ'} />
            <KPICard label="Cpk" value={fmt(result.cpk,3)} pass={result.cpk>=1.33} sub={cls ? CAP_LABELS[cls] : undefined} />
            <KPICard label="Pp"  value={fmt(result.pp,3)}  pass={result.pp>=1.33}  />
            <KPICard label="Ppk" value={fmt(result.ppk,3)} pass={result.ppk>=1.33} />
            <KPICard
              label="PPM Within"
              value={fmtPPM(result.ppmW)}
              pass={result.ppmW === 0}
              warn={result.ppmW > 0 && result.ppmW < 1000}
              sub={result.ppmW === 0 ? 'ZERO DEFECTS' : result.ppmW < 1000 ? '< 1,000 PPM' : '≥ 1,000 PPM'}
            />
          </div>

          {/* Control Charts Row */}
          <div className="grid grid-cols-2 gap-3.5">
            <ChartPanel title="Carta Individual (I)" subtitle="UCL — CL — LCL · ±3σ Within" height={220}>
              <ResponsiveContainer>
                <LineChart data={result.chartData} margin={{ top:5, right:12, bottom:5, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} />
                  <XAxis dataKey="i" {...tickProps} />
                  <YAxis {...tickProps} width={60} domain={['auto','auto']} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <ReferenceLine y={result.iUCL} stroke={CT.red}   strokeDasharray="5 3" strokeWidth={1.5} label={{ value:'UCL', fill:CT.red,   fontSize:9, fontFamily:'JetBrains Mono, monospace' }} />
                  <ReferenceLine y={result.xbar} stroke={CT.green} strokeDasharray="3 2" strokeWidth={1}   label={{ value:'X̄',  fill:CT.green, fontSize:9 }} />
                  <ReferenceLine y={result.iLCL} stroke={CT.red}   strokeDasharray="5 3" strokeWidth={1.5} label={{ value:'LCL', fill:CT.red,   fontSize:9, fontFamily:'JetBrains Mono, monospace' }} />
                  <Line
                    type="monotone" dataKey="v" stroke={CT.accent} strokeWidth={1.5} name="Medición"
                    dot={(p: any) => {
                      const { cx, cy, payload } = p
                      return (
                        <circle
                          key={payload.i} cx={cx} cy={cy}
                          r={payload.oos ? 5 : 3}
                          fill={payload.oos ? CT.red : CT.accent}
                          stroke={payload.oos ? CT.red : CT.card}
                          strokeWidth={1.5}
                        />
                      )
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Carta Rango Móvil (MR)" subtitle="UCL — MR̄" height={220}>
              <ResponsiveContainer>
                <LineChart data={result.chartData.slice(1)} margin={{ top:5, right:12, bottom:5, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} />
                  <XAxis dataKey="i" {...tickProps} />
                  <YAxis {...tickProps} width={60} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <ReferenceLine y={result.mrUCL} stroke={CT.red}   strokeDasharray="5 3" strokeWidth={1.5} label={{ value:'UCL',fill:CT.red,   fontSize:9 }} />
                  <ReferenceLine y={result.MRbar} stroke={CT.green} strokeDasharray="3 2" strokeWidth={1}   label={{ value:'MR̄',fill:CT.green, fontSize:9 }} />
                  <Line type="monotone" dataKey="mr" stroke={CT.amber} strokeWidth={1.5} dot={{ r:3, fill:CT.amber }} name="MR" />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>

          {/* Histogram + Stats Row */}
          <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
            <ChartPanel title="Histograma · Distribución de Frecuencias" subtitle="Barras rojas = fuera de especificación" height={200}>
              <ResponsiveContainer>
                <BarChart data={result.bins} margin={{ top:5, right:10, bottom:5, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} />
                  <XAxis dataKey="mid" {...tickProps} />
                  <YAxis {...tickProps} width={25} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <ReferenceLine x={result.lsl.toFixed(3)} stroke={CT.red} strokeDasharray="4 2" strokeWidth={1.5} />
                  <ReferenceLine x={result.usl.toFixed(3)} stroke={CT.red} strokeDasharray="4 2" strokeWidth={1.5} />
                  <Bar dataKey="count" name="Frec." radius={[2,2,0,0]}>
                    {result.bins.map((b, i) => (
                      <Cell key={i} fill={(b.lo < result.lsl || b.hi > result.usl) ? CT.red : CT.accent} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <div className="card p-4">
              <SectionTitle>Estadísticos Descriptivos</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['n',           String(result.n)],
                  ['X̄',           fmt(result.xbar, 5)],
                  ['σ Within',    fmt(result.sigmaW, 5)],
                  ['σ Overall',   fmt(result.sigmaO, 5)],
                  ['Mín',         fmt(result.min, 4)],
                  ['Máx',         fmt(result.max, 4)],
                  ['Rango',       fmt(result.max - result.min, 4)],
                  ['OOS',         `${result.oosI} (${(result.oosI/result.n*100).toFixed(1)}%)`],
                ].map(([l, v]) => (
                  <div key={l} className="stat-block">
                    <span className="stat-label">{l}</span>
                    <span className="stat-value mono-num">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Conclusion */}
          <motion.div
            className={result.cpk >= 1.33 ? 'card-pass p-5' : 'card-fail p-5'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="font-mono text-2xs text-tx-muted tracking-[2px] uppercase mb-2">
              Conclusión Automática · IATF 16949
            </div>
            <div className="font-sans text-sm text-tx-primary leading-relaxed">
              El proceso{' '}
              <strong className="text-accent-bright font-mono">{meta.proceso || 'analizado'}</strong>
              {' '}presenta Cpk ={' '}
              <strong className={`font-mono ${result.cpk >= 1.33 ? 'text-pass' : 'text-fail'}`}>
                {fmt(result.cpk, 3)}
              </strong>
              , clasificado como{' '}
              <strong className={`text-base ${result.cpk >= 1.33 ? 'text-pass' : 'text-fail'}`}>
                {cls ? CAP_LABELS[cls] : '—'}
              </strong>
              . PPM teórico Within:{' '}
              <strong className="font-mono text-warn">{fmtPPM(result.ppmW)}</strong>.
              {result.oosI > 0 && (
                <span className="text-fail">
                  {' '}Se detectaron <strong>{result.oosI}</strong> punto(s) fuera de límites.
                </span>
              )}
            </div>
          </motion.div>
        </>
      )}
    </ModuleLayout>
  )
}
