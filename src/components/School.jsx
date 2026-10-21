import { useState } from 'react'
import { SCHOOL_TYPES, SCHOOL_QUESTION, YEARS_QUESTION, NAME_QUESTION } from '../data/learning1940.js'

// 學校類型選擇：似一本打開咗嘅歷史相簿，可以揀多過一種
export function SchoolType({ initial = {}, onDone, onBack }) {
  const [types, setTypes] = useState(initial.types || [])
  const [multi, setMulti] = useState(!!initial.multi)
  const [unsure, setUnsure] = useState(!!initial.unsure)
  const [msg, setMsg] = useState('')
  const toggle = id => { setUnsure(false); setMsg(''); setTypes(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]) }
  const big = SCHOOL_TYPES.filter(t => t.big)
  const small = SCHOOL_TYPES.filter(t => !t.big)

  function next() {
    if (!types.length && !unsure) { setMsg(multi ? '請喺上面揀你讀過嘅幾種學校；唔記得可以揀「不記得／不清楚」。' : '揀一種或者幾種學校；唔記得可以揀「不記得／不清楚」。'); return }
    onDone({ types: unsure ? [] : types, multi, unsure })
  }

  return (
    <section className="photo-album">
      <div className="album-spread">
        <header className="spread-head">
          <p className="kicker">第二章 · 求學歲月</p>
          <h1 className="h2">{SCHOOL_QUESTION.question}</h1>
          <p className="note">{SCHOOL_QUESTION.note}</p>
        </header>
        <div className="school-big">
          {big.map(t => (
            <button key={t.id} type="button" className={'school-card big' + (types.includes(t.id) ? ' on' : '')} onClick={() => toggle(t.id)} aria-pressed={types.includes(t.id)}>
              <span className="sc-photo"><img src={t.image} alt={t.name + (t.placeholder ? '示意插畫' : '嘅舊相')} /><i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" /></span>
              <span className="sc-name">{t.name}</span>
              <span className="sc-intro">{t.intro}</span>
              <span className="sc-credit">{t.placeholder ? '示意插畫（未有授權相片）' : t.credit}</span>
              <span className="sc-tick" aria-hidden="true">{types.includes(t.id) ? '✓ 已揀' : '輕按揀選'}</span>
            </button>
          ))}
        </div>
        <div className="school-small">
          {small.map(t => (
            <button key={t.id} type="button" className={'school-card small' + (types.includes(t.id) ? ' on' : '')} onClick={() => toggle(t.id)} aria-pressed={types.includes(t.id)}>
              <span className="sc-photo"><img src={t.image} alt={t.name + (t.placeholder ? '示意插畫' : '嘅舊相')} /></span>
              <span className="sc-text"><span className="sc-name">{t.name}</span>{t.sub && <span className="sc-sub">{t.sub}</span>}<span className="sc-credit">{t.placeholder ? '示意插畫（未有授權相片）' : t.credit}</span></span>
              <span className="sc-tick" aria-hidden="true">{types.includes(t.id) ? '✓' : ''}</span>
            </button>
          ))}
          <button type="button" className={'school-card small text' + (multi ? ' on' : '')} onClick={() => { setMulti(m => !m); setUnsure(false); setMsg('') }} aria-pressed={multi}>
            <span className="sc-text"><span className="sc-name">讀過不止一種學校</span><span className="sc-sub">請同時喺上面揀返讀過嘅幾種</span></span>
            <span className="sc-tick" aria-hidden="true">{multi ? '✓' : ''}</span>
          </button>
          <button type="button" className={'school-card small text' + (unsure ? ' on' : '')} onClick={() => { setUnsure(u => !u); setTypes([]); setMulti(false); setMsg('') }} aria-pressed={unsure}>
            <span className="sc-text"><span className="sc-name">不記得／不清楚</span><span className="sc-sub">唔緊要，照樣可以繼續</span></span>
            <span className="sc-tick" aria-hidden="true">{unsure ? '✓' : ''}</span>
          </button>
        </div>
        {msg && <p className="msg" role="alert">{msg}</p>}
        <div className="btnrow center-row">
          {onBack && <button type="button" className="btn ghost" onClick={onBack}>返回上一步</button>}
          <button type="button" className="btn primary big" onClick={next}>下一步</button>
        </div>
      </div>
    </section>
  )
}

// 可選填嘅就讀年份同學校名稱
export function SchoolYears({ initial = {}, birthYear, onDone, onBackToTypes }) {
  const [start, setStart] = useState(initial.start || '')
  const [end, setEnd] = useState(initial.end || '')
  const [decade, setDecade] = useState(initial.decade || '')
  const [name, setName] = useState(initial.name || '')
  const num = v => { const n = parseInt(v, 10); return Number.isNaN(n) ? null : n }
  const s = num(start), e = num(end)
  const notes = []
  if (s && birthYear && (s - birthYear < 3 || s - birthYear > 20)) notes.push('呢個年份同你大約 ' + birthYear + ' 年出世對比好似有啲特別，唔緊要，照記低就得。')
  if (s && e && e < s) notes.push('離校年份早過開始年份，係咪記錯咗？唔肯定都可以照樣繼續。')
  const clean = v => v.replace(/[^\d]/g, '').slice(0, 4)

  return (
    <section className="paper-sheet narrow">
      <p className="kicker">可以唔填</p>
      <h1 className="h2">{YEARS_QUESTION}</h1>
      <div className="years-grid">
        <label className="field"><span>開始就讀年份</span>
          <input inputMode="numeric" placeholder="例如 1952" value={start} onChange={ev => setStart(clean(ev.target.value))} /></label>
        <label className="field"><span>離校年份</span>
          <input inputMode="numeric" placeholder="例如 1958" value={end} onChange={ev => setEnd(clean(ev.target.value))} /></label>
      </div>
      <fieldset className="field decades">
        <legend>或者揀大概年代</legend>
        <div className="btnrow">
          {['1940 年代', '1950 年代', '1960 年代'].map(d => (
            <button key={d} type="button" className={'btn chip' + (decade === d ? ' on' : '')} aria-pressed={decade === d} onClick={() => setDecade(decade === d ? '' : d)}>{d}</button>
          ))}
        </div>
      </fieldset>
      <label className="field"><span>{NAME_QUESTION}（知道先填）</span>
        <input value={name} maxLength={40} placeholder="例如：宗福學校" onChange={ev => setName(ev.target.value)} /></label>
      {notes.map(n => <p key={n} className="note warn">{n}</p>)}
      <div className="btnrow">
        <button type="button" className="btn primary big" onClick={() => onDone({ start, end, decade, name: name.trim() })}>下一步：開始配對</button>
        <button type="button" className="btn big" onClick={() => onDone({ start: '', end: '', decade: '', name: name.trim(), skippedYears: true })}>不記得／跳過年份</button>
      </div>
      <button type="button" className="btn ghost" onClick={() => onBackToTypes({ start, end, decade, name: name.trim() })}>← 返回修改學校選項</button>
      <p className="note">所有資料之後都可以喺「我的自傳」修改。</p>
    </section>
  )
}
