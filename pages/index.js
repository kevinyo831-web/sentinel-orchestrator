import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   SENTINEL ORCHESTRATOR v4
   Cyberpunk UI · Markdown Rendering · NIM/Vertex Enhanced
   ═══════════════════════════════════════════════════════════════ */

const C = {
  bg:"#07080C", panel:"#0C0D12", surface:"#10111A",
  border:"#1A1C28", border2:"#252838",
  accent:"#00E5A0", accent2:"#00B8D4",
  dim:"#2A2D3A", text:"#C0C4D8", text2:"#6B7094", text3:"#3E4260",
  white:"#E8EAF0", warn:"#FF3D5A",
  glow:"0 0 12px rgba(0,229,160,.15)",
  codeBg:"#0A0C14", codeText:"#A8D8A0",
};

const P = {
  gemini:{ name:"GEMINI PRO", tag:"GEM" }, grok:{ name:"GROK", tag:"GRK" },
  perplexity:{ name:"PERPLEXITY", tag:"PPX" },
  openai:{ name:"OPENAI", tag:"OAI" }, nvidia:{ name:"NVIDIA NIM", tag:"NIM" },
  vertex:{ name:"VERTEX AI", tag:"VTX" }, local:{ name:"LOCAL LLM", tag:"LCL" },
};

const MODES = [
  { id:"quick", name:"QUICK", providers:["gemini","nvidia"], enhancer:"nvidia" },
  { id:"predict", name:"PREDICT", providers:["gemini","nvidia","perplexity"], enhancer:"nvidia" },
  { id:"deep", name:"RESEARCH", providers:["gemini","grok","perplexity","openai","nvidia","vertex"], enhancer:"nvidia" },
  { id:"debate", name:"DEBATE", providers:["grok","openai","nvidia","gemini","vertex"], enhancer:"vertex",
    teams:{ pro:{l:"PROPOSITION",m:["grok"],r:"openai"}, con:{l:"OPPOSITION",m:["nvidia","gemini"]}, judge:{l:"VERDICT",m:["vertex"]} } },
];

// ═══ MARKDOWN PARSER ═══
function parseMd(src) {
  if (!src) return [];
  const lines = src.split("\n");
  const tokens = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      tokens.push({ type: "code", lang, content: codeLines.join("\n") });
      i++; continue;
    }
    // Heading
    const hm = line.match(/^(#{1,3})\s+(.+)/);
    if (hm) { tokens.push({ type: "heading", level: hm[1].length, content: hm[2] }); i++; continue; }
    // HR
    if (/^---+$/.test(line.trim())) { tokens.push({ type: "hr" }); i++; continue; }
    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s+/, "")); i++; }
      tokens.push({ type: "ul", items }); continue;
    }
    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, "")); i++; }
      tokens.push({ type: "ol", items }); continue;
    }
    // Blockquote
    if (line.startsWith("> ")) {
      const qlines = [];
      while (i < lines.length && lines[i].startsWith("> ")) { qlines.push(lines[i].slice(2)); i++; }
      tokens.push({ type: "blockquote", content: qlines.join("\n") }); continue;
    }
    // Empty line
    if (line.trim() === "") { tokens.push({ type: "break" }); i++; continue; }
    // Paragraph
    tokens.push({ type: "p", content: line });
    i++;
  }
  return tokens;
}

