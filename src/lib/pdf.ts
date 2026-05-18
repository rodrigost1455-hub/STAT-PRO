import type { StudyMeta } from '@/types'

interface PDFOptions {
  title: string
  ref: string
  meta: StudyMeta
  body: string
}

export function buildPDFHtml({ title, ref, meta, body }: PDFOptions): string {
  const metaRows = [
    ['Proceso/Máquina', meta.proceso],
    ['No. de Parte',    meta.parte],
    ['Característica',  meta.caracteristica],
    ['Versión',         meta.version],
    ['Fecha',           meta.fecha],
    ['Responsable',     meta.responsable],
    ['Cliente',         meta.cliente],
  ].map(([l, v]) => `<div class="meta-item"><label>${l}</label><span>${v || '—'}</span></div>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${title}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a2e;margin:0;padding:0}
  .header{background:#050810;color:white;padding:12px 24px;display:flex;justify-content:space-between;align-items:center}
  .logo{font-weight:900;font-size:16px;letter-spacing:3px;color:#00B4D8;font-family:monospace}
  .logo-sub{font-size:9px;color:#475569;letter-spacing:1px}
  .iatf{font-size:9px;color:#00B4D8;text-align:right;line-height:1.6}
  .title-bar{background:#0B1220;border-bottom:2px solid #00B4D8;padding:10px 24px}
  .title-bar h1{margin:0;font-size:14px;color:#00D4FF;letter-spacing:1px;font-family:monospace}
  .title-bar .ref{font-size:9px;color:#475569;margin-top:2px;font-family:monospace}
  .content{padding:20px 24px}
  .meta-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0}
  .meta-item label{display:block;font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
  .meta-item span{font-weight:700;font-size:11px;color:#1e3a5f}
  h3{font-size:11px;color:#00B4D8;letter-spacing:1.5px;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin:16px 0 8px;font-family:monospace}
  table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:10px;font-family:monospace}
  th{background:#050810;color:#00B4D8;padding:6px 10px;text-align:left;font-size:9px;letter-spacing:.5px}
  td{padding:5px 10px;border-bottom:1px solid #e2e8f0;color:#1a1a2e}
  tr:nth-child(even) td{background:#f8fafc}
  .footer{position:fixed;bottom:0;left:0;right:0;background:#050810;color:#475569;font-size:8px;padding:6px 24px;display:flex;justify-content:space-between;font-family:monospace}
  .sign-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:24px}
  .sign-box{border-top:1px solid #0B1220;padding-top:8px;font-size:9px;color:#64748b}
  .sign-box strong{display:block;margin-bottom:16px;color:#1a1a2e;font-size:10px;font-family:monospace}
  p{line-height:1.7;font-size:11px}
  @media print{.footer{position:fixed}}
</style></head><body>
<div class="header">
  <div>
    <div class="logo">STATPRO</div>
    <div class="logo-sub">INDUSTRIAL v4.0 · Quality Analytics Platform</div>
  </div>
  <div class="iatf">IATF 16949<br>Ref: ${ref}<br>${new Date().toLocaleDateString('es-MX')}</div>
</div>
<div class="title-bar">
  <h1>${title}</h1>
  <div class="ref">Referencia: ${ref}</div>
</div>
<div class="content">
  <div class="meta-grid">${metaRows}</div>
  ${body}
  <div class="sign-grid">
    <div class="sign-box"><strong>ELABORÓ</strong>${meta.responsable || '___________'}<br>Firma / Fecha</div>
    <div class="sign-box"><strong>REVISÓ</strong>___________<br>Firma / Fecha</div>
    <div class="sign-box"><strong>AUTORIZÓ</strong>___________<br>Firma / Fecha</div>
  </div>
</div>
<div class="footer">
  <span>Generado por StatPro Industrial v4.0 · Ref: ${ref}</span>
  <span>Documento de referencia · Requiere firma física para auditoría IATF 16949</span>
</div>
</body></html>`
}

export function openPDF(html: string): void {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank')
  if (w) setTimeout(() => w.print(), 800)
}
