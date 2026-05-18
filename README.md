# StatPro Industrial v4.0

> **Offline-first Statistical Process Control platform for automotive manufacturing — IATF 16949 compliant.**

![IATF](https://img.shields.io/badge/Standard-IATF_16949-0d6e3f)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff)

---

## What's New in v4.0

Complete frontend redesign with a premium industrial SaaS aesthetic:

- **TypeScript** — full type coverage across all modules
- **TailwindCSS** design token system — spacing, color, typography scales
- **Framer Motion** — page transitions, KPI card entrances, result animations
- **JetBrains Mono + Space Grotesk** — intentional typographic split between data and UI
- **Modular architecture** — each module in its own folder with clean separation

---

## Architecture

```
src/
├── components/
│   ├── ui/           # KPICard, Field, Badge, EmptyState, StatusBar, SectionTitle
│   ├── charts/       # ChartPanel, chartTheme (shared Recharts tokens)
│   └── layout/       # TopNav, Sidebar, ModuleLayout, HistoryPanel
├── modules/
│   ├── sixpack/      # Capability Sixpack — Cp, Cpk, Pp, Ppk
│   ├── grr/          # Attribute Gage R&R — MSA analysis
│   └── pchart/       # P-Chart — SPC proportion control
├── lib/
│   ├── utils.ts      # Statistical functions, formatting, histogram
│   └── pdf.ts        # PDF/print export template
└── types/            # Shared TypeScript types
```

---

## Quick Start

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

The `dist/` folder is a fully offline, zero-server deployment — drop it on a USB or serve from any static host.

---

## Modules

| Module | Description | Standard |
|---|---|---|
| **Capability Sixpack** | Cp, Cpk, Pp, Ppk, Z-Bench, PPM, I-Chart, MR-Chart, Histogram | IATF 16949 §8.3.3 |
| **Attribute Gage R&R** | Kappa-based agreement analysis per appraiser | MSA Manual 4th Ed. |
| **P-Chart** | Proportion control chart with Western Electric rules (OOC, Run-7, Trend-6) | SPC Reference Manual |

---

## Design System

### Colors
| Token | Hex | Use |
|---|---|---|
| `accent` | `#00B4D8` | Primary interactive |
| `pass` | `#00E5A0` | Capable / PASS / OK |
| `fail` | `#FF3B5C` | Incapable / FAIL / OOC |
| `warn` | `#FFB800` | Warning / Marginal |
| `bg-base` | `#050810` | Root background |

### Typography
- **Data / Metrics**: JetBrains Mono (tabular numerals, monospaced)
- **UI / Labels**: Space Grotesk (readable, modern)

---

## Author

**Rodrigo Santana Torrecillas**  
Quality Engineer · Software Engineer · Automotive Domain  
[LinkedIn](https://www.linkedin.com/in/rodrigo-santana-torrecillas-5b523113b/) · Durango, México

> *Built at the intersection of manufacturing quality and software engineering.*

---

## License

MIT License.
