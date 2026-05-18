/** Shared Recharts visual tokens for StatPro Industrial */
export const CT = {
  accent:  '#00B4D8',
  glow:    '#00D4FF',
  green:   '#00E5A0',
  red:     '#FF3B5C',
  amber:   '#FFB800',
  purple:  '#8B5CF6',
  muted:   '#475569',
  grid:    'rgba(28,46,80,0.4)',
  card:    '#111D33',
  border:  '#1C2E50',
  panel:   '#0F1829',
}

export const tooltipStyle = {
  background: CT.panel,
  border: `1px solid ${CT.border}`,
  borderRadius: 6,
  fontSize: 11,
  fontFamily: 'JetBrains Mono, monospace',
  color: '#E2E8F0',
  padding: '6px 10px',
}

export const tickProps = {
  fill: CT.muted,
  fontSize: 9,
  fontFamily: 'JetBrains Mono, monospace',
}
