import { useState } from 'react'
import { EXPERIENCES, WHERE } from '../data/catalog.js'

// 第三章開頭：少量、可以全部唔揀嘅經歷選項（似相簿頁，沿用學校類型頁嘅樣式）
// 每類三個狀態：有（加入嗰類物件）／冇（收起嗰類）／未揀（唔肯定，唔當作冇）
// 只負責揀配對物件同調整追問，唔會寫入自傳。
export default function Experiences({ initial, onDone, onBack, editing = false }) {
  const [tags, setTags] = useState({ ...(initial?.tags || {}) })
  const [where, setWhere] = useState(initial?.where || '')
  const [place, setPlace] = useState(initial?.place || '')
  const set = (id, v) => setTags(t => { const n = { ...t }; if (n[id] === v) delete n[id]; else n[id] = v; return n })
  const done = () => onDone({ tags, where, place: (where === 'away' || where === 'both') ? place.trim().slice(0, 40) : '', done: true })

  return (
    <section className="photo-album">
      <div className="album-spread">
        <header className="spread-head">
          <p className="kicker">第三章 · 踏入社會</p>
          <h1 className="h2">出嚟社會之後，你有冇經歷過呢啲？</h1>
          <p className="note">可以揀多過一樣，唔揀都得，之後喺「我的自傳」可以再改。只係用嚟揀配對物件，唔會寫入自傳。</p>
        </header>
        <div className="exp-grid">
          {EXPERIENCES.map(e => {
            const v = tags[e.id]
            return (
              <div key={e.id} className={'exp-card' + (v === 'yes' ? ' on' : v === 'no' ? ' off' : '')}>
                <button type="button" className="exp-main" onClick={() => set(e.id, 'yes')} aria-pressed={v === 'yes'}>
                  <span className="family-seal" aria-hidden="true">{e.seal}</span>
                  <span className="exp-text"><b>{e.name}</b><small>{e.hint}</small></span>
                  <span className="exp-tick" aria-hidden="true">{v === 'yes' ? '✓ 有' : v === 'no' ? '冇' : ''}</span>
                </button>
                <button type="button" className={'btn chip exp-no' + (v === 'no' ? ' on' : '')} onClick={() => set(e.id, 'no')} aria-pressed={v === 'no'}>冇呢類經歷</button>
              </div>
            )
          })}
        </div>
        <div className="exp-where">
          <p className="question">你後生主要喺邊度生活？</p>
          <div className="btnrow center-row">
            {WHERE.map(w => (
              <button key={w.id} type="button" className={'btn chip' + (where === w.id ? ' on' : '')} aria-pressed={where === w.id} onClick={() => setWhere(where === w.id ? '' : w.id)}>{w.label}</button>
            ))}
          </div>
          {(where === 'away' || where === 'both') && (
            <label className="lbl">地方（可以唔填）
              <input value={place} maxLength={40} placeholder="例如：廣州、英國、澳門" onChange={ev => setPlace(ev.target.value)} />
            </label>
          )}
          {where === 'away' && <p className="note">遊戲入面嘅相大部分喺香港影，只係同類物件參考，唔代表你住過嘅地方。</p>}
        </div>
        <div className="btnrow center-row">
          {onBack && <button type="button" className="btn ghost" onClick={onBack}>{editing ? '取消' : '返回'}</button>}
          <button type="button" className="btn primary big" onClick={done}>{editing ? '保存' : Object.keys(tags).length || where ? '開始配對' : '唔揀住，直接開始'}</button>
        </div>
      </div>
    </section>
  )
}
