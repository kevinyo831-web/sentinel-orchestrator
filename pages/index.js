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
  { id:"quick", name:"QUICK", label:"快速", desc:"戰略長 + 營運長", providers:["gemini","nvidia"], enhancer:"nvidia" },
  { id:"predict", name:"PREDICT", label:"預測", desc:"戰略 + 營運 + 情報", providers:["gemini","nvidia","perplexity"], enhancer:"nvidia" },
  { id:"deep", name:"DEEP RESEARCH", label:"深度研究", desc:"全智囊團綜合", providers:["gemini","grok","perplexity","openai","nvidia","vertex"], enhancer:"nvidia" },
  { id:"debate", name:"DEBATE", label:"AI 辯論", desc:"創業家 vs 營運長", providers:["grok","openai","nvidia","gemini","vertex"], enhancer:"vertex",
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
const gen = (pv, q) => {
  const m = {
    gemini: `## 多維語義分析

針對「${q}」進行深度解構。這是一個值得從多個層面仔細拆解的問題，以下我將從結構性因素、時序動態、因果鏈三個核心面向展開完整分析。

### 1. 結構性因素

首先，我們需要理解底層架構與系統依賴關係。任何複雜問題都不是孤立存在的——它嵌套在一個由 **技術基礎設施、組織流程、人才結構** 三者構成的多層系統中。

在技術層面，當前的主流範式已經從單一模型推理轉向 \`multi-agent orchestration\`，這意味著問題的解決路徑不再是線性的，而是一個多節點的 **有向無環圖（DAG）**。每個節點代表一個專門化的推理單元，節點之間的連接權重決定了資訊流動的優先級。

\`\`\`
ANALYSIS_FRAMEWORK:
├── Layer 1: Infrastructure Dependencies
│   ├── compute_capacity: elastic
│   ├── data_pipeline: streaming
│   └── model_registry: versioned
├── Layer 2: Process Architecture
│   ├── inference_chain: multi-hop
│   ├── feedback_loop: real-time
│   └── quality_gate: automated
└── Layer 3: Human-in-the-Loop
    ├── decision_authority: tiered
    ├── override_mechanism: available
    └── audit_trail: complete
\`\`\`

### 2. 時序動態

其次是演變趨勢的分析。根據歷史數據的回歸模型，我們可以識別出 **${2+Math.floor(Math.random()*3)} 個關鍵拐點**：

1. **早期採用階段**（Phase 1）— 技術驗證與小規模試點，ROI 尚未顯現，但學習曲線陡峭。這個階段最容易被保守決策者低估，因為可見的收益滯後於投入。
2. **加速擴張階段**（Phase 2）— 網絡效應開始發揮作用，邊際成本快速下降。在這個窗口期，先行者優勢最為顯著，後進者需要付出 **${(1.5+Math.random()*2).toFixed(1)}x** 的額外成本才能達到同等效果。
3. **成熟穩定階段**（Phase 3）— 技術差異化收窄，競爭焦點轉向運營效率與生態系統整合能力。

> 值得注意的是，Phase 2 到 Phase 3 的過渡期往往伴隨著一波 **整合浪潮**——在這個階段，無法證明差異化價值的參與者將面臨淘汰壓力。

### 3. 因果鏈推理

最後，讓我們建立關鍵變數之間的因果推理路徑。透過 \`counterfactual analysis\` 和 \`intervention modeling\`，我可以識別出以下因果關係：

- **輸入品質** → 直接影響 **推理準確度**（相關係數 r = ${(0.82+Math.random()*0.15).toFixed(2)}）
- **系統複雜度** → 反向影響 **迭代速度**（但可透過模組化設計緩解）
- **團隊認知負荷** → 非線性影響 **決策品質**（存在明確的認知過載閾值）

### 建議策略

綜合以上分析，我建議採用 **雙軌並行** 方法論：

- 短期以 \`incremental optimization\` 穩定核心收益，確保現有系統的穩健性
- 中長期同步布局 \`paradigm shift\` 準備結構性突破，建立技術護城河
- 設置 **關鍵先行指標** 的自動監測機制，當偏離度超過 ${(1.5+Math.random()*1).toFixed(1)} 個標準差時觸發預警
- 每季度進行一次 \`strategic review\`，根據最新數據動態調整資源配置權重

> 最重要的是保持 **認知靈活性**——不要讓當前的成功模式成為未來的路徑依賴。`,

    nvidia: `## 高效能並行推理分析

NVIDIA NIM 推理引擎已啟動，針對「${q}」執行深度運算分析。以下是完整的技術報告。

### 問題分解與並行化

原始問題經語義解析後，被分解為 **${3+Math.floor(Math.random()*6)} 個可並行執行的子任務**。每個子任務分配至獨立的推理節點，透過 \`scatter-gather\` 模式實現最大並行度。

分解策略採用 **語義切割演算法**，確保子任務之間的依賴關係最小化，同時保留語義完整性：

\`\`\`python
# NIM Parallel Inference Pipeline
class ParallelInferencePipeline:
    def __init__(self, num_nodes=${3+Math.floor(Math.random()*6)}):
        self.nodes = [InferenceNode(
            precision="FP8/FP16",
            batch_size="dynamic",
            memory_pool="shared"
        ) for _ in range(num_nodes)]
    
    def scatter(self, query):
        """語義切割 + 任務分配"""
        sub_tasks = self.semantic_split(query)
        futures = [node.infer_async(task) 
                   for node, task in zip(self.nodes, sub_tasks)]
        return futures
    
    def gather(self, futures):
        """結果融合 + 一致性檢查"""
        results = await asyncio.gather(*futures)
        return self.semantic_merge(results, 
            consistency_check=True,
            dedup_threshold=0.85)
\`\`\`

### 運算效能指標

本次推理的效能數據如下：

- **精度模式**：FP8/FP16 混合精度（在精度損失 < 0.1% 的前提下，吞吐量提升 ${(1.8+Math.random()*1.5).toFixed(1)}x）
- **推理延遲**：端到端 ${8+Math.floor(Math.random()*15)}ms（含網路往返、序列化/反序列化開銷）
- **吞吐量提升**：相較序列推理方案提升 ${(2+Math.random()*2).toFixed(1)}x
- **GPU 資源利用率**：${85+Math.floor(Math.random()*13)}%（接近理論最優值）
- **記憶體頻寬利用**：${(78+Math.random()*18).toFixed(1)}%（KV-cache 壓縮啟用）

### 張量並行架構

推理過程使用了 **Tensor Parallelism（TP）** 與 **Pipeline Parallelism（PP）** 的混合策略：

\`\`\`
ARCHITECTURE:
┌─────────────────────────────────────────────┐
│  INPUT LAYER                                │
│  ├── Tokenizer (BPE, vocab=128k)           │
│  └── Embedding Lookup (dim=4096)           │
├─────────────────────────────────────────────┤
│  INFERENCE CORE (TP=${2+Math.floor(Math.random()*3)}, PP=${1+Math.floor(Math.random()*2)})              │
│  ├── Attention: Multi-Head (${32+Math.floor(Math.random()*32)} heads)     │
│  ├── FFN: SwiGLU activation               │
│  ├── KV-Cache: PagedAttention v2           │
│  └── Precision: Dynamic FP8↔FP16          │
├─────────────────────────────────────────────┤
│  OUTPUT LAYER                               │
│  ├── Logit Processing (top-p=0.9)          │
│  ├── Semantic Dedup (threshold=0.85)       │
│  └── Consistency Validator                  │
└─────────────────────────────────────────────┘
\`\`\`

### 優化建議

基於本次推理的效能分析，我提出以下優化方向：

1. **批次大小動態調整** — 根據輸入序列長度自動調節 \`batch_size\`，在延遲與吞吐量之間取得最優平衡
2. **投機解碼** — 啟用 \`speculative decoding\` 可進一步降低延遲，預估改善幅度 25-40%
3. **KV-Cache 量化** — 將 KV-Cache 從 FP16 壓縮至 FP8，可在幾乎不影響品質的前提下將記憶體佔用減半
4. **請求排程優化** — 採用 \`continuous batching\` 取代靜態批次，提升 GPU 利用率至 95%+

> 總結：本次推理在效能與品質之間達到了良好的帕累托最優點。如需進一步提升，建議從投機解碼和連續批次排程兩個方向切入，預估可再提升 30-50% 的整體吞吐量。`,

    perplexity: `## 即時資料索引與深度研究報告

Perplexity 搜尋引擎針對「${q}」完成了全面的即時資料索引，以下是基於 **${20+Math.floor(Math.random()*35)} 個高品質來源** 的深度分析報告。

### 研究方法論

本次分析採用三階段研究框架：

1. **廣度搜索**（Breadth-First）— 在全網範圍內索引與主題相關的所有高品質來源，包括學術論文、技術報告、產業分析、官方文檔
2. **深度驗證**（Depth-First）— 對排名前 20 的來源進行逐一交叉驗證，確認事實準確性與時效性
3. **共識提取**（Consensus Mining）— 從驗證通過的來源中提取共識觀點與分歧點

### 核心發現

經過系統性分析，以下是最重要的三個發現：

**發現一：領域共識趨向漸進式發展路徑**

${(75+Math.random()*20).toFixed(0)}% 的來源支持漸進式路徑，理由包括：技術成熟度尚未達到突破性創新的臨界點、既有基礎設施的轉換成本過高、以及市場接受度需要時間培育。值得注意的是，持激進觀點的來源主要集中在學術研究領域，而產業界則普遍偏向務實。

\`\`\`
CONSENSUS_MAP:
  gradual_approach:  ${(75+Math.random()*20).toFixed(0)}% ████████████████░░░░
  radical_approach:  ${(10+Math.random()*15).toFixed(0)}% ████░░░░░░░░░░░░░░░░
  hybrid_approach:   ${(8+Math.random()*10).toFixed(0)}%  ███░░░░░░░░░░░░░░░░░
  undetermined:      ${(3+Math.random()*5).toFixed(0)}%   █░░░░░░░░░░░░░░░░░░░
\`\`\`

**發現二：資料品質的權重已超越規模效應**

最新的研究（2024-2025）顯示了一個明確的趨勢轉向：過去三年中，**資料品質對模型效能的邊際貢獻率** 持續上升，而單純的規模擴張帶來的收益正在遞減。具體而言：

- 高品質策展資料集的效能提升倍率：**${(2.5+Math.random()*1.5).toFixed(1)}x**
- 等量低品質資料的效能提升倍率：**${(0.8+Math.random()*0.4).toFixed(1)}x**
- 交叉點（品質超越規模的臨界資料量）：約 **${(10+Math.floor(Math.random()*20))}TB**

**發現三：多模態融合已成為不可逆的技術趨勢**

跨模態整合不僅是技術趨勢，更正在成為 **產品差異化的核心戰場**。主要表現在：

- 文本 + 視覺的融合推理準確度提升 **+${(15+Math.floor(Math.random()*20))}%**
- 純文本模型在複雜推理任務上的瓶頸日益明顯
- 端到端多模態架構正在取代 pipeline 式的模組拼接方案

### 來源可靠度評估

來源驗證完成，整體可靠度評分 **${(88+Math.random()*10).toFixed(1)}%**：

- 學術來源（peer-reviewed）：${8+Math.floor(Math.random()*6)} 篇，可靠度 98%
- 官方技術文檔：${5+Math.floor(Math.random()*5)} 份，可靠度 95%
- 產業分析報告：${4+Math.floor(Math.random()*4)} 份，可靠度 88%
- 高品質技術部落格：${3+Math.floor(Math.random()*5)} 篇，可靠度 82%

> 重要提醒：部分新興觀點（特別是關於突破性進展的預測）尚未獲得廣泛共識，置信區間較寬。建議將這些觀點視為 **弱信號** 而非確定性結論，並透過持續追蹤來更新判斷。`,

    grok: `## 核心論點：直擊要害

讓我直接切入「${q}」的關鍵問題，不繞彎子。

### 結論先行

**創新收益壓倒性超越風險成本。** 這不是觀點，這是數據。

歷史上每一次重大技術革新——從印刷術到蒸汽機、從電力到網際網路、從行動運算到人工智慧——都遵循著相同的劇本：

1. **恐慌期** — 社會輿論充斥末日預言，監管機構本能性地想要踩煞車
2. **適應期** — 早期採用者開始證明價值，懷疑論者逐漸沉默
3. **加速期** — 網絡效應啟動，落後者開始恐慌式追趕
4. **新常態** — 技術融入日常，人們開始遺忘當初的恐懼

我們現在正處於 **第 2 階段的後期**，即將進入第 3 階段。這是一個關鍵窗口。

### 反直覺數據

讓數字說話：

\`\`\`
HISTORICAL_ANALYSIS (N=${20+Math.floor(Math.random()*15)} major tech transitions):

Early Adopters:
  avg_roi:           +${(180+Math.random()*120).toFixed(0)}%
  time_to_breakeven: ${(8+Math.floor(Math.random()*10))} months
  market_share_gain: +${(12+Math.floor(Math.random()*15))}%

Wait-and-See Players:
  avg_roi:           +${(30+Math.random()*40).toFixed(0)}%
  time_to_breakeven: ${(18+Math.floor(Math.random()*12))} months
  market_share_loss: -${(5+Math.floor(Math.random()*8))}%

Risk-Adjusted Performance:
  alpha (early):     +${(1.2+Math.random()*0.8).toFixed(2)}
  alpha (late):      +${(0.2+Math.random()*0.3).toFixed(2)}
  information_ratio: ${(0.8+Math.random()*0.6).toFixed(2)}
\`\`\`

### 常見反論與反駁

讓我預先回應幾個最常見的反對意見：

**「但這次不一樣」** — 每一次都有人說「這次不一樣」。印刷術會讓抄寫員失業（對，但創造了出版業）。汽車會讓馬車伕失業（對，但創造了整個汽車產業鏈）。模式永遠比個案更有預測力。

**「風險太高」** — 你以為不行動沒有風險？不行動的風險是 **確定性的衰退**，而行動的風險是 **不確定性的回報**。哪個更可怕？

**「我們需要更多數據」** — 等你拿到「足夠」的數據時，窗口已經關閉。在不確定性中做決策的能力，本身就是一種核心競爭力。

### 行動建議

- 立即啟動 **小規模高速試驗**（投入不超過總預算的 15%，但要求 30 天內出結果）
- 建立 **快速失敗機制**——失敗不可恥，慢速失敗才致命
- 設定 **不可逆決策閾值**——只有超過此閾值的決策需要完整審核流程

> 最後一句：風險厭惡者以為自己在避險，實際上是在系統性地錯失 alpha。真正的風險管理不是避免風險，而是 **選擇正確的風險**。`,

    meta: `## 開放生態系統分析

讓我從 **社群驅動創新** 的角度來深度解構「${q}」。這個視角在當前語境下特別重要，因為我們正處於一個開放與封閉兩種範式激烈競爭的歷史節點。

### 核心命題

開放生態系統在軟體發展史上已經反覆證明了其結構性優勢。從 Linux 到 Kubernetes、從 TensorFlow 到 PyTorch、從 Android 到 React——**最終勝出的幾乎總是開放方案**。原因不是偶然，而是源於深層的系統動力學。

### 關鍵指標深度對比

民主化技術取用在 **${3+Math.floor(Math.random()*4)} 個核心維度** 上系統性地超越封閉開發：

**維度一：安全性**

這是最反直覺的一點。直覺告訴我們，封閉系統更安全，因為攻擊者看不到原始碼。但數據顯示的恰恰相反：

- 開源軟體的安全審計覆蓋率 **+${30+Math.floor(Math.random()*25)}%**
- 嚴重漏洞的平均修復時間（MTTR）**-${40+Math.floor(Math.random()*20)}%**
- 0-day 漏洞的發現速度 **+${50+Math.floor(Math.random()*30)}%**

原因很簡單：**${(1000+Math.floor(Math.random()*5000))} 雙眼睛比 ${(50+Math.floor(Math.random()*100))} 雙看得更仔細**。

**維度二：創新速度**

\`\`\`
INNOVATION_VELOCITY_COMPARISON:

Open Source Ecosystem:
  feature_release_cycle:  ${(2+Math.floor(Math.random()*3))} weeks (median)
  contributor_diversity:  ${(100+Math.floor(Math.random()*500))}+ organizations
  fork_and_improve_rate:  ${(15+Math.floor(Math.random()*25))}% monthly
  
Closed Source Equivalent:
  feature_release_cycle:  ${(6+Math.floor(Math.random()*8))} weeks (median)
  contributor_diversity:  1 organization
  improvement_rate:       ${(3+Math.floor(Math.random()*5))}% monthly
\`\`\`

**維度三：長期可持續性**

封閉系統最大的隱性風險是 **vendor lock-in** 和 **single point of failure**。當一家公司決定改變策略、提高價格、或停止支持某個產品時，所有依賴者都會受到影響。開源生態透過去中心化的治理結構，從根本上消除了這個風險。

**維度四：邊緣案例覆蓋**

- 全球社群貢獻的邊緣案例測試場景 **+${20+Math.floor(Math.random()*20)}%**
- 多語言 / 多文化適配的完整度 **+${30+Math.floor(Math.random()*30)}%**
- 非主流平台的支援度 **+${40+Math.floor(Math.random()*25)}%**

### 核心洞察

開源模式的 \`collective intelligence\` 效應在規模化後呈現 **非線性增長**。這不是簡單的人力加成——而是一種湧現現象（emergence），當足夠多的獨立思考者在同一個問題空間中工作時，解決方案的品質和多樣性會出現質的飛躍。

這種效應是封閉式開發 **在結構上無法複製** 的優勢，因為它依賴的不是更好的管理或更多的資源，而是 **認知多樣性** 本身。

> 結論：如果你正在做技術選型決策，除非有極其特殊的理由（例如強制性的合規要求），否則開放方案應該是你的預設選擇。不是因為它免費，而是因為它在幾乎所有長期指標上都更優。`,

    openai: `## 安全與進步：非零和框架

針對「${q}」，我要提出一個可能與直覺相悖的論點：**安全機制不是創新的制動器，而是創新的加速器**。以下是完整的分析框架。

### 問題的重新定義

大多數關於安全 vs. 進步的討論都陷入了一個錯誤的二分法：彷彿我們只能在「快速但危險」和「安全但緩慢」之間做選擇。這個框架本身就是錯的。

真正的問題不是「要不要安全」，而是「如何設計一個讓安全成為創新催化劑而非瓶頸的系統」。

### RLHF 對齊驗證：實證數據

我們已經在 **${5+Math.floor(Math.random()*8)} 個生產環境** 中驗證了這個方法論，結果一致性地顯示：

- 有對齊機制的系統，使用者信任度 **+${(35+Math.floor(Math.random()*25))}%**
- 信任度提升帶來的使用頻率增長 **+${(20+Math.floor(Math.random()*20))}%**
- 使用頻率增長帶來的數據飛輪效應——模型改善速度 **+${(15+Math.floor(Math.random()*15))}%**

換句話說，安全措施 → 信任 → 使用 → 數據 → 更好的模型。這是一個 **正向回饋循環**。

### 建議架構

\`\`\`python
class SafeInnovationFramework:
    """
    非零和安全框架 — 讓安全成為創新加速器
    """
    
    def __init__(self):
        self.risk_layers = {
            "critical": RiskLayer(
                threshold="zero_tolerance",
                review="mandatory_human",
                rollback="instant"
            ),
            "high": RiskLayer(
                threshold="statistical",
                review="automated_with_escalation", 
                rollback="< 5min"
            ),
            "medium": RiskLayer(
                threshold="monitoring",
                review="post_hoc",
                rollback="< 1hr"
            ),
            "low": RiskLayer(
                threshold="logging_only",
                review="weekly_batch",
                rollback="standard"
            ),
        }
    
    def evaluate(self, action):
        risk_level = self.classify_risk(action)
        layer = self.risk_layers[risk_level]
        
        if layer.requires_review(action):
            return self.human_review(action)
        
        # 低風險行動 — 直接放行，事後審計
        return self.execute_with_monitoring(action)
    
    def red_team_cycle(self, system, frequency="weekly"):
        """持續對抗性測試"""
        vulnerabilities = self.adversarial_probe(system)
        patches = self.generate_mitigations(vulnerabilities)
        self.deploy_patches(patches, strategy="canary")
        return self.verify_patches(patches)
\`\`\`

### 分層風險管理矩陣

具體的實施建議分為四個層次：

1. **關鍵風險**（Critical）— 影響人身安全或不可逆損害的行動。採用零容忍策略，所有此類行動必須經過人類審核。這一層不容妥協。

2. **高風險**（High）— 可能造成顯著影響但可逆的行動。採用統計閾值 + 自動化審核，異常值自動上報人類。這一層的關鍵是 **快速迭代閾值**——太松則失去保護，太緊則成為瓶頸。

3. **中等風險**（Medium）— 影響有限且完全可逆的行動。事後審查制，重點是 **建立模式識別能力**——從歷史數據中學習什麼樣的中等風險行動可能升級。

4. **低風險**（Low）— 日常操作，僅需記錄。這一層的原則是 **最大化自由度**——給創新留出足夠的呼吸空間。

### 漸進式部署策略

\`\`\`
DEPLOYMENT_STRATEGY:
  Stage 1: Shadow Mode (0% traffic)
    └── 所有新功能先在影子模式運行，不影響實際使用者
  Stage 2: Canary Release (1-5% traffic)
    └── 選擇性開放給小比例使用者，密集監控
  Stage 3: Gradual Rollout (5% → 25% → 50% → 100%)
    └── 每階段設置 kill switch，異常指標觸發自動回滾
  Stage 4: Full Release + Continuous Monitoring
    └── 完全上線後持續監控，建立長期基線
\`\`\`

> 核心信念：約束不是創新的敵人，而是讓創新 **可持續** 的基礎設施。就像公路上的護欄——它們不是為了阻止你開快車，而是讓你 **敢於** 開快車。`,

    vertex: `## Vertex AI 多引擎綜合評估

針對「${q}」的全面評估已完成。作為綜合評估引擎，Vertex AI 的角色是對所有其他引擎的分析進行 **元分析（meta-analysis）**，識別共識、分歧與盲區。

### 評估方法論

本次評估採用三維度評分框架：

1. **論述完整性**（Completeness）— 是否涵蓋了問題的所有關鍵面向
2. **邏輯一致性**（Consistency）— 內部推理是否自洽，是否存在矛盾
3. **實證支持度**（Evidence）— 論點是否有數據或案例支持

### 各引擎表現評估

- 多引擎共識度：**${(75+Math.random()*20).toFixed(1)}%**
- 正方論述充分度：**${(7+Math.random()*2).toFixed(1)}/10**
- 反方風控觀點：**${(7+Math.random()*2).toFixed(1)}/10**
- 交叉驗證通過率：**${(85+Math.random()*12).toFixed(1)}%**

### 共識區域

所有引擎在以下三個觀點上達成高度共識（共識度 > 85%）：

1. 問題的複雜性需要多面向分析，單一視角不足以覆蓋全貌
2. 短期與長期策略需要明確區分，避免混為一談
3. 持續的監測和動態調整機制是任何方案的必要組成部分

### 分歧區域

主要分歧集中在 **行動時機** 和 **風險容忍度** 兩個維度：

- 激進派（Grok 為代表）主張立即大膽行動，認為等待的機會成本大於行動的風險
- 穩健派（OpenAI 為代表）主張在安全框架內加速，確保每一步都有回滾機制
- 中間派（Gemini、Perplexity）傾向漸進式方法，根據數據驅動決策

### 裁定

建議採取 **「創新優先、安全並行」** 的雙軌策略框架。具體而言：

1. 設定 \`innovation velocity\` 的合理上限——不是限制創新本身，而是確保每個創新步驟都有對應的安全驗證
2. 為每個創新里程碑配置對應的安全 checkpoint
3. 建立 **動態調整機制**，根據實際風險指標修正策略權重
4. 定期（建議每季）進行策略回顧，整合新數據更新判斷

> 最終建議：不要把這個問題框定為「創新 vs 安全」的對立，而是將其重新定義為「如何設計一個讓創新和安全互相強化的系統」。答案不在兩者之間的折中，而在兩者之上的 **湧現**。`,

    local: `## 本地離線推理分析

MacBook 本地模型已完成「${q}」的深度分析。以下是完整的推理報告。

### 執行環境

本次推理在完全離線環境下執行，確保 **零數據外洩** 與 **最大隱私保護**：

\`\`\`
RUNTIME_ENVIRONMENT:
  device:          MacBook Pro (Apple Silicon)
  model:           Quantized LLaMA (INT4)
  memory_usage:    ${(2+Math.random()*4).toFixed(1)}GB / 16GB available
  inference_time:  ${5+Math.floor(Math.random()*12)}ms
  precision:       INT4 (GPTQ quantization)
  context_window:  8192 tokens
  temperature:     0.7
  top_p:           0.9
\`\`\`

### 語義分析結果

針對「${q}」的核心語義特徵提取完成：

1. **主題分類** — 技術分析 / 策略建議 / 趨勢預測（三重分類，權重分別為 ${(30+Math.floor(Math.random()*20))}% / ${(25+Math.floor(Math.random()*20))}% / ${(20+Math.floor(Math.random()*20))}%）
2. **情感向量** — 中性偏積極（sentiment score: +${(0.2+Math.random()*0.3).toFixed(2)}）
3. **複雜度評估** — 中高（需要跨領域知識整合）
4. **時效性要求** — 中等（混合了恆久性原則與時效性數據）

### 推理能力評估

本地模型在此特定任務上的表現：

- 語義理解精度：**${(90+Math.random()*8).toFixed(1)}%**（與雲端大模型的差距約 ${(3+Math.random()*5).toFixed(1)}%）
- 邏輯推理一致性：**${(88+Math.random()*9).toFixed(1)}%**
- 知識覆蓋範圍：**${(75+Math.random()*15).toFixed(1)}%**（受限於模型參數量與訓練數據截止日期）
- 回應生成速度：**${(95+Math.random()*4).toFixed(1)}%** 優於雲端方案（無網路延遲）

### 本地推理的獨特優勢

在以下場景中，本地推理具有雲端方案不可替代的優勢：

- **敏感數據處理** — 醫療記錄、財務數據、法律文件等不適合上傳雲端的資料
- **離線環境** — 飛機上、偏遠地區、網路不穩定的場所
- **低延遲需求** — 需要即時回應的互動場景（延遲 < ${5+Math.floor(Math.random()*12)}ms）
- **成本考量** — 高頻率使用場景下，本地推理的邊際成本趨近於零
- **法規合規** — 某些產業要求數據不得離開本地環境

### 局限性與補償策略

誠實地說，本地模型也有明確的局限性：

- **知識時效性** — 訓練數據有截止日期，無法獲取最新資訊。補償策略：與 Perplexity 等即時搜尋引擎互補
- **推理深度** — 參數量限制了複雜多步推理的能力。補償策略：在 Sentinel 系統中作為快速初篩，由雲端模型處理複雜案例
- **多語言能力** — 在非英語語言上的表現有所下降。補償策略：使用專門針對目標語言微調的本地模型

> 總結：本地 LLM 不是雲端大模型的替代品，而是 **互補品**。在 Sentinel Orchestrator 的架構中，本地模型扮演的角色是快速初篩、離線備援、以及敏感數據的安全處理通道。`,
  };
  return m[pv] || `*${P[pv]?.name} 正在分析...*`;
};

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
function AIBubble({provider,text,delay=0,role,isEnhanced,onRerun,modes,currentMode}){
  const[show,setShow]=useState(false);
  const[content,setContent]=useState("");
  const[done,setDone]=useState(false);
  const[copied,setCopied]=useState(false);
  const[rerunOpen,setRerunOpen]=useState(false);

  useEffect(()=>{
    const t1=setTimeout(()=>setShow(true),delay);
    const t2=setTimeout(()=>{
      let i=0;
      const iv=setInterval(()=>{i+=18;setContent(text.slice(0,i));if(i>=text.length){clearInterval(iv);setDone(true);}},6);
    },delay+300);
    return()=>{clearTimeout(t1);clearTimeout(t2)};
  },[text,delay]);

  if(!show) return null;
  const p=P[provider];
  const doCopy=()=>{navigator.clipboard.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500)})};

  return(
    <div style={{animation:"slideUp .3s cubic-bezier(.16,1,.3,1)",marginBottom:isEnhanced?18:12}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,paddingLeft:2}}>
        <span style={{fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:3,background:isEnhanced?`${C.accent}18`:`${C.accent}0A`,color:isEnhanced?C.accent:C.text2,border:`1px solid ${isEnhanced?C.accent+"30":C.border}`,letterSpacing:".08em",fontFamily:"'Share Tech Mono',monospace"}}>{p.tag}</span>
        <span style={{fontSize:11,fontWeight:500,color:isEnhanced?C.accent:C.text2,letterSpacing:".04em"}}>{p.name}</span>
        {role&&<span style={{fontSize:9.5,fontWeight:700,padding:"1px 6px",borderRadius:3,background:`${C.accent2}15`,color:C.accent2,border:`1px solid ${C.accent2}25`,letterSpacing:".06em"}}>{role}</span>}
        {isEnhanced&&<span style={{fontSize:9.5,fontWeight:700,padding:"1px 6px",borderRadius:3,background:`${C.accent}15`,color:C.accent,border:`1px solid ${C.accent}30`,letterSpacing:".06em"}}>ENHANCED</span>}
        {!done&&<span style={{fontSize:10,color:C.text3,fontFamily:"'Share Tech Mono',monospace"}}>STREAMING...</span>}
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
          {s.list.map((pv,i)=><AIBubble key={pv} provider={pv} text={gen(pv,query)} delay={(s.off+i)*1400} role={s.role(pv)} onRerun={onRerun} modes={modes} currentMode={currentMode}/>)}
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
              {nonE.map((pv,i)=><AIBubble key={pv} provider={pv} text={gen(pv,msg.query)} delay={i*1200} onRerun={mid=>handleRerun(msg.query,mid)} modes={MODES} currentMode={msg.mode}/>)}
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
