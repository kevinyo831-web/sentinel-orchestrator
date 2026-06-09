/**
 * 技術指標與交易策略
 * 所有函數均為純函數，輸入收盤價陣列，輸出訊號
 */

// ─── 基礎指標 ─────────────────────────────────────────────────

export function sma(prices, period) {
  return prices.map((_, i) => {
    if (i < period - 1) return null;
    return +(prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period).toFixed(3);
  });
}

export function ema(prices, period) {
  const k = 2 / (period + 1);
  return prices.reduce((acc, p, i) => {
    acc.push(i === 0 ? p : +(p * k + acc[i - 1] * (1 - k)).toFixed(3));
    return acc;
  }, []);
}

export function rsi(prices, period = 14) {
  if (prices.length < period + 1) return prices.map(() => null);
  const deltas = prices.slice(1).map((p, i) => p - prices[i]);
  const gains  = deltas.map(d => d > 0 ? d : 0);
  const losses = deltas.map(d => d < 0 ? -d : 0);

  const result = Array(period).fill(null);
  let ag = gains.slice(0, period).reduce((a, b) => a + b) / period;
  let al = losses.slice(0, period).reduce((a, b) => a + b) / period;
  result.push(al === 0 ? 100 : +(100 - 100 / (1 + ag / al)).toFixed(2));

  for (let i = period; i < gains.length; i++) {
    ag = (ag * (period - 1) + gains[i])  / period;
    al = (al * (period - 1) + losses[i]) / period;
    result.push(al === 0 ? 100 : +(100 - 100 / (1 + ag / al)).toFixed(2));
  }
  return result;
}

export function macd(prices, fast = 12, slow = 26, signal = 9) {
  const fastE  = ema(prices, fast);
  const slowE  = ema(prices, slow);
  const line   = fastE.map((v, i) => +(v - slowE[i]).toFixed(3));
  const sigE   = ema(line.slice(slow - 1), signal);
  const sigFull = [...Array(slow - 1).fill(null), ...sigE];
  const hist   = line.map((v, i) => sigFull[i] == null ? null : +(v - sigFull[i]).toFixed(3));
  return { line, signal: sigFull, hist };
}

export function bollingerBands(prices, period = 20, dev = 2) {
  const mid = sma(prices, period);
  return prices.map((_, i) => {
    if (mid[i] == null) return { upper: null, mid: null, lower: null };
    const slice = prices.slice(i - period + 1, i + 1);
    const std   = Math.sqrt(slice.reduce((a, b) => a + (b - mid[i]) ** 2, 0) / period);
    return { upper: +(mid[i] + std * dev).toFixed(2), mid: +mid[i].toFixed(2), lower: +(mid[i] - std * dev).toFixed(2) };
  });
}

export function atr(highs, lows, closes, period = 14) {
  const tr = highs.map((h, i) =>
    i === 0 ? h - lows[i]
    : Math.max(h - lows[i], Math.abs(h - closes[i-1]), Math.abs(lows[i] - closes[i-1]))
  );
  const result = Array(period - 1).fill(null);
  let avg = tr.slice(0, period).reduce((a, b) => a + b) / period;
  result.push(+avg.toFixed(3));
  for (let i = period; i < tr.length; i++) {
    avg = (avg * (period - 1) + tr[i]) / period;
    result.push(+avg.toFixed(3));
  }
  return result;
}

// ─── 策略訊號 ─────────────────────────────────────────────────

/** SMA 黃金/死亡交叉 */
export function maCrossSignal(closes, shortP = 5, longP = 20) {
  const s = sma(closes, shortP);
  const l = sma(closes, longP);
  const n = closes.length - 1;
  if (!s[n] || !l[n] || !s[n-1] || !l[n-1]) return 'HOLD';
  if (s[n-1] <= l[n-1] && s[n] > l[n]) return 'BUY';   // 黃金交叉
  if (s[n-1] >= l[n-1] && s[n] < l[n]) return 'SELL';  // 死亡交叉
  return s[n] > l[n] ? 'HOLD_LONG' : 'HOLD_SHORT';
}

/** RSI 超買超賣 */
export function rsiSignal(closes, period = 14, oversold = 30, overbought = 70) {
  const vals = rsi(closes, period);
  const last = vals[vals.length - 1];
  const prev = vals[vals.length - 2];
  if (!last || !prev) return { signal: 'HOLD', rsi: null };
  if (prev <= oversold  && last > oversold)   return { signal: 'BUY',        rsi: last };
  if (prev >= overbought && last < overbought) return { signal: 'SELL',       rsi: last };
  if (last <= oversold)                        return { signal: 'WATCH_BUY',  rsi: last };
  if (last >= overbought)                      return { signal: 'WATCH_SELL', rsi: last };
  return { signal: 'HOLD', rsi: last };
}

/** MACD 柱翻正/負 */
export function macdSignal(closes) {
  const { hist } = macd(closes);
  const curr = hist[hist.length - 1];
  const prev = hist[hist.length - 2];
  if (curr == null || prev == null) return 'HOLD';
  if (prev < 0 && curr > 0) return 'BUY';
  if (prev > 0 && curr < 0) return 'SELL';
  return curr > 0 ? 'HOLD_LONG' : 'HOLD_SHORT';
}

/** 布林通道邊緣反彈 */
export function bbSignal(closes) {
  const bands = bollingerBands(closes);
  const b     = bands[closes.length - 1];
  const p     = closes[closes.length - 1];
  if (!b.upper) return 'HOLD';
  if (p <= b.lower) return 'BUY';
  if (p >= b.upper) return 'SELL';
  return 'HOLD';
}

/**
 * 綜合評分  -100 ~ +100
 * 每個策略最多貢獻 ±25 分
 */
export function compositeScore(closes) {
  const W = { BUY: 25, WATCH_BUY: 12, HOLD_LONG: 5, HOLD: 0, HOLD_SHORT: -5, WATCH_SELL: -12, SELL: -25 };
  const signals = {
    ma:   maCrossSignal(closes),
    rsi:  rsiSignal(closes).signal,
    macd: macdSignal(closes),
    bb:   bbSignal(closes),
  };
  const score = Object.values(signals).reduce((sum, s) => sum + (W[s] ?? 0), 0);
  return {
    score,
    signals,
    recommendation: score >= 25 ? 'BUY' : score <= -25 ? 'SELL' : score > 0 ? 'HOLD_LONG' : 'HOLD',
  };
}
