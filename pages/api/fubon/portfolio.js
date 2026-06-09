import { getPositions, getAvailableFunds } from '../../../lib/fubon-client';
import { PROFILE, monthProgress, daysToNextPayment, loanMonthsLeft } from '../../../lib/risk-manager';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  let positions = [];
  let funds     = { available: 0 };

  try {
    [positions, funds] = await Promise.all([getPositions(), getAvailableFunds()]);
  } catch (_) {
    // Fubon credentials not configured → return static profile data only
  }

  const marketValue  = positions.reduce((s, p) => s + (p.marketValue || 0), 0);
  const totalBalance = (funds.available || 0) + marketValue;
  const startBalance = parseFloat(req.query.startBalance) || totalBalance;

  res.json({
    positions,
    funds,
    summary:      PROFILE,
    loanStatus: {
      daysToPayment: daysToNextPayment(),
      monthsLeft:    loanMonthsLeft(),
    },
    monthProgress: monthProgress(totalBalance - startBalance),
    totalBalance,
    generatedAt:   new Date().toISOString(),
  });
}
