import test from 'node:test'
import assert from 'node:assert/strict'
import worker from '../worker/index.js'
import { generateStory, personalizeQuestion, nextInterviewStep } from '../src/lib/ai.js'
import { memoirText } from '../src/lib/export.js'

const env = { AI_ENABLED: 'false', ASSETS: { fetch: () => new Response('asset') } }
const req = (path, body, origin = 'https://game.example') => new Request('https://game.example' + path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body) })

test('disabled AI reports local mode even if a key is present', async () => {
  const r = await worker.fetch(req('/api/status'), { ...env, GEMINI_API_KEY: 'test-only' })
  assert.equal((await r.json()).ai, 'local')
  assert.equal(r.headers.get('Cache-Control'), 'no-store')
  assert.equal((await worker.fetch(req('/api/ai', { prompt: '記憶' }), env)).status, 503)
})
test('API rejects wrong methods, cross-origin requests and unknown routes', async () => {
  assert.equal((await worker.fetch(req('/api/ai'), env)).status, 405)
  assert.equal((await worker.fetch(req('/api/ai', {}, 'https://other.example'), env)).status, 403)
  assert.equal((await worker.fetch(req('/api/missing'), env)).status, 404)
  assert.equal(await (await worker.fetch(req('/'), env)).text(), 'asset')
})
test('enabled API validates bodies before attempting an upstream call', async () => {
  const enabled = { ...env, AI_ENABLED: 'true', GEMINI_API_KEY: 'test-only' }
  assert.equal((await worker.fetch(req('/api/ai', null), enabled)).status, 400)
  assert.equal((await worker.fetch(req('/api/ai', { prompt: 7 }), enabled)).status, 400)
  assert.equal((await worker.fetch(req('/api/ai', { prompt: 'x'.repeat(96001) }), enabled)).status, 413)
})
test('upstream errors do not disclose provider details', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('private upstream detail') }
  try {
    const r = await worker.fetch(req('/api/ai', { prompt: '記憶' }), { ...env, AI_ENABLED: 'true', GEMINI_API_KEY: 'test-only' })
    assert.equal(r.status, 502)
    assert.ok(!(await r.text()).includes('private upstream'))
  } finally { globalThis.fetch = original }
})
test('story fallback keeps first-person words and does not invent school metadata', async () => {
  const r = await generateStory([{ name: '學校', meta: true, text: '不應自動寫入' }, { name: '屋企', text: '我記得同妹妹喺屋企食飯' }], { birthYear: 1945 })
  assert.equal(r.source, 'local')
  assert.equal(r.text, '我記得同妹妹喺屋企食飯。')
})
test('interview and memory prompts work with no AI', async () => {
  assert.equal(await personalizeQuestion({ name: '書包', question: '記得嗎？' }, '背景'), null)
  assert.equal((await nextInterviewStep([], ['你記得乜嘢？'], 0, '')).question, '你記得乜嘢？')
})
test('export includes edited stories and original memories from both chapters', () => {
  const p = { cfg: { items: [{ id: 'home', name: '屋企' }, { id: 'skip', name: '跳過' }] }, storyTitle: '童年', data: { story: { text: '修改後嘅故事' }, memories: { home: { status: 'shared', text: '我同妹妹食飯' }, skip: { status: 'skipped' } } } }
  const text = memoirText({ childhood: p, learning: { ...p, storyTitle: '求學', data: { ...p.data, interview: [{ q: '離校後？', a: '我跟師傅學手藝' }], extra: { text: '難忘嘅老師' } } } })
  for (const word of ['修改後嘅故事', '我同妹妹食飯', '求學', '我跟師傅學手藝', '難忘嘅老師']) assert.ok(text.includes(word))
  assert.ok(!text.includes('undefined'))
})
test('export includes shared family memories only', () => {
  const p = { cfg: { items: [] }, storyTitle: '童年', data: { memories: {} }, family: { father: { status: 'shared', text: '爸爸做木工', follow: [{ q: '教過你咩？', a: '刨木' }] }, mother: { status: 'skipped' } } }
  const text = memoirText({ childhood: p })
  assert.ok(text.includes('我的家庭 · 爸爸：爸爸做木工'))
  assert.ok(text.includes('刨木'))
  assert.ok(!text.includes('媽媽'))
})

test('有 DeepSeek 金鑰：/api/status 報 deepseek，並用 DeepSeek 格式呼叫', async () => {
  const original = globalThis.fetch
  let called = ''
  globalThis.fetch = async (u, o) => { called = String(u) + ' ' + o.headers.Authorization; return new Response(JSON.stringify({ choices: [{ message: { content: '我細個住寮屋。' } }] }), { status: 200 }) }
  try {
    const e2 = { ...env, AI_ENABLED: 'true', DEEPSEEK_API_KEY: 'test-only' }
    assert.equal((await (await worker.fetch(req('/api/status'), e2)).json()).ai, 'deepseek')
    const r = await worker.fetch(req('/api/ai', { prompt: '記憶' }), e2)
    assert.equal((await r.json()).text, '我細個住寮屋。')
    assert.ok(called.startsWith('https://api.deepseek.com/chat/completions Bearer test-only'))
    assert.equal((await (await worker.fetch(req('/api/status'), { ...env, AI_ENABLED: 'true' })).json()).ai, 'local', '冇金鑰就係原話整理')
  } finally { globalThis.fetch = original }
})

test('冇金鑰但有 Workers AI：用免費 Workers AI，第一個型號出錯會試下一個', async () => {
  const runs = []
  const AI = { run: async (m, input) => { runs.push(m); if (runs.length === 1) throw new Error('model gone'); return { response: '<think>…</think>我細個喺鄉下。' } } }
  const e3 = { ...env, AI_ENABLED: 'true', AI, WORKERS_AI_MODEL: '@cf/qwen/qwen3-30b-a3b-fp8' }
  assert.equal((await (await worker.fetch(req('/api/status'), e3)).json()).ai, 'workers-ai')
  const r = await worker.fetch(req('/api/ai', { prompt: '記憶' }), e3)
  assert.equal((await r.json()).text, '我細個喺鄉下。')
  assert.equal(runs.length, 2)
  assert.equal((await (await worker.fetch(req('/api/status'), { ...e3, DEEPSEEK_API_KEY: 'k' })).json()).ai, 'deepseek', '有 DeepSeek 金鑰就優先用')
})

test('Gemini 出錯（例如拒絕香港連線）：自動轉用免費 Workers AI', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: 'User location is not supported for the API use.' } }), { status: 400 })
  try {
    const AI = { run: async () => ({ response: '我後生喺工廠做嘢。' }) }
    const r = await worker.fetch(req('/api/ai', { prompt: '記憶' }), { ...env, AI_ENABLED: 'true', GEMINI_API_KEY: 'k', AI })
    const d = await r.json()
    assert.equal(d.text, '我後生喺工廠做嘢。')
    assert.equal(d.provider, 'workers-ai', '回報實際用咗 Workers AI，故事頁唔會錯寫 Gemini')
  } finally { globalThis.fetch = original }
})
