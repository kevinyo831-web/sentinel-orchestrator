/**
 * 風險管理器
 * 用戶財務快照 (2026-06):
 *   資產 $1,468,850 / 負債 $1,251,431 / 淨值 $217,419
 *   月繳 $25,757 (每月8日) / 利率 2.99% / 餘額 $1,543,761
 */

export const PROFILE = {
  totalAssets:       1_468_850,
  totalLiabilities:  1_251_431,
  netWorth:            217_419,
  monthlyLoanPmt:       25_757,
  loanBalance:       1_543_761,
  loanRate:             0.0299,
  loanStartDate:   '2024-11-08',
  loanEndDate:     '2031-11-08',
  paidPeriods:             19,
  totalPeriods:            84,
  paymentDay:               8,
};

/** 月目標：貸款 × 1.3 (含30%緩衝) */
export function getMonthlyTarget() {
  return Math.ceil(PROFILE.monthlyLoanPmt * 1.3);
}

/** 建議最高交易資金 (淨值 60%) */
export function getMaxTradingCapital() {
  return Math.floor(PROFILE.netWorth * 0.6);
}

/** Half-Kelly 倉位計算，回傳建議投入金額 */
export function kellySize(winRate, avgWin, avgLoss, capital) {
  if (avgLoss === 0) return 0;
  const kelly    = winRate / avgLoss - (1 - winRate) / avgWin;
  const fraction = Math.max(0, Math.min(kelly * 0.5, 0.10));
  return Math.floor(capital * fraction);
}

/** 依單筆風險%計算最大股數 */
export function maxShares(capital, riskPct, entry, stopLoss) {
  const riskAmount = capital * (riskPct / 100);
  const priceRisk  = Math.abs(entry - stopLoss);
  if (priceRisk === 0) return 0;
  return Math.floor(riskAmount / priceRisk / 1000) * 1000;
}

/** ATR 停損價 */
export function atrStopLoss(entryPrice, atrValue, multiplier = 2) {
  return +(entryPrice - atrValue * multiplier).toFixed(2);
}

/** 本月損益進度 */
export function monthProgress(profit) {
  const target = getMonthlyTarget();
  return {
    profit,
    target,
    pct:       +(profit / target * 100).toFixed(1),
    remaining: Math.max(0, target - profit),
    achieved:  profit >= target,
  };
}

/** 月回撤是否超過上限 */
export function shouldPauseTrade(drawdownPct, maxPct = 10) {
  return drawdownPct >= maxPct;
}

/** 距下次繳款日 (天) */
export function daysToNextPayment() {
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), PROFILE.paymentDay);
  if (next <= now) next.setMonth(next.getMonth() + 1);
  return Math.ceil((next - now) / 86_400_000);
}

/** 貸款剩餘月數 */
export function loanMonthsLeft() {
  const end = new Date(PROFILE.loanEndDate);
  const now = new Date();
  return Math.max(0,
    (end.getFullYear() - now.getFullYear()) * 12 +
    (end.getMonth()   - now.getMonth())
  );
}
