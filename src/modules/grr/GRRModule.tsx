import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'
import { motion } from 'framer-motion'
import { Play, FileDown } from 'lucide-react'

import { Field }         from '@/components/ui/Field'
import { KPICard }       from '@/components/ui/KPICard'
import { Badge }         from '@/components/ui/Badge'
import { SectionTitle }  from '@/components/ui/SectionTitle'
import { EmptyState }    from '@/components/ui/EmptyState'
import { StatusBar }     from '@/components/ui/StatusBar'
import { ChartPanel }    from '@/components/charts/ChartPanel'
import { Sidebar, SidebarPanel } from '@/components/layout/Sidebar'
import { ModuleLayout }  from '@/components/layout/ModuleLayout'
import { CT, tooltipStyle, tickProps } from '@/components/charts/chartTheme'
import { buildPDFHtml, openPDF } from '@/lib/pdf'
import type { StudyMeta, GRRConfig, GRRResult, HistoryEntry } from '@/types'

interface GRRModuleProps { onSave: (e: HistoryEntry) => void }

const OP_LABELS = ['Op A', 'Op B', 'Op C', 'Op D']
const MSA_CRITERIA = [
  ['≥ 90%',   'ACEPTABLE'],
  ['75–89%',  'MARGINAL'],
  ['< 75%',   'DEFICIENTE'],
  ['κ ≥ 0.75','Kappa OK'],
  ['κ ≥ 0.40','Kappa marginal'],
]

