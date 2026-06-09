import { getHistoricalData } from '../../../lib/fubon-client';
import { compositeScore }    from '../../../lib/strategies';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { symbols = [], aiQuery = '' } = req.body || {};

  const results = await Promise.allSettled(
    symbols.map(async sym => {
      const hist   = await getHistoricalData(sym, 3);
      const closes = hist.map(h => h.close);
      if (closes.length < 26) throw new Error(`Not enough data for ${sym}`);
      return { symbol: sym, lastClose: closes.at(-1), histLen: closes.length, ...compositeScore(closes) };
    })
  );

  const signals = results.map((r, i) => ({
    symbol: symbols[i],
    ...(r.status === 'fulfilled'
      ? r.value
      : { error: r.reason.message, score: 0, recommendation: 'HOLD', signals: {} }),
  }));

  let aiAnalysis = null;
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_KEY;
  if (aiQuery && geminiKey) {
    try {
      const prompt =
        `你是台股量化交易分析師。技術訊號如下：\n` +
        JSON.stringify(signals, null, 2) +
        `\n\n問題：${aiQuery}\n請給出具體操作建議，含進出場價位，150字以內。`;
      const gr = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
      );
      const gd = await gr.json();
      aiAnalysis = gd.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch (_) {}
  }

  res.json({ signals, aiAnalysis, generatedAt: new Date().toISOString() });
}
