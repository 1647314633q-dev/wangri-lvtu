import { useEffect, useRef, useState } from 'react'
import { generateStory } from '../lib/ai.js'
import { speak, stopSpeaking, ttsSupported } from '../lib/speech.js'

export function ReadAloud({ text }) {
  const [on, setOn] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => () => stopSpeaking(), [])
  if (!ttsSupported()) return null
  return (
    <>
      <button type="button" className={'btn voice' + (on ? ' on' : '')} onClick={() => {
        if (on) { stopSpeaking(); setOn(false); return }
        setMsg('')
        const ok = speak(text, { onEnd: () => setOn(false), onNoVoice: () => setMsg('呢部裝置未裝廣東話語音，讀出嚟可能唔係廣東話。') })
        setOn(ok)
      }}>{on ? '⏹ 停止朗讀' : '🔊 用廣東話讀出嚟'}</button>
      {msg && <p className="note w100">{msg}</p>}
    </>
  )
}

const SOURCE = {
  claude: '由 AI（Claude）根據你分享嘅內容整理。請核對內容，確認係你嘅真實經歷。',
  server: '由 AI 根據你分享嘅內容整理。請核對內容，確認係你嘅真實經歷。',
  gemini: '由 AI（Gemini）根據你分享嘅內容整理。請核對內容，確認係你嘅真實經歷。',
  'workers-ai': '由 AI（Cloudflare Workers AI）根據你分享嘅內容整理。請核對內容，確認係你嘅真實經歷。',
  deepseek: '由 AI（DeepSeek）根據你分享嘅內容整理。請核對內容，確認係你嘅真實經歷。',
  local: '未連接 AI：呢度先將你講過嘅說話按次序排好。你可以自己修改。',
}

export default function StoryPage({ entries, profile, story, onSave, onBack, onAlbum, chapterNo = '第一章', chapterTitle = '童年時光', heading = '我的童年', context = '', emptyText = '你今次未有分享童年回憶，所以未可以整理故事。我哋唔會幫你作故事。' }) {
  const [text, setText] = useState(story ? story.text : '')
  const [source, setSource] = useState(story ? story.source : null)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [err, setErr] = useState('')
  const [confirmRedo, setConfirmRedo] = useState(false)
  const ctl = useRef(null)

  async function run() {
    setErr(''); setBusy(true); setEditing(false); setText('')
    ctl.current = new AbortController()
    try {
      const r = await generateStory(entries, profile, { signal: ctl.current.signal, onText: t => setText(t), chapterTitle, context })
      setText(r.text); setSource(r.source)
      onSave({ text: r.text, source: r.source, updatedAt: Date.now(), saved: false })
    } catch (e) {
      if (e && e.code === 'cancelled') return
      setErr('暫時整理唔到（' + (e && (e.message || e.code) || '未知原因') + '）。可以稍後再試，或者自己寫。')
      setText(story ? story.text : '')
    } finally { setBusy(false) }
  }

  useEffect(() => {
    if (entries.some(e => !e.meta) && !story) run()
    return () => { try { ctl.current && ctl.current.abort() } catch { /* ignore */ } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!entries.some(e => !e.meta)) {
    return (
      <section className="paper-sheet narrow center-text">
        <h1 className="h1">暫時未收集到足夠回憶</h1>
        <p className="lead">{emptyText}</p>
        <p className="note">可以返去自傳收藏頁，喺每樣物件旁邊按「補充回憶」，之後再整理。</p>
        <div className="btncol">
          <button type="button" className="btn primary big" onClick={onAlbum}>去我的人生自傳</button>
          <button type="button" className="btn big" onClick={onBack}>返回</button>
        </div>
      </section>
    )
  }

  return (
    <section className="paper-sheet story">
      <p className="kicker">{chapterNo} · {chapterTitle} · 自傳草稿</p>
      <h1 className="h1">{heading}</h1>
      {busy && !text && <p className="thinking">正在整理你嘅故事</p>}
      {editing ? (
        <textarea className="story-edit" value={text} onChange={e => setText(e.target.value)} rows={12} aria-label="修改故事" />
      ) : (
        <div className="story-text">{text}</div>
      )}
      {err && <p className="msg" role="alert">{err}</p>}
      {!busy && source && <p className="note">{SOURCE[source]}</p>}
      {!busy && (
        <div className="btnrow">
          {editing ? (
            <button type="button" className="btn primary" onClick={() => { setEditing(false); onSave({ text: text.trim(), source, updatedAt: Date.now(), saved: false, edited: true }) }}>完成修改</button>
          ) : (
            <button type="button" className="btn" onClick={() => setEditing(true)}>✏️ 自己修改</button>
          )}
          {!editing && text && <ReadAloud text={text} />}
          {!editing && (
            <button type="button" className="btn ghost" onClick={() => {
              if (!confirmRedo) { setConfirmRedo(true); setTimeout(() => setConfirmRedo(false), 4000); return }
              setConfirmRedo(false); run()
            }}>{confirmRedo ? '再按一次：重新整理（會覆蓋修改）' : '🔄 重新整理'}</button>
          )}
        </div>
      )}
      {!busy && !editing && text && (
        <button type="button" className="btn primary big" onClick={() => { onSave({ text: text.trim(), source, updatedAt: Date.now(), saved: true }); onAlbum() }}>保存到我的人生自傳</button>
      )}
      <details className="raw">
        <summary>睇返你分享過嘅原話</summary>
        {entries.map(e => <p key={e.id}><b>{e.name}</b>：{e.text}</p>)}
      </details>
    </section>
  )
}
