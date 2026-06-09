import { getTWSEQuote, getHistoricalData } from '../../../lib/fubon-client';

const CACHE     = new Map();
const CACHE_TTL = 30_000;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { symbol, history } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  const key    = `${symbol}:${history || 'live'}`;
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.json({ ...cached.data, cached: true });
  }

  try {
    const data = history
      ? await getHistoricalData(symbol, Math.min(parseInt(history) || 3, 12))
      : await getTWSEQuote(symbol);
    CACHE.set(key, { data, ts: Date.now() });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
