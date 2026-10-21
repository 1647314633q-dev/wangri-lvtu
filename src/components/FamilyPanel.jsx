import { useEffect, useRef, useState } from 'react'
import { FAMILY_CARDS, familyById } from '../data/family.js'
import { familyFollowUp } from '../lib/ai.js'
import MemoryEditor from './MemoryEditor.jsx'

const STATUS = { shared: '已分享', none: '沒有相關經歷', skipped: '跳過咗' }

// 「我的家庭」：童年配對畫面右邊嘅固定入口。
// 桌面版 = 右側邊欄（唔遮住配對）；手機／平板 = 由右邊拉出嚟嘅抽屜。
// 呢個係額外支線：揀邊張答都得，唔使全部完成。
export function FamilyTab({ open, count, onToggle }) {
  return (
    <button type="button" className={'family-tab' + (open ? ' on' : '')} onClick={onToggle} aria-expanded={open} aria-controls="family-panel">
      <span className="family-tab-seal" aria-hidden="true">家</span>
      <span className="family-tab-text">我的家庭</span>
      {count > 0 && <span className="family-tab-count">{count}</span>}
    </button>
  )
}

export default function FamilyPanel({ open, family = {}, context = '', onSave, onClose }) {
  const [cardId, setCardId] = useState(null)
  const closeRef = useRef(null)
  useEffect(() => { if (open && closeRef.current) closeRef.current.focus() }, [open])
  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const card = cardId ? familyById(cardId) : null

  return (
    <>
      <div className="family-backdrop" onClick={onClose} aria-hidden="true" />
      <aside id="family-panel" className="family-panel" aria-label="我的家庭">
        <header className="family-head">
          {card ? <button type="button" className="btn small-btn" onClick={() => setCardId(null)}>← 全部家庭卡</button> : <h2>我的家庭</h2>}
          <button ref={closeRef} type="button" className="btn small-btn" onClick={onClose}>✕ 收埋</button>
        </header>
        {card ? (
          <FamilyCard key={card.id} card={card} rec={family[card.id]} context={context}
            onSave={rec => onSave(card.id, rec)} onDone={() => setCardId(null)} />
        ) : (
          <div className="family-list">
            <p className="note">想講就講，揀邊張都得，唔使全部答。唔答都可以繼續玩第一章。</p>
            {FAMILY_CARDS.map(c => {
              const r = family[c.id]
              return (
                <button key={c.id} type="button" className={'family-card' + (r && r.status === 'shared' ? ' done' : '')} onClick={() => setCardId(c.id)}>
                  <span className="family-seal" aria-hidden="true">{c.seal}</span>
                  <span className="family-card-body">
                    <b>{c.name}</b>
                    <small>{r ? STATUS[r.status] : '未傾'}</small>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </aside>
    </>
  )
}

function FamilyCard({ card, rec, context, onSave, onDone }) {
  const [step, setStep] = useState('ask') // ask | write | follow | followWrite
  const [follow, setFollow] = useState(null) // { reply, question }
  const [busy, setBusy] = useState(false)
  const r = rec || {}
  const asked = (r.follow || []).map(f => f.q)

  async function loadFollow(answer, extraAsked = []) {
    setStep('follow'); setBusy(true); setFollow(null)
    const f = await familyFollowUp(card, answer, [...asked, ...extraAsked], context).catch(() => null)
    setBusy(false)
    if (!f || !f.question) { setFollow(f && f.reply ? { reply: f.reply, question: '' } : null); if (!f || !f.reply) onDone(); return }
    setFollow(f)
  }

  if (step === 'write') {
    return (
      <div className="family-detail">
        <h3>{card.name}</h3>
        <p className="question">{card.question}</p>
        <MemoryEditor initial={r.status === 'shared' ? r.text : ''} onCancel={() => setStep('ask')}
          onSave={text => { onSave({ ...r, status: 'shared', text, follow: r.follow || [], updatedAt: Date.now() }); loadFollow(text) }} />
      </div>
    )
  }
  if (step === 'follow' || step === 'followWrite') {
    return (
      <div className="family-detail">
        <h3>{card.name}</h3>
        <p className="stamp">已保存</p>
        {busy && <p className="thinking">諗緊下一條問題</p>}
        {!busy && follow && follow.reply && <p className="lead">{follow.reply}</p>}
        {!busy && follow && follow.question && (
          <>
            <p className="note">想再講多少少？唔答都得。</p>
            <p className="question">{follow.question}</p>
            {step === 'followWrite' ? (
              <MemoryEditor onCancel={() => setStep('follow')} saveLabel="保存"
                onSave={a => {
                  const nf = [...(r.follow || []), { q: follow.question, a }]
                  onSave({ ...r, follow: nf, updatedAt: Date.now() })
                  loadFollow(a, [follow.question])
                }} />
            ) : (
              <div className="choice">
                <button type="button" className="btn primary big" onClick={() => setStep('followWrite')}>我想答</button>
                <button type="button" className="btn big" onClick={() => loadFollow(r.text || '', [follow.question])}>換另一條</button>
                <button type="button" className="btn ghost big" onClick={onDone}>唔使喇，返去</button>
              </div>
            )}
          </>
        )}
        {!busy && (!follow || !follow.question) && <button type="button" className="btn primary big" onClick={onDone}>返去家庭卡</button>}
      </div>
    )
  }
  return (
    <div className="family-detail">
      <div className="family-detail-head">
        <span className="family-seal big" aria-hidden="true">{card.seal}</span>
        <h3>{card.name}</h3>
      </div>
      <p className="question">{card.question}</p>
      {card.note && <p className="note">{card.note}</p>}
      {r.status === 'shared' && (
        <div className="family-saved">
          <p className="mini-text">{r.text}</p>
          {(r.follow || []).filter(f => f.a).map((f, i) => <p key={i} className="mini-text"><span className="muted">{f.q}</span><br />{f.a}</p>)}
        </div>
      )}
      <div className="choice">
        <button type="button" className="btn primary big" onClick={() => setStep('write')}>{r.status === 'shared' ? '修改我嘅回憶' : '有回憶，我想分享'}</button>
        {r.status === 'shared' && <button type="button" className="btn big" onClick={() => loadFollow(r.text)}>再講多啲</button>}
        {r.status !== 'shared' && <button type="button" className="btn big" onClick={() => { onSave({ status: 'none', updatedAt: Date.now() }); onDone() }}>沒有相關經歷</button>}
        {r.status !== 'shared' && <button type="button" className="btn ghost big" onClick={() => { onSave({ status: 'skipped', updatedAt: Date.now() }); onDone() }}>不想回答／跳過</button>}
      </div>
    </div>
  )
}
