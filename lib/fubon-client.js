/**
 * 富邦證券 API 客戶端
 * ─────────────────────────────────────────────────────────────
 * 環境變數 (.env.local):
 *   FUBON_ACCOUNT          帳號 (身份證字號)
 *   FUBON_PASSWORD         密碼
 *   FUBON_CERT_PASSWORD    憑證密碼 (如有)
 *   FUBON_API_URL          API base URL (預設 https://api.fubon.com)
 *   FUBON_SIM_MODE         '1' = 模擬下單模式 (測試用)
 * ─────────────────────────────────────────────────────────────
 */

const BASE = process.env.FUBON_API_URL || 'https://api.fubon.com';
const SIM  = process.env.FUBON_SIM_MODE === '1';

let _token       = null;
let _tokenExpiry = 0;

async function fubonRequest(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(_token && { Authorization: `Bearer ${_token}` }),
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Fubon API ${res.status}: ${body}`);
  }
  return res.json();
}

export async function fubonLogin() {
  const data = await fubonRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      account:  process.env.FUBON_ACCOUNT,
      password: process.env.FUBON_PASSWORD,
      certPwd:  process.env.FUBON_CERT_PASSWORD || '',
    }),
  });
  _token       = data.token;
  _tokenExpiry = Date.now() + (data.expiresIn || 3600) * 1000;
  return data;
}

async function ensureAuth() {
  if (!_token || Date.now() > _tokenExpiry - 60_000) await fubonLogin();
}

// ─── TWSE / OTC 即時報價 (公開 API，無需登入) ───────────────────

export async function getTWSEQuote(symbol) {
  const r1   = await fetch(
    `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${symbol}.tw&json=1&delay=0`
  );
  const d1   = await r1.json();
  const info = d1.msgArray?.[0];
  if (info) return _parseInfo(info);

  // fallback: 上櫃 (OTC)
  const r2 = await fetch(
    `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=otc_${symbol}.tw&json=1&delay=0`
  );
  const d2 = await r2.json();
  const i2 = d2.msgArray?.[0];
  if (!i2) throw new Error(`Symbol ${symbol} not found`);
  return _parseInfo(i2);
}

function _parseInfo(i) {
  const price  = parseFloat(i.z) || parseFloat(i.y);
  const close  = parseFloat(i.y);
  const change = +(price - close).toFixed(2);
  return {
    symbol:    i.c,
    name:      i.n,
    price,
    open:      parseFloat(i.o)  || close,
    high:      parseFloat(i.h)  || close,
    low:       parseFloat(i.l)  || close,
    close,
    volume:    parseInt(i.v)   || 0,
    change,
    changePct: +(change / close * 100).toFixed(2),
    ts:        new Date().toISOString(),
  };
}

// TWSE 歷史日K (最近 N 個月)
export async function getHistoricalData(symbol, months = 3) {
  const rows = [];
  const now  = new Date();
  for (let i = 0; i < months; i++) {
    const d    = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}01`;
    try {
      const r    = await fetch(
        `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${date}&stockNo=${symbol}`
      );
      const data = await r.json();
      if (data?.data) rows.push(...data.data);
    } catch (_) {}
  }
  return rows
    .map(r => ({
      date:   r[0],
      volume: parseInt(r[1].replace(/,/g, '')),
      open:   parseFloat(r[3].replace(/,/g, '')),
      high:   parseFloat(r[4].replace(/,/g, '')),
      low:    parseFloat(r[5].replace(/,/g, '')),
      close:  parseFloat(r[6].replace(/,/g, '')),
    }))
    .filter(r => !isNaN(r.close))
    .reverse();
}

// ─── 下單相關 ──────────────────────────────────────────────────

export async function placeOrder({ symbol, action, lots, price, orderType = 'limit' }) {
  if (SIM) {
    console.log('[SIM] Order:', { symbol, action, lots, price, orderType });
    return { orderId: `SIM-${Date.now()}`, status: 'simulated', symbol, action, lots, price };
  }
  await ensureAuth();
  return fubonRequest('/order', {
    method: 'POST',
    body: JSON.stringify({
      stockId:   symbol,
      buySell:   action === 'buy' ? 'B' : 'S',
      quantity:  lots,
      price,
      priceFlag: orderType === 'market' ? '0' : '2',
      tradeType: '0',
    }),
  });
}

export async function cancelOrder(orderId) {
  await ensureAuth();
  return fubonRequest(`/order/${orderId}`, { method: 'DELETE' });
}

export async function getPositions() {
  await ensureAuth();
  return fubonRequest('/portfolio/positions');
}

export async function getAvailableFunds() {
  await ensureAuth();
  return fubonRequest('/portfolio/funds');
}

export async function getTodayOrders() {
  await ensureAuth();
  return fubonRequest('/orders/today');
}