export default function GRRModule({ onSave }: GRRModuleProps) {
  const [meta, setMeta] = useState<StudyMeta>({
    proceso:'', parte:'', caracteristica:'', unidad:'',
    fecha: new Date().toLocaleDateString('es-MX'),
    responsable:'', cliente:'', version:'Rev.1',
  })
  const [config, setConfig] = useState<GRRConfig>({ partes:'10', operadores:'3', replicas:'2' })
  const [tableData, setTableData] = useState<Record<number, Record<number, Record<number, string>>>>({})
  const [result, setResult] = useState<GRRResult | null>(null)
  const [err, setErr] = useState('')

  const np  = Math.max(1, parseInt(config.partes)    || 10)
  const nop = Math.min(4, parseInt(config.operadores) || 3)
  const nr  = Math.max(1, parseInt(config.replicas)   || 2)
  const opLabels = OP_LABELS.slice(0, nop)

  const setCell = (p: number, o: number, r: number, v: string) => {
    setTableData(prev => {
      const n = { ...prev }
      if (!n[p]) n[p] = {}
      if (!n[p][o]) n[p][o] = {}
      n[p][o][r] = v
      return n
    })
  }

  const compute = () => {
    setErr('')
    let agree = 0, total = 0
    const opAg: Record<number, { agree: number; total: number }> = {}
    for (let o = 0; o < nop; o++) opAg[o] = { agree: 0, total: 0 }

    for (let p = 0; p < np; p++) {
      const votes: { op: number; v: string }[] = []
      for (let o = 0; o < nop; o++)
        for (let r = 0; r < nr; r++)
          votes.push({ op: o, v: (tableData[p]?.[o]?.[r] || '').toUpperCase().trim() })

      for (let o = 0; o < nop; o++) {
        const ov = votes.filter(x => x.op === o).map(x => x.v)
        opAg[o].total++
        if (ov.every(v => v === ov[0])) opAg[o].agree++
      }
      const all = votes.map(x => x.v)
      total++
      if (all.every(v => v === all[0])) agree++
    }

    const overallPct = (agree / total) * 100
    const opPcts = opLabels.map((_, i) => (opAg[i].agree / opAg[i].total) * 100)
    const kappa = (overallPct / 100 - 0.5) / 0.5

    setResult({ agree, total, overallPct, opPcts, kappa })
    onSave({
      module:'Gage R&R', proceso: meta.proceso, fecha: meta.fecha,
      ts: Date.now(), acuerdo: `${overallPct.toFixed(1)}%`,
    })
  }

  const exportPDF = () => {
    if (!result) return
    const html = buildPDFHtml({
      title: 'ATTRIBUTE GAGE R&R — MSA ANÁLISIS',
      ref: `GRR-${Date.now()}`,
      meta,
      body: `
        <h3>CONFIGURACIÓN</h3>
        <table>
          <tr><td>Partes</td><td>${np}</td><td>Operadores</td><td>${nop}</td><td>Réplicas</td><td>${nr}</td></tr>
        </table>
        <h3>RESULTADOS</h3>
        <table>
          <tr><th>Métrica</th><th>Valor</th><th>Estado</th></tr>
          <tr><td>% Acuerdo Total</td><td>${result.overallPct.toFixed(1)}%</td>
              <td>${result.overallPct>=90?'✓ ACEPTABLE':'✗ NO ACEPTABLE'}</td></tr>
          ${result.opPcts.map((p,i)=>`<tr><td>% Acuerdo ${opLabels[i]}</td><td>${p.toFixed(1)}%</td><td>${p>=90?'✓':'✗'}</td></tr>`).join('')}
          <tr><td>Kappa (aprox.)</td><td>${result.kappa.toFixed(3)}</td>
              <td>${result.kappa>=.75?'✓ ACEPTABLE':result.kappa>=.4?'⚠ MARGINAL':'✗ DEFICIENTE'}</td></tr>
        </table>
        <h3>CONCLUSIÓN</h3>
        <p>El sistema de medición para "${meta.caracteristica}" presenta un acuerdo global del
        ${result.overallPct.toFixed(1)}%. Clasificado como
        <strong>${result.overallPct>=90?'ACEPTABLE':'NO ACEPTABLE'}</strong> (MSA ≥ 90%).</p>
      `,
    })
    openPDF(html)
  }

  const barData = result
    ? [{ name:'Global', value: result.overallPct }, ...result.opPcts.map((p, i) => ({ name: opLabels[i], value: p }))]
    : []

  const msaVerdict = result
    ? result.overallPct >= 90 ? { label:'SISTEMA ACEPTABLE', v:'pass' }
      : result.overallPct >= 75 ? { label:'SISTEMA MARGINAL', v:'warn' }
      : { label:'SISTEMA DEFICIENTE', v:'fail' }
    : null

  return (
    <ModuleLayout
      sidebar={
        <Sidebar>
          <SidebarPanel>
            <SectionTitle>Identificación del Estudio</SectionTitle>
            <div className="flex flex-col gap-2.5">
              {([['proceso','Proceso'],['parte','No. Parte'],['caracteristica','Característica Crítica'],['fecha','Fecha'],['responsable','Responsable'],['cliente','Cliente'],['version','Versión']] as [keyof StudyMeta, string][]).map(([k, l]) => (
                <Field key={k} label={l} value={meta[k] ?? ''} onChange={v => setMeta(p => ({ ...p, [k]: v }))} small />
              ))}
            </div>
          </SidebarPanel>

          <SidebarPanel>
            <SectionTitle>Configuración MSA</SectionTitle>
            <div className="flex flex-col gap-2.5">
              <Field label="No. de Partes"           value={config.partes}     onChange={v => setConfig(p=>({...p,partes:v}))}     type="number" />
              <Field label="No. Operadores (máx 4)"  value={config.operadores} onChange={v => setConfig(p=>({...p,operadores:String(Math.min(4,parseInt(v)||1))}))} type="number" />
              <Field label="Réplicas por Operador"   value={config.replicas}   onChange={v => setConfig(p=>({...p,replicas:v}))}    type="number" />
            </div>
          </SidebarPanel>

          <SidebarPanel>
            <SectionTitle>Criterios MSA</SectionTitle>
            <div className="flex flex-col gap-1">
              {MSA_CRITERIA.map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-border-dim">
                  <span className="font-mono text-2xs text-accent-glow">{k}</span>
                  <span className="font-mono text-2xs text-tx-muted">{v}</span>
                </div>
              ))}
            </div>
          </SidebarPanel>

          {err && <div className="err-box">{err}</div>}

          <button className="btn-primary" onClick={compute}>
            <Play size={11} className="inline mr-2 -mt-0.5" />
            Calcular Gage R&R
          </button>
          {result && (
            <button className="btn-success" onClick={exportPDF}>
              <FileDown size={11} className="inline mr-2 -mt-0.5" />
              Exportar PDF MSA
            </button>
          )}
        </Sidebar>
      }
    >
      {/* Data Table */}
      <div className="card p-4">
        <SectionTitle>
          Tabla de Datos — Ingresa <span className="text-pass">A</span> (Aprobado) o{' '}
          <span className="text-fail">R</span> (Rechazado)
        </SectionTitle>
        <div className="overflow-auto max-h-72">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-16">Parte</th>
                {opLabels.map(op =>
                  Array.from({ length: nr }, (_, r) => (
                    <th key={`${op}${r}`}>{op} R{r+1}</th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: np }, (_, p) => (
                <tr key={p}>
                  <td className="text-accent font-bold font-mono">P{p+1}</td>
                  {opLabels.map((_, o) =>
                    Array.from({ length: nr }, (_, r) => {
                      const v = tableData[p]?.[o]?.[r] || ''
                      return (
                        <td key={`${o}${r}`}>
                          <input
                            value={v}
                            onChange={e => setCell(p, o, r, e.target.value)}
                            maxLength={1}
                            className={`cell-input w-9 uppercase text-center ${
                              v === 'A' ? 'text-pass border-pass-border' :
                              v === 'R' ? 'text-fail border-fail-border' : ''
                            }`}
                          />
                        </td>
                      )
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!result && (
        <EmptyState
          icon="◉"
          title="Sin resultados"
          description="Configura el estudio, llena la tabla y presiona Calcular Gage R&R"
        />
      )}

      {result && (
        <motion.div
          className="flex flex-col gap-3.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* KPI Row */}
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${2 + result.opPcts.length}, 1fr)` }}>
            <KPICard
              label="Acuerdo Global"
              value={`${result.overallPct.toFixed(1)}%`}
              pass={result.overallPct >= 90}
              warn={result.overallPct >= 75 && result.overallPct < 90}
            />
            {result.opPcts.map((p, i) => (
              <KPICard key={i} label={opLabels[i]} value={`${p.toFixed(1)}%`}
                pass={p >= 90} warn={p >= 75 && p < 90} />
            ))}
            <KPICard
              label="Kappa (aprox.)"
              value={result.kappa.toFixed(3)}
              pass={result.kappa >= 0.75}
              warn={result.kappa >= 0.4 && result.kappa < 0.75}
            />
          </div>

          {/* Charts + Summary Row */}
          <div className="grid grid-cols-2 gap-3.5">
            <ChartPanel title="Acuerdo por Operador (%)" subtitle="Línea verde = criterio 90%" height={200}>
              <ResponsiveContainer>
                <BarChart data={barData} margin={{ top:5, right:10, bottom:5, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} />
                  <XAxis dataKey="name" {...tickProps} />
                  <YAxis domain={[0,100]} {...tickProps} width={30} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${(+v).toFixed(1)}%`, 'Acuerdo']} />
                  <ReferenceLine y={90} stroke={CT.green} strokeDasharray="4 2" label={{ value:'90%', fill:CT.green, fontSize:9 }} />
                  <Bar dataKey="value" radius={[3,3,0,0]}>
                    {barData.map((d, i) => (
                      <Cell key={i} fill={d.value >= 90 ? CT.green : d.value >= 75 ? CT.amber : CT.red} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <div className="card p-4 flex flex-col gap-3">
              <SectionTitle>Clasificación del Sistema de Medición</SectionTitle>

              {[
                ['% Acuerdo Global',   `${result.overallPct.toFixed(1)}%`, result.overallPct>=90?'pass':result.overallPct>=75?'warn':'fail'],
                ['Kappa (aprox.)',      result.kappa.toFixed(3),            result.kappa>=.75?'pass':result.kappa>=.4?'warn':'fail'],
                ['Partes correctas',   `${result.agree}/${result.total}`,   'info'],
              ].map(([l, v, b]) => (
                <div key={l} className="flex items-center justify-between py-2 border-b border-border-dim">
                  <span className="font-mono text-xs text-tx-secondary">{l}</span>
                  <Badge variant={b as any}>{v}</Badge>
                </div>
              ))}

              {/* Progress bars per operator */}
              <div className="mt-1 flex flex-col gap-2">
                {result.opPcts.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-mono text-2xs text-tx-muted w-10">{opLabels[i]}</span>
                    <StatusBar value={p} showLabel className="flex-1" />
                  </div>
                ))}
              </div>

              {msaVerdict && (
                <div className={`rounded-md p-3 mt-auto ${
                  msaVerdict.v === 'pass' ? 'bg-pass-bg border border-pass-border' :
                  msaVerdict.v === 'warn' ? 'bg-warn-bg border border-warn-border' :
                  'bg-fail-bg border border-fail-border'
                }`}>
                  <div className="font-mono text-2xs text-tx-muted tracking-widest mb-1">VEREDICTO MSA</div>
                  <div className={`font-mono text-sm font-bold ${
                    msaVerdict.v === 'pass' ? 'text-pass' :
                    msaVerdict.v === 'warn' ? 'text-warn' : 'text-fail'
                  }`}>
                    {msaVerdict.v === 'pass' ? '✓' : msaVerdict.v === 'warn' ? '⚠' : '✗'} {msaVerdict.label}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </ModuleLayout>
  )
}
