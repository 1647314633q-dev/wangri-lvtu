// 由「本人資料 + 已保存嘅選題」組合每一章嘅回合同物件（畫面沿用原有配對、回憶卡）。
// 選題規則喺 catalog.js；呢度負責接上圖片同舊章節資料。
import { CHAPTER as CH1 } from './childhood1940.js'
import { chapterFor, LEARNING_ITEMS } from './learning1940.js'
import { planChildhood, planLearning, planSociety, planShared, material, keyOf, groupOf, GROUPS } from './catalog.js'
import { img } from '../lib/img.js'

export const ORDER = ['childhood', 'learning', 'society', 'events', 'later']
const HINT = '點左邊一張相，再點右邊同名嘅字'
const DEFAULT_NO_EXP = '唔緊要，我哋可以揀另一件物件，或者講你想講嘅經歷。'
const CLASSIC = new Set(['childhood', 'learning'])   // 第一、二章：原有三個按鈕

const YEARS = {
  childhood: { '1940': '1940 – 1950 年代', '1950': '1950 – 1960 年代', '1960': '1960 – 1970 年代' },
  learning: { '1940': '1946 – 1960', '1950': '1956 – 1970', '1960': '1966 – 1980' },
  society: { '1940': '約 1955 – 1984', '1950': '約 1965 – 1994', '1960': '約 1975 – 2001' },
}
const STORY_RULE = '只寫佢有分享嘅部分。物件同相片只係話題提示，唔好由物件、相片年份或者選項推斷佢做過、去過或者經歷過任何事。'

// 每一章嘅顯示設定
export const META = {
  childhood: {
    n: 1, no: '第一章', title: '童年時光', coverNote: '左邊嘅相配右邊同名嘅字，打開一段童年回憶。',
    seal: '童', done: '恭喜你完成童年時光嘅探索！', unit: '樣童年物件', storyLabel: '整理我的童年故事', heading: '我的童年', storyTitle: '我的童年故事',
    empty: '你今次未有分享童年回憶，所以未可以整理故事。我哋唔會幫你作故事。', finalTitle: '你嘅童年',
    storyContext: '故事可以按以下次序組織（只寫佢有分享嘅部分）：我的家庭與成長背景、童年的居住環境、童年玩樂與朋友、家庭生活與日常回憶、難忘的人和事情。如果佢冇分享家庭資料，就唔好寫任何關於爸爸、媽媽、兄弟姊妹或者家境嘅內容。' + STORY_RULE,
  },
  learning: {
    n: 2, no: '第二章', title: '求學歲月', coverNote: '有冇返過學都唔緊要，講吓你當年點樣學習、點樣長大。',
    seal: '學', done: '恭喜你完成求學歲月嘅探索！', unit: '樣物件', storyLabel: '整理我的求學歲月', heading: '我的求學歲月', storyTitle: '我的求學歲月',
    empty: '你今次未有分享呢段日子嘅回憶，所以未可以整理故事。我哋唔會幫你作故事。', finalTitle: '求學歲月',
    storyContext: '故事可以包括（只寫佢有分享嘅部分）：曾經讀過咩類型嘅學校、大概喺咩年代讀書、學校環境、老師同同學、難忘嘅學校生活、升學或者中途離校嘅經歷、後來點樣繼續學習同成長。' + STORY_RULE,
  },
  society: {
    n: 3, no: '第三章', title: '踏入社會', coverNote: '出嚟社會之後做過啲咩、喺邊度生活，按你自己嘅經歷揀物件。',
    seal: '社', done: '恭喜你完成踏入社會嘅探索！', unit: '樣物件', storyLabel: '整理我的社會歲月', heading: '踏入社會', storyTitle: '我的社會歲月',
    empty: '你今次未有分享呢段日子嘅回憶，所以未可以整理故事。我哋唔會幫你作故事。', finalTitle: '踏入社會',
    finalQuestion: '出嚟社會嗰段日子，仲有冇邊件事係你特別想留低畀屋企人知道？',
    storyContext: '故事可以包括（只寫佢有分享嘅部分）：做過嘅工作或者家務、學過嘅手藝、工作同生活嘅地方、身邊嘅人、離開或者搬去其他地方嘅經歷、工餘生活。' + STORY_RULE,
  },
  events: {
    n: 4, no: '第四章', title: '期間大事件', coverNote: '搬屋、喜事、打風、新事物……人生入面你記得嘅大事，邊個年紀都得。',
    seal: '事', done: '恭喜你完成期間大事件嘅探索！', unit: '樣物件', storyLabel: '整理我的人生大事', heading: '我記得嘅大事', storyTitle: '我記得嘅大事',
    empty: '你今次未有分享呢部分嘅回憶，所以未可以整理故事。我哋唔會幫你作故事。', finalTitle: '人生大事',
    finalQuestion: '仲有冇邊件大事，係你一直都記得，想寫入自傳？',
    storyContext: '呢啲係佢人生唔同階段記得嘅大事，唔一定按年紀次序。' + STORY_RULE + '唔好假設佢嘅政治立場或者佢當時身處邊度。',
  },
  later: {
    n: 5, no: '第五章', title: '晚年生活', coverNote: '而家嘅日子：鍾意做嘅嘢、身邊嘅人、想學嘅嘢。',
    seal: '今', done: '恭喜你完成晚年生活嘅探索！', unit: '樣物件', storyLabel: '整理我而家嘅生活', heading: '我而家嘅生活', storyTitle: '我而家嘅生活',
    empty: '你今次未有分享呢部分嘅回憶，所以未可以整理故事。我哋唔會幫你作故事。', finalTitle: '而家嘅日子',
    finalQuestion: '而家嘅生活，有冇邊樣嘢令你最開心，或者想同屋企人講？',
    storyContext: '呢一章係佢而家嘅生活同興趣；唔好假設佢已經退休、身體狀況或者住喺邊度。' + STORY_RULE,
  },
}
export const yearsOf = (id, group) => YEARS[id]?.[group] || (id === 'events' ? '人生入面嘅大事' : id === 'later' ? '而家嘅日子' : '')

