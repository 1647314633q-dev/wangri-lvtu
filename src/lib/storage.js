// 遊戲紀錄儲存喺瀏覽器 localStorage（只限呢部裝置、呢個瀏覽器）。
const KEY = 'wangri-lvtu-v1'

export const EMPTY = {
  profile: null,            // { age, birthYear, decade }
  childhood: {
    cleared: [],            // 已配對嘅物件 id
    memories: {},           // id → { status: 'shared' | 'none' | 'skipped', text, updatedAt }
    extra: null,            // 最後補充 { text, updatedAt }
    family: {},             // 「我的家庭」：cardId → { status, text, follow: [{ q, a }], updatedAt }
    finalDone: false,
    story: null,            // { text, source, updatedAt, saved }
  },
  learning: {
    route: null,            // 'A' | 'B' | 'C' | 'U'（見 src/data/learning1940.js）
    cleared: [],
    memories: {},
    interview: [],          // 路線 B：[{ q, a, skipped }]
    interviewDone: false,
    extra: null,
    finalDone: false,
    story: null,
  },
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(EMPTY)
    const data = JSON.parse(raw)
    const e = structuredClone(EMPTY)
    return { ...e, ...data, childhood: { ...e.childhood, ...(data.childhood || {}) }, learning: { ...e.learning, ...(data.learning || {}) } }
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
