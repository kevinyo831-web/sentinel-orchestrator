import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';

const C = {
  bg:'#07080C', panel:'#0C0D12', surface:'#10111A',
  border:'#1A1C28', border2:'#252838',
  accent:'#00E5A0', accent2:'#00B8D4',
  warn:'#FF3D5A', warn2:'#FF8C00',
  dim:'#2A2D3A', text:'#C0C4D8', text2:'#6B7094', text3:'#3E4260',
  white:'#E8EAF0',
  glow:'0 0 12px rgba(0,229,160,.15)',
  warnGlow:'0 0 12px rgba(255,61,90,.20)',
};

const WATCHLIST = [
  { symbol:'0050', name:'元大台灣50' },
  { symbol:'0056', name:'元大高股息' },
  { symbol:'2330', name:'台積電'    },
  { symbol:'2317', name:'鴻海'      },
  { symbol:'2454', name:'聯發科'    },
  { symbol:'2412', name:'中華電'    },
];

const MONTHLY_LOAN   = 25_757;
const MONTHLY_TARGET = Math.ceil(MONTHLY_LOAN * 1.3);
const MAX_CAPITAL    = 130_451;

const iSt = {
  background:C.surface, border:`1px solid ${C.border}`, borderRadius:3,
  padding:'7px 10px', color:C.white, fontSize:12, outline:'none',
  fontFamily:"'Share Tech Mono',monospace", width:'100%', boxSizing:'border-box',
};

function Tag({ label, color=C.accent }) {
  return <span style={{
    fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:3,
    background:`${color}18`, color, border:`1px solid ${color}30`,
    letterSpacing:'.07em', fontFamily:"'Share Tech Mono',monospace",
  }}>{label}</span>;
}

function SignalBadge({ rec }) {
  const map = { BUY:C.accent, SELL:C.warn, HOLD_LONG:C.accent2, HOLD:C.text3, HOLD_SHORT:C.warn2 };
  const col = map[rec] || C.text3;
  return <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
    <span style={{ width:7, height:7, borderRadius:'50%', background:col, boxShadow:`0 0 5px ${col}` }} />
    <span style={{ fontSize:10, fontWeight:700, color:col, fontFamily:"'Share Tech Mono',monospace" }}>{rec||'---'}</span>
  </span>;
}