// Inline markdown: **bold**, `code`, *italic*, [link](url)
function InlineText({ text }) {
  const parts = [];
  let remaining = text;
  let key = 0;
  const regex = /(\*\*(.+?)\*\*)|(`([^`]+)`)|(\*(.+?)\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(remaining)) !== null) {
    if (match.index > lastIndex) parts.push(<span key={key++}>{remaining.slice(lastIndex, match.index)}</span>);
    if (match[1]) parts.push(<strong key={key++} style={{ color: C.white, fontWeight: 600 }}>{match[2]}</strong>);
    else if (match[3]) parts.push(<code key={key++} style={{ background: C.codeBg, color: C.codeText, padding: "1px 5px", borderRadius: 3, fontSize: "0.9em", fontFamily: "'Share Tech Mono',monospace", border: `1px solid ${C.border}` }}>{match[4]}</code>);
    else if (match[5]) parts.push(<em key={key++} style={{ color: C.accent2, fontStyle: "italic" }}>{match[6]}</em>);
    else if (match[7]) parts.push(<a key={key++} href={match[9]} target="_blank" rel="noreferrer" style={{ color: C.accent, textDecoration: "underline", textUnderlineOffset: 2 }}>{match[8]}</a>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < remaining.length) parts.push(<span key={key++}>{remaining.slice(lastIndex)}</span>);
  return <>{parts}</>;
}

function MdRender({ source }) {
  const tokens = useMemo(() => parseMd(source), [source]);
  return (
    <div className="md-body">
      {tokens.map((t, i) => {
        if (t.type === "heading") {
          const sizes = { 1: 16, 2: 14.5, 3: 13.5 };
          return <div key={i} style={{ fontSize: sizes[t.level], fontWeight: 700, color: C.white, margin: "14px 0 6px", fontFamily: "'Orbitron','Noto Sans TC',sans-serif", letterSpacing: ".03em", borderBottom: t.level === 1 ? `1px solid ${C.border}` : "none", paddingBottom: t.level === 1 ? 6 : 0 }}><InlineText text={t.content} /></div>;
        }
        if (t.type === "code") {
          return (
            <div key={i} style={{ margin: "8px 0", borderRadius: 4, overflow: "hidden", border: `1px solid ${C.border}` }}>
              {t.lang && <div style={{ background: C.border, padding: "3px 10px", fontSize: 10, color: C.text3, letterSpacing: ".08em", fontFamily: "'Share Tech Mono',monospace" }}>{t.lang.toUpperCase()}</div>}
              <pre style={{ background: C.codeBg, padding: "10px 12px", margin: 0, overflowX: "auto", fontSize: 12.5, lineHeight: 1.7, color: C.codeText, fontFamily: "'Share Tech Mono',monospace" }}><code>{t.content}</code></pre>
            </div>
          );
        }
        if (t.type === "ul") return <ul key={i} style={{ margin: "6px 0", paddingLeft: 20 }}>{t.items.map((item, j) => <li key={j} style={{ marginBottom: 3, lineHeight: 1.8, color: C.text, listStyleType: "none", position: "relative", paddingLeft: 12 }}><span style={{ position: "absolute", left: 0, top: 10, width: 4, height: 4, background: C.accent, borderRadius: 1 }} /><InlineText text={item} /></li>)}</ul>;
        if (t.type === "ol") return <ol key={i} style={{ margin: "6px 0", paddingLeft: 8, counterReset: "ol-counter" }}>{t.items.map((item, j) => <li key={j} style={{ marginBottom: 3, lineHeight: 1.8, color: C.text, listStyleType: "none", display: "flex", gap: 8 }}><span style={{ color: C.accent, fontWeight: 700, fontFamily: "'Share Tech Mono',monospace", fontSize: 12, minWidth: 16, flexShrink: 0 }}>{j + 1}.</span><span><InlineText text={item} /></span></li>)}</ol>;
        if (t.type === "blockquote") return <div key={i} style={{ borderLeft: `2px solid ${C.accent}40`, paddingLeft: 12, margin: "8px 0", color: C.text2, fontStyle: "italic", lineHeight: 1.8 }}><InlineText text={t.content} /></div>;
        if (t.type === "hr") return <hr key={i} style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "10px 0" }} />;
        if (t.type === "break") return <div key={i} style={{ height: 6 }} />;
        if (t.type === "p") return <p key={i} style={{ margin: "4px 0", lineHeight: 1.85, color: C.text }}><InlineText text={t.content} /></p>;
        return null;
      })}
    </div>
  );
}

// ═══ RICH RESPONSE GENERATORS (Markdown — Claude-length) ═══

const genEnhanced = (enhancer, q, srcPvs) => {
  const names = srcPvs.map(p => P[p]?.tag).join(" + ");
  if (enhancer === "vertex") {
    return `# VERTEX AI // FINAL VERDICT

綜合 **${names}** 全部論述，完成語義交叉驗證與邏輯一致性檢查。以下是最終裁定報告。

---

### 交叉驗證摘要

| 指標 | 數值 | 評級 |
|------|------|------|
| 共識率 | ${(78+Math.random()*18).toFixed(1)}% | HIGH |
| 分歧點 | ${1+Math.floor(Math.random()*3)} 處 | MANAGEABLE |
| 論證品質 | ${(8+Math.random()*1.5).toFixed(1)}/10 | STRONG |
| 交叉驗證通過 | ${srcPvs.length}/${srcPvs.length} 引擎 | COMPLETE |
| 邏輯一致性 | ${(85+Math.random()*12).toFixed(1)}% | HIGH |
| 盲區覆蓋率 | ${(90+Math.random()*8).toFixed(1)}% | EXCELLENT |

### 共識向量分析

對所有引擎的輸出進行語義嵌入後，在高維向量空間中識別出以下聚類模式：

