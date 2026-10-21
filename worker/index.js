// Cloudflare Worker：提供網站（dist 資料夾）同 /api/ai（經 Gemini 整理回憶）
// 部署：npx wrangler deploy　　設定密鑰：npx wrangler secret put GEMINI_API_KEY
import { callGemini } from './gemini.js'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/ai') {
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
      try {
        const { prompt, json } = await request.json()
        const text = await callGemini({ prompt, json: !!json, apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL })
        return Response.json({ text })
      } catch (e) {
        return Response.json({ error: String((e && e.message) || e) }, { status: 500 })
      }
    }
    return env.ASSETS.fetch(request)
  },
}
