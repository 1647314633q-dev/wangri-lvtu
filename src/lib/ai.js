// AI 功能：整理自傳、調整回憶卡問題、離校訪談。
// 優先次序：
// 1. 喺 claude.ai Artifact 入面開啟 → 用 Claude（window.claude 嘅 sample 能力）
// 2. 有設定 VITE_AI_ENDPOINT（Cloudflare 版本係 /api/ai）→ 經自己嘅伺服器呼叫 Google Gemini
// 3. 兩樣都用唔到 → 唔用 AI，直接將長者講過嘅說話按次序排好（唔會加任何虛構內容）

const ENDPOINT = import.meta.env?.VITE_AI_ENDPOINT || ''
// 伺服器有冇開 AI（/api/status 回應 ai: 'gemini' 先算）；只問一次
let serverStatus
async function serverReady() {
  if (!ENDPOINT) return false
  if (!serverStatus) serverStatus = fetch('/api/status', { signal: AbortSignal.timeout(5000) })
    .then(r => r.ok ? r.json() : null).then(s => s?.ai === 'gemini').catch(() => false)
  return serverStatus
}
async function callServer(prompt, { json = false, signal } = {}) {
  if (!await serverReady()) throw new Error('AI 未啟用')
  const timeout = AbortSignal.timeout(25000)
  const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, json }), signal: signal ? AbortSignal.any([signal, timeout]) : timeout })
  if (!res.ok) throw new Error('AI 伺服器出錯（' + res.status + '）')
  const data = await res.json()
  const text = String(data.text || '').trim()
  if (!text) throw new Error('AI 冇回覆')
  if (!json) return text
  const m = text.match(/[\[{][\s\S]*[\]}]/)
  return JSON.parse(m ? m[0] : text)
}

let samplerPromise = null
function getSampler() {
  if (!samplerPromise) {
    samplerPromise = (async () => {
      try {
        if (typeof window !== 'undefined' && window.claude && typeof window.claude.use === 'function') {
          return await window.claude.use('sample')
        }
      } catch { /* ignore */ }
      return null
    })()
  }
  return samplerPromise
}

export async function aiAvailable() {
  if (await getSampler()) return 'claude'
  if (await serverReady()) return 'server'
  return null
}

export function buildPrompt(entries, profile, { chapterTitle = '童年時光', context = '' } = {}) {
  const lines = entries.map(e => e.meta ? `【${e.name}】${e.text}` : `【${e.name}】\n問：${e.question}\n答：${e.text}`).join('\n\n')
  const who = profile ? `佢大約 ${profile.birthYear} 年出世。` : ''
  return [
    `你要幫一位香港長者，將佢喺回憶遊戲入面分享嘅經歷，整理成自傳章節「${chapterTitle}」嘅草稿。`,
    who,
    context ? '背景：' + context : '',
    '要求：',
    '- 用第一人稱「我」，繁體中文，語氣自然、親切，保留佢原本嘅用字同廣東話味道。',
    '- 只可以根據佢真正講過嘅內容撰寫。',
    '- 絕對唔可以擅自捏造人物、地點、年份、事件、原因、感受或者任何細節；唔清楚嘅就唔寫。',
    '- 佢冇提及嘅物件或者話題唔好寫入故事。',
    '- 如果佢講到辛苦或者遺憾嘅事，用平實、尊重嘅語氣寫，唔好渲染，亦唔好加評價。',
    '- 可以加少量自然嘅過渡句，令段落連貫。',
    '- 分兩至四段，唔好加標題，唔好加任何解釋。',
    '',
    '長者分享嘅內容：',
    lines,
    '',
    '只回覆自傳正文。',
  ].filter(Boolean).join('\n')
}

// 冇 AI 時：只將原話排好
export function localDraft(entries) {
  return entries.filter(e => !e.meta).map(e => e.text.trim().replace(/[。！？!?]*$/, '。')).join('\n\n')
}

export async function generateStory(entries, profile, { onText, signal, chapterTitle, context } = {}) {
  const prompt = buildPrompt(entries, profile, { chapterTitle, context })
  const sampler = await getSampler()
  if (sampler) {
    const { text } = await sampler(prompt, { cache: false, signal, onText: onText ? ({ text }) => onText(text) : undefined })
    return { text: text.trim(), source: 'claude' }
  }
  if (ENDPOINT) {
    try {
      const text = await callServer(prompt, { signal })
      if (onText) onText(text)
      return { text, source: 'server' }
    } catch (e) {
      if (signal && signal.aborted) throw e
      // 伺服器用唔到：改為只排好長者原話，唔會令遊戲卡住
    }
  }
  return { text: localDraft(entries), source: 'local' }
}

