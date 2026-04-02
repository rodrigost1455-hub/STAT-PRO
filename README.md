# StatPro Industrial

> **Offline-first Statistical Process Control platform for automotive manufacturing — built to IATF 16949 standards.**

![Static Badge](https://img.shields.io/badge/Standard-IATF_16949-blue)
![Static Badge](https://img.shields.io/badge/Industry-Automotive_Manufacturing-0d6e3f)
![Static Badge](https://img.shields.io/badge/Mode-Fully_Offline-orange)
![Static Badge](https://img.shields.io/badge/Built_with-JavaScript_%7C_HTML_%7C_CSS-yellow)

---

## The Problem

In automotive manufacturing plants operating under IATF 16949 and IATF 16949/TS 16949 standards, Quality Engineers depend on heavy commercial tools (Minitab, JMP) for Statistical Process Control analysis — tools that require:

- Paid licenses ($1,500–$4,000/year per seat)
- Active internet access or VPN connectivity
- IT admin rights for installation
- Training and setup time

In **corporate-restricted environments** — which describes most Tier 1 automotive suppliers — none of these are guaranteed. Quality analysis gets delayed. Reports get done in Excel. Process capability studies become manual, error-prone, and inconsistent.

**StatPro Industrial was built to eliminate that bottleneck.**

---

## What It Does

StatPro Industrial is a **single-file, zero-dependency SPC platform** that runs entirely in the browser — no installation, no internet, no license. Open the HTML file and start analyzing.

### Modules

| Module | Description |
|---|---|
| **Capability Sixpack** | Cp, Cpk, Pp, Ppk with histogram, run chart, control charts (X̄-R / X̄-S), normality assessment |
| **Attribute Gauge R&R** | Kappa-based agreement analysis per appraiser and station — matches Yazaki corporate format |
| **P-Chart (Proportion)** | Attribute SPC with UCL/LCL, SPC rule detection (Western Electric), trend analysis |
| **Process Performance (P)** | Minitab-style Pp/Ppk reporting with Anderson-Darling normality test |
| **XLSX Export** | Generates Excel reports replicating the corporate CPK template — using pure JS (no libraries) |

---

## Key Technical Decisions

### Why a single HTML file?
Automotive plants have strict network policies. No npm, no CDN, no package managers in restricted environments. A single `.html` file can be dropped on a USB drive, shared via internal email, or opened from a local folder — and it works the same everywhere.

### Why no external libraries for XLSX?
Using pure JavaScript ZIP/SpreadsheetML instead of SheetJS or ExcelJS means zero dependency risk. The output matches exactly the format used in the corporate CPK template — column layout, decimal precision, cell structure.

### Why replicate the Minitab output format?
Quality teams in automotive already know how to read Minitab output. By replicating the visual structure of Capability Sixpack and Process Performance reports, the tool requires zero onboarding for QEs already familiar with standard SPC tools.

---

## Who This Is For

- Quality Engineers at Tier 1 / Tier 2 automotive suppliers
- Plants operating under IATF 16949 or ISO 9001 quality systems
- Teams that need SPC analysis without paid tool dependencies
- QA/manufacturing teams in network-restricted corporate environments

---

## Screenshots

> *(Add screenshots of Capability Sixpack output, P-Chart with SPC rules, and XLSX export here)*

---

## Background

This tool was developed by a Quality Engineer at **Yazaki Electronics** — one of the world's largest automotive wiring harness and electronics manufacturers — to solve a real operational problem: running Gauge R&R studies and process capability analysis during production audits with no access to licensed software.

STAT PRO is now associated with **Yazaki North America** on the developer's LinkedIn profile and is actively used as a reference tool for IATF 16949 compliance activities.

---

## Roadmap

- [ ] Variable Gauge R&R (ANOVA method)
- [ ] Multi-characteristic capability report
- [ ] MSA Discrimination Ratio
- [ ] Control chart with assignable cause logging
- [ ] PDF export (single-file, no server required)

---

## Author

**Rodrigo Santana Torrecillas**
Software Engineer · QA Automation · Automotive Domain
[LinkedIn](https://www.linkedin.com/in/rodrigo-santana-torrecillas-5b523113b/) · Durango, México

> *Built at the intersection of manufacturing quality and software — because the next generation of quality engineering is automated.*

---

## License

MIT License. Free to use, adapt, and deploy in any environment.
