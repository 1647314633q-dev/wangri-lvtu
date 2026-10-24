// Cloudflare Workers AI：用 Cloudflare 帳戶本身嘅免費額度（唔使金鑰；免費計劃每日有額度，UTC 零時重置）。
// 型號可以喺 wrangler.toml 嘅 WORKERS_AI_MODEL 改；第一個用唔到就試下一個。
const FALLBACK = ['@cf/qwen/qwen3-30b-a3b-fp8', '@cf/meta/llama-3.3-70b-instruct-fp8-fast']

function textOf(r) {
  const t = typeof r === 'string' ? r
    : typeof r?.response === 'string' ? r.response
    : r?.response && typeof r.response === 'object' ? JSON.stringify(r.response)
    : r?.choices?.[0]?.message?.content || r?.result?.response || ''
  return String(t).replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}

export async function callWorkersAI({ prompt, json = false, ai, model }) {
  if (!ai) throw new Error('未設定 Workers AI')
  if (!prompt || typeof prompt !== 'string' || prompt.length > 20000) throw new Error('bad prompt')
  const models = [...new Set([model, ...FALLBACK].filter(Boolean))]
  const messages = [
    { role: 'system', content: '你係香港長者回憶遊戲嘅助手。只用繁體中文同香港廣東話口語回答，唔好夾雜任何英文字。' + (json ? '只回覆 JSON，唔好加其他文字。' : '') },
    { role: 'user', content: prompt },
  ]
  let last
  for (const m of models) {
    try {
      const text = textOf(await ai.run(m, { messages, max_tokens: 1500, temperature: 0.6 }))
      if (text) return text
      last = new Error('冇回覆內容')
    } catch (e) { last = e }
  }
  throw last || new Error('Workers AI 用唔到')
}