// 路線 B：離校之後嘅訪談。AI 根據長者答案，溫和咁回應同問下一條；冇 AI 就用預設問題。
export async function nextInterviewStep(history, baseQuestions, step, context, { signal } = {}) {
  const fallback = { reply: '', question: baseQuestions[step] || '', distress: false, source: 'preset' }
  if (step >= baseQuestions.length) return { ...fallback, question: '' }
  const sampler = await getSampler()
  const ask = sampler && sampler.json ? (p, o) => sampler.json(p, { ...o, modelTier: 'quick', cache: false }) : ENDPOINT ? (p, o) => callServer(p, { ...o, json: true }) : null
  if (!ask) return fallback
  const done = history.map(h => `問：${h.q}\n答：${h.skipped ? '（跳過）' : h.a}`).join('\n')
  const prompt = [
    '你係回憶遊戲《往日旅途》入面親切嘅陪談員，正同一位香港長者傾佢細個離開學校之後嘅經歷。用自然、親切嘅香港廣東話口語，繁體字。',
    '背景：' + context,
    '之前嘅對話：', done || '（未開始）',
    '',
    `下一個要傾嘅方向：「${baseQuestions[step]}」`,
    '規則：',
    '- reply：一句短短嘅回應，具體接住佢上一個答案講過嘅內容；如果佢跳過，就唔好追問，reply 留空。',
    '- question：按「下一個要傾嘅方向」問一條開放式、容易答嘅問題，可以參考佢講過嘅內容，唔超過 35 字。',
    '- 唔好假設佢冇講過嘅事，唔好問錢銀數目、病痛細節、私隱。',
    '- 如果佢流露傷心、辛苦或者唔想講：reply 溫柔接住，question 改為輕鬆啲、可以選擇唔答，distress 設為 true。',
    '只回覆 JSON：{"reply":"…","question":"…","distress":false}',
  ].join('\n')
  try {
    const r = await ask(prompt, { signal })
    const q = String(r && r.question || '').trim()
    return { reply: String(r && r.reply || '').trim(), question: q || fallback.question, distress: !!(r && r.distress), source: sampler ? 'claude' : 'server' }
  } catch (e) {
    if (e && e.code === 'cancelled') throw e
    return fallback
  }
}

// 按長者已確認保存嘅資料（第一章：家庭資料；第二章：學校類型同年份），將回憶卡問題調整得更貼身。
// 冇資料或者冇 AI → 回傳 null，即係用原本嘅一般問題。
export async function personalizeQuestion(item, context, { signal } = {}) {
  const sampler = await getSampler()
  const ask = sampler && sampler.json ? (p, o) => sampler.json(p, { ...o, modelTier: 'quick' }) : ENDPOINT ? (p, o) => callServer(p, { ...o, json: true }) : null
  if (!ask || !context) return null
  const prompt = [
    '你係回憶遊戲《往日旅途》入面親切嘅陪談員。用自然、親切嘅香港廣東話口語，繁體字。',
    '背景：' + context,
    `長者啱啱配對咗「${item.name}」。原本問題：「${item.question}」`,
    '請按背景微調成一條更貼近佢經歷嘅回憶問題：開放式、容易答、唔超過 45 字。',
    '如果背景入面有同呢樣物件自然相關嘅資料，可以溫和咁提返，用問嘅方式，例如「你之前提過爸爸做木工，咁你屋企以前張飯桌係咪爸爸自己整㗎？」；冇相關就唔好硬扯。',
    '問題只係回憶線索，唔好假設佢一定經歷過，亦唔好當背景冇講過嘅事係真；唔好問錢銀數目、病痛、私隱。',
    '只可以係一條問題，唔好加多一條必答問題。',
    '只回覆 JSON：{"question":"…"}',
  ].join('\n')
  try {
    const r = await ask(prompt, { signal })
    const q = String(r && r.question || '').trim()
    return q || null
  } catch { return null }
}

// 第一章「我的家庭」：長者分享完之後，AI 可以揀一條合適嘅追問（可選擇唔答）。
// 冇 AI 就按次序用預設追問。
export async function familyFollowUp(card, answer, asked, context, { signal } = {}) {
  const left = card.followups.filter(q => !asked.includes(q))
  const fallback = { reply: '', question: left[0] || '', source: 'preset' }
  if (!left.length) return fallback
  const sampler = await getSampler()
  const ask = sampler && sampler.json ? (p, o) => sampler.json(p, { ...o, modelTier: 'quick', cache: false }) : ENDPOINT ? (p, o) => callServer(p, { ...o, json: true }) : null
  if (!ask) return fallback
  const prompt = [
    '你係回憶遊戲《往日旅途》入面親切嘅陪談員，正同一位香港長者傾佢細個嘅家庭。用自然、親切嘅香港廣東話口語，繁體字。',
    context ? '背景：' + context : '',
    `題目：「${card.name}」。佢答：「${answer}」`,
    asked.length ? '已經問過：' + asked.join('／') : '',
    '可以揀嘅追問：' + left.map(q => '「' + q + '」').join('、'),
    '規則：',
    '- reply：一句短短嘅回應，具體接住佢講過嘅內容，唔好加佢冇講過嘅事。',
    '- question：由「可以揀嘅追問」揀一條佢未答過、最自然嘅，可以按佢嘅答案微調字眼，唔超過 35 字；如果佢已經答咗某條，就唔好再問嗰條。',
    '- 唔好要求佢揀「貧窮、中產、富裕」之類嘅家庭階級，唔好問錢銀數目、病痛、私隱。',
    '- 如果佢流露傷心或者唔想講，reply 溫柔接住，question 留空。',
    '只回覆 JSON：{"reply":"…","question":"…"}',
  ].filter(Boolean).join('\n')
  try {
    const r = await ask(prompt, { signal })
    return { reply: String(r && r.reply || '').trim(), question: String(r && r.question || '').trim(), source: sampler ? 'claude' : 'server' }
  } catch (e) {
    if (e && e.code === 'cancelled') throw e
    return fallback
  }
}
