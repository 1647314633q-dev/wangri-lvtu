// 遊戲紀錄儲存喺瀏覽器 localStorage（只限呢部裝置、呢個瀏覽器）。
// 舊紀錄會自動補返新欄位（唔會清空），原有回憶、配對進度、家庭資料、教育路線同自傳全部保留。
import { groupOf, EMPTY_EXP } from '../data/catalog.js'

const KEY = 'wangri-lvtu-v1'
export const SCHEMA = 2

const chapter = extra => ({
  cleared: [],            // 已配對（或跳過）嘅物件 id
  memories: {},           // id → { status: 'shared' | 'none' | 'noexp' | 'skipped', text, follow: [{ q, a }], updatedAt }
  extra: null,            // 最後補充 { text, updatedAt }
  finalDone: false,
  story: null,            // { text, source, updatedAt, saved }
  plan: null,             // 開始配對時保存嘅選題 { rounds: [{ id, title, items }] }；之後唔會因推薦改變而重置
  ...extra,
})

export const EMPTY = {
  schema: SCHEMA,
  profile: null,          // { age, birthYear, group, groupChosen }
  exp: { ...EMPTY_EXP },  // 本人確認嘅經歷：{ tags: { factory: 'yes' | 'no' }, where, place, done }
  childhood: chapter({ family: {} }),   // family：「我的家庭」cardId → { status, text, follow, updatedAt }
  learning: chapter({
    route: null,          // 'A' | 'B' | 'C' | 'U'（見 src/data/learning1940.js）
    interview: [],        // 路線 B：[{ q, a, skipped }]
    interviewDone: false,
  }),
  society: chapter(),
  events: chapter(),
  later: chapter(),
}

// 舊紀錄 → 新格式（純函數，方便測試）
export function migrate(data) {
  const e = structuredClone(EMPTY)
  if (!data || typeof data !== 'object') return e
  const out = { ...e, ...data, schema: SCHEMA }
  for (const id of ['childhood', 'learning', 'society', 'events', 'later']) out[id] = { ...e[id], ...(data[id] || {}) }
  out.exp = { ...e.exp, ...(data.exp || {}), tags: { ...(data.exp?.tags || {}) } }
  if (data.profile) {
    const p = { ...data.profile }
    if (!p.group) {
      const g = groupOf(p.birthYear)
      // 舊版超出範圍嘅人當時玩緊 1940 組：保留佢哋玩過嘅內容
      p.group = g || '1940'
      if (!g) p.groupChosen = true
    }
    out.profile = p
  }
  return out
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return migrate(raw ? JSON.parse(raw) : null)
  } catch {
    return structuredClone(EMPTY)
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* 私密瀏覽等情況唔能夠儲存 */ }
}

export function clearAll() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}
