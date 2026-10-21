// 廣東話語音輸入（語音轉文字）同朗讀，使用瀏覽器內建 Web Speech API。
// 支援程度視乎瀏覽器：Chrome / Edge 較好；部分瀏覽器或者嵌入式頁面會用唔到咪高峰。

export function recognitionSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function startRecognition({ onText, onEnd, onError }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) { onError && onError('呢部裝置唔支援語音輸入，請用打字，或者請職員幫手。'); return null }
  const rec = new SR()
  rec.lang = 'yue-Hant-HK'
  rec.interimResults = true
  rec.continuous = true
  let finalText = ''
  rec.onresult = e => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript
      if (e.results[i].isFinal) finalText += t
      else interim += t
    }
    onText && onText(finalText, interim)
  }
  rec.onerror = e => {
    const map = {
      'not-allowed': '用唔到咪高峰：請喺瀏覽器允許使用咪高峰，或者改用打字。',
      'service-not-allowed': '呢個環境唔容許語音輸入，請改用打字。',
      'no-speech': '聽唔到聲音，請再講一次。',
      'audio-capture': '搵唔到咪高峰。',
      'network': '語音辨識需要上網，請檢查網絡。',
    }
    onError && onError(map[e.error] || '語音輸入出錯，請再試或者改用打字。')
  }
  rec.onend = () => onEnd && onEnd()
  try { rec.start() } catch { onError && onError('語音輸入啟動唔到，請再試。'); return null }
  return rec
}

export function ttsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function cantoneseVoice() {
  const voices = window.speechSynthesis.getVoices()
  return voices.find(v => /zh[-_]HK|yue/i.test(v.lang)) || voices.find(v => /Cantonese|粵|廣東/i.test(v.name)) || null
}

export function speak(text, { onEnd, onNoVoice } = {}) {
  if (!ttsSupported()) return false
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-HK'
  u.rate = 0.85
  const v = cantoneseVoice()
  if (v) u.voice = v
  else onNoVoice && onNoVoice()
  u.onend = () => onEnd && onEnd()
  u.onerror = () => onEnd && onEnd()
  window.speechSynthesis.speak(u)
  return true
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel()
}
