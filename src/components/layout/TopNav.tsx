import { cn } from '@/lib/utils'
import { Activity, BarChart2, Microscope, Clock, type LucideProps } from 'lucide-react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import type { ModuleId, HistoryEntry } from '@/types'

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps,'ref'> & RefAttributes<SVGSVGElement>>

interface ModuleDef {
  id: ModuleId
  label: string
  sub: string
  Icon: LucideIcon
}

const MODULES: ModuleDef[] = [
  { id: 'sixpack', label: 'Capability Sixpack', sub: 'Variables · Cp / Cpk / Pp / Ppk', Icon: BarChart2 },
  { id: 'grr',     label: 'Gage R&R',           sub: 'MSA · Attribute Agreement',         Icon: Microscope },
  { id: 'pchart',  label: 'P-Chart SPC',         sub: 'Atributos · Control de Proceso',    Icon: Activity },
]

interface TopNavProps {
  active: ModuleId
  setActive: (id: ModuleId) => void
  history: HistoryEntry[]
  showHistory: boolean
  setShowHistory: (v: boolean) => void
}

export function TopNav({
  active, setActive, history, showHistory, setShowHistory,
}: TopNavProps) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-MX', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <header className="h-16 flex items-center px-6 gap-0 bg-bg-deep/90 backdrop-blur-md border-b border-border-base sticky top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 mr-8 flex-shrink-0">
        <div className="bg-accent text-bg-base font-black text-xs tracking-[3px] px-2.5 py-1.5 font-mono rounded-sm">
          STATPRO
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-2xs text-tx-secondary tracking-widest">INDUSTRIAL</span>
          <span className="font-mono text-2xs text-tx-muted tracking-wider" style={{ fontSize: '9px' }}>
            v4.0 · IATF 16949
          </span>
        </div>
      </div>

      <div className="w-px h-7 bg-border-base mr-6 flex-shrink-0" />

      {/* Module tabs */}
      <nav className="flex items-center gap-1 flex-1">
        {MODULES.map(({ id, label, sub, Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              'nav-btn',
              active === id && 'active'
            )}
          >
            <span className={cn(
              'w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all',
              active === id
                ? 'bg-accent shadow-[0_0_6px_rgba(0,180,216,0.8)]'
                : 'bg-tx-dim'
            )} />
            <Icon size={13} className="flex-shrink-0 opacity-70" />
            <span className="flex flex-col gap-0.5 items-start">
              <span className="text-2xs">{label}</span>
              <span className="text-2xs opacity-50" style={{ fontSize: '9px' }}>{sub}</span>
            </span>
          </button>
        ))}
      </nav>

      {/* Right controls */}
      <div className="flex items-center gap-4 ml-4 flex-shrink-0">
        <div className="flex items-center gap-1.5 font-mono text-2xs text-tx-dim">
          <Clock size={10} />
          {dateStr}
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={cn(
            'btn-ghost flex items-center gap-2',
            showHistory && 'bg-bg-card border-border-mid text-tx-primary'
          )}
        >
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            history.length > 0 ? 'bg-pass' : 'bg-tx-dim'
          )} />
          Historial
          <span className="font-mono text-2xs text-tx-muted">
            ({history.length})
          </span>
        </button>
      </div>
    </header>
  )
}

export { MODULES }
