import { useState, useRef, useCallback, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer, ScatterChart, Scatter,
  BarChart, Bar, Cell, ComposedChart, Area
} from "recharts";

/* ─────────────────────────────────────────────
   SHARED STYLES & CONSTANTS
───────────────────────────────────────────── */
const CORP_COLORS = {
  bg: "#0a0f1e",
  panel: "#111827",
  card: "#1a2235",
  border: "#1e3a5f",
  accent: "#00a8e8",
  accentGlow: "#00d4ff",
  red: "#ff3b5c",
  green: "#00e5a0",
  yellow: "#ffc107",
  text: "#e2e8f0",
  muted: "#64748b",
  white: "#ffffff",
};

const MODULE_DEFS = [
  { id: "sixpack", label: "Capability Sixpack", icon: "📊", sub: "Variables – Process Capability" },
  { id: "grr",     label: "Attribute Gage R&R", icon: "🔬", sub: "MSA – Measurement System Analysis" },
  { id: "pchart",  label: "P-Chart",            icon: "📉", sub: "Atributos – Control de Proceso" },
];

/* ─────────────────────────────────────────────
   UTILITY HELPERS
───────────────────────────────────────────── */
function jStat_pnorm(x) {
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
  const sign = x<0?-1:1; x=Math.abs(x)/Math.sqrt(2);
  const t=1/(1+p*x);
  const y=1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return 0.5*(1+sign*y);
}
function mean(arr){return arr.reduce((a,b)=>a+b,0)/arr.length;}
function stdev(arr){const m=mean(arr);return Math.sqrt(arr.reduce((a,b)=>a+(b-m)**2,0)/(arr.length-1));}
function parseNum(v){const n=parseFloat(v);return isNaN(n)?null:n;}

