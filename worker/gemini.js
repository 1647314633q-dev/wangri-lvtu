// 共用：呼叫 Google Gemini API（Cloudflare Worker 同本機伺服器都用呢個）
export async function callGemini({ prompt, json = false, apiKey, model }) {
  if (!apiKey) throw new Error('未設定 GEMINI_API_KEY')
  if (!prompt || typeof prompt !== 'string' || prompt.length > 20000) throw new Error('bad prompt')
  const m = model || 'gemini-3.6-flash'
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 1500, ...(json ? { responseMimeType: 'application/json' } : {}) },
  }
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((data.error && data.error.message) || ('Gemini API 出錯（' + r.status + '）'))
  const text = ((data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [])
    .map(p => p.text || '').join('').trim()
  if (!text) throw new Error('Gemini 冇回覆內容')
  return text
}