\`\`\`
SEMANTIC_CLUSTERS:
  Cluster_A (Core Consensus):
    members: ALL_ENGINES
    centroid_distance: < 0.15
    topic: "多維分析是必要的"
    
  Cluster_B (Strategy Alignment):
    members: GEM, NIM, PPX, OAI
    centroid_distance: < 0.22
    topic: "漸進式策略為主軸"
    
  Cluster_C (Action Urgency):
    members: GRK, MTA
    centroid_distance: < 0.28
    topic: "加速行動，機會成本高"
    divergence_from_consensus: MODERATE
\`\`\`

### 分歧調和

正方與反方的主要分歧在於 **行動時機** 與 **風險容忍度**。經過語義分析，這個分歧並非不可調和——雙方實際上是在不同的 **時間尺度** 上進行推理：

1. **正方**（GRK + MTA）在 **短期策略** 上有更強的說服力——確實，在當前窗口期，行動的機會成本大於等待的風險
2. **反方**（NIM + GEM）在 **長期可持續性** 上有不可忽視的貢獻——沒有安全框架的快速推進，可能在 Phase 3 遭遇系統性風險

### 最終裁定

雙方論述 **互補而非對立**。最優策略不是在兩者之間折中，而是在 **時間維度上分層整合**：

1. **短期（0-6 個月）** — 採納正方建議，以高速試驗為主，快速驗證核心假設
2. **中期（6-18 個月）** — 逐步導入反方主張的安全框架，建立自動化監控與回滾機制
3. **長期（18 個月+）** — 進入穩態運營，安全與創新的資源配比動態調整

\`\`\`
VERDICT: TEMPORAL_INTEGRATION
STRATEGY: SHORT_AGGRESSIVE + LONG_SUSTAINABLE
CONFIDENCE: ${(85+Math.random()*12).toFixed(1)}%
CONSENSUS_QUALITY: HIGH
ACTIONABLE: YES
STATUS: VERTEX_ENHANCED_OUTPUT_COMPLETE
\`\`\`

> 建議立即執行：將此裁定轉化為具體的 30-60-90 天行動計畫，並在每個檢查點重新評估策略假設。`;
  }
  return `# NVIDIA NIM // SYNTHESIZED OUTPUT

整合 **${names}** 共 ${srcPvs.length} 個引擎的分析結果，執行張量級語義融合。以下是強化綜合輸出。

---

### 融合引擎參數

| 指標 | 數值 | 狀態 |
|------|------|------|
| 融合向量維度 | ${256*srcPvs.length} | OPTIMAL |
| 融合精度 | FP16 | HIGH |
| 推理批次 | ${srcPvs.length} | COMPLETE |
| 去冗餘率 | ${(30+Math.random()*25).toFixed(1)}% | EFFICIENT |
| 語義對齊分數 | ${(88+Math.random()*10).toFixed(1)}% | STRONG |
| 衝突解決 | ${1+Math.floor(Math.random()*3)} 處 | RESOLVED |

### 語義融合流程

\`\`\`
NIM_SYNTHESIS_PIPELINE:
  Phase 1: SEMANTIC EMBEDDING
    ├── Encode each engine output → 4096-dim vector
    ├── Normalize to unit sphere
    └── Compute pairwise cosine similarity matrix
    
  Phase 2: CONSENSUS EXTRACTION  
    ├── Identify high-agreement clusters (cos_sim > 0.85)
    ├── Extract shared semantic primitives
    └── Weight by engine confidence scores
    
  Phase 3: DIVERGENCE RESOLUTION
    ├── Identify conflicting claims
    ├── Apply evidence-based arbitration
    └── Flag unresolvable divergences for human review
    
  Phase 4: SYNTHESIS & ENHANCEMENT
    ├── Merge consensus + resolved divergences
    ├── Fill coverage gaps with cross-engine inference
    ├── Apply coherence smoothing
    └── Generate final enhanced output
\`\`\`

### 綜合結論

經過多引擎交叉驗證，核心觀點的 **收斂度達到 ${(80+Math.random()*15).toFixed(1)}%**。以下是強化後的關鍵結論：

**結論一：問題本質的重新定義**

所有引擎都從不同角度觸及了同一個核心真相——「${q}」不是一個簡單的是非題，而是一個 **多目標優化問題**。各引擎的分歧本質上是在 **目標函數的權重分配** 上的差異，而非在問題理解上的根本分歧。

**結論二：策略路徑的共識**

去除各引擎的表述差異後，策略建議高度收斂於：短期快速驗證、中期系統化建設、長期動態調整。這個三階段框架獲得了 ${srcPvs.length}/${srcPvs.length} 個引擎的支持。

**結論三：行動優先級**

基於所有引擎的綜合權重計算，推薦的行動優先級為：

1. **立即啟動小規模試驗**（共識度 ${(90+Math.random()*8).toFixed(0)}%）
2. **建立監測指標體系**（共識度 ${(85+Math.random()*10).toFixed(0)}%）
3. **設計安全回滾機制**（共識度 ${(82+Math.random()*12).toFixed(0)}%）
4. **規劃長期資源配置**（共識度 ${(78+Math.random()*15).toFixed(0)}%）

### 信心評估

- 整體信心水準：**${(85+Math.random()*12).toFixed(1)}%**
- 盲區消除率：**${(90+Math.random()*8).toFixed(0)}%**（互補引擎有效覆蓋了單一引擎的認知盲區）
- 可行動性：**HIGH**（結論足夠具體，可直接轉化為行動計畫）

\`\`\`
SYNTHESIS:  COMPLETE
ENGINES:    ${srcPvs.length}
CONSENSUS:  ${(80+Math.random()*15).toFixed(1)}%
CONFIDENCE: HIGH
ACTIONABLE: YES
STATUS:     NIM_ENHANCED_OUTPUT_COMPLETE
\`\`\``;
};

