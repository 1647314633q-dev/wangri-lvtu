import { callGemini } from './gemini.js'
import { callDeepSeek } from './deepseek.js'
import { callWorkersAI } from './workers-ai.js'

// 用邊個 AI：AI_PROVIDER 指定；冇指定就：有 DeepSeek 金鑰用 DeepSeek，有 Gemini 金鑰用 Gemini，
// 兩樣都冇就用 Cloudflare Workers AI（免費額度，唔使金鑰）
function providerOf(env) {
  const p = env.AI_PROVIDER || (env.DEEPSEEK_API_KEY ? 'deepseek' : env.GEMINI_API_KEY ? 'gemini' : env.AI ? 'workers-ai' : '')
  if (p === 'deepseek' && env.DEEPSEEK_API_KEY) return 'deepseek'
  if (p === 'gemini' && env.GEMINI_API_KEY) return 'gemini'
  if (p === 'workers-ai' && env.AI) return 'workers-ai'
  return ''
}
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const provider = env.AI_ENABLED === 'true' ? providerOf(env) : ''
    const enabled = !!provider
    if (url.pathname === '/health' || url.pathname === '/api/status') {
      return json({ site: 'wangri-lvtu-hk', ok: true, ai: provider || 'local', storage: 'browser-only' })
    }
    if (url.pathname === '/api/ai') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
      const origin = request.headers.get('Origin')
      if (origin && origin !== url.origin) return json({ error: 'Forbidden' }, 403)
      if (!enabled) return json({ error: 'AI 未啟用；請使用原話整理。' }, 503)
      if (!request.headers.get('Content-Type')?.includes('application/json')) return json({ error: 'Expected JSON' }, 415)
      const reader = request.body?.getReader()
      if (!reader) return json({ error: 'Missing body' }, 400)
      let size = 0, chunks = []
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 96000) { await reader.cancel(); return json({ error: 'Request too large' }, 413) }
        chunks.push(value)
      }
      const bytes = new Uint8Array(size)
      let offset = 0
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
      let input
      try { input = JSON.parse(new TextDecoder().decode(bytes)) } catch { return json({ error: 'Invalid JSON' }, 400) }
      if (!input || typeof input.prompt !== 'string' || !input.prompt.trim() || input.prompt.length > 20000) return json({ error: 'Invalid prompt' }, 400)
      try {
        const args = { prompt: input.prompt, json: !!input.json }
        const text = provider === 'deepseek'
          ? await callDeepSeek({ ...args, apiKey: env.DEEPSEEK_API_KEY, model: env.DEEPSEEK_MODEL })
          : provider === 'workers-ai'
            ? await callWorkersAI({ ...args, ai: env.AI, model: env.WORKERS_AI_MODEL })
            : await callGemini({ ...args, apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL })
        return json({ text })
      } catch {
        return json({ error: 'AI 暫時未能使用，請使用原話整理。' }, 502)
      }
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404)
    return env.ASSETS.fetch(request)
  },
}
