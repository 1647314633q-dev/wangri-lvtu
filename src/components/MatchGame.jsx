import { useEffect, useMemo, useRef, useState } from 'react'

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

// 相同名稱配對：每個詞語出現兩次，點擊兩張一樣嘅詞語就會連線然後消失。
export default function MatchGame({ round, items, cleared, onMatched, disabled, showImages }) {
  const tiles = useMemo(
    () => shuffle(items.flatMap(it => [{ key: it.id + '-a', id: it.id, name: it.name, image: it.image }, { key: it.id + '-b', id: it.id, name: it.name, image: it.image }])),
    // 每一回只洗一次牌
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round.id]
  )
  const [sel, setSel] = useState(null)
  const [bad, setBad] = useState([])
  const [linking, setLinking] = useState(null) // { id, x1, y1, x2, y2 }
  const [msg, setMsg] = useState(round.hint)
  const boardRef = useRef(null)
  const tileRefs = useRef({})

  useEffect(() => { setMsg(round.hint); setSel(null) }, [round.id, round.hint])

  function click(t) {
    if (disabled || linking || cleared.includes(t.id)) return
    if (!sel) { setSel(t); setMsg('再搵另一張「' + t.name + '」'); return }
    if (sel.key === t.key) { setSel(null); setMsg(round.hint); return }
    if (sel.id === t.id) {
      const b = boardRef.current.getBoundingClientRect()
      const r1 = tileRefs.current[sel.key].getBoundingClientRect()
      const r2 = tileRefs.current[t.key].getBoundingClientRect()
      setLinking({ id: t.id, x1: r1.left + r1.width / 2 - b.left, y1: r1.top + r1.height / 2 - b.top, x2: r2.left + r2.width / 2 - b.left, y2: r2.top + r2.height / 2 - b.top, keys: [sel.key, t.key] })
      setSel(null)
      setMsg('配對成功：' + t.name + '！')
      setTimeout(() => { setLinking(null); onMatched(t.id) }, 900)
    } else {
      setBad([sel.key, t.key])
      setSel(null)
      setMsg('再試一次，慢慢嚟，唔使急。')
      setTimeout(() => setBad([]), 600)
    }
  }

  const left = items.filter(i => !cleared.includes(i.id)).length

  return (
    <section className="game">
      <div className="game-head">
        <h2>{round.title}</h2>
        <p className="count">仲有 {left} 對</p>
      </div>
      <div className={'board n' + tiles.length + (showImages ? ' pics' : '')} ref={boardRef}>
        {tiles.map(t => {
          const gone = cleared.includes(t.id) && !(linking && linking.keys.includes(t.key))
          const cls = ['tile', showImages ? 'pic' : '', sel && sel.key === t.key ? 'sel' : '', bad.includes(t.key) ? 'bad' : '', linking && linking.keys.includes(t.key) ? 'linked' : '', gone ? 'gone' : ''].join(' ')
          return (
            <button key={t.key} ref={el => { tileRefs.current[t.key] = el }} type="button" className={cls}
              onClick={() => click(t)} disabled={gone} aria-hidden={gone} aria-pressed={sel && sel.key === t.key}>
              {showImages && <img src={t.image} alt="" />}
              <span>{t.name}</span>
            </button>
          )
        })}
        {linking && (
          <svg className="link" aria-hidden="true">
            <line x1={linking.x1} y1={linking.y1} x2={linking.x2} y2={linking.y2} />
            <circle cx={linking.x1} cy={linking.y1} r="9" /><circle cx={linking.x2} cy={linking.y2} r="9" />
          </svg>
        )}
      </div>
      <p className="game-msg" aria-live="polite">{msg}</p>
    </section>
  )
}