/* ─────────────────────────────────────────────
   TOP NAVIGATION
───────────────────────────────────────────── */
function TopNav({active, setActive, history}) {
  return (
    <header style={{background:"#060d1a",borderBottom:`1px solid ${CORP_COLORS.border}`,padding:"0 32px",display:"flex",alignItems:"center",gap:0,minHeight:64}}>
      {/* Logo */}
      <div style={{marginRight:48,display:"flex",alignItems:"center",gap:12}}>
        <div style={{background:CORP_COLORS.accent,color:"#000",fontWeight:900,fontSize:13,letterSpacing:2,padding:"4px 10px",fontFamily:"monospace"}}>STATPRO</div>
        <div style={{color:CORP_COLORS.muted,fontSize:11,letterSpacing:1}}>INDUSTRIAL v3.0</div>
      </div>
      {/* Module tabs */}
      <nav style={{display:"flex",gap:4,flex:1}}>
        {MODULE_DEFS.map(m=>(
          <button key={m.id} onClick={()=>setActive(m.id)} style={{
            background: active===m.id ? CORP_COLORS.card : "transparent",
            border: active===m.id ? `1px solid ${CORP_COLORS.accent}` : "1px solid transparent",
            color: active===m.id ? CORP_COLORS.accentGlow : CORP_COLORS.muted,
            borderRadius:6, padding:"8px 20px", cursor:"pointer",
            fontFamily:"monospace", fontSize:12, fontWeight:active===m.id?700:400,
            transition:"all .2s", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:2,
          }}>
            <span style={{fontSize:14}}>{m.icon} {m.label}</span>
            <span style={{fontSize:10,opacity:.7}}>{m.sub}</span>
          </button>
        ))}
      </nav>
      {/* History badge */}
      <div style={{color:CORP_COLORS.muted,fontSize:11,fontFamily:"monospace"}}>
        📁 {history.length} estudios
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────
   SHARED INPUT COMPONENT
───────────────────────────────────────────── */
function Field({label,value,onChange,type="text",small,unit,readOnly}){
  return (
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <label style={{fontSize:11,color:CORP_COLORS.muted,fontFamily:"monospace",letterSpacing:.5}}>{label}</label>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} readOnly={readOnly}
          style={{
            background:"#0d1929",border:`1px solid ${CORP_COLORS.border}`,borderRadius:4,
            color:CORP_COLORS.text,padding:small?"4px 8px":"8px 12px",
            fontSize:small?12:13,fontFamily:"monospace",width:"100%",
            outline:"none",boxSizing:"border-box",
            opacity:readOnly?.6:1,
          }}/>
        {unit&&<span style={{fontSize:11,color:CORP_COLORS.muted,whiteSpace:"nowrap"}}>{unit}</span>}
      </div>
    </div>
  );
}

function SectionTitle({children}){
  return (
    <div style={{fontSize:11,color:CORP_COLORS.accent,fontFamily:"monospace",letterSpacing:2,
      textTransform:"uppercase",borderBottom:`1px solid ${CORP_COLORS.border}`,paddingBottom:8,marginBottom:16}}>
      {children}
    </div>
  );
}

function StatCard({label,value,unit,pass,warn}){
  const color = pass===true ? CORP_COLORS.green : pass===false ? CORP_COLORS.red : warn ? CORP_COLORS.yellow : CORP_COLORS.accentGlow;
  return (
    <div style={{background:"#0d1929",border:`1px solid ${color}33`,borderRadius:8,padding:"14px 18px",
      boxShadow:`0 0 12px ${color}22`}}>
      <div style={{fontSize:10,color:CORP_COLORS.muted,fontFamily:"monospace",marginBottom:4}}>{label}</div>
      <div style={{fontSize:22,fontWeight:700,color,fontFamily:"monospace"}}>{value}</div>
      {unit&&<div style={{fontSize:10,color:CORP_COLORS.muted,marginTop:2}}>{unit}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODULE 1 – CAPABILITY SIXPACK
───────────────────────────────────────────── */
function SixpackModule({onSaveHistory}) {
  const [meta,setMeta]=useState({proceso:"",parte:"",caracteristica:"",fecha:new Date().toLocaleDateString("es-MX"),responsable:"",cliente:"",version:"Rev.1",unidad:"Nm"});
  const [spec,setSpec]=useState({lsl:"",usl:"",target:""});
  const [rawData,setRawData]=useState("");
  const [result,setResult]=useState(null);
  const [err,setErr]=useState("");

  const computar=()=>{
    setErr("");
    const vals=rawData.split(/[\s,;\n]+/).map(parseNum).filter(v=>v!==null);
    if(vals.length<5){setErr("Mínimo 5 observaciones requeridas.");return;}
    const lsl=parseNum(spec.lsl),usl=parseNum(spec.usl),tgt=parseNum(spec.target)||(lsl&&usl?(lsl+usl)/2:null);
    if(!lsl||!usl){setErr("LSL y USL son requeridos.");return;}
    const n=vals.length,xbar=mean(vals);
    const MRs=vals.slice(1).map((v,i)=>Math.abs(v-vals[i]));
    const MRbar=mean(MRs);
    const d2=1.128,D4=3.267;
    const sigmaW=MRbar/d2;
    const sigmaO=stdev(vals);
    const cp=(usl-lsl)/(6*sigmaW);
    const cpk=Math.min((usl-xbar)/(3*sigmaW),(xbar-lsl)/(3*sigmaW));
    const pp=(usl-lsl)/(6*sigmaO);
    const ppk=Math.min((usl-xbar)/(3*sigmaO),(xbar-lsl)/(3*sigmaO));
    const cpm=tgt?(usl-lsl)/(6*Math.sqrt(sigmaO**2+(xbar-tgt)**2)):null;
    const zBench=Math.min((usl-xbar)/sigmaW,(xbar-lsl)/sigmaW);
    const ppmW=Math.round((1-jStat_pnorm(zBench))*2*1e6);
    const iUCL=xbar+3*sigmaW,iLCL=xbar-3*sigmaW;
    const mrUCL=D4*MRbar;
    const oosI=vals.filter(v=>v>iUCL||v<iLCL).length;
    const min=Math.min(...vals),max=Math.max(...vals);
    const chartData=vals.map((v,i)=>({i:i+1,v,mr:i>0?Math.abs(v-vals[i-1]):null}));
    setResult({vals,n,xbar,sigmaW,sigmaO,cp,cpk,pp,ppk,cpm,zBench,ppmW,iUCL,iLCL,mrUCL,MRbar,oosI,min,max,chartData,lsl,usl,tgt});
  };

  const exportPDF=()=>{
    if(!result)return;
    const r=result;
    const rows=r.vals.map((v,i)=>`<tr><td>${i+1}</td><td>${v.toFixed(4)}</td></tr>`).join("");
    const html=pdfTemplate({
      title:"ESTUDIO DE CAPACIDAD DE PROCESO — SIXPACK",
      ref:`CPK-${Date.now()}`,
      meta,
      body:`
        <h3>ESPECIFICACIONES</h3>
        <table><tr><td>LSL</td><td>${r.lsl} ${meta.unidad}</td><td>USL</td><td>${r.usl} ${meta.unidad}</td></tr>
        <tr><td>Target</td><td>${r.tgt??"-"} ${meta.unidad}</td><td>Tolerancia</td><td>${(r.usl-r.lsl).toFixed(4)} ${meta.unidad}</td></tr></table>
        <h3>RESULTADOS ESTADÍSTICOS</h3>
        <table>
          <tr><th>Parámetro</th><th>Valor</th><th>Estado</th></tr>
          <tr><td>Cp</td><td>${r.cp.toFixed(3)}</td><td>${r.cp>=1.67?"✓ EXCELENTE":r.cp>=1.33?"✓ CAPAZ":"✗ NO CAPAZ"}</td></tr>
          <tr><td>Cpk</td><td>${r.cpk.toFixed(3)}</td><td>${r.cpk>=1.67?"✓ EXCELENTE":r.cpk>=1.33?"✓ CAPAZ":"✗ NO CAPAZ"}</td></tr>
          <tr><td>Pp</td><td>${r.pp.toFixed(3)}</td><td>${r.pp>=1.67?"✓ EXCELENTE":r.pp>=1.33?"✓ CAPAZ":"✗ NO CAPAZ"}</td></tr>
          <tr><td>Ppk</td><td>${r.ppk.toFixed(3)}</td><td>${r.ppk>=1.67?"✓ EXCELENTE":r.ppk>=1.33?"✓ CAPAZ":"✗ NO CAPAZ"}</td></tr>
          ${r.cpm?`<tr><td>Cpm</td><td>${r.cpm.toFixed(3)}</td><td>-</td></tr>`:""}
          <tr><td>X̄</td><td>${r.xbar.toFixed(5)} ${meta.unidad}</td><td>-</td></tr>
          <tr><td>σ Within</td><td>${r.sigmaW.toFixed(5)}</td><td>-</td></tr>
          <tr><td>σ Overall</td><td>${r.sigmaO.toFixed(5)}</td><td>-</td></tr>
          <tr><td>Z Bench</td><td>${r.zBench.toFixed(4)}</td><td>-</td></tr>
          <tr><td>PPM Within</td><td>${r.ppmW}</td><td>-</td></tr>
          <tr><td>OOS</td><td>${r.oosI} (${(r.oosI/r.n*100).toFixed(1)}%)</td><td>${r.oosI===0?"✓ OK":"⚠ REVISAR"}</td></tr>
        </table>
        <h3>DATOS (n=${r.n})</h3>
        <table><tr><th>#</th><th>Valor (${meta.unidad})</th></tr>${rows}</table>
        <h3>CONCLUSIÓN</h3>
        <p>El proceso "${meta.proceso}" presenta Cpk = ${r.cpk.toFixed(3)}, clasificado como 
        <strong>${r.cpk>=1.67?"EXCELENTE":r.cpk>=1.33?"CAPAZ":r.cpk>=1?"MARGINAL":"NO CAPAZ"}</strong>
        bajo criterio IATF 16949 (Cpk ≥ 1.33). PPM teórico Within: ${r.ppmW}.</p>
      `
    });
    openPDF(html);
    onSaveHistory({module:"Sixpack",proceso:meta.proceso,fecha:meta.fecha,cpk:r.cpk.toFixed(3),result:r});
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:24,padding:24,height:"calc(100vh - 64px)",overflow:"auto"}}>
      {/* LEFT PANEL */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,padding:20}}>
          <SectionTitle>Identificación del Estudio</SectionTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["proceso","Proceso/Máquina"],["parte","No. de Parte"],["caracteristica","Característica"],["unidad","Unidad"],["fecha","Fecha"],["responsable","Responsable"],["cliente","Cliente"],["version","Versión"]].map(([k,l])=>(
              <div key={k} style={{gridColumn:["proceso","caracteristica","responsable"].includes(k)?"1/-1":"auto"}}>
                <Field label={l} value={meta[k]} onChange={v=>setMeta(p=>({...p,[k]:v}))} small/>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,padding:20}}>
          <SectionTitle>Especificaciones</SectionTitle>
          <div style={{display:"grid",gap:10}}>
            <Field label="LSL" value={spec.lsl} onChange={v=>setSpec(p=>({...p,lsl:v}))} type="number" unit={meta.unidad}/>
            <Field label="USL" value={spec.usl} onChange={v=>setSpec(p=>({...p,usl:v}))} type="number" unit={meta.unidad}/>
            <Field label="Target" value={spec.target} onChange={v=>setSpec(p=>({...p,target:v}))} type="number" unit={meta.unidad}/>
          </div>
        </div>
        <div style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,padding:20}}>
          <SectionTitle>Datos (separados por coma, espacio o línea)</SectionTitle>
          <textarea value={rawData} onChange={e=>setRawData(e.target.value)}
            placeholder="10.45, 10.50, 10.52..."
            style={{width:"100%",minHeight:120,background:"#0d1929",border:`1px solid ${CORP_COLORS.border}`,
              color:CORP_COLORS.text,borderRadius:6,padding:10,fontFamily:"monospace",fontSize:12,
              resize:"vertical",boxSizing:"border-box"}}/>
        </div>
        {err&&<div style={{background:"#ff1a3344",border:`1px solid ${CORP_COLORS.red}`,borderRadius:6,padding:10,fontSize:12,color:CORP_COLORS.red}}>{err}</div>}
        <button onClick={computar} style={btnStyle(CORP_COLORS.accent)}>▶ CALCULAR CAPACIDAD</button>
        {result&&<button onClick={exportPDF} style={btnStyle(CORP_COLORS.green)}>📄 EXPORTAR PDF CORPORATIVO</button>}
      </div>

      {/* RIGHT PANEL */}
      <div style={{display:"flex",flexDirection:"column",gap:16,overflowY:"auto"}}>
        {!result&&<EmptyState icon="📊" text="Ingresa especificaciones y datos, luego presiona Calcular"/>}
        {result&&<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
            <StatCard label="Cp" value={result.cp.toFixed(3)} pass={result.cp>=1.33}/>
            <StatCard label="Cpk" value={result.cpk.toFixed(3)} pass={result.cpk>=1.33}/>
            <StatCard label="Pp" value={result.pp.toFixed(3)} pass={result.pp>=1.33}/>
            <StatCard label="Ppk" value={result.ppk.toFixed(3)} pass={result.ppk>=1.33}/>
            <StatCard label="PPM Within" value={result.ppmW.toLocaleString()} pass={result.ppmW===0}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <ChartPanel title="Carta Individual (I)" height={220}>
              <ResponsiveContainer>
                <LineChart data={result.chartData} margin={{top:5,right:10,bottom:5,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f"/>
                  <XAxis dataKey="i" tick={{fill:CORP_COLORS.muted,fontSize:10}}/>
                  <YAxis tick={{fill:CORP_COLORS.muted,fontSize:10}} domain={["auto","auto"]}/>
                  <Tooltip contentStyle={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,fontSize:11}}/>
                  <ReferenceLine y={result.iUCL} stroke={CORP_COLORS.red} strokeDasharray="4 3" label={{value:"UCL",fill:CORP_COLORS.red,fontSize:10}}/>
                  <ReferenceLine y={result.xbar} stroke={CORP_COLORS.green} strokeDasharray="2 2"/>
                  <ReferenceLine y={result.iLCL} stroke={CORP_COLORS.red} strokeDasharray="4 3" label={{value:"LCL",fill:CORP_COLORS.red,fontSize:10}}/>
                  <Line type="monotone" dataKey="v" stroke={CORP_COLORS.accent} strokeWidth={1.5} dot={{r:3,fill:CORP_COLORS.accent}}/>
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>
            <ChartPanel title="Carta Rango Móvil (MR)" height={220}>
              <ResponsiveContainer>
                <LineChart data={result.chartData.slice(1)} margin={{top:5,right:10,bottom:5,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f"/>
                  <XAxis dataKey="i" tick={{fill:CORP_COLORS.muted,fontSize:10}}/>
                  <YAxis tick={{fill:CORP_COLORS.muted,fontSize:10}}/>
                  <Tooltip contentStyle={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,fontSize:11}}/>
                  <ReferenceLine y={result.mrUCL} stroke={CORP_COLORS.red} strokeDasharray="4 3" label={{value:"UCL",fill:CORP_COLORS.red,fontSize:10}}/>
                  <ReferenceLine y={result.MRbar} stroke={CORP_COLORS.green} strokeDasharray="2 2"/>
                  <Line type="monotone" dataKey="mr" stroke={CORP_COLORS.yellow} strokeWidth={1.5} dot={{r:3,fill:CORP_COLORS.yellow}}/>
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>
          <div style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,padding:16}}>
            <SectionTitle>Estadísticos Descriptivos</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {[["n",result.n],["X̄",result.xbar.toFixed(5)],["σ Within",result.sigmaW.toFixed(5)],["σ Overall",result.sigmaO.toFixed(5)],
                ["Mín",result.min.toFixed(4)],["Máx",result.max.toFixed(4)],["Rango",(result.max-result.min).toFixed(4)],["OOS",`${result.oosI} (${(result.oosI/result.n*100).toFixed(1)}%)`]]
                .map(([l,v])=>(
                  <div key={l} style={{background:"#0d1929",borderRadius:6,padding:"10px 14px"}}>
                    <div style={{fontSize:10,color:CORP_COLORS.muted,fontFamily:"monospace"}}>{l}</div>
                    <div style={{fontSize:16,fontWeight:700,color:CORP_COLORS.text,fontFamily:"monospace"}}>{v}</div>
                  </div>
              ))}
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODULE 2 – ATTRIBUTE GAGE R&R
───────────────────────────────────────────── */
function GRRModule({onSaveHistory}) {
  const [meta,setMeta]=useState({proceso:"",parte:"",caracteristica:"",fecha:new Date().toLocaleDateString("es-MX"),responsable:"",cliente:"",version:"Rev.1"});
  const [config,setConfig]=useState({partes:"10",operadores:"3",replicas:"2"});
  const [tableData,setTableData]=useState({});
  const [result,setResult]=useState(null);
  const [err,setErr]=useState("");

  const np=parseInt(config.partes)||10,nop=parseInt(config.operadores)||3,nr=parseInt(config.replicas)||2;
  const opLabels=["Op A","Op B","Op C","Op D"].slice(0,nop);

  const setCell=(p,o,r,v)=>{
    setTableData(prev=>{const n={...prev};if(!n[p])n[p]={};if(!n[p][o])n[p][o]={};n[p][o][r]=v;return n;});
  };

  const computar=()=>{
    setErr("");
    let agree=0,total=0;
    const opAgreement={};
    for(let o=0;o<nop;o++){opAgreement[o]={agree:0,total:0};}

    for(let p=0;p<np;p++){
      const votes=[];
      for(let o=0;o<nop;o++){
        for(let r=0;r<nr;r++){
          const v=(tableData[p]?.[o]?.[r])||"";
          votes.push({op:o,rep:r,v:v.toUpperCase().trim()});
        }
      }
      // Within operator consistency
      for(let o=0;o<nop;o++){
        const opVotes=votes.filter(x=>x.op===o).map(x=>x.v);
        const allSame=opVotes.every(v=>v===opVotes[0]);
        opAgreement[o].total++;
        if(allSame)opAgreement[o].agree++;
      }
      // All-operator agreement
      const allVotes=votes.map(x=>x.v);
      const consensusVal=allVotes[0];
      const allMatch=allVotes.every(v=>v===consensusVal);
      total++;
      if(allMatch)agree++;
    }

    const overallPct=(agree/total*100);
    const opPcts=opLabels.map((_,i)=>(opAgreement[i].agree/opAgreement[i].total*100));
    const kappa=(overallPct/100-.5)/.5; // simplified
    setResult({agree,total,overallPct,opPcts,kappa,opAgreement});
  };

  const exportPDF=()=>{
    if(!result)return;
    const html=pdfTemplate({
      title:"ATTRIBUTE GAGE R&R — MSA ANÁLISIS",
      ref:`GRR-${Date.now()}`,
      meta,
      body:`
        <h3>CONFIGURACIÓN</h3>
        <table>
          <tr><td>Partes</td><td>${np}</td><td>Operadores</td><td>${nop}</td><td>Réplicas</td><td>${nr}</td></tr>
        </table>
        <h3>RESULTADOS</h3>
        <table>
          <tr><th>Métrica</th><th>Valor</th><th>Estado</th></tr>
          <tr><td>% Acuerdo Total</td><td>${result.overallPct.toFixed(1)}%</td><td>${result.overallPct>=90?"✓ ACEPTABLE":"✗ NO ACEPTABLE"}</td></tr>
          ${result.opPcts.map((p,i)=>`<tr><td>% Acuerdo ${opLabels[i]}</td><td>${p.toFixed(1)}%</td><td>${p>=90?"✓":"✗"}</td></tr>`).join("")}
          <tr><td>Kappa (aprox)</td><td>${result.kappa.toFixed(3)}</td><td>${result.kappa>=.75?"✓ ACEPTABLE":result.kappa>=.4?"⚠ MARGINAL":"✗ DEFICIENTE"}</td></tr>
        </table>
        <h3>CONCLUSIÓN</h3>
        <p>El sistema de medición para "${meta.caracteristica}" presenta un acuerdo global del ${result.overallPct.toFixed(1)}%.
        El sistema se clasifica como <strong>${result.overallPct>=90?"ACEPTABLE":"NO ACEPTABLE"}</strong> bajo criterios MSA (≥90%).</p>
      `
    });
    openPDF(html);
    onSaveHistory({module:"Gage R&R",proceso:meta.proceso,fecha:meta.fecha,acuerdo:`${result.overallPct.toFixed(1)}%`});
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:24,padding:24,height:"calc(100vh - 64px)",overflow:"auto"}}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,padding:20}}>
          <SectionTitle>Identificación</SectionTitle>
          <div style={{display:"grid",gap:10}}>
            {[["proceso","Proceso"],["parte","No. Parte"],["caracteristica","Característica Crítica"],["fecha","Fecha"],["responsable","Responsable"],["cliente","Cliente"],["version","Versión"]]
              .map(([k,l])=><Field key={k} label={l} value={meta[k]} onChange={v=>setMeta(p=>({...p,[k]:v}))} small/>)}
          </div>
        </div>
        <div style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,padding:20}}>
          <SectionTitle>Configuración</SectionTitle>
          <div style={{display:"grid",gap:10}}>
            <Field label="No. Partes" value={config.partes} onChange={v=>setConfig(p=>({...p,partes:v}))} type="number"/>
            <Field label="No. Operadores (máx 4)" value={config.operadores} onChange={v=>setConfig(p=>({...p,operadores:Math.min(4,parseInt(v)||1)}))} type="number"/>
            <Field label="Réplicas por operador" value={config.replicas} onChange={v=>setConfig(p=>({...p,replicas:v}))} type="number"/>
          </div>
        </div>
        {err&&<div style={{background:"#ff1a3344",border:`1px solid ${CORP_COLORS.red}`,borderRadius:6,padding:10,fontSize:12,color:CORP_COLORS.red}}>{err}</div>}
        <button onClick={computar} style={btnStyle(CORP_COLORS.accent)}>▶ CALCULAR GAGE R&R</button>
        {result&&<button onClick={exportPDF} style={btnStyle(CORP_COLORS.green)}>📄 EXPORTAR PDF</button>}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:16,overflowY:"auto"}}>
        <div style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,padding:16}}>
          <SectionTitle>Tabla de Datos — Ingresa A (Aprobado) o R (Rechazado)</SectionTitle>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:"monospace"}}>
              <thead>
                <tr>
                  <th style={thStyle}>Parte</th>
                  {opLabels.map(op=>Array.from({length:nr},(_,r)=>(
                    <th key={`${op}${r}`} style={thStyle}>{op} R{r+1}</th>
                  )))}
                </tr>
              </thead>
              <tbody>
                {Array.from({length:np},(_,p)=>(
                  <tr key={p}>
                    <td style={{...tdStyle,color:CORP_COLORS.accent,fontWeight:700}}>P{p+1}</td>
                    {opLabels.map((_,o)=>Array.from({length:nr},(_,r)=>(
                      <td key={`${o}${r}`} style={tdStyle}>
                        <input value={(tableData[p]?.[o]?.[r])||""}
                          onChange={e=>setCell(p,o,r,e.target.value)}
                          maxLength={1}
                          style={{width:36,background:"#0d1929",border:`1px solid ${CORP_COLORS.border}`,
                            color:CORP_COLORS.text,textAlign:"center",padding:"3px",borderRadius:3,
                            fontFamily:"monospace",fontSize:12,textTransform:"uppercase"}}/>
                      </td>
                    )))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {result&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            <StatCard label="% Acuerdo Global" value={`${result.overallPct.toFixed(1)}%`} pass={result.overallPct>=90}/>
            {result.opPcts.map((p,i)=>(
              <StatCard key={i} label={`% ${opLabels[i]}`} value={`${p.toFixed(1)}%`} pass={p>=90}/>
            ))}
            <StatCard label="Kappa (aprox)" value={result.kappa.toFixed(3)} pass={result.kappa>=.75} warn={result.kappa>=.4&&result.kappa<.75}/>
            <StatCard label="Subgrupos OK" value={`${result.agree}/${result.total}`}/>
          </div>
        )}

        {result&&(
          <div style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,padding:16}}>
            <SectionTitle>Criterios de Aceptación MSA</SectionTitle>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:"monospace"}}>
              <thead><tr>
                <th style={thStyle}>Nivel</th><th style={thStyle}>% Acuerdo</th><th style={thStyle}>Kappa</th><th style={thStyle}>Estado</th>
              </tr></thead>
              <tbody>
                {[["Excelente","≥ 95%","≥ 0.90","✓ PASS"],["Aceptable","≥ 90%","≥ 0.75","✓ PASS"],
                  ["Marginal","80-90%","0.40-0.75","⚠ PLAN"],["No Aceptable","< 80%","< 0.40","✗ FAIL"]]
                  .map(([n,a,k,s])=>(
                    <tr key={n}>
                      <td style={tdStyle}>{n}</td><td style={tdStyle}>{a}</td>
                      <td style={tdStyle}>{k}</td><td style={{...tdStyle,color:s.includes("✓")?CORP_COLORS.green:s.includes("⚠")?CORP_COLORS.yellow:CORP_COLORS.red}}>{s}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODULE 3 – P-CHART
───────────────────────────────────────────── */
function PChartModule({onSaveHistory}) {
  const [meta,setMeta]=useState({
    proceso:"",parte:"",caracteristica:"",fecha:new Date().toLocaleDateString("es-MX"),
    responsable:"",cliente:"",version:"Rev.1"
  });
  const [inputMode,setInputMode]=useState("manual"); // "manual" | "excel"
  const [numSubgroups,setNumSubgroups]=useState("20");
  const [rows,setRows]=useState(Array.from({length:20},(_,i)=>({id:i+1,n:"",d:""})));
  const [result,setResult]=useState(null);
  const [err,setErr]=useState("");
  const fileRef=useRef();

  const updateRows=useCallback((count)=>{
    const c=parseInt(count)||5;
    setRows(prev=>{
      const next=Array.from({length:c},(_,i)=>prev[i]||{id:i+1,n:"",d:""});
      return next;
    });
  },[]);

  const setRow=(i,field,val)=>{
    setRows(prev=>{const n=[...prev];n[i]={...n[i],[field]:val};return n;});
  };

  const handleExcel=async(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    const XLSX=await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs").catch(()=>null);
    if(!XLSX){setErr("Error cargando librería Excel.");return;}
    const ab=await file.arrayBuffer();
    const wb=XLSX.read(ab);
    const ws=wb.Sheets[wb.SheetNames[0]];
    const data=XLSX.utils.sheet_to_json(ws,{header:1});
    const parsed=data.slice(1).filter(r=>r[0]!=null).map((r,i)=>({
      id:parseInt(r[0])||i+1,
      n:String(r[1]||""),
      d:String(r[2]||""),
    }));
    setRows(parsed);
    setNumSubgroups(String(parsed.length));
  };

  // SPC Rule checks
  const checkRules=(pts,pbar)=>{
    const flags=pts.map(()=>({oc:false,run7:false,trend:false}));
    pts.forEach((p,i)=>{
      const {pi,ucl,lcl}=p;
      if(pi>ucl||pi<lcl) flags[i].oc=true;
    });
    // Run of 7 above/below mean
    for(let i=6;i<pts.length;i++){
      const seg=pts.slice(i-6,i+1);
      if(seg.every(x=>x.pi>pbar)||seg.every(x=>x.pi<pbar)){
        for(let j=i-6;j<=i;j++)flags[j].run7=true;
      }
    }
    // Trend of 6
    for(let i=5;i<pts.length;i++){
      const seg=pts.slice(i-5,i+1);
      const up=seg.every((x,j)=>j===0||x.pi>=seg[j-1].pi);
      const dn=seg.every((x,j)=>j===0||x.pi<=seg[j-1].pi);
      if(up||dn){for(let j=i-5;j<=i;j++)flags[j].trend=true;}
    }
    return flags;
  };

  const computar=()=>{
    setErr("");
    const valid=rows.filter(r=>r.n!==""&&r.d!=="");
    if(valid.length<3){setErr("Mínimo 3 subgrupos con datos completos.");return;}
    const parsed=valid.map(r=>{
      const ni=parseNum(r.n),di=parseNum(r.d);
      if(ni===null||di===null||ni<=0||di<0||di>ni){return null;}
      return {id:r.id,ni,di,pi:di/ni};
    });
    if(parsed.some(x=>x===null)){setErr("Verifica los datos: d debe ser ≤ n y n > 0.");return;}

    const totalD=parsed.reduce((a,b)=>a+b.di,0);
    const totalN=parsed.reduce((a,b)=>a+b.ni,0);
    const pbar=totalD/totalN;

    const pts=parsed.map(({id,ni,di,pi})=>{
      const sigma=Math.sqrt(pbar*(1-pbar)/ni);
      const ucl=Math.min(1,pbar+3*sigma);
      const lcl=Math.max(0,pbar-3*sigma);
      return {id,ni,di,pi,sigma,ucl,lcl};
    });

    const flags=checkRules(pts,pbar);
    const oocCount=flags.filter(f=>f.oc||f.run7||f.trend).length;
    const run7Count=flags.filter(f=>f.run7).length;
    const trendCount=flags.filter(f=>f.trend).length;

    const avgUCL=mean(pts.map(p=>p.ucl));
    const avgLCL=mean(pts.map(p=>p.lcl));
    const ppm=Math.round(pbar*1e6);

    const chartData=pts.map((p,i)=>({
      ...p,
      flag:flags[i],
      color: flags[i].oc ? CORP_COLORS.red : flags[i].run7||flags[i].trend ? CORP_COLORS.yellow : CORP_COLORS.accent
    }));

    setResult({pts,chartData,pbar,totalD,totalN,avgUCL,avgLCL,ppm,oocCount,run7Count,trendCount,flags,parsed});
  };

  const exportPDF=()=>{
    if(!result)return;
    const r=result;
    const stable=r.oocCount===0;
    const tableRows=r.pts.map((p,i)=>`
      <tr>
        <td>${p.id}</td><td>${p.ni}</td><td>${p.di}</td>
        <td>${(p.pi*100).toFixed(2)}%</td>
        <td>${(p.ucl*100).toFixed(2)}%</td>
        <td>${(p.lcl*100).toFixed(2)}%</td>
        <td style="color:${r.flags[i].oc?"red":r.flags[i].run7||r.flags[i].trend?"orange":"green"}">${r.flags[i].oc?"⚠ OOC":r.flags[i].run7?"↔ RUN7":r.flags[i].trend?"↗ TREND":"✓"}</td>
      </tr>`).join("");

    const html=pdfTemplate({
      title:"ESTUDIO DE CONTROL ESTADÍSTICO — P CHART",
      ref:`PCHART-${Date.now()}`,
      meta,
      body:`
        <h3>RESULTADOS ESTADÍSTICOS</h3>
        <table>
          <tr><th>Parámetro</th><th>Valor</th></tr>
          <tr><td>p̄ (Proporción media defectiva)</td><td>${(r.pbar*100).toFixed(4)}%</td></tr>
          <tr><td>UCL promedio</td><td>${(r.avgUCL*100).toFixed(4)}%</td></tr>
          <tr><td>LCL promedio</td><td>${(r.avgLCL*100).toFixed(4)}%</td></tr>
          <tr><td>Total defectos</td><td>${r.totalD}</td></tr>
          <tr><td>Total inspeccionado</td><td>${r.totalN}</td></tr>
          <tr><td>% Defectivo total</td><td>${(r.pbar*100).toFixed(4)}%</td></tr>
          <tr><td>PPM</td><td>${r.ppm.toLocaleString()}</td></tr>
          <tr><td>Subgrupos fuera de control</td><td>${r.oocCount}</td></tr>
          <tr><td>Regla 7 consecutivos</td><td>${r.run7Count} puntos</td></tr>
          <tr><td>Tendencia</td><td>${r.trendCount} puntos</td></tr>
        </table>
        <h3>TABLA DE DATOS POR SUBGRUPO</h3>
        <table>
          <tr><th>Subgrupo</th><th>n</th><th>d</th><th>p_i (%)</th><th>UCL (%)</th><th>LCL (%)</th><th>Estado</th></tr>
          ${tableRows}
        </table>
        <h3>CRITERIOS SPC APLICADOS</h3>
        <table>
          <tr><th>Regla</th><th>Descripción</th><th>Resultado</th></tr>
          <tr><td>Regla 1</td><td>Punto fuera de límites ±3σ</td><td>${r.flags.some(f=>f.oc)?"⚠ DETECTADO":"✓ OK"}</td></tr>
          <tr><td>Regla 2</td><td>7 puntos consecutivos arriba/abajo de p̄</td><td>${r.flags.some(f=>f.run7)?"⚠ DETECTADO":"✓ OK"}</td></tr>
          <tr><td>Regla 3</td><td>Tendencia de 6 puntos consecutivos</td><td>${r.flags.some(f=>f.trend)?"⚠ DETECTADO":"✓ OK"}</td></tr>
        </table>
        <h3>CONCLUSIÓN AUTOMÁTICA</h3>
        <p>El proceso <strong>"${meta.proceso}"</strong> para la característica <strong>"${meta.caracteristica}"</strong> 
        presenta una proporción promedio defectiva de <strong>${(r.pbar*100).toFixed(4)}%</strong> 
        (${r.ppm.toLocaleString()} PPM). Se detectaron <strong>${r.oocCount} subgrupos</strong> con señales de falta de control.
        El proceso se clasifica como <strong>${stable?"ESTABLE":"INESTABLE"}</strong> bajo criterios SPC.</p>
        <p>${stable
          ? "Recomendación: Mantener condiciones actuales y continuar monitoreo periódico."
          : "Recomendación: Investigar causas asignables en subgrupos fuera de control. Implementar acciones correctivas antes de continuar producción."
        }</p>
      `
    });
    openPDF(html);
    onSaveHistory({module:"P-Chart",proceso:meta.proceso,fecha:meta.fecha,pbar:`${(result.pbar*100).toFixed(2)}%`,ooc:result.oocCount});
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:24,padding:24,height:"calc(100vh - 64px)",overflow:"auto"}}>
      {/* LEFT */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,padding:20}}>
          <SectionTitle>Identificación del Estudio</SectionTitle>
          <div style={{display:"grid",gap:10}}>
            {[["proceso","Proceso/Máquina"],["parte","No. de Parte"],["caracteristica","Característica"],["fecha","Fecha"],["responsable","Responsable"],["cliente","Cliente"],["version","Versión"]]
              .map(([k,l])=><Field key={k} label={l} value={meta[k]} onChange={v=>setMeta(p=>({...p,[k]:v}))} small/>)}
          </div>
        </div>

        <div style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,padding:20}}>
          <SectionTitle>Fuente de Datos</SectionTitle>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {["manual","excel"].map(m=>(
              <button key={m} onClick={()=>setInputMode(m)} style={{
                flex:1,padding:"8px",borderRadius:6,cursor:"pointer",fontFamily:"monospace",fontSize:12,fontWeight:700,
                background: inputMode===m ? CORP_COLORS.accent : "#0d1929",
                color: inputMode===m ? "#000" : CORP_COLORS.muted,
                border:`1px solid ${inputMode===m?CORP_COLORS.accent:CORP_COLORS.border}`
              }}>{m==="manual"?"✏️ Manual":"📂 Excel"}</button>
            ))}
          </div>
          {inputMode==="excel"?(
            <div>
              <div style={{fontSize:11,color:CORP_COLORS.muted,marginBottom:8,fontFamily:"monospace"}}>
                Formato: Col A=Subgrupo, B=Total n, C=Defectos d
              </div>
              <button onClick={()=>fileRef.current.click()} style={{...btnStyle(CORP_COLORS.yellow),fontSize:12}}>
                📂 Seleccionar archivo Excel
              </button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleExcel} style={{display:"none"}}/>
            </div>
          ):(
            <Field label="Número de subgrupos" value={numSubgroups}
              onChange={v=>{setNumSubgroups(v);updateRows(v);}} type="number"/>
          )}
        </div>

        {err&&<div style={{background:"#ff1a3344",border:`1px solid ${CORP_COLORS.red}`,borderRadius:6,padding:10,fontSize:12,color:CORP_COLORS.red}}>{err}</div>}
        <button onClick={computar} style={btnStyle(CORP_COLORS.accent)}>▶ GENERAR P-CHART</button>
        {result&&<button onClick={exportPDF} style={btnStyle(CORP_COLORS.green)}>📄 EXPORTAR PDF CORPORATIVO</button>}

        {/* Formula reference */}
        <div style={{background:"#0d1929",border:`1px solid ${CORP_COLORS.border}`,borderRadius:8,padding:14,fontSize:11,fontFamily:"monospace",color:CORP_COLORS.muted}}>
          <div style={{color:CORP_COLORS.accent,marginBottom:6,fontSize:10,letterSpacing:1}}>FÓRMULAS P-CHART</div>
          <div>p̄ = Σd / Σn</div>
          <div>σᵢ = √[p̄(1-p̄)/nᵢ]</div>
          <div>UCL = p̄ + 3σᵢ</div>
          <div>LCL = max(0, p̄ - 3σᵢ)</div>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{display:"flex",flexDirection:"column",gap:16,overflowY:"auto"}}>
        {/* Data Table */}
        <div style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,padding:16}}>
          <SectionTitle>Tabla de Datos por Subgrupo</SectionTitle>
          <div style={{overflowX:"auto",maxHeight:280,overflowY:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:"monospace"}}>
              <thead style={{position:"sticky",top:0,background:CORP_COLORS.card,zIndex:1}}>
                <tr>
                  <th style={thStyle}>Subgrupo</th>
                  <th style={thStyle}>n (Total)</th>
                  <th style={thStyle}>d (Defectos)</th>
                  <th style={thStyle}>pᵢ = d/n</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row,i)=>{
                  const pi=row.n&&row.d?(parseNum(row.d)/parseNum(row.n)):null;
                  return(
                    <tr key={row.id}>
                      <td style={{...tdStyle,color:CORP_COLORS.accent,fontWeight:700}}>{row.id}</td>
                      <td style={tdStyle}>
                        <input value={row.n} onChange={e=>setRow(i,"n",e.target.value)} type="number"
                          style={{width:70,background:"#0d1929",border:`1px solid ${CORP_COLORS.border}`,
                            color:CORP_COLORS.text,padding:"3px 6px",borderRadius:3,fontFamily:"monospace",fontSize:12}}/>
                      </td>
                      <td style={tdStyle}>
                        <input value={row.d} onChange={e=>setRow(i,"d",e.target.value)} type="number"
                          style={{width:70,background:"#0d1929",border:`1px solid ${CORP_COLORS.border}`,
                            color:CORP_COLORS.text,padding:"3px 6px",borderRadius:3,fontFamily:"monospace",fontSize:12}}/>
                      </td>
                      <td style={{...tdStyle,color:pi!==null?(pi>0?CORP_COLORS.yellow:CORP_COLORS.green):CORP_COLORS.muted}}>
                        {pi!==null?(pi*100).toFixed(2)+"%":"—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {!result&&<EmptyState icon="📉" text="Ingresa los datos por subgrupo y presiona Generar P-Chart"/>}

        {result&&<>
          {/* KPI Cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            <StatCard label="p̄ (Prop. media)" value={`${(result.pbar*100).toFixed(3)}%`}/>
            <StatCard label="% Defectivo total" value={`${(result.pbar*100).toFixed(3)}%`} pass={result.pbar<0.05}/>
            <StatCard label="PPM" value={result.ppm.toLocaleString()} pass={result.ppm<1000}/>
            <StatCard label="Subgrupos OOC" value={result.oocCount} pass={result.oocCount===0}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            <StatCard label="UCL promedio" value={`${(result.avgUCL*100).toFixed(3)}%`}/>
            <StatCard label="LCL promedio" value={`${(result.avgLCL*100).toFixed(3)}%`}/>
            <StatCard label="Total defectos" value={result.totalD.toLocaleString()}/>
            <StatCard label="Total inspeccionado" value={result.totalN.toLocaleString()}/>
          </div>

          {/* P-CHART GRAPH */}
          <div style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,padding:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <SectionTitle>P-Chart — Proporción Defectiva por Subgrupo</SectionTitle>
              <div style={{display:"flex",gap:16,fontSize:11,fontFamily:"monospace"}}>
                <span style={{color:CORP_COLORS.accent}}>● Normal</span>
                <span style={{color:CORP_COLORS.red}}>● OOC (±3σ)</span>
                <span style={{color:CORP_COLORS.yellow}}>● Regla Run/Trend</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={result.chartData} margin={{top:10,right:20,bottom:20,left:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f55"/>
                <XAxis dataKey="id" label={{value:"Subgrupo",position:"insideBottom",offset:-10,fill:CORP_COLORS.muted,fontSize:11}} tick={{fill:CORP_COLORS.muted,fontSize:10}}/>
                <YAxis tickFormatter={v=>`${(v*100).toFixed(1)}%`} tick={{fill:CORP_COLORS.muted,fontSize:10}}
                  label={{value:"Proporción defectiva",angle:-90,position:"insideLeft",fill:CORP_COLORS.muted,fontSize:11}}/>
                <Tooltip
                  contentStyle={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,fontSize:11,fontFamily:"monospace"}}
                  formatter={(v,n)=>[`${(v*100).toFixed(4)}%`,n]}
                  labelFormatter={l=>`Subgrupo ${l}`}/>
                {/* UCL line */}
                <Line type="monotone" dataKey="ucl" stroke={CORP_COLORS.red} strokeDasharray="6 3" strokeWidth={1.5}
                  dot={false} name="UCL"/>
                {/* LCL line */}
                <Line type="monotone" dataKey="lcl" stroke={CORP_COLORS.red} strokeDasharray="6 3" strokeWidth={1.5}
                  dot={false} name="LCL"/>
                {/* p-bar */}
                <ReferenceLine y={result.pbar} stroke={CORP_COLORS.green} strokeDasharray="4 2" strokeWidth={1.5}
                  label={{value:`p̄=${(result.pbar*100).toFixed(3)}%`,position:"right",fill:CORP_COLORS.green,fontSize:10}}/>
                {/* Actual data */}
                <Line type="monotone" dataKey="pi" stroke={CORP_COLORS.accent} strokeWidth={1.5}
                  dot={(props)=>{
                    const {cx,cy,payload}=props;
                    const col=payload.flag.oc ? CORP_COLORS.red :
                              (payload.flag.run7||payload.flag.trend) ? CORP_COLORS.yellow : CORP_COLORS.accent;
                    return <circle key={payload.id} cx={cx} cy={cy} r={5} fill={col} stroke={col=== CORP_COLORS.accent?"#0d1929":"#000"} strokeWidth={1.5}/>;
                  }}
                  name="pᵢ"/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* SPC Rules summary */}
          <div style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,padding:16}}>
            <SectionTitle>Verificación de Reglas SPC</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {[
                {label:"Regla 1 – Punto fuera ±3σ",icon:"🔴",count:result.flags.filter(f=>f.oc).length,pass:!result.flags.some(f=>f.oc)},
                {label:"Regla 2 – 7 consecutivos",icon:"🟡",count:result.flags.filter(f=>f.run7).length,pass:!result.flags.some(f=>f.run7)},
                {label:"Regla 3 – Tendencia 6 pts",icon:"🟠",count:result.flags.filter(f=>f.trend).length,pass:!result.flags.some(f=>f.trend)},
              ].map(({label,icon,count,pass})=>(
                <div key={label} style={{background:"#0d1929",border:`1px solid ${pass?CORP_COLORS.green+"44":CORP_COLORS.red+"44"}`,borderRadius:8,padding:"12px 16px"}}>
                  <div style={{fontSize:11,color:CORP_COLORS.muted,fontFamily:"monospace",marginBottom:4}}>{label}</div>
                  <div style={{fontSize:20,fontWeight:700,color:pass?CORP_COLORS.green:CORP_COLORS.red,fontFamily:"monospace"}}>
                    {icon} {count} {count===1?"punto":"puntos"}
                  </div>
                  <div style={{fontSize:10,color:pass?CORP_COLORS.green:CORP_COLORS.red,marginTop:4}}>{pass?"✓ NO DETECTADO":"⚠ DETECTADO"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Conclusion */}
          <div style={{background: result.oocCount===0 ? "#00e5a011" : "#ff3b5c11",
            border:`1px solid ${result.oocCount===0?CORP_COLORS.green:CORP_COLORS.red}44`,
            borderRadius:10,padding:20}}>
            <div style={{fontSize:11,color:CORP_COLORS.muted,fontFamily:"monospace",letterSpacing:2,marginBottom:8}}>CONCLUSIÓN AUTOMÁTICA</div>
            <div style={{fontSize:14,color:CORP_COLORS.text,lineHeight:1.7}}>
              El proceso <strong style={{color:CORP_COLORS.accentGlow}}>{meta.proceso||"analizado"}</strong> presenta una 
              proporción promedio defectiva de <strong style={{color:CORP_COLORS.yellow}}>{(result.pbar*100).toFixed(4)}%</strong> ({result.ppm.toLocaleString()} PPM). 
              Se detectaron <strong style={{color:result.oocCount>0?CORP_COLORS.red:CORP_COLORS.green}}>{result.oocCount} subgrupos</strong> con señales de falta de control. 
              El proceso se clasifica como{" "}
              <strong style={{fontSize:16,color:result.oocCount===0?CORP_COLORS.green:CORP_COLORS.red}}>
                {result.oocCount===0?"✓ ESTABLE":"✗ INESTABLE"}
              </strong> bajo criterios SPC.
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HISTORY PANEL
───────────────────────────────────────────── */
function HistoryPanel({history,onClose}) {
  return (
    <div style={{position:"fixed",top:64,right:0,bottom:0,width:360,background:"#0a0f1e",
      borderLeft:`1px solid ${CORP_COLORS.border}`,zIndex:100,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"16px 20px",borderBottom:`1px solid ${CORP_COLORS.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontFamily:"monospace",color:CORP_COLORS.accentGlow,fontSize:13,fontWeight:700}}>📁 HISTORIAL</span>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:CORP_COLORS.muted,cursor:"pointer",fontSize:18}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10}}>
        {history.length===0&&<div style={{color:CORP_COLORS.muted,fontFamily:"monospace",fontSize:12,textAlign:"center",marginTop:40}}>Sin estudios guardados</div>}
        {[...history].reverse().map((h,i)=>(
          <div key={i} style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:8,padding:14}}>
            <div style={{fontSize:10,color:CORP_COLORS.accent,fontFamily:"monospace",marginBottom:4}}>{h.module}</div>
            <div style={{fontSize:13,color:CORP_COLORS.text,fontFamily:"monospace",fontWeight:700}}>{h.proceso||"—"}</div>
            <div style={{fontSize:11,color:CORP_COLORS.muted,marginTop:4}}>
              {h.fecha} {h.cpk&&`· Cpk: ${h.cpk}`}{h.acuerdo&&`· Acuerdo: ${h.acuerdo}`}{h.pbar&&`· p̄: ${h.pbar}`}
              {h.ooc!==undefined&&` · OOC: ${h.ooc}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARED SMALL COMPONENTS
───────────────────────────────────────────── */
function EmptyState({icon,text}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,
      padding:60,gap:16}}>
      <div style={{fontSize:48}}>{icon}</div>
      <div style={{color:CORP_COLORS.muted,fontFamily:"monospace",fontSize:13,textAlign:"center"}}>{text}</div>
    </div>
  );
}

function ChartPanel({title,height=250,children}) {
  return (
    <div style={{background:CORP_COLORS.card,border:`1px solid ${CORP_COLORS.border}`,borderRadius:10,padding:16}}>
      <div style={{fontSize:11,color:CORP_COLORS.accent,fontFamily:"monospace",marginBottom:12}}>{title}</div>
      <div style={{height}}>{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STYLE HELPERS
───────────────────────────────────────────── */
const btnStyle=(col)=>({
  background:`${col}22`,border:`1px solid ${col}`,color:col,borderRadius:8,
  padding:"12px 0",width:"100%",cursor:"pointer",fontFamily:"monospace",
  fontSize:13,fontWeight:700,letterSpacing:1,transition:"all .2s",
});
const thStyle={background:"#0d1929",color:CORP_COLORS.accent,padding:"8px 12px",
  textAlign:"left",fontSize:11,fontFamily:"monospace",letterSpacing:.5,borderBottom:`1px solid ${CORP_COLORS.border}`};
const tdStyle={color:CORP_COLORS.text,padding:"6px 12px",fontSize:12,fontFamily:"monospace",
  borderBottom:`1px solid ${CORP_COLORS.border}22`};

/* ─────────────────────────────────────────────
   PDF TEMPLATE
───────────────────────────────────────────── */
function pdfTemplate({title,ref,meta,body}) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a2e;margin:0;padding:0}
  .header{background:#0a0f1e;color:white;padding:12px 24px;display:flex;justify-content:space-between;align-items:center}
  .logo{font-weight:900;font-size:16px;letter-spacing:2px;color:#00a8e8}
  .logo-sub{font-size:9px;color:#64748b;letter-spacing:1px}
  .iatf{font-size:9px;color:#00a8e8;text-align:right}
  .title-bar{background:#111827;border-bottom:2px solid #00a8e8;padding:10px 24px}
  .title-bar h1{margin:0;font-size:14px;color:#00d4ff;letter-spacing:1px}
  .title-bar .ref{font-size:9px;color:#64748b;margin-top:2px}
  .content{padding:20px 24px}
  .meta-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0}
  .meta-item label{display:block;font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
  .meta-item span{font-weight:700;font-size:11px;color:#1e3a5f}
  h3{font-size:11px;color:#00a8e8;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-top:16px}
  table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:10px}
  th{background:#0a0f1e;color:#00a8e8;padding:6px 10px;text-align:left;font-size:10px;letter-spacing:.5px}
  td{padding:5px 10px;border-bottom:1px solid #e2e8f0;color:#1a1a2e}
  tr:nth-child(even) td{background:#f8fafc}
  .footer{position:fixed;bottom:0;left:0;right:0;background:#0a0f1e;color:#64748b;font-size:8px;padding:6px 24px;display:flex;justify-content:space-between}
  .sign-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:24px}
  .sign-box{border-top:1px solid #0a0f1e;padding-top:8px;font-size:9px;color:#64748b}
  .sign-box strong{display:block;margin-bottom:16px;color:#1a1a2e;font-size:10px}
  p{line-height:1.6;font-size:11px}
</style></head><body>
<div class="header">
  <div><div class="logo">STATPRO</div><div class="logo-sub">INDUSTRIAL v3.0 · Quality Analytics Platform</div></div>
  <div class="iatf">IATF 16949<br>Ref: ${ref}<br>${new Date().toLocaleDateString("es-MX")}</div>
</div>
<div class="title-bar">
  <h1>${title}</h1>
  <div class="ref">Referencia: ${ref}</div>
</div>
<div class="content">
  <div class="meta-grid">
    ${[["Proceso/Máquina",meta.proceso],["No. de Parte",meta.parte],["Característica",meta.caracteristica],["Versión",meta.version],
      ["Fecha",meta.fecha],["Responsable",meta.responsable],["Cliente",meta.cliente]]
      .map(([l,v])=>`<div class="meta-item"><label>${l}</label><span>${v||"—"}</span></div>`).join("")}
  </div>
  ${body}
  <div class="sign-grid">
    <div class="sign-box"><strong>ELABORÓ</strong>${meta.responsable||"___________"}<br>Firma / Fecha</div>
    <div class="sign-box"><strong>REVISÓ</strong>___________<br>Firma / Fecha</div>
    <div class="sign-box"><strong>AUTORIZÓ</strong>___________<br>Firma / Fecha</div>
  </div>
</div>
<div class="footer">
  <span>Generado por StatPro Industrial v3.0 · Ref: ${ref}</span>
  <span>Documento de referencia · Requiere firma física para auditoría</span>
</div>
</body></html>`;
}

function openPDF(html) {
  const blob=new Blob([html],{type:"text/html"});
  const url=URL.createObjectURL(blob);
  const w=window.open(url,"_blank");
  if(w)setTimeout(()=>w.print(),800);
}

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */
export default function App() {
  const [activeModule,setActiveModule]=useState("pchart");
  const [history,setHistory]=useState([]);
  const [showHistory,setShowHistory]=useState(false);

  const saveHistory=useCallback((entry)=>{
    setHistory(prev=>[...prev,{...entry,ts:Date.now()}]);
  },[]);

  return (
    <div style={{background:CORP_COLORS.bg,minHeight:"100vh",color:CORP_COLORS.text,fontFamily:"system-ui,sans-serif"}}>
      <TopNav active={activeModule} setActive={setActiveModule} history={history}/>

      {/* History toggle */}
      <button onClick={()=>setShowHistory(p=>!p)}
        style={{position:"fixed",top:72,right:16,zIndex:200,background:CORP_COLORS.card,
          border:`1px solid ${CORP_COLORS.border}`,color:CORP_COLORS.muted,borderRadius:6,
          padding:"6px 14px",cursor:"pointer",fontSize:11,fontFamily:"monospace"}}>
        📁 Historial
      </button>

      {showHistory&&<HistoryPanel history={history} onClose={()=>setShowHistory(false)}/>}

      <main style={{marginRight:showHistory?360:0,transition:"margin .2s"}}>
        {activeModule==="sixpack" && <SixpackModule onSaveHistory={saveHistory}/>}
        {activeModule==="grr"     && <GRRModule     onSaveHistory={saveHistory}/>}
        {activeModule==="pchart"  && <PChartModule  onSaveHistory={saveHistory}/>}
      </main>
    </div>
  );
}
