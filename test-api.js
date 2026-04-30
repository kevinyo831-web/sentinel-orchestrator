// 測試 Gemini API
const apiKey = process.env.NEXT_PUBLIC_GEMINI_KEY || 'YOUR_KEY_HERE';

async function testGemini() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ 
        parts: [{ text: '請用繁體中文簡單回答：台灣在哪裡？' }] 
      }]
    })
  });
  
  const data = await response.json();
  console.log('API 回應:', JSON.stringify(data, null, 2));
}

testGemini().catch(console.error);
