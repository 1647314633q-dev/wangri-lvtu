// ---------- 「我的家庭」額外支線（唔使配對，唔係完成第一章嘅必要條件） ----------
export const FAMILY_CARDS = [
  { id: 'father', name: '爸爸', seal: '父',
    question: '你細個嗰陣，仲記唔記得爸爸係一個點樣嘅人？',
    followups: ['爸爸以前係做咩工作㗎？', '你細個通常會同爸爸一齊做啲咩？', '爸爸有冇教過你啲咩？', '有冇一件同爸爸有關嘅事令你好難忘？'] },
  { id: 'mother', name: '媽媽', seal: '母',
    question: '你細個嗰陣，媽媽係一個點樣嘅人？有冇啲特別難忘嘅回憶？',
    followups: ['媽媽以前平時主要做啲咩？', '你細個會唔會成日跟住媽媽？', '你最記得媽媽煮過咩餸？', '媽媽有冇講過一句令你好難忘嘅說話？'] },
  { id: 'siblings', name: '兄弟姊妹', seal: '手足',
    question: '你細個有冇兄弟姊妹？你哋以前通常會一齊做啲咩？',
    followups: ['你屋企一共有幾多個兄弟姊妹？', '你排行第幾？', '你同邊個兄弟姊妹最親近？', '你哋細個最鍾意一齊玩啲咩？', '有冇一件令你特別難忘嘅事？'] },
  { id: 'home', name: '家庭背景與生活', seal: '家',
    question: '你細個一家人通常係點樣生活㗎？',
    followups: ['屋企以前通常有幾多人一齊住？', '你細個住嘅地方係點樣㗎？', '屋企當時主要靠邊個工作維持生活？', '你細個有冇幫屋企做家務或者幫手做嘢？', '以前屋企有冇啲事情需要特別慳住使？', '你最懷念以前一家人嘅咩時光？'] },
  { id: 'others', name: '其他重要的人', seal: '親',
    question: '你細個除咗屋企人，仲有冇邊個係對你好重要嘅人？',
    note: '例如祖父母、親戚、照顧你嘅人、街坊……',
    followups: ['佢係你嘅邊位？', '佢平時會同你做啲咩？', '有冇一件同佢有關嘅事令你好難忘？'] },
]
export const familyById = id => FAMILY_CARDS.find(c => c.id === id)

// 已分享嘅家庭資料（俾 AI 調整問題同整理自傳用）；冇分享就回傳空字串
export function familySummary(family) {
  if (!family) return ''
  return FAMILY_CARDS.map(c => {
    const f = family[c.id]
    if (!f || f.status !== 'shared') return ''
    const more = (f.follow || []).filter(x => x.a).map(x => x.a).join('；')
    return c.name + '：' + f.text + (more ? '；' + more : '')
  }).filter(Boolean).join('\n')
}
