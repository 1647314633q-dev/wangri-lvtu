import { useEffect, useMemo, useRef, useState } from 'react'

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

// 圖片名稱配對：左邊係物件圖片同名稱，右邊係打亂次序嘅相同名稱文字。
// 點一邊，再點另一邊同名嗰張，就會連線然後消失。
export default function PairMatch({ round, items, cleared, onMatched, onSkip, disabled }) {
  const left = items
  const right = useMemo(() => shuffle(items), [round.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const [sel, setSel] = useState(null)      // { side, id }
  const [bad, setBad] = useState([])
  const [linking, setLinking] = useState(null)
  const [msg, setMsg] = useState(round.hint)
  const boardRef = useRef(null)
  const refs = useRef({})

  useEffect(() => { setMsg(round.hint); setSel(null) }, [round.id, round.hint])

  function click(side, it) {
    if (disabled || linking || cleared.includes(it.id)) return
    if (!sel || sel.side === side) {
      if (sel && sel.side === side && sel.id === it.id) { setSel(null); setMsg(round.hint); return }
      setSel({ side, id: it.id })
      setMsg(side === 'L' ? '而家喺右邊點「' + it.name + '」' : '而家喺左邊點返對應嘅相')
      return
    }
    const a = sel; setSel(null)
    if (a.id === it.id) {
      const b = boardRef.current.getBoundingClientRect()
      const L = refs.current['L' + it.id].getBoundingClientRect()
      const R = refs.current['R' + it.id].getBoundingClientRect()
      setLinking({ id: it.id, x1: L.right - b.left, y1: L.top + L.height / 2 - b.top, x2: R.left - b.left, y2: R.top + R.height / 2 - b.top })
      setMsg('配對成功：' + it.name + '！')
      setTimeout(() => { setLinking(null); onMatched(it.id) }, 900)
    } else {
      setBad(['L' + (a.side === 'L' ? a.id : it.id), 'R' + (a.side === 'R' ? a.id : it.id)])
      setMsg('再試一次，慢慢嚟，唔使急。')
      setTimeout(() => setBad([]), 600)
    }
  }

  const leftCount = items.filter(i => !cleared.includes(i.id)).length
  const cls = (side, it) => {
    const k = side + it.id
    const gone = cleared.includes(it.id) && !(linking && linking.id === it.id)
    return ['ptile', side === 'L' ? 'pic' : 'word', sel && sel.side === side && sel.id === it.id ? 'sel' : '', bad.includes(k) ? 'bad' : '', linking && linking.id === it.id ? 'linked' : '', gone ? 'gone' : ''].join(' ')
  }

  return (
    <section className="game">
      <div className="game-head">
        <h2>{round.title}</h2>
        <p className="count">仲有 {leftCount} 對</p>
      </div>
      <div className="pairboard" ref={boardRef}>
        <div className="pcol">
          <p className="pcol-h">相</p>
          {left.map(it => (
            <button key={'L' + it.id} ref={el => { refs.current['L' + it.id] = el }} type="button" className={cls('L', it)}
              onClick={() => click('L', it)} disabled={cleared.includes(it.id)} aria-pressed={!!(sel && sel.side === 'L' && sel.id === it.id)}>
              <img src={it.image} alt="" /><span>{it.name}</span>
            </button>
          ))}
        </div>
        <div className="pcol">
          <p className="pcol-h">字</p>
          {right.map(it => (
            <button key={'R' + it.id} ref={el => { refs.current['R' + it.id] = el }} type="button" className={cls('R', it)}
              onClick={() => click('R', it)} disabled={cleared.includes(it.id)} aria-pressed={!!(sel && sel.side === 'R' && sel.id === it.id)}>
              <span>{it.name}</span>
            </button>
          ))}
        </div>
        {linking && (
          <svg className="link" aria-hidden="true">
            <line x1={linking.x1} y1={linking.y1} x2={linking.x2} y2={linking.y2} />
            <circle cx={linking.x1} cy={linking.y1} r="9" /><circle cx={linking.x2} cy={linking.y2} r="9" />
          </svg>
        )}
      </div>
      <p className="game-msg" aria-live="polite">{msg}</p>
      {onSkip && sel && !linking && (() => {
        const it = items.find(i => i.id === sel.id)
        return it ? (
          <div className="btnrow center-row">
            <button type="button" className="btn ghost" onClick={() => { setSel(null); setMsg(round.hint); onSkip(it.id) }}>唔熟悉「{it.name}」，跳過呢張</button>
          </div>
        ) : null
      })()}
    </section>
  )
}
