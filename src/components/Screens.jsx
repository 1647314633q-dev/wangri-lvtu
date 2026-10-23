import { useState } from 'react'
import { img } from '../lib/img.js'
import { groupOf, birthYearFromAge, GROUPS } from '../data/catalog.js'

// 如果你有自己設計好嘅封面圖，放入 src/assets/images/covers/ 並命名為
//   cover.jpg（或 .png）          → 遊戲封面
//   chapter1-cover.jpg（或 .png） → 進入童年後嘅封面
// 系統會自動用你嘅圖片做成一個可以點擊嘅大按鈕。
const custom = import.meta.glob('../assets/images/covers/{cover,chapter1-cover,chapter2-cover}.{jpg,jpeg,png,webp}', { eager: true, import: 'default' })
const pick = name => Object.entries(custom).find(([k]) => k.includes('/' + name + '.'))?.[1]
const CUSTOM_COVER = pick('cover')
const CUSTOM_CH = { 1: pick('chapter1-cover'), 2: pick('chapter2-cover') }
const coverPhoto = img('covers/cover-photo').src
const PHOTO = { 1: img('covers/chapter1-photo').src, 2: img('covers/chapter2-photo').src }

export function Cover({ onOpen, hasSave, onContinue }) {
  return (
    <section className="cover-screen">
      {CUSTOM_COVER ? (
        <button type="button" className="cover-img-btn" onClick={onOpen} aria-label="開啟回憶之旅">
          <img src={CUSTOM_COVER} alt="往日旅途封面" />
        </button>
      ) : (
        <button type="button" className="album-cover" onClick={onOpen} aria-label="往日旅途：開啟回憶之旅">
          <span className="ac-top">香港長者 · 人生回憶</span>
          <span className="ac-title">往日旅途</span>
          <span className="ac-sub">一本屬於你嘅自傳</span>
          <span className="ac-photo"><img src={coverPhoto} alt="" /></span>
          <span className="ac-cta">輕按封面 · 開啟回憶之旅</span>
        </button>
      )}
      {hasSave && <button type="button" className="btn" onClick={onContinue}>繼續上次嘅旅程</button>}
      <p className="note center">冇時間限制，唔會扣分。慢慢玩，慢慢諗。</p>
      <p className="note center">回憶只保存在呢個瀏覽器，記得下載自傳留底。</p>
    </section>
  )
}

// 問歲數 → 推算出世年份（近似，可以自己改）→ 出生組（1940–1949／1950–1959／1960–1966）
// 範圍以外唔會默默當作某一組；要本人揀先用最接近嘅一組試玩
export function AgeAsk({ initial, initialYear, onConfirm }) {
  const [age, setAge] = useState(initial || 81)
  const [year, setYear] = useState(initialYear ? String(initialYear) : '')
  const [editYear, setEditYear] = useState(false)
  const [err, setErr] = useState('')
  const ok = age >= 50 && age <= 110
  const guess = birthYearFromAge(age || 0)
  const by = editYear && /^\d{4}$/.test(year) ? parseInt(year, 10) : guess
  const group = groupOf(by)
  const nearest = by < 1940 ? '1940' : '1960'
  function set(v) { const n = parseInt(v, 10); setAge(Number.isNaN(n) ? '' : n); setErr('') }
  const go = (g, chosen) => ok ? onConfirm({ age, birthYear: by, group: g, groupChosen: !!chosen, yearEdited: editYear }) : setErr('請輸入 50 至 110 之間嘅歲數。')
  return (
    <section className="paper-sheet narrow">
      <p className="kicker">開始之前</p>
      <h1 className="h1">你今年幾多歲？</h1>
      <div className="age-row">
        <button type="button" className="btn round" onClick={() => set((age || 81) - 1)} aria-label="減一歲">－</button>
        <input className="age-input" inputMode="numeric" value={age} onChange={e => set(e.target.value)} aria-label="年齡" maxLength={3} />
        <span className="age-unit">歲</span>
        <button type="button" className="btn round" onClick={() => set((age || 81) + 1)} aria-label="加一歲">＋</button>
      </div>
      {ok ? (
        <div className="age-result">
          <p>你大約喺 <b>{by}</b> 年出世{group ? <>（{GROUPS[group].label}）</> : ''}。</p>
          {!editYear ? (
            <button type="button" className="btn small-btn" onClick={() => { setEditYear(true); setYear(String(guess)) }}>出世年份唔啱？自己改</button>
          ) : (
            <label className="lbl">出世年份
              <input className="year-input" inputMode="numeric" maxLength={4} value={year} onChange={e => setYear(e.target.value.replace(/\D/g, ''))} aria-label="出世年份" />
            </label>
          )}
          {!group && <p className="note">試玩版嘅內容按 1940–1966 年出世嘅長者設計，{by > 1966 ? '暫時未有 1967 年或之後出世嘅內容' : '1940 年之前出世嘅內容未有'}。你可以自己揀先用 {GROUPS[nearest].label} 嘅內容試玩，部分物件未必配合你嘅年代。</p>}
        </div>
      ) : <p className="note">請輸入 50 至 110 之間嘅歲數。</p>}
      {err && <p className="msg">{err}</p>}
      {group || !ok ? (
        <button type="button" className="btn primary big" onClick={() => go(group)}>出發</button>
      ) : (
        <button type="button" className="btn primary big" onClick={() => go(nearest, true)}>先用 {GROUPS[nearest].label} 嘅內容試玩</button>
      )}
    </section>
  )
}

export function ChapterCover({ n = 1, no = '第一章', title = '童年時光', years = '1940 – 1950', note = '配對兩張一樣嘅詞語，打開一段童年回憶。', photo, onEnter }) {
  const custom = CUSTOM_CH[n]
  if (custom) {
    return (
      <section className="cover-screen">
        <button type="button" className="cover-img-btn wide" onClick={onEnter} aria-label={'進入' + no + '：' + title}>
          <img src={custom} alt={no + ' ' + title} />
        </button>
        <button type="button" className="btn primary big" onClick={onEnter}>進入{title}</button>
      </section>
    )
  }
  return (
    <section className="cover-screen">
      <button type="button" className="chapter-cover" onClick={onEnter} aria-label={'進入' + no + '：' + title}>
        <img src={photo || PHOTO[n]} alt="" />
        <span className="cc-text">
          <span className="cc-no">{no}</span>
          <span className="cc-title">{title}</span>
          <span className="cc-years">{years}</span>
          <span className="cc-cta">輕按進入</span>
        </span>
      </button>
      <p className="note center">{note}</p>
    </section>
  )
}

export function Congrats({ seal = '童', title = '恭喜你完成童年時光嘅探索！', shared, total, unit = '樣童年物件', storyLabel = '整理我的童年故事', onStory, onAlbum, next, onNext }) {
  return (
    <section className="paper-sheet narrow center-text">
      <p className="seal" aria-hidden="true">{seal}</p>
      <h1 className="h1">{title}</h1>
      <p className="lead">你配對咗 {total} {unit}，分享咗 {shared} 段回憶。</p>
      <div className="btncol">
        <button type="button" className="btn primary big" onClick={onStory}>{storyLabel}</button>
        {next && <button type="button" className="btn big" onClick={onNext}>{next}</button>}
        <button type="button" className="btn big" onClick={onAlbum}>睇我的人生自傳</button>
      </div>
    </section>
  )
}
