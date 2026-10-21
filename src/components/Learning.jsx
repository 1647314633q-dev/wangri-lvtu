import { useEffect, useRef, useState } from 'react'
import { ROUTE_QUESTION } from '../data/learning1940.js'
import { nextInterviewStep } from '../lib/ai.js'
import MemoryEditor from './MemoryEditor.jsx'

// 第二章開頭：先溫和咁問有冇返過學，再決定路線
export function RouteQuestion({ onPick }) {
  return (
    <section className="paper-sheet narrow">
      <p className="kicker">第二章 · 求學歲月</p>
      <div className="asker"><span className="asker-badge" aria-hidden="true">問</span><h1 className="h2">{ROUTE_QUESTION.question}</h1></div>
      <p className="note">{ROUTE_QUESTION.note}</p>
      <div className="choice">
        {ROUTE_QUESTION.options.map((o, i) => (
          <button key={o.route} type="button" className={'btn big' + (i === 0 ? ' primary' : '') + (o.route === 'U' ? ' ghost' : '')} onClick={() => onPick(o.route)}>{o.label}</button>
        ))}
      </div>
    </section>
  )
}

export function RouteIntro({ route, onStart, onChange }) {
  return (
    <section className="paper-sheet narrow center-text">
      <p className="kicker">你揀咗：{route.label}</p>
      <h1 className="h2">{route.short}</h1>
      <p className="lead">{route.intro}</p>
      <div className="btncol">
        <button type="button" className="btn primary big" onClick={onStart}>開始配對</button>
        <button type="button" className="btn ghost" onClick={onChange}>揀錯咗，返去改</button>
      </div>
    </section>
  )
}

// 路線 B：配對完校園回憶之後，傾離校原因、家庭生活、之後嘅學習或者工作
export function Interview({ route, history, onAnswer, onDone }) {
  const step = history.length
  const base = route.interview
  const [q, setQ] = useState(step === 0 ? base[0] : '')
  const [reply, setReply] = useState('')
  const [care, setCare] = useState(false)
  const [busy, setBusy] = useState(false)
  const [writing, setWriting] = useState(false)
  const ctl = useRef(null)

  useEffect(() => {
    if (step === 0) { setQ(base[0]); return }
    if (step >= base.length) { onDone(); return }
    let alive = true
    setBusy(true); setWriting(false)
    ctl.current = new AbortController()
    nextInterviewStep(history, base, step, route.context, { signal: ctl.current.signal })
      .then(r => { if (!alive) return; setReply(r.reply); setCare(r.distress); setQ(r.question || base[step]) })
      .catch(() => { if (alive) setQ(base[step]) })
      .finally(() => alive && setBusy(false))
    return () => { alive = false; try { ctl.current && ctl.current.abort() } catch { /* ignore */ } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  if (step >= base.length) return null
  return (
    <section className="paper-sheet narrow interview">
      <p className="kicker">離開學校之後 · {step + 1}／{base.length}</p>
      {reply && <p className="reply">{reply}</p>}
      {care && <p className="care">聽落嗰段日子唔容易。唔想講可以按「跳過」，或者同身邊嘅職員傾吓。</p>}
      {busy ? <p className="thinking">諗緊下一條問題</p> : (
        <>
          <div className="asker"><span className="asker-badge" aria-hidden="true">問</span><p className="question">{q}</p></div>
          {!writing ? (
            <div className="choice">
              <button type="button" className="btn primary big" onClick={() => setWriting(true)}>我想分享</button>
              <button type="button" className="btn ghost big" onClick={() => onAnswer({ q, skipped: true })}>跳過</button>
            </div>
          ) : (
            <MemoryEditor key={step} onSave={a => onAnswer({ q, a })} onCancel={() => setWriting(false)} />
          )}
        </>
      )}
      <button type="button" className="btn ghost" onClick={onDone}>唔再傾呢部分，繼續</button>
    </section>
  )
}