const COVER_MATERIAL = { society: 'm-S17', events: 'm-S23', later: 'm-S29' }
export function coverPhoto(id) {
  const m = material(COVER_MATERIAL[id]); if (!m) return ''
  const p = img('materials/photos/' + m.photo.file)
  return p.photo ? p.src : img('materials/svg/' + m.id.slice(2)).src
}

export function profileGroup(state) { return state.profile?.group || groupOf(state.profile?.birthYear) || '1940' }

// ---------- 素材 → 回憶卡物件 ----------
export function toItem(m, chapter, birthYear) {
  const p = img('materials/photos/' + m.photo.file)
  const exp = !CLASSIC.has(chapter)
  const ph = m.photo
  let yearNote = '相片年份唔等於你經歷嘅年份，只係同類物件或者場景參考。'
  if (ph.to && birthYear && ph.to < birthYear) yearNote = '呢張相早過你出世，只係同類物件參考。'
  else if (!ph.from) yearNote = '相片拍攝年份未詳；只係同類物件或者活動參考。'
  return {
    id: m.id, key: m.key, name: m.word, material: true,
    image: p.photo ? p.src : img('materials/svg/' + m.id.slice(2)).src, placeholder: !p.photo,
    intro: ph.desc, question: m.question,
    prompt: exp ? m.prompt : '',
    followups: exp ? [m.follow].filter(Boolean) : [m.prompt, m.follow].filter(Boolean),
    noExp: exp ? (m.noExp || DEFAULT_NO_EXP) : '',
    photoInfo: p.photo ? { year: ph.year, source: ph.source, ref: ph.ref, url: ph.url, note: ph.note, yearNote } : null,
  }
}

function lookup(id, chapter, birthYear) {
  if (id.startsWith('m-')) { const m = material(id); return m ? toItem(m, chapter, birthYear) : null }
  return CH1.items.find(i => i.id === id) || LEARNING_ITEMS[id] || null
}
export const keyForId = id => id.startsWith('m-') ? keyOf(material(id) || { id }) : keyOf({ id })

// ---------- 選題（未保存就即時計；開始配對後保存，之後唔會因推薦改變而重置） ----------
export function computePlan(id, state, used) {
  const d = state[id], group = profileGroup(state), exp = state.exp
  const started = d.cleared.length > 0 || d.finalDone
  const route = state.learning?.route
  if (id === 'childhood') {
    const legacyIds = CH1.items.map(i => i.id)
    if (started) return { v: 1, legacy: true, rounds: [{ id: 'things', title: '童年物件', items: legacyIds }] }
    return planChildhood({ group, legacyIds })
  }
  if (id === 'learning') {
    if (!d.route) return null
    const base = chapterFor(d).rounds.map(r => ({ id: r.id, title: r.title.replace(/^第二章 · /, ''), items: r.items }))
    if (started) return { v: 1, legacy: true, rounds: base.map(r => ({ ...r, items: r.items.map(i => i.id) })) }
    return planLearning({ group, route: d.route, baseRounds: base, exp })
  }
  if (id === 'society') {
    if (!exp?.done) return null
    return planSociety({ group, exp, route, used })
  }
  return planShared(id, { group, exp, route, used })
}

// 其他章節已用嘅物件 key：本人已經分享過、話咗「冇呢段經歷」，或者仲喺未完成章節等緊出現嘅，先唔再出。
// 只係跳過或者冇乜印象嘅物件，可以喺另一個人生階段再問（例如童年攞水、後生照顧家人攞水）。
export function usedKeys(id, state) {
  const used = new Set()
  for (const c of ORDER) {
    if (c === id) continue
    const d = state[c]
    if (!d?.plan) continue
    for (const r of d.plan.rounds) for (const it of r.items) {
      const st = d.memories?.[it]?.status
      if (st === 'shared' || st === 'noexp' || (!d.finalDone && !d.cleared.includes(it))) used.add(keyForId(it))
    }
  }
  for (const c of ORDER) {
    if (c === id || state[c]?.plan) continue
    for (const [it, m] of Object.entries(state[c]?.memories || {})) if (m.status === 'shared' || m.status === 'noexp') used.add(keyForId(it))
  }
  return used
}

export function planOf(id, state) {
  return state[id]?.plan || computePlan(id, state, usedKeys(id, state))
}

export function cfgOf(id, state) {
  const plan = planOf(id, state)
  if (!plan) return null
  const by = state.profile?.birthYear
  const m = META[id]
  const rounds = plan.rounds.filter(r => r.items.length).map(r => ({ id: r.id, title: m.no + ' · ' + r.title, hint: HINT, items: r.items }))
  const items = rounds.flatMap(r => r.items.map(i => { const it = lookup(i, id, by); return it ? { ...it, round: r.id } : null }).filter(Boolean))
  const base = id === 'learning' ? chapterFor(state.learning) : {}
  return {
    ...base, id, no: m.no, title: m.title, years: yearsOf(id, profileGroup(state)),
    rounds, items, plan, pairMode: true,
    finalQuestion: base.finalQuestion || m.finalQuestion || CH1.finalQuestion,
    expMode: !CLASSIC.has(id),
  }
}

export const groupLabel = g => GROUPS[g]?.label || ''
