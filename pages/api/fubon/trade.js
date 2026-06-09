import { placeOrder, cancelOrder, getTodayOrders } from '../../../lib/fubon-client';
import { getMaxTradingCapital, shouldPauseTrade }   from '../../../lib/risk-manager';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (req.query.action !== 'orders') return res.status(400).json({ error: 'unknown action' });
    try { return res.json(await getTodayOrders()); }
    catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'DELETE') {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId required' });
    try { return res.json(await cancelOrder(orderId)); }
    catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'POST') {
    const { symbol, side, lots, price, orderType = 'limit', drawdownPct = 0 } = req.body || {};
    if (!symbol || !side || !lots || !price)
      return res.status(400).json({ error: 'symbol, side, lots, price are required' });
    if (shouldPauseTrade(drawdownPct))
      return res.status(403).json({ error: `月回撤已達 ${drawdownPct}%，暫停下單保護資本` });
    const orderValue = lots * 1000 * price;
    const maxCap     = getMaxTradingCapital();
    if (orderValue > maxCap)
      return res.status(403).json({ error: `下單金額 $${orderValue.toLocaleString()} 超過建議上限 $${maxCap.toLocaleString()}` });
    try {
      const result = await placeOrder({ symbol, action: side, lots, price, orderType });
      return res.json({ success: true, ...result });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  res.status(405).end();
}