function LoanTracker({ profit=0 }) {
  const pct      = Math.max(0, Math.min(100, profit / MONTHLY_TARGET * 100));
  const achieved = profit >= MONTHLY_TARGET;
  const daysLeft = (() => {
    const now  = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), 8);
    if (next <= now) next.setMonth(next.getMonth() + 1);
    return Math.ceil((next - now) / 86_400_000);
  })();
  return (
    <div style={{ background:C.panel, border:`1px solid ${achieved?C.accent+'40':C.border}`,
      borderRadius:6, padding:'14px 18px', boxShadow:achieved?C.glow:'none' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Tag label="LOAN TARGET" color={achieved?C.accent:C.warn2} />
          <span style={{ fontSize:11, color:C.text2, fontFamily:"'Share Tech Mono',monospace" }}>
            月繳 ${MONTHLY_LOAN.toLocaleString()} ／ 月目標 ${MONTHLY_TARGET.toLocaleString()}
          </span>
        </div>
        <Tag label={`繳款日 D-${daysLeft}`} color={daysLeft<=5?C.warn:C.text3} />
      </div>
      <div style={{ height:6, background:C.surface, borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, borderRadius:3, transition:'width .6s ease',
          background:achieved?C.accent:pct>60?C.accent2:C.warn2,
          boxShadow:`0 0 8px ${achieved?C.accent:C.warn2}` }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
        <span style={{ fontSize:11, color:profit>=0?C.accent:C.warn,
          fontFamily:"'Share Tech Mono',monospace", fontWeight:700 }}>
          本月損益 {profit>=0?'+':''}{profit.toLocaleString()}
        </span>
        <span style={{ fontSize:10, color:C.text3, fontFamily:"'Share Tech Mono',monospace" }}>
          {pct.toFixed(1)}% 完成 · 還差 ${Math.max(0,MONTHLY_TARGET-profit).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function Card({ label, value, sub, color=C.text, icon='' }) {
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:6, padding:'14px 16px' }}>
      <div style={{ fontSize:9, fontWeight:700, color:C.text3, letterSpacing:'.12em',
        fontFamily:"'Share Tech Mono',monospace", marginBottom:6 }}>{icon} {label}</div>
      <div style={{ fontSize:17, fontWeight:700, color, fontFamily:"'Orbitron',sans-serif",
        letterSpacing:'.03em', lineHeight:1.2 }}>{value}</div>
      {sub&&<div style={{ fontSize:10, color:C.text3, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

const COLS = '76px 1fr 80px 70px 110px 90px';

function StockHeader() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:COLS, padding:'5px 12px', marginBottom:2 }}>
      {['代號','名稱','現價','漲跌%','訊號','操作'].map((h,i)=>(
        <span key={i} style={{ fontSize:9, color:C.text3, letterSpacing:'.07em',
          textAlign:i>=2?'right':'left',
          ...(i===4&&{textAlign:'center'}), ...(i===5&&{textAlign:'right'}),
        }}>{h}</span>
      ))}
    </div>
  );
}

function Btn({ label, color, onClick, disabled, full }) {
  return <button onClick={onClick} disabled={disabled} style={{
    fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:3,
    background:`${color}18`, border:`1px solid ${color}35`, color,
    cursor:disabled?'default':'pointer', letterSpacing:'.06em',
    fontFamily:"'Share Tech Mono',monospace", transition:'all .12s',
    opacity:disabled?.4:1, width:full?'100%':undefined,
  }}>{label}</button>;
}

function StockRow({ quote, signal, selected, onClick, onTrade }) {
  const up  = (quote?.change??0) >= 0;
  const col = up ? C.accent : C.warn;
  return (
    <div onClick={onClick} style={{
      display:'grid', gridTemplateColumns:COLS, alignItems:'center',
      padding:'9px 12px', cursor:'pointer', borderRadius:4, marginBottom:1,
      background:selected?`${C.accent}07`:'transparent',
      border:`1px solid ${selected?C.accent+'22':'transparent'}`,
      transition:'background .12s',
    }}>
      <span style={{ fontSize:12, fontWeight:700, color:C.white, fontFamily:"'Share Tech Mono',monospace" }}>
        {quote?.symbol??'...'}
      </span>
      <span style={{ fontSize:11, color:C.text2, fontFamily:"'Noto Sans TC',sans-serif",
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{quote?.name??'-'}</span>
      <span style={{ fontSize:13, fontWeight:700, color:col, textAlign:'right',
        fontFamily:"'Share Tech Mono',monospace" }}>
        {quote?.price!=null?quote.price.toFixed(2):'---'}
      </span>
      <span style={{ fontSize:11, color:col, textAlign:'right', fontFamily:"'Share Tech Mono',monospace" }}>
        {quote?.changePct!=null?`${quote.changePct>=0?'+':''}${quote.changePct}%`:'---'}
      </span>
      <div style={{ display:'flex', justifyContent:'center' }}>
        {signal?<SignalBadge rec={signal.recommendation}/>:<span style={{ fontSize:10, color:C.text3 }}>--</span>}
      </div>
      <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
        <Btn label="買" color={C.accent} onClick={e=>{ e.stopPropagation(); onTrade('buy',quote); }} />
        <Btn label="賣" color={C.warn}   onClick={e=>{ e.stopPropagation(); onTrade('sell',quote); }} />
      </div>
    </div>
  );
}

function TradeModal({ quote, side, onClose, onConfirm, busy }) {
  const [lots,  setLots]  = useState('1');
  const [price, setPrice] = useState(quote?.price?.toFixed(2)||'');
  const [type,  setType]  = useState('limit');
  const isBuy = side === 'buy';
  const color = isBuy ? C.accent : C.warn;
  const total = (parseInt(lots)||0) * 1000 * (parseFloat(price)||0);
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200,
      background:'rgba(0,0,0,.72)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:360, background:C.panel, border:`1px solid ${color}40`,
        borderRadius:8, padding:24, boxShadow:isBuy?C.glow:C.warnGlow,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Tag label={isBuy?'BUY':'SELL'} color={color} />
            <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:700, color:C.white }}>
              {quote?.symbol} {quote?.name}
            </span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none',
            color:C.text3, cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
        </div>
        <div style={{ display:'grid', gap:12 }}>
          <div>
            <div style={{ fontSize:9, color:C.text3, letterSpacing:'.1em', marginBottom:5 }}>ORDER TYPE</div>
            <div style={{ display:'flex', gap:6 }}>
              {['limit','market'].map(t=>(
                <button key={t} onClick={()=>setType(t)} style={{
                  flex:1, padding:'6px', borderRadius:3, cursor:'pointer', fontSize:10,
                  fontWeight:700, fontFamily:"'Share Tech Mono',monospace", letterSpacing:'.06em',
                  textTransform:'uppercase',
                  background:type===t?`${color}20`:C.surface,
                  border:`1px solid ${type===t?color+'50':C.border}`,
                  color:type===t?color:C.text2,
                }}>{t==='limit'?'限價':'市價'}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:9, color:C.text3, letterSpacing:'.1em', marginBottom:5 }}>LOTS (張)</div>
            <input type="number" min="1" value={lots} onChange={e=>setLots(e.target.value)} style={iSt} />
          </div>
          {type==='limit'&&(
            <div>
              <div style={{ fontSize:9, color:C.text3, letterSpacing:'.1em', marginBottom:5 }}>PRICE</div>
              <input type="number" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} style={iSt} />
            </div>
          )}
          <div style={{ padding:'10px 12px', background:C.surface, borderRadius:4, border:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
              <span style={{ color:C.text3, fontFamily:"'Share Tech Mono',monospace" }}>預計金額</span>
              <span style={{ color:C.white, fontWeight:700, fontFamily:"'Share Tech Mono',monospace" }}>
                ${total.toLocaleString()}
              </span>
            </div>
            {total>MAX_CAPITAL&&(
              <div style={{ marginTop:6, fontSize:10, color:C.warn2, fontFamily:"'Share Tech Mono',monospace" }}>
                ⚠ 超過建議上限 ${MAX_CAPITAL.toLocaleString()}
              </div>
            )}
          </div>
        </div>
        <button disabled={busy||!lots||!price}
          onClick={()=>onConfirm({ symbol:quote.symbol, side, lots:parseInt(lots), price:parseFloat(price), type })}
          style={{ marginTop:16, width:'100%', padding:'10px', borderRadius:4,
            background:`${color}20`, border:`1px solid ${color}55`,
            color, fontSize:12, fontWeight:700, cursor:busy?'wait':'pointer',
            fontFamily:"'Orbitron',sans-serif", letterSpacing:'.08em',
            boxShadow:isBuy?C.glow:C.warnGlow, opacity:busy?.6:1,
          }}>
          {busy?'SENDING...':(`確認${isBuy?'買進':'賣出'}`)}
        </button>
      </div>
    </div>
  );
}

function AIPanel({ symbols }) {
  const [query,    setQuery]    = useState('請分析這些台股目前的買賣時機，並考慮我每月需獲利 $33,484 以支付貸款，給出具體操作建議');
  const [analysis, setAnalysis] = useState('');
  const [loading,  setLoading]  = useState(false);
  const run = useCallback(async () => {
    setLoading(true); setAnalysis('');
    try {
      const r = await fetch('/api/fubon/signals', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ symbols, aiQuery:query }),
      });
      const d = await r.json();
      setAnalysis(d.aiAnalysis || d.signals?.map(s=>`${s.symbol}: ${s.recommendation} (score ${s.score})`).join('\n'));
    } catch(e) {
      setAnalysis(`⚠ 分析失敗: ${e.message}`);
    } finally { setLoading(false); }
  }, [symbols, query]);
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:6, padding:16, marginTop:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <Tag label="AI ANALYSIS" color={C.accent2} />
        <span style={{ fontSize:10, color:C.text3 }}>Gemini 量化評析</span>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <input value={query} onChange={e=>setQuery(e.target.value)}
          style={{ ...iSt, flex:1, width:undefined }}
          placeholder="輸入分析問題…" />
        <button onClick={run} disabled={loading} style={{
          background:loading?C.dim:`${C.accent2}20`,
          border:`1px solid ${loading?C.border:C.accent2+'50'}`,
          color:loading?C.text3:C.accent2, borderRadius:4,
          padding:'7px 14px', cursor:loading?'default':'pointer',
          fontSize:10, fontWeight:700, fontFamily:"'Share Tech Mono',monospace",
          letterSpacing:'.06em', whiteSpace:'nowrap',
        }}>{loading?'ANALYZING…':'ANALYZE'}</button>
      </div>
      {analysis&&(
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:4,
          padding:'12px 14px', fontSize:12.5, lineHeight:1.85, color:C.text,
          fontFamily:"'Noto Sans TC',sans-serif", whiteSpace:'pre-wrap',
          maxHeight:220, overflowY:'auto' }}>{analysis}</div>
      )}
    </div>
  );
}

