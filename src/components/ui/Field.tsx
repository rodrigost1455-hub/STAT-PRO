import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  value: string
  onChange?: (v: string) => void
  type?: string
  unit?: string
  small?: boolean
  readOnly?: boolean
  placeholder?: string
  className?: string
}

export function Field({
  label, value, onChange, type = 'text',
  unit, small, readOnly, placeholder, className,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="font-mono text-2xs text-tx-muted tracking-widest uppercase">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          className={cn(
            small ? 'field-sm' : 'field-md',
            readOnly && 'opacity-50 cursor-default'
          )}
        />
        {unit && (
          <span className="font-mono text-2xs text-tx-muted whitespace-nowrap flex-shrink-0">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}
