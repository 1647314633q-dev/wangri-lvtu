import { useEffect, useRef, useState } from 'react'
import MemoryEditor from './MemoryEditor.jsx'
import { familyFollowUp } from '../lib/ai.js'

// 回憶卡：上半部 = 物件圖片、名稱、介紹；下半部 = 回憶問題 + 大按鈕
// 第一、二章：有回憶，我想分享／冇乜印象／跳過（原有）
// 第三章起（item.noExp）：再多一個「冇呢段經歷」——同「冇乜印象」分開記錄；本人確認有先問深入問題
// 分享之後，如果有追問（item.followups），可以選擇再講多啲；唔答都會保存已分享嘅內容
export default function MemoryCard({ item, existing, onShare, onNone, onNoExp, onSkip, loadQuestion, followContext = '' }) {
  const [step, setStep] = useState('ask')   // ask | write | noexp | follow | followWrite
  const [question, setQuestion] = useState(item.question)
  const [text, setText] = useState('')
  const [answers, setAnswers] = useState([])
  const [follow, setFollow] = useState(null) // { reply, question }
  const [busy, setBusy] = useState(false)
  const firstBtn = useRef(null)
  const followups = item.followups || []
  useEffect(() => { firstBtn.current && firstBtn.current.focus() }, [])
  useEffect(() => {
    if (!loadQuestion) return
    let alive = true
    loadQuestion(item).then(q => { if (alive && q) setQuestion(q) }).catch(() => {})
    return () => { alive = false }
  }, [item, loadQuestion])

  async function nextFollow(mainText, done) {
    const left = followups.filter(q => !done.some(a => a.preset === q))
    if (!left.length) return onShare(mainText, done.map(({ q, a }) => ({ q, a })))
    setStep('follow'); setBusy(true); setFollow(null)
    const card = { name: item.name, followups: left, topic: '「' + item.name + '」相關嘅經歷' }
    const f = await familyFollowUp(card, done.length ? done[done.length - 1].a : mainText, [], followContext).catch(() => null)
    setBusy(false)
    // AI 冇問題（例如佢流露唔想講）就唔追問
    if (f && !f.question && f.source !== 'preset') return onShare(mainText, done.map(({ q, a }) => ({ q, a })))
    setFollow({ reply: f?.reply || '', question: f?.question || left[0], preset: left[0] })
  }

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
            {item.intro && <p className="intro">{item.intro}</p>}
            {item.placeholder && <p className="note">（示意插畫，可換成真實照片）</p>}
            {item.credit && !item.placeholder && <p className="credit">{item.credit}</p>}
            {item.photoInfo && (
              <p className="credit">相片：{item.photoInfo.year} · {item.photoInfo.source}{item.photoInfo.ref ? '（' + item.photoInfo.ref + '）' : ''}<br />{item.photoInfo.yearNote}</p>
            )}
          </div>
        </div>
        <div className="memcard-bottom">
          {step === 'ask' && (
            <>
              <p className="question">{question}</p>
              <div className="choice">
                <button ref={firstBtn} type="button" className="btn primary big" onClick={() => setStep('write')}>{item.noExp ? '有，我想分享' : '有回憶，我想分享'}</button>
                {item.noExp && <button type="button" className="btn big" onClick={() => setStep('noexp')}>冇呢段經歷</button>}
                <button type="button" className="btn big" onClick={onNone}>冇乜印象</button>
                <button type="button" className="btn ghost big" onClick={onSkip}>跳過</button>
              </div>
            </>
          )}
          {step === 'write' && (
            <>
              <p className="question">{item.prompt || question}</p>
              <MemoryEditor initial={existing || ''} onCancel={() => setStep('ask')} cancelLabel="返回"
                onSave={v => { setText(v); followups.length ? nextFollow(v, []) : onShare(v, []) }} />
            </>
          )}
          {step === 'noexp' && (
            <>
              <p className="question">{item.noExp}</p>
              <p className="note">呢件物件會收起，唔會再追問，亦唔會寫入自傳。想講其他經歷，可以喺最後一張回憶卡補充。</p>
              <div className="choice">
                <button type="button" className="btn primary big" onClick={onNoExp}>好，揀下一件</button>
                <button type="button" className="btn ghost big" onClick={() => setStep('ask')}>返回</button>
              </div>
            </>
          )}
          {(step === 'follow' || step === 'followWrite') && (
            <>
              <p className="stamp">已保存</p>
              {busy && <p className="thinking">諗緊下一條問題</p>}
              {!busy && follow && (
                <>
                  {follow.reply && <p className="lead">{follow.reply}</p>}
                  <p className="note">想再講多少少？唔答都得。</p>
                  <p className="question">{follow.question}</p>
                  {step === 'followWrite' ? (
                    <MemoryEditor saveLabel="保存" onCancel={() => setStep('follow')}
                      onSave={a => { const done = [...answers, { q: follow.question, a, preset: follow.preset }]; setAnswers(done); nextFollow(text, done) }} />
                  ) : (
                    <div className="choice">
                      <button type="button" className="btn primary big" onClick={() => setStep('followWrite')}>我想答</button>
                      <button type="button" className="btn ghost big" onClick={() => onShare(text, answers.map(({ q, a }) => ({ q, a })))}>唔使喇，繼續</button>
                    </div>
                  )}
                </>
              )}
            </>
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