function Toast({ msg, type }) {
  const color = type==='error'?C.warn:type==='warn'?C.warn2:C.accent;
  return <div style={{ position:'fixed', bottom:24, right:24, zIndex:999,
    background:C.panel, border:`1px solid ${color}40`, borderRadius:6,
    padding:'12px 18px', fontSize:12, color,
    fontFamily:"'Share Tech Mono',monospace",
    animation:'fadeIn .25s ease', boxShadow:`0 0 14px ${color}25`,
  }}>{msg}</div>;
}

export default function TradingPage() {
  const [quotes,      setQuotes]      = useState({});
  const [signals,     setSignals]     = useState({});
  const [selected,    setSelected]    = useState(null);
  const [modal,       setModal]       = useState(null);
  const [busy,        setBusy]        = useState(false);
  const [toast,       setToast]       = useState(null);
  const [monthProfit, setMonthProfit] = useState(0);
  const [autoMode,    setAutoMode]    = useState(false);
  const timer = useRef(null);

  const notify = (msg, type='info') => {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3500);
  };

  const fetchQuotes = useCallback(async () => {
    for (const s of WATCHLIST) {
      try {
        const r = await fetch(`/api/fubon/market?symbol=${s.symbol}`);
        const d = await r.json();
        setQuotes(q=>({ ...q, [s.symbol]:{ ...d, name:s.name } }));
      } catch(_) {}
    }
  }, []);

  const fetchSignals = useCallback(async () => {
    try {
      const r = await fetch('/api/fubon/signals', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ symbols:WATCHLIST.map(s=>s.symbol) }),
      });
      const d   = await r.json();
      const map = {};
      d.signals?.forEach(s=>{ map[s.symbol]=s; });
      setSignals(map);
    } catch(_) {}
  }, []);

  useEffect(() => {
    fetchQuotes();
    fetchSignals();
    timer.current = setInterval(fetchQuotes, 30_000);
    return () => clearInterval(timer.current);
  }, [fetchQuotes, fetchSignals]);

  const handleConfirm = async ({ symbol, side, lots, price, type }) => {
    setBusy(true);
    try {
      const r = await fetch('/api/fubon/trade', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ symbol, side, lots, price, orderType:type }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      notify(`✓ ${side==='buy'?'買進':'賣出'} ${symbol} × ${lots} 張`, 'success');
      setModal(null);
    } catch(e) {
      notify(`⚠ ${e.message}`, 'error');
    } finally { setBusy(false); }
  };

  return (
    <>
      <Head>
        <title>富邦 AI Pro Trading — Sentinel</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>
      <div style={{ minHeight:'100vh', background:C.bg, color:C.text,
        fontFamily:"'Share Tech Mono','Noto Sans TC',monospace" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Noto+Sans+TC:wght@400;500;700&family=Orbitron:wght@400;600;700;900&display=swap');
          *{box-sizing:border-box;margin:0;padding:0}
          ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:9px}
          @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
          @keyframes glow{0%,100%{opacity:.5}50%{opacity:1}}
          @media(max-width:768px){.grid2{grid-template-columns:1fr!important}}
        `}</style>

        {/* HEADER */}
        <header style={{ height:56, display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 20px', borderBottom:`1px solid ${C.border}`,
          background:`${C.bg}F0`, backdropFilter:'blur(8px)',
          position:'sticky', top:0, zIndex:50 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <a href="/" style={{ textDecoration:'none', fontSize:10, color:C.text3,
              padding:'3px 8px', border:`1px solid ${C.border}`, borderRadius:3 }}>← SENTINEL</a>
            <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:700,
              color:C.accent, letterSpacing:'.06em' }}>富邦 AI PRO</span>
            <Tag label="AUTO TRADING" />
            <Tag label="SIM MODE" color={C.warn2} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:C.accent,
              animation:'glow 2s ease-in-out infinite', boxShadow:`0 0 6px ${C.accent}` }} />
            <span style={{ fontSize:10, color:C.accent, letterSpacing:'.08em' }}>LIVE</span>
            <button onClick={()=>{ setAutoMode(v=>!v); notify(autoMode?'自動交易已暫停':'自動交易已啟動 (模擬)'); }} style={{
              padding:'4px 12px', borderRadius:3, fontSize:10, fontWeight:700,
              cursor:'pointer', letterSpacing:'.06em', fontFamily:"'Share Tech Mono',monospace",
              background:autoMode?`${C.accent}20`:C.surface,
              border:`1px solid ${autoMode?C.accent+'50':C.border}`,
              color:autoMode?C.accent:C.text2,
            }}>{autoMode?'■ STOP':'▶ AUTO'}</button>
          </div>
        </header>

        <div style={{ maxWidth:1200, margin:'0 auto', padding:'20px 16px', animation:'fadeIn .5s ease' }}>

          {/* LOAN PROGRESS */}
          <div style={{ marginBottom:14 }}><LoanTracker profit={monthProfit} /></div>

          {/* SUMMARY CARDS */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(168px,1fr))', gap:10, marginBottom:16 }}>
            <Card icon="▲" label="資產總額" value="$1,468,850" sub="約當台幣"              color={C.accent}  />
            <Card icon="▼" label="負債總額" value="$1,251,431" sub="貸款餘額 $1,543,761"  color={C.warn}   />
            <Card icon="◈" label="淨資產"   value="$217,419"   sub="資產 − 負債"          color={C.white}  />
            <Card icon="◎" label="貸款進度" value="22.6%"      sub="已繳 19/84 期 · 2031/11 到期" color={C.accent2} />
            <Card icon="⬡" label="月繳壓力" value="$25,757"    sub="利率 2.99% · 剩 65 期"       color={C.warn2}  />
          </div>

          {/* MAIN GRID */}
          <div className="grid2" style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:16 }}>

            {/* LEFT */}
            <div>
              <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:6, overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'11px 14px', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Tag label="WATCHLIST" />
                    <span style={{ fontSize:10, color:C.text3 }}>台股監控 · 每30秒更新</span>
                  </div>
                  <button onClick={()=>{ fetchQuotes(); fetchSignals(); }} style={{
                    background:'none', border:'none', color:C.accent2,
                    fontSize:10, cursor:'pointer', fontFamily:"'Share Tech Mono',monospace" }}>↻ REFRESH</button>
                </div>
                <div style={{ padding:'6px 8px' }}>
                  <StockHeader />
                  {WATCHLIST.map(s=>(
                    <StockRow key={s.symbol}
                      quote={quotes[s.symbol]||{ symbol:s.symbol, name:s.name }}
                      signal={signals[s.symbol]}
                      selected={selected===s.symbol}
                      onClick={()=>setSelected(v=>v===s.symbol?null:s.symbol)}
                      onTrade={(side,q)=>setModal({ quote:q||{ symbol:s.symbol, name:s.name, price:0 }, side })}
                    />
                  ))}
                </div>
              </div>
              <AIPanel symbols={WATCHLIST.map(s=>s.symbol)} />
            </div>

            {/* RIGHT */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Loan detail */}
              <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:6, padding:16 }}>
                <Tag label="LOAN DETAIL" color={C.warn2} />
                <div style={{ marginTop:12 }}>
                  {[
                    ['貸款金額','$1,950,000'],
                    ['貸款餘額','$1,543,761'],
                    ['月繳金額',`$${(25_757).toLocaleString()}`],
                    ['貸款利率','2.99% / 年'],
                    ['撥款日期','2024/11/08'],
                    ['到期日期','2031/11/08'],
                    ['已繳期數','19 期 / 共 84 期'],
                    ['下次扣款','2026/07/08'],
                  ].map(([k,v])=>(
                    <div key={k} style={{ display:'flex', justifyContent:'space-between',
                      padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
                      <span style={{ fontSize:11, color:C.text3 }}>{k}</span>
                      <span style={{ fontSize:11, color:C.white, fontWeight:700,
                        fontFamily:"'Share Tech Mono',monospace" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategies */}
              <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:6, padding:16 }}>
                <Tag label="STRATEGIES" color={C.accent} />
                <div style={{ marginTop:12, display:'grid', gap:6 }}>
                  {[
                    { name:'SMA 均線交叉',  desc:'5日/20日黃金交叉',    risk:'LOW',  active:true  },
                    { name:'RSI 超賣反彈',  desc:'RSI < 30 進場',       risk:'MED',  active:true  },
                    { name:'MACD 動能跟蹤', desc:'MACD 柱翻正入場',     risk:'MED',  active:false },
                    { name:'AI 量化選股',   desc:'Gemini 分析進出場時機', risk:'HIGH', active:false },
                  ].map(s=>(
                    <div key={s.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'9px 10px', background:C.surface, borderRadius:4,
                      border:`1px solid ${s.active?C.accent+'22':C.border}` }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontSize:11, fontWeight:700, color:C.white }}>{s.name}</span>
                          {s.active&&<Tag label="ON" color={C.accent} />}
                        </div>
                        <div style={{ fontSize:10, color:C.text3, marginTop:2 }}>{s.desc}</div>
                      </div>
                      <Tag label={s.risk} color={s.risk==='LOW'?C.accent:s.risk==='MED'?C.warn2:C.warn} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk notice */}
              <div style={{ background:`${C.warn}04`, border:`1px solid ${C.warn}20`, borderRadius:6, padding:'14px 16px' }}>
                <Tag label="RISK NOTICE" color={C.warn} />
                <div style={{ marginTop:10, fontSize:11, color:C.text2, lineHeight:1.8,
                  fontFamily:"'Noto Sans TC',sans-serif" }}>
                  <p>• 建議交易資金：<b style={{ color:C.warn2 }}>$130,451</b>（淨值60%）</p>
                  <p>• 單筆最大損失：<b style={{ color:C.warn2 }}>2%</b>（$2,609）</p>
                  <p>• 月回撤暫停線：<b style={{ color:C.warn }}>10%</b>（$13,045）</p>
                  <p>• 月獲利目標：<b style={{ color:C.accent }}>$33,484</b>（貸款×1.3）</p>
                  <p style={{ marginTop:8, fontSize:10, color:C.text3,
                    fontFamily:"'Share Tech Mono',monospace" }}>⚠ 交易有風險，本系統不保證獲利。貸款壓力大時優先控制虧損。</p>
                </div>
              </div>

              {/* Manual P&L input */}
              <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:6, padding:16 }}>
                <Tag label="MONTH P&L" color={C.accent} />
                <div style={{ marginTop:10, display:'flex', gap:8, alignItems:'center' }}>
                  <input type="number" value={monthProfit}
                    onChange={e=>setMonthProfit(parseFloat(e.target.value)||0)}
                    style={{ ...iSt, flex:1, width:undefined }}
                    placeholder="本月損益 (TWD)" />
                  <Btn label="SET" color={C.accent} onClick={()=>notify('損益已更新')} />
                </div>
                <p style={{ fontSize:10, color:C.text3, marginTop:6, fontFamily:"'Noto Sans TC',sans-serif" }}>
                  手動輸入本月損益以追蹤目標進度
                </p>
              </div>
            </div>
          </div>
        </div>

        {modal&&<TradeModal quote={modal.quote} side={modal.side} busy={busy}
          onClose={()=>setModal(null)} onConfirm={handleConfirm} />}
        {toast&&<Toast msg={toast.msg} type={toast.type} />}
      </div>
    </>
  );
}
