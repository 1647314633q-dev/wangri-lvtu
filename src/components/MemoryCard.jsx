import { useEffect, useRef, useState } from 'react'
import MemoryEditor from './MemoryEditor.jsx'

// 回憶卡：上半部 = 物件圖片、名稱、介紹；下半部 = 回憶問題 + 三個大按鈕
export default function MemoryCard({ item, existing, onShare, onNone, onSkip, loadQuestion }) {
  const [writing, setWriting] = useState(false)
  const [question, setQuestion] = useState(item.question)
  const firstBtn = useRef(null)
  useEffect(() => { firstBtn.current && firstBtn.current.focus() }, [])
  useEffect(() => {
    if (!loadQuestion) return
    let alive = true
    loadQuestion(item).then(q => { if (alive && q) setQuestion(q) }).catch(() => {})
    return () => { alive = false }
  }, [item, loadQuestion])

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="card-name">
      <article className="memcard">
        <div className="memcard-top">
          <figure className="photo-mount big">
            <img src={item.image} alt={item.name} />
            <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          </figure>
          <div className="memcard-title">
            <p className="stamp">配對成功</p>
            <h2 id="card-name">{item.name}</h2>
            <p className="intro">{item.intro}</p>
            {item.placeholder && <p className="note">（示意插畫，可換成真實照片）</p>}
            {item.credit && !item.placeholder && <p className="credit">{item.credit}</p>}
          </div>
        </div>
        <div className="memcard-bottom">
          <p className="question">{question}</p>
          {!writing ? (
            <div className="choice">
              <button ref={firstBtn} type="button" className="btn primary big" onClick={() => setWriting(true)}>有回憶，我想分享</button>
              <button type="button" className="btn big" onClick={onNone}>冇乜印象</button>
              <button type="button" className="btn ghost big" onClick={onSkip}>跳過</button>
            </div>
          ) : (
            <MemoryEditor initial={existing || ''} onSave={onShare} onCancel={() => setWriting(false)} cancelLabel="返回" />
          )}
        </div>
      </article>
    </div>
  )
}

// 最後一張回憶卡：上面係問號，下面提問長者補充
export function FinalCard({ question, title = '你嘅童年', onShare, onNone }) {
  const [writing, setWriting] = useState(false)
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="final-q">
      <article className="memcard">
        <div className="memcard-top final">
          <div className="qmark" aria-hidden="true">？</div>
          <div className="memcard-title">
            <p className="stamp">最後一張回憶卡</p>
            <h2>{title}</h2>
            <p className="intro">全部都傾完喇！最後，想聽吓你自己記得嘅事。</p>
          </div>
        </div>
        <div className="memcard-bottom">
          <p className="question" id="final-q">{question}</p>
          {!writing ? (
            <div className="choice">
              <button type="button" className="btn primary big" onClick={() => setWriting(true)}>有，我想補充</button>
              <button type="button" className="btn big" onClick={onNone}>冇喇</button>
              <button type="button" className="btn ghost big" onClick={onNone}>跳過</button>
            </div>
          ) : (
            <MemoryEditor onSave={onShare} onCancel={() => setWriting(false)} />
          )}
        </div>
      </article>
    </div>
  )
}
