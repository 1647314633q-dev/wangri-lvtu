import { FAMILY_CARDS } from '../data/family.js'

export function memoirText(pages) {
  const lines = ['往日旅途 · 我的人生自傳', '']
  for (const p of Object.values(pages)) {
    if (!p.cfg || !p.data) continue
    lines.push(p.storyTitle, '─'.repeat(16))
    if (p.data.story?.text) lines.push(p.data.story.text, '')
    if (p.schoolText) lines.push('學校資料：' + p.schoolText)
    lines.push('我分享過的原話：')
    for (const c of FAMILY_CARDS) {
      const f = p.family?.[c.id]
      if (f?.status !== 'shared') continue
      lines.push('我的家庭 · ' + c.name + '：' + f.text)
      for (const x of f.follow || []) if (x.a) lines.push('  ' + x.q + ' ' + x.a)
    }
    for (const item of p.cfg.items) {
      const memory = p.data.memories[item.id]
      if (memory?.status !== 'shared') continue
      lines.push(item.name + '：' + memory.text)
      for (const f of memory.follow || []) if (f.a) lines.push('  ' + f.q + ' ' + f.a)
    }
    for (const h of p.data.interview || []) if (!h.skipped && h.a) lines.push(h.q, h.a)
    if (p.data.extra?.text) lines.push('其他難忘回憶：' + p.data.extra.text)
    lines.push('')
  }
  return lines.join('\n')
}

export function downloadMemoir(pages) {
  const url = URL.createObjectURL(new Blob(['\ufeff' + memoirText(pages)], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url; a.download = '往日旅途-我的人生自傳.txt'
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
