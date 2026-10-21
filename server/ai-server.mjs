// 可選：本機 AI 伺服器（Gemini），開發時用。
// 用法：
//   GEMINI_API_KEY=你的key npm run ai-server
//   另一個視窗：VITE_AI_ENDPOINT=http://127.0.0.1:8787/api/ai npm run dev
// 注意：Gemini API 唔接受香港 IP，喺香港本機測試要經支援地區嘅網絡。
import http from 'node:http'
import { callGemini } from '../worker/gemini.js'

const KEY = process.env.GEMINI_API_KEY
const PORT = Number(process.env.PORT || 8787)
if (!KEY) { console.error('請先設定 GEMINI_API_KEY'); process.exit(1) }

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }
  if (req.method !== 'POST' || req.url !== '/api/ai') { res.writeHead(404); return res.end() }
  let body = ''
  for await (const chunk of req) body += chunk
  try {
    const { prompt, json } = JSON.parse(body || '{}')
    const text = await callGemini({ prompt, json: !!json, apiKey: KEY, model: process.env.GEMINI_MODEL })
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ text }))
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ error: String(e.message || e) }))
  }
}).listen(PORT, '127.0.0.1', () => console.log('AI 伺服器（Gemini）：http://127.0.0.1:' + PORT + '/api/ai'))
