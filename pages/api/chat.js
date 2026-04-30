// 真實 API 呼叫端點
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider, query } = req.body;

  const prompts = {
    gemini: `你是迪桑特的戰略長，為台灣籍材料總監提供戰略建議。必須包含：1)具體情報（兩岸局勢、油價、原物料數據）2)對迪桑特材料策略的影響 3)可執行行動方案。用繁體中文Markdown。`,
    nvidia: `你是營運長，給迪桑特材料總監執行建議。包含供應鏈管理、庫存策略、成本控制。用繁體中文Markdown。`,
    perplexity: `你是策略情報長，提供市場洞察。包含競爭對手動態（Nike/Adidas/優衣庫）、市場訊號。用繁體中文Markdown。`,
    grok: `你是創業家，主張快速行動。質疑過度分析、強調市場不等人。給迪桑特材料總監大膽建議。用繁體中文Markdown。`,
    openai: `你是風控長，關注長期主義。分析系統性風險、給迪桑特穩健建議。用繁體中文Markdown。`,
    vertex: `你是董事會主席，綜合所有視角。給迪桑特材料總監分層策略與執行方案。用繁體中文Markdown。`,
    local: `你是獨立顧問，回歸本質。給迪桑特戰略建議。用繁體中文Markdown。`
  };

  try {
    let response;
    const systemPrompt = prompts[provider] || '';

    switch(provider) {
      case 'gemini':
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n使用者問題：${query}` }] }]
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API 錯誤 (${response.status}): ${errorText}`);
        }
        
        const gData = await response.json();
        const text = gData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
          throw new Error(`Gemini 回應格式錯誤: ${JSON.stringify(gData)}`);
        }
        
        return res.json({ text });

      case 'perplexity':
        response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PERPLEXITY_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-large-128k-online',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: query }
            ]
          })
        });
        const pData = await response.json();
        return res.json({ text: pData.choices?.[0]?.message?.content || '無法生成回應' });

      case 'openai':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: query }
            ]
          })
        });
        const oData = await response.json();
        return res.json({ text: oData.choices?.[0]?.message?.content || '無法生成回應' });

      default:
        return res.json({ text: `${provider} API 尚未整合，暫時使用模擬回應。` });
    }
  } catch (error) {
    console.error(`Error calling ${provider}:`, error);
    return res.status(500).json({ 
      text: `⚠️ API 呼叫失敗\n\n錯誤：${error.message}\n\n請檢查 API Key 是否正確設定。` 
    });
  }
}
