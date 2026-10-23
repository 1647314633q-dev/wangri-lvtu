// 選題規則（純資料、唔含圖片，Node 測試都用得）。
// 分齡決定候選物件嘅優先次序；本人已確認嘅經歷、教育路線同生活地點決定實際揀邊啲物件。
// 「有」先會加入嗰類物件；「冇」會收起嗰類；冇揀（唔肯定）唔當作冇。
import { MATERIALS } from './materials.js'

export { MATERIALS }

// ---------- 出生組 ----------
export const GROUPS = {
  '1940': { from: 1940, to: 1949, label: '1940–1949 年出世' },
  '1950': { from: 1950, to: 1959, label: '1950–1959 年出世' },
  '1960': { from: 1960, to: 1966, label: '1960–1966 年出世' },
}
export function groupOf(birthYear) {
  for (const [g, r] of Object.entries(GROUPS)) if (birthYear >= r.from && birthYear <= r.to) return g
  return null
}
export function birthYearFromAge(age, now = new Date()) { return now.getFullYear() - age }

// ---------- 八類經歷（跨章節嘅素材標籤，唔係章節，可以揀多過一樣） ----------
export const EXPERIENCES = [
  { id: 'education', name: '返學與繼續學習', seal: '學', hint: '返學、夜校、自己睇書學嘢' },
  { id: 'trade', name: '學師與手藝', seal: '藝', hint: '跟師傅學手藝、做手工' },
  { id: 'factory', name: '工場與生產', seal: '工', hint: '工廠、工場、裝配、執貨' },
  { id: 'care', name: '家務與照顧家人', seal: '家', hint: '煮飯、洗衫、攞水、照顧家人' },
  { id: 'business', name: '小生意與服務', seal: '舖', hint: '擺檔、睇舖、做飲食或者服務' },
  { id: 'rural', name: '鄉郊與水上生活', seal: '村', hint: '鄉村、離島、漁農、船艇' },
  { id: 'away', name: '離鄉、離港與多地生活', seal: '行', hint: '搬去第二個地方、住過幾個地方' },
  { id: 'community', name: '朋友、興趣與社區', seal: '友', hint: '同朋友玩、興趣、街坊活動' },
]
const EXP_IDS = EXPERIENCES.map(e => e.id)
export const WHERE = [
  { id: 'hk', label: '香港' },
  { id: 'away', label: '香港以外' },
  { id: 'both', label: '兩邊都有' },
  { id: 'skip', label: '唔想講' },
]
export const EMPTY_EXP = { tags: {}, where: '', place: '', done: false }

export function expSummary(exp) {
  if (!exp) return ''
  const yes = EXPERIENCES.filter(e => exp.tags?.[e.id] === 'yes').map(e => e.name)
  const no = EXPERIENCES.filter(e => exp.tags?.[e.id] === 'no').map(e => e.name)
  const parts = []
  if (yes.length) parts.push('本人揀咗有呢啲經歷：' + yes.join('、'))
  if (no.length) parts.push('本人表示冇：' + no.join('、'))
  if (exp.where === 'away') parts.push('本人表示後生主要喺香港以外生活' + (exp.place ? '（' + exp.place + '）' : '') + '，唔好假設佢喺香港')
  if (exp.where === 'both') parts.push('本人表示喺香港同其他地方都住過' + (exp.place ? '（' + exp.place + '）' : ''))
  return parts.join('；')
}

// 主要照顧家人、已確認冇工廠經歷，亦冇揀其他工作類：唔再反覆問返工同工廠
export function carerOnly(exp) {
  const t = exp?.tags || {}
  return t.care === 'yes' && t.factory === 'no' && t.trade !== 'yes' && t.business !== 'yes'
}

// ---------- 舊物件（第一、二章原有資料）嘅共用 key ----------
const LEGACY_KEYS = {
  bucket: 'water-carry', flowers: 'plastic-flowers', 'c-flowers': 'plastic-flowers',
  'c-carpentry': 'carpentry', 'c-radio': 'radio', 'c-brush': 'brush', 'type-rooftop': 'rooftop',
}
export const keyOf = item => item.key || LEGACY_KEYS[item.id] || item.id

// ---------- 單一素材可唔可以用 ----------
// ctx: { group, exp, route }  route = 第二章 A／B／C／U
export function usable(m, { group, exp, route } = {}) {
  if (group && m.groups && !m.groups.includes(group)) return false
  const tags = exp?.tags || {}
  const real = (m.tags || []).filter(t => EXP_IDS.includes(t))
  if (real.length && real.every(t => tags[t] === 'no')) return false   // 本人話冇呢類經歷
  if (carerOnly(exp) && (m.tags || []).some(t => t === 'factory' || t === 'work')) return false
  if (m.hk && exp?.where === 'away') return false                       // 香港專屬街景，唔當作海外實景
  if (m.needsSchool && route === 'C') return false                      // C 唔預設有正規學校經驗（U 唔當作冇讀書）
  if (m.needsRural && tags.rural !== 'yes') return false                 // 水上學校要本人揀咗鄉郊／水上生活
  return true
}

const byId = Object.fromEntries(MATERIALS.map(m => [m.id, m]))
export const material = id => byId[id]
const groupMaterials = (chapter, group) => MATERIALS.filter(m => m.chapter === chapter && m.src.startsWith(group + '-'))
const shared = chapter => MATERIALS.filter(m => m.chapter === chapter && m.src.startsWith('共用-'))
const routeItems = (tag, chapter) => MATERIALS.filter(m => m.src.startsWith('E') && m.chapter === chapter && m.tags[0] === tag)

