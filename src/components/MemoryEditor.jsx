import { useEffect, useRef, useState } from 'react'
import { recognitionSupported, startRecognition } from '../lib/speech.js'

// 回憶輸入：文字輸入 + 廣東話語音輸入（可用時），辨識後可以自己檢查同修改。
export default function MemoryEditor({ initial = '', placeholder = '喺度寫低你嘅回憶……', saveLabel = '保存回憶', onSave, onCancel, cancelLabel = '返回' }) {
  const [text, setText] = useState(initial)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [msg, setMsg] = useState('')
  const recRef = useRef(null)
  const baseRef = useRef('')
  const canVoice = recognitionSupported()

  useEffect(() => () => { try { recRef.current && recRef.current.stop() } catch { /* ignore */ } }, [])

  function toggleVoice() {
    if (listening) { try { recRef.current && recRef.current.stop() } catch { /* ignore */ } return }
    setMsg('')
    baseRef.current = text ? text.replace(/\s*$/, '') + (text.trim() ? '，' : '') : ''
    const rec = startRecognition({
      onText: (finalText, inter) => { setText(baseRef.current + finalText); setInterim(inter) },
      onEnd: () => { setListening(false); setInterim('') },
      onError: m => { setMsg(m); setListening(false); setInterim('') },
    })
    if (rec) { recRef.current = rec; setListening(true) }
  }

  function submit() {
    const v = text.trim()
    if (!v) { setMsg('寫幾個字都得；唔想分享可以按「' + cancelLabel + '」。'); return }
    try { recRef.current && recRef.current.stop() } catch { /* ignore */ }
    onSave(v)
  }

  return (
    <div className="editor">
      <label className="lbl" htmlFor="mem-text">你嘅回憶（可以自己打字、用語音，或者請職員代寫）</label>
      <textarea id="mem-text" value={text} placeholder={placeholder} onChange={e => setText(e.target.value)} rows={5} />
      {listening && <p className="listening" aria-live="polite">🎙️ 聽緊……{interim && <span className="interim">{interim}</span>}</p>}
      {msg && <p className="msg" role="alert">{msg}</p>}
      <div className="btnrow">
        {canVoice && (
          <button type="button" className={'btn voice' + (listening ? ' on' : '')} onClick={toggleVoice} aria-pressed={listening}>
            {listening ? '⏹ 停止錄音' : '🎤 用廣東話講'}
          </button>
        )}
        <button type="button" className="btn primary" onClick={submit}>{saveLabel}</button>
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>{cancelLabel}</button>}
      </div>
      {canVoice && <p className="note">講完可以喺上面嘅框檢查同修改文字，先至保存。</p>}
    </div>
  )
}
