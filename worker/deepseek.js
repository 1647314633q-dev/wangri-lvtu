// 呼叫 DeepSeek API（OpenAI 相容格式）。香港網絡可以直接用，唔使經美國伺服器。
export async function callDeepSeek({ prompt, json = false, apiKey, model }) {
  if (!apiKey) throw new Error('未設定 DEEPSEEK_API_KEY')
  if (!prompt || typeof prompt !== 'string' || prompt.length > 20000) throw new Error('bad prompt')
  const body = {
    model: model || 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    max_tokens: 1500,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  }
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(25000),
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((data.error && data.error.message) || ('DeepSeek API 出錯（' + r.status + '）'))
  const text = String(data.choices?.[0]?.message?.content || '').trim()
  if (!text) throw new Error('DeepSeek 冇回覆內容')
  return text
}