// 由候選清單揀出可用、未用過 key 嘅物件
function pick(list, ctx, used) {
  const out = []
  for (const m of list) {
    const k = keyOf(m)
    if (!usable(m, ctx) || used.has(k)) continue
    used.add(k); out.push(m.id)
  }
  return out
}
const chunk = (ids, size) => { const r = []; for (let i = 0; i < ids.length; i += size) r.push(ids.slice(i, i + size)); return r }

// ---------- 第一章：童年 ----------
// legacyIds：原有 6 件童年物件 id（保留舊 ID 同舊存檔）
export function planChildhood({ group, legacyIds }) {
  const play = groupMaterials('childhood', group).map(m => m.id)
  const things = { id: 'things', title: '童年物件', items: legacyIds }
  const toys = { id: 'play-' + group, title: '童年玩意', items: play }
  return { v: 1, group, rounds: group === '1940' ? [things, toys] : [toys, { ...things, title: '屋企同生活' }] }
}

// ---------- 第二章：求學（A／B／C／U 流程不變，只按出生組調整「課室入面嘅嘢」） ----------
const OBJECTS_BY_GROUP = {
  '1940': ['report', 'desk', 'textbook', 'exercise', 'bell', 'gate'],
  '1950': ['report', 'desk', 'textbook', 'exercise', 'm-E04', 'bell'],
  '1960': ['m-E02', 'm-E04', 'report', 'desk', 'textbook', 'exercise'],
}
// baseRounds：learning1940.js 嘅 chapterFor() 原有回合（唔改）
export function planLearning({ group, route, baseRounds, exp, used = new Set() }) {
  const ctx = { group, route, exp }
  const rounds = baseRounds.map(r => {
    let items = r.items.map(i => i.id)
    if (r.id === 'objects' && OBJECTS_BY_GROUP[group]) items = OBJECTS_BY_GROUP[group].filter(id => !id.startsWith('m-') || usable(byId[id], ctx))
    if (r.id === 'learn') items = [...items, ...pick([byId['m-E03']], ctx, new Set())]
    return { id: r.id, title: r.title, items }
  })
  return { v: 1, group, route, rounds }
}

// ---------- 第三章：踏入社會 ----------
const TAG_ORDER = ['trade', 'factory', 'care', 'business', 'rural', 'away', 'community', 'education']
export function planSociety({ group, exp, route, used = new Set() }) {
  const ctx = { group, exp, route }
  const u = new Set(used)
  const base = pick(groupMaterials('society', group), ctx, u)
  const order = carerOnly(exp) ? ['care', ...TAG_ORDER.filter(t => t !== 'care')] : TAG_ORDER
  const rounds = []
  if (base.length) rounds.push({ id: 'young-' + group, title: '後生嘅日子', items: base })
  for (const tag of order) {
    if (exp?.tags?.[tag] !== 'yes') continue
    const name = EXPERIENCES.find(e => e.id === tag).name
    const pool = tag === 'education' ? routeItems('education', 'learning') : routeItems(tag, 'society')
    const ids = pick(pool, ctx, u)
    chunk(ids, 6).forEach((items, i) => rounds.push({ id: 'exp-' + tag + (i ? '-' + i : ''), title: name, items }))
  }
  // 主要照顧家人：家務回合排第一
  if (carerOnly(exp)) {
    const i = rounds.findIndex(r => r.id.startsWith('exp-care'))
    if (i > 0) rounds.unshift(...rounds.splice(i, 1))
  }
  // 太細嘅第一回併入下一回（每回最多 6 件）
  if (rounds.length > 1 && rounds[0].items.length < 3 && rounds[0].items.length + rounds[1].items.length <= 6) {
    rounds[1] = { ...rounds[1], items: [...rounds[0].items, ...rounds[1].items] }; rounds.shift()
  }
  return { v: 1, group, exp: snapshotExp(exp), rounds }
}

// ---------- 第四章：期間大事件／第五章：晚年生活（共用內容，跨年齡；同樣跟本人經歷過濾） ----------
export function planShared(chapter, { group, exp, route, used = new Set() }) {
  const ctx = { group, exp, route }
  const u = new Set(used)
  const ids = pick(shared(chapter), ctx, u)
  const titles = chapter === 'events' ? ['搬遷、喜事同出行', '天氣、時事同新事物'] : ['日常同興趣', '朋友同學習']
  const rounds = chunk(ids, 4).map((items, i) => ({ id: chapter + '-' + (i + 1), title: titles[i] || '再多一回', items }))
  return { v: 1, group, rounds }
}

const snapshotExp = exp => ({ tags: { ...(exp?.tags || {}) }, where: exp?.where || '', place: exp?.place || '' })

// ---------- 保留已開始嘅回合 ----------
// 本人改咗經歷之後重新揀題：已經有配對紀錄嘅回合原封不動，未開始嘅回合先換成新建議
export function mergePlan(oldPlan, fresh, cleared = []) {
  if (!oldPlan) return fresh
  const kept = oldPlan.rounds.filter(r => r.items.some(id => cleared.includes(id)))
  const keptIds = new Set(kept.flatMap(r => r.items))
  const add = fresh.rounds.map(r => ({ ...r, items: r.items.filter(id => !keptIds.has(id)) })).filter(r => r.items.length)
  const ids = new Set(kept.map(r => r.id))
  return { ...fresh, rounds: [...kept, ...add.map(r => ids.has(r.id) ? { ...r, id: r.id + '-new' } : r)] }
}

export const keysOfPlan = (plan, keyFor) => (plan?.rounds || []).flatMap(r => r.items.map(keyFor))
