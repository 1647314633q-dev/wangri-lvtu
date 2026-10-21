import { callGemini } from './gemini.js'
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const enabled = env.AI_ENABLED === 'true' && !!env.GEMINI_API_KEY
    if (url.pathname === '/health' || url.pathname === '/api/status') {
      return json({ site: 'wangri-lvtu-hk', ok: true, ai: enabled ? 'gemini' : 'local', storage: 'browser-only' })
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
        const text = await callGemini({ prompt: input.prompt, json: !!input.json, apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL })
        return json({ text })
      } catch {
        return json({ error: 'AI 暫時未能使用，請使用原話整理。' }, 502)
      }
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404)
    return env.ASSETS.fetch(request)
  },
}