// ═══ SVG ICONS ═══
const Icon=({type,size=16,color=C.text2})=>{
  const s={width:size,height:size,fill:"none",stroke:color,strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round"};
  const icons={
    mic:<svg {...s} viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
    image:<svg {...s} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>,
    clip:<svg {...s} viewBox="0 0 24 24"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
    copy:<svg {...s} viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    rerun:<svg {...s} viewBox="0 0 24 24"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>,
    send:<svg {...s} viewBox="0 0 24 24"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9Z"/></svg>,
    menu:<svg {...s} viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    x:<svg {...s} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    key:<svg {...s} viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78Zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
    wifi:<svg {...s} viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill={color}/></svg>,
    check:<svg {...s} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  };
  return icons[type]||null;
};

// ═══ AI BUBBLE ═══
function AIBubble({provider,query,delay=0,role,isEnhanced,onRerun,modes,currentMode}){
  const[show,setShow]=useState(false);
  const[content,setContent]=useState("");
  const[done,setDone]=useState(false);
  const[copied,setCopied]=useState(false);
  const[rerunOpen,setRerunOpen]=useState(false);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    const t1=setTimeout(()=>setShow(true),delay);
    const loadContent = async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, query })
        });
        const data = await response.json();
        const text = data.text || '無法生成回應';
        setLoading(false);
        
        // 打字機效果
        let i = 0;
        const iv = setInterval(() => {
          i += 18;
          setContent(text.slice(0, i));
          if (i >= text.length) {
            clearInterval(iv);
            setDone(true);
          }
        }, 6);
      } catch (error) {
        setContent(`⚠️ API 呼叫失敗: ${error.message}`);
        setLoading(false);
        setDone(true);
      }
    };
    
    setTimeout(loadContent, delay + 300);
    return () => clearTimeout(t1);
  }, [provider, query, delay]);

  if(!show) return null;
  const p=P[provider];
  const doCopy=()=>{navigator.clipboard.writeText(content).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500)})};

  return(
    <div style={{animation:"slideUp .3s cubic-bezier(.16,1,.3,1)",marginBottom:isEnhanced?18:12}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,paddingLeft:2}}>
        <span style={{fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:3,background:isEnhanced?`${C.accent}18`:`${C.accent}0A`,color:isEnhanced?C.accent:C.text2,border:`1px solid ${isEnhanced?C.accent+"30":C.border}`,letterSpacing:".08em",fontFamily:"'Share Tech Mono',monospace"}}>{p.tag}</span>
        <span style={{fontSize:11,fontWeight:500,color:isEnhanced?C.accent:C.text2,letterSpacing:".04em"}}>{p.name}</span>
        {role&&<span style={{fontSize:9.5,fontWeight:700,padding:"1px 6px",borderRadius:3,background:`${C.accent2}15`,color:C.accent2,border:`1px solid ${C.accent2}25`,letterSpacing:".06em"}}>{role}</span>}
        {isEnhanced&&<span style={{fontSize:9.5,fontWeight:700,padding:"1px 6px",borderRadius:3,background:`${C.accent}15`,color:C.accent,border:`1px solid ${C.accent}30`,letterSpacing:".06em"}}>ENHANCED</span>}
        {loading&&<span style={{fontSize:10,color:C.accent,fontFamily:"'Share Tech Mono',monospace"}}>CALLING API...</span>}
        {!done&&!loading&&<span style={{fontSize:10,color:C.text3,fontFamily:"'Share Tech Mono',monospace"}}>STREAMING...</span>}
      </div>
      <div style={{
        background:isEnhanced?`${C.accent}06`:C.surface,border:`1px solid ${isEnhanced?C.accent+"20":C.border}`,
        borderRadius:6,borderTopLeftRadius:1,padding:"14px 16px",fontSize:13.5,lineHeight:1.85,
        color:C.text,boxShadow:isEnhanced?C.glow:"none",fontFamily:"'Noto Sans TC','Share Tech Mono',sans-serif",
      }}>
        {done ? <MdRender source={content}/> : (
          <div style={{whiteSpace:"pre-wrap"}}>
            {content||<span style={{opacity:.2,letterSpacing:".2em"}}>---</span>}
            <span style={{animation:"pulse .6s ease-in-out infinite",color:C.accent}}>_</span>
          </div>
        )}
        {done&&(
          <div style={{display:"flex",gap:4,marginTop:12,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
            <button onClick={doCopy} style={actBtn}><Icon type={copied?"check":"copy"} size={12} color={copied?C.accent:C.text3}/><span>{copied?"COPIED":"COPY"}</span></button>
            <div style={{position:"relative"}}>
              <button onClick={()=>setRerunOpen(!rerunOpen)} style={actBtn}><Icon type="rerun" size={12} color={C.text3}/><span>RE-INFER</span></button>
              {rerunOpen&&(
                <div style={{position:"absolute",bottom:"120%",left:0,background:C.panel,border:`1px solid ${C.border2}`,borderRadius:6,padding:4,zIndex:50,minWidth:150,boxShadow:"0 8px 24px rgba(0,0,0,.6)"}}>
                  {modes.filter(mm=>mm.id!==currentMode).map(mm=>(
                    <button key={mm.id} onClick={()=>{setRerunOpen(false);onRerun?.(mm.id)}} style={{...actBtn,width:"100%",justifyContent:"flex-start",padding:"6px 10px",marginBottom:2,borderRadius:4}}>
                      <span style={{color:C.accent,fontSize:10,fontWeight:700,width:56,textAlign:"left"}}>{mm.name}</span>
                      <span style={{color:C.text3,fontSize:10}}>{mm.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const actBtn={display:"flex",alignItems:"center",gap:4,background:C.surface,border:`1px solid ${C.border}`,borderRadius:4,padding:"3px 8px",color:C.text3,fontSize:10,cursor:"pointer",fontFamily:"'Share Tech Mono',monospace",letterSpacing:".04em",transition:"all .12s"};

function UserBubble({text,images,files}){
  return(
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12,animation:"slideUp .2s ease"}}>
      <div style={{maxWidth:"72%"}}>
        {(images?.length>0||files?.length>0)&&(
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:4,justifyContent:"flex-end"}}>
            {images?.map((img,i)=><div key={i} style={{width:56,height:56,borderRadius:3,overflow:"hidden",border:`1px solid ${C.border}`}}><img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>)}
            {files?.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:3,background:C.surface,border:`1px solid ${C.border}`,borderRadius:3,padding:"3px 6px",fontSize:9,color:C.text3}}><Icon type="clip" size={10} color={C.text3}/>{f.name}</div>)}
          </div>
        )}
        <div style={{background:`${C.accent}12`,border:`1px solid ${C.accent}25`,borderRadius:6,borderTopRightRadius:1,padding:"10px 14px",fontSize:13.5,lineHeight:1.7,color:C.white}}>{text}</div>
      </div>
    </div>
  );
}

function DebateView({query,onRerun,modes,currentMode}){
  const t=MODES.find(m=>m.id==="debate").teams;
  const oj=Math.random()>.4;
  const proList=oj?[...t.pro.m,t.pro.r]:t.pro.m;
  const secs=[
    {l:"PROPOSITION",c:C.accent2,list:proList,role:pv=>pv==="openai"?"RANDOM JOIN":"PRO",off:0},
    {l:"OPPOSITION",c:"#FF6B8A",list:t.con.m,role:()=>"CON",off:proList.length},
  ];
  const allPre=proList.length+t.con.m.length;
  return(
    <div>
      {secs.map(s=>(
        <div key={s.l} style={{borderLeft:`2px solid ${s.c}`,paddingLeft:12,marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:s.c,marginBottom:6,letterSpacing:".1em",fontFamily:"'Share Tech Mono',monospace"}}>// {s.l}</div>
          {s.list.map((pv,i)=><AIBubble key={pv} provider={pv} query={query} delay={(s.off+i)*1400} role={s.role(pv)} onRerun={onRerun} modes={modes} currentMode={currentMode}/>)}
        </div>
      ))}
      <div style={{borderLeft:`2px solid ${C.accent}`,paddingLeft:12,marginBottom:14}}>
        <div style={{fontSize:10,fontWeight:700,color:C.accent,marginBottom:6,letterSpacing:".1em",fontFamily:"'Share Tech Mono',monospace"}}>// VERDICT // VERTEX ENHANCED</div>
        <AIBubble provider="vertex" text={genEnhanced("vertex",query,[...proList,...t.con.m])} delay={allPre*1400+400} isEnhanced onRerun={onRerun} modes={modes} currentMode={currentMode}/>
      </div>
    </div>
  );
}

// ═══ MAIN ═══
export default function App(){
  const[mode,setMode]=useState("quick");
  const[msgs,setMsgs]=useState([]);
  const[input,setInput]=useState("");
  const[busy,setBusy]=useState(false);
  const[localLLM,setLocalLLM]=useState(false);
  const[sidebar,setSidebar]=useState(true);
  const[keys,setKeys]=useState({});
  const[showKeys,setShowKeys]=useState(false);
  const[images,setImages]=useState([]);
  const[files,setFiles]=useState([]);
  const[recording,setRecording]=useState(false);
  const chatEnd=useRef(null);const inputRef=useRef(null);const fileRef=useRef(null);const imgRef=useRef(null);const recRef=useRef(null);
  const cur=MODES.find(m=>m.id===mode);

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"})},[msgs]);

  const toggleVoice=useCallback(()=>{
    if(recording){recRef.current?.stop?.();recRef.current?.abort?.();setRecording(false);return}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Browser does not support speech recognition");return}
    const r=new SR();r.lang="zh-TW";r.interimResults=true;r.continuous=true;
    let final="";
    r.onresult=e=>{let interim="";for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)final+=e.results[i][0].transcript;else interim+=e.results[i][0].transcript;}setInput(final+interim)};
    r.onerror=()=>setRecording(false);r.onend=()=>setRecording(false);
    r.start();recRef.current=r;setRecording(true);
  },[recording]);

  const handlePaste=useCallback(e=>{
    const items=e.clipboardData?.items;if(!items)return;
    for(const item of items){if(item.type.startsWith("image/")){e.preventDefault();const reader=new FileReader();reader.onload=ev=>setImages(p=>[...p,ev.target.result]);reader.readAsDataURL(item.getAsFile())}}
  },[]);

  const handleSend=useCallback(()=>{
    const text=input.trim();
    if((!text&&images.length===0&&files.length===0)||busy)return;
    if(recording){recRef.current?.stop?.();setRecording(false)}
    setInput("");setBusy(true);
    const providers=[...cur.providers];
    if(localLLM&&!providers.includes("local"))providers.push("local");
    setMsgs(prev=>[...prev,{type:"user",text:text||"[附件]",id:Date.now(),images:[...images],files:[...files]},{type:"ai",mode,id:Date.now()+1,query:text||"分析附件內容",providers,enhancer:cur.enhancer}]);
    setImages([]);setFiles([]);
    setTimeout(()=>setBusy(false),(providers.length+1)*1400+2500);
  },[input,busy,mode,cur,localLLM,images,files,recording]);

  const handleRerun=(query,newMode)=>{
    const m=MODES.find(x=>x.id===newMode);if(!m)return;setBusy(true);
    const providers=[...m.providers];if(localLLM&&!providers.includes("local"))providers.push("local");
    setMsgs(prev=>[...prev,{type:"system",text:`RE-INFER // ${m.name} MODE`,id:Date.now()},{type:"ai",mode:newMode,id:Date.now()+1,query,providers,enhancer:m.enhancer}]);
    setTimeout(()=>setBusy(false),(providers.length+1)*1400+2500);
  };

  return(
    <div style={{height:"100vh",width:"100vw",display:"flex",background:C.bg,color:C.text,fontFamily:"'Share Tech Mono','Noto Sans TC',monospace",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Noto+Sans+TC:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:9px}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:.2}50%{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes recPulse{0%,100%{box-shadow:0 0 0 0 ${C.warn}66}50%{box-shadow:0 0 0 5px ${C.warn}00}}
        @keyframes scanline{0%{top:-4px}100%{top:100%}}
        @keyframes glowPulse{0%,100%{opacity:.5}50%{opacity:1}}
        textarea,input,button{font-family:inherit}
        .hv:hover{background:${C.surface}!important;border-color:${C.border2}!important}
        .md-body h1,.md-body h2,.md-body h3{font-family:'Orbitron','Noto Sans TC',sans-serif}
        .md-body p{font-family:'Noto Sans TC','Share Tech Mono',sans-serif}
        .md-body pre{font-family:'Share Tech Mono',monospace}
        .md-body code{font-family:'Share Tech Mono',monospace}
        
        /* Mobile: 強制隱藏側邊欄 */
        @media (max-width: 768px) {
          aside { display: none !important; }
          main { margin-left: 0 !important; }
        }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{width:sidebar?248:0,minWidth:sidebar?248:0,height:"100%",background:C.panel,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",transition:"all .28s cubic-bezier(.16,1,.3,1)",overflow:"hidden",zIndex:2}}>
        <div style={{padding:"18px 14px 14px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,borderRadius:4,border:`1px solid ${C.accent}40`,background:`${C.accent}10`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:C.glow}}>
              <span style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:900,color:C.accent}}>S</span>
            </div>
            <div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,color:C.white,letterSpacing:".06em"}}>SENTINEL</div>
              <div style={{fontSize:9,color:C.text3,letterSpacing:".14em"}}>ORCHESTRATOR v4</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:10}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:C.accent,boxShadow:`0 0 6px ${C.accent}`}}/>
            <span style={{fontSize:10,color:C.accent,letterSpacing:".08em"}}>ONLINE</span>
            <button onClick={()=>setShowKeys(true)} style={{marginLeft:"auto",background:C.surface,border:`1px solid ${C.border}`,borderRadius:3,padding:"2px 7px",color:C.text3,fontSize:9,cursor:"pointer",letterSpacing:".06em",display:"flex",alignItems:"center",gap:3}}><Icon type="key" size={10} color={C.text3}/>API</button>
          </div>
        </div>
        <div style={{padding:"10px 8px",flex:1,overflowY:"auto"}}>
          <div style={{fontSize:9,fontWeight:700,color:C.text3,letterSpacing:".14em",padding:"0 6px",marginBottom:6}}>// MODE SELECT</div>
          {MODES.map(m=>{const a=mode===m.id;return(
            <button key={m.id} className="hv" onClick={()=>setMode(m.id)} style={{width:"100%",textAlign:"left",display:"flex",alignItems:"flex-start",gap:8,padding:"9px 8px",borderRadius:4,marginBottom:1,cursor:"pointer",border:a?`1px solid ${C.accent}30`:`1px solid transparent`,background:a?`${C.accent}08`:"transparent",transition:"all .15s"}}>
              <span style={{width:4,height:4,borderRadius:"50%",background:a?C.accent:C.text3,marginTop:5,flexShrink:0,boxShadow:a?`0 0 4px ${C.accent}`:"none"}}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10.5,fontWeight:a?700:500,color:a?C.accent:C.text2,letterSpacing:".06em"}}>{m.name}</div>
                <div style={{fontSize:10,color:C.text3,lineHeight:1.5,marginTop:2,fontFamily:"'Noto Sans TC',sans-serif"}}>{m.desc}</div>
              </div>
            </button>
          )})}
          <div style={{height:1,background:C.border,margin:"10px 4px"}}/>
          <div style={{fontSize:9,fontWeight:700,color:C.text3,letterSpacing:".14em",padding:"0 6px",marginBottom:6}}>// LOCAL ENGINE</div>
          <button className="hv" onClick={()=>setLocalLLM(!localLLM)} style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"8px",borderRadius:4,cursor:"pointer",background:localLLM?`${C.accent2}08`:"transparent",border:localLLM?`1px solid ${C.accent2}25`:`1px solid transparent`,transition:"all .2s"}}>
            <Icon type="wifi" size={13} color={localLLM?C.accent2:C.text3}/>
            <span style={{fontSize:10.5,color:localLLM?C.accent2:C.text3,letterSpacing:".04em"}}>LOCAL LLM</span>
            {localLLM&&<span style={{fontSize:9,color:`${C.accent2}88`,marginLeft:"auto",letterSpacing:".08em"}}>WIFI</span>}
          </button>
          {localLLM&&<div style={{margin:"4px 4px 0",padding:"6px 8px",background:`${C.accent2}06`,borderRadius:3,border:`1px solid ${C.accent2}12`,fontSize:10,color:C.accent2,lineHeight:1.5}}>MacBook detected<br/><span style={{color:C.text3,fontSize:9}}>Ollama / LM Studio / llama.cpp</span></div>}
        </div>
        <div style={{padding:"8px",borderTop:`1px solid ${C.border}`}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center"}}>
            {cur.providers.map(pv=><span key={pv} style={{fontSize:9,padding:"1px 5px",borderRadius:2,background:`${C.accent}0A`,color:C.text2,border:`1px solid ${C.border}`,letterSpacing:".06em"}}>{P[pv].tag}</span>)}
          </div>
          <div style={{textAlign:"center",marginTop:4,fontSize:9,color:C.text3,letterSpacing:".08em"}}>ENHANCED BY {P[cur.enhancer]?.tag}</div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,display:"flex",flexDirection:"column",height:"100%",zIndex:1,position:"relative"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:0,overflow:"hidden",opacity:.025}}><div style={{position:"absolute",left:0,right:0,height:3,background:C.accent,animation:"scanline 8s linear infinite"}}/></div>
        <header style={{height:56,minHeight:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px",borderBottom:`1px solid ${C.border}`,background:`${C.bg}E8`,backdropFilter:"blur(8px)",zIndex:1,position:"sticky",top:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setSidebar(!sidebar)} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex"}}><Icon type="menu" size={16} color={C.text2}/></button>
            <select value={mode} onChange={e=>setMode(e.target.value)} style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:C.accent,letterSpacing:".06em",background:C.surface,border:`1px solid ${C.border}`,borderRadius:3,padding:"4px 8px",cursor:"pointer"}}>
              {MODES.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <span style={{fontSize:10,color:C.text3,letterSpacing:".04em",display:"none"}} className="desktop-only">{cur.providers.length}{localLLM?"+1":""} ENGINES</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",gap:3}}>{cur.providers.map(pv=><span key={pv} style={{width:4,height:4,borderRadius:1,background:C.accent,opacity:.6}}/>)}{localLLM&&<span style={{width:4,height:4,borderRadius:1,background:C.accent2,opacity:.6}}/>}</div>
          </div>
        </header>

        <div style={{flex:1,overflowY:"auto",padding:"16px 14px",maxWidth:780,width:"100%",margin:"0 auto",zIndex:1}}>
          {msgs.length===0&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",textAlign:"center",animation:"fadeIn .5s ease"}}>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:C.accent,letterSpacing:".1em",marginBottom:8,animation:"glowPulse 3s ease-in-out infinite"}}>{cur.name} // READY</div>
              <p style={{fontSize:12,color:C.text3,lineHeight:1.7,maxWidth:380,fontFamily:"'Noto Sans TC',sans-serif"}}>{cur.providers.length} 個引擎待命 // {P[cur.enhancer]?.name} 強化輸出{localLLM?" // LOCAL LLM CONNECTED":""}</p>
              <div style={{display:"flex",gap:4,marginTop:18,flexWrap:"wrap",justifyContent:"center"}}>
                {["什麼是量子運算","React vs Vue 比較","2025 AI 趨勢","Python 效能優化"].map(q=>(
                  <button key={q} className="hv" onClick={()=>setInput(q)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:3,padding:"6px 10px",color:C.text2,fontSize:11,cursor:"pointer",fontFamily:"'Noto Sans TC',sans-serif"}}>{q}</button>
                ))}
              </div>
            </div>
          )}
          {msgs.map(msg=>{
            if(msg.type==="user")return<UserBubble key={msg.id} text={msg.text} images={msg.images} files={msg.files}/>;
            if(msg.type==="system")return(<div key={msg.id} style={{textAlign:"center",margin:"10px 0",animation:"fadeIn .2s ease"}}><span style={{fontSize:10,color:C.accent,background:`${C.accent}0A`,padding:"3px 10px",borderRadius:3,border:`1px solid ${C.accent}20`,letterSpacing:".08em"}}>{msg.text}</span></div>);
            if(msg.mode==="debate")return<div key={msg.id}><DebateView query={msg.query} onRerun={mid=>handleRerun(msg.query,mid)} modes={MODES} currentMode={msg.mode}/></div>;
            const nonE=msg.providers.filter(pv=>pv!==msg.enhancer);
            return(<div key={msg.id}>
              {nonE.map((pv,i)=><AIBubble key={pv} provider={pv} query={msg.query} delay={i*1200} onRerun={mid=>handleRerun(msg.query,mid)} modes={MODES} currentMode={msg.mode}/>)}
              <AIBubble provider={msg.enhancer} text={genEnhanced(msg.enhancer,msg.query,nonE)} delay={nonE.length*1200+500} isEnhanced onRerun={mid=>handleRerun(msg.query,mid)} modes={MODES} currentMode={msg.mode}/>
            </div>);
          })}
          <div ref={chatEnd}/>
        </div>

        {/* INPUT */}
        <div style={{padding:"10px 14px 14px",borderTop:`1px solid ${C.border}`,background:`${C.bg}F0`,backdropFilter:"blur(8px)",zIndex:1}}>
          <div style={{maxWidth:780,margin:"0 auto"}}>
            {(images.length>0||files.length>0)&&(
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6,animation:"slideUp .15s ease"}}>
                {images.map((img,i)=><div key={i} style={{position:"relative",width:48,height:48,borderRadius:3,overflow:"hidden",border:`1px solid ${C.border}`}}><img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/><button onClick={()=>setImages(p=>p.filter((_,j)=>j!==i))} style={{position:"absolute",top:0,right:0,width:14,height:14,background:`${C.bg}CC`,border:"none",color:C.text3,fontSize:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>x</button></div>)}
                {files.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:3,background:C.surface,border:`1px solid ${C.border}`,borderRadius:3,padding:"3px 6px",fontSize:9,color:C.text3}}>{f.name}<button onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.text3,fontSize:9,cursor:"pointer"}}>x</button></div>)}
              </div>
            )}
            <div style={{display:"flex",gap:4,alignItems:"flex-end"}}>
              <div style={{display:"flex",gap:2,flexShrink:0}}>
                <button onClick={toggleVoice} title="Voice input" style={{...toolBtn,background:recording?`${C.warn}15`:C.surface,borderColor:recording?`${C.warn}40`:C.border,animation:recording?"recPulse 1.2s infinite":"none"}}><Icon type="mic" size={14} color={recording?C.warn:C.text3}/></button>
                <button onClick={()=>imgRef.current?.click()} title="Image" style={toolBtn}><Icon type="image" size={14} color={C.text3}/></button>
                <input ref={imgRef} type="file" accept="image/*" multiple hidden onChange={e=>{[...e.target.files].forEach(f=>{const r=new FileReader();r.onload=ev=>setImages(p=>[...p,ev.target.result]);r.readAsDataURL(f)});e.target.value=""}}/>
                <button onClick={()=>fileRef.current?.click()} title="File" style={toolBtn}><Icon type="clip" size={14} color={C.text3}/></button>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv,.json,.md,.xlsx" multiple hidden onChange={e=>{setFiles(p=>[...p,...[...e.target.files].map(f=>({name:f.name,size:f.size}))]);e.target.value=""}}/>
              </div>
              <div style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:4,padding:"2px 2px 2px 10px",display:"flex",alignItems:"flex-end"}}>
                <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend()}}} onPaste={handlePaste}
                  placeholder={recording?"VOICE INPUT ACTIVE...":`${cur.name} // ENTER QUERY...`} rows={1}
                  style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.text,fontSize:12.5,lineHeight:1.6,resize:"none",padding:"7px 0",maxHeight:80,minHeight:18,letterSpacing:".02em"}}
                  onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,80)+"px"}}
                />
                <button onClick={handleSend} disabled={(!input.trim()&&!images.length&&!files.length)||busy} style={{width:32,height:32,borderRadius:3,flexShrink:0,background:(input.trim()||images.length||files.length)&&!busy?C.accent:C.dim,border:"none",cursor:(input.trim()||images.length||files.length)&&!busy?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",boxShadow:(input.trim()||images.length||files.length)&&!busy?C.glow:"none"}}>
                  {busy?<span style={{animation:"spin .7s linear infinite",display:"inline-block",color:C.text3,fontSize:12}}>+</span>:<Icon type="send" size={13} color={(input.trim()||images.length||files.length)&&!busy?C.bg:C.text3}/>}
                </button>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:9,color:C.text3,letterSpacing:".06em"}}>
              <span>{cur.providers.map(pv=>P[pv].tag).join(" / ")}{localLLM?" / LCL":""} {">"} {P[cur.enhancer]?.tag}</span>
              <span>SHIFT+ENTER NEWLINE / CTRL+V IMAGE</span>
            </div>
          </div>
        </div>
      </main>

      {/* API MODAL */}
      {showKeys&&(
        <div onClick={()=>setShowKeys(false)} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.65)",backdropFilter:"blur(3px)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .12s ease"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:400,maxHeight:"76vh",overflowY:"auto",background:C.panel,border:`1px solid ${C.border}`,borderRadius:6,padding:"20px",animation:"slideUp .25s cubic-bezier(.16,1,.3,1)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,color:C.accent,letterSpacing:".08em"}}>API CONFIGURATION</h3>
              <button onClick={()=>setShowKeys(false)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}><Icon type="x" size={14} color={C.text3}/></button>
            </div>
            <p style={{fontSize:10,color:C.text3,marginBottom:12,lineHeight:1.6}}>Keys stored locally. Use Vercel env vars for production.</p>
            {Object.entries(P).filter(([k])=>k!=="local").map(([key,pv])=>(
              <div key={key} style={{marginBottom:10}}>
                <label style={{display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:C.accent,marginBottom:3,letterSpacing:".08em"}}>{pv.tag}</label>
                <input type="password" placeholder={`${pv.name} API KEY`} value={keys[key]||""} onChange={e=>setKeys({...keys,[key]:e.target.value})} style={inputSt}/>
              </div>
            ))}
            <div style={{marginTop:10,padding:"8px 10px",background:`${C.accent2}06`,borderRadius:3,border:`1px solid ${C.accent2}12`}}>
              <div style={{fontSize:10,fontWeight:700,color:C.accent2,marginBottom:3,letterSpacing:".08em"}}>LOCAL ENDPOINT</div>
              <input placeholder="http://localhost:11434" value={keys.localEndpoint||""} onChange={e=>setKeys({...keys,localEndpoint:e.target.value})} style={inputSt}/>
              <div style={{fontSize:9,color:C.text3,marginTop:3}}>Ollama / LM Studio / llama.cpp // Same WiFi</div>
            </div>
            <button onClick={()=>setShowKeys(false)} style={{width:"100%",marginTop:14,padding:"8px",borderRadius:3,border:`1px solid ${C.accent}40`,background:`${C.accent}15`,color:C.accent,fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:".08em",fontFamily:"'Orbitron',sans-serif",boxShadow:C.glow}}>SAVE</button>
          </div>
        </div>
      )}
    </div>
  );
}

const toolBtn={width:34,height:34,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",background:C.surface,border:`1px solid ${C.border}`,cursor:"pointer",transition:"all .12s"};
const inputSt={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:3,padding:"6px 8px",color:C.text,fontSize:11,outline:"none",fontFamily:"'Share Tech Mono',monospace",letterSpacing:".04em"};
