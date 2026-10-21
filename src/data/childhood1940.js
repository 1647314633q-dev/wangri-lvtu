// 第一章「童年時光」· 1940 年代出世、童年喺 1940–1950 年代嘅香港長者
// 玩法：左邊物件圖片 + 名稱，右邊打亂嘅同名文字，點兩邊同名嘅就配對成功（例如圖片「木飯桌」配文字「木飯桌」）。
// 所有物件都只係回憶線索，唔代表長者一定用過，或者一定住過寮屋。
import { pic } from '../lib/img.js'
// 換圖：將相片放入 src/assets/images/childhood/，用同一個檔名（例如 marbles.jpg）就會自動取代示意插畫（見 src/lib/img.js）。

const HINT = '點左邊一張相，再點右邊同名嘅字'

export const CHAPTER = {
  id: 'childhood',
  no: '第一章',
  decade: 1940,
  title: '童年時光',
  years: '1940–1950',
  pairMode: true,
  rounds: [
    { id: 'things', title: '第一章 · 童年物件', hint: HINT },
  ],
  items: [
    { id: 'marbles', round: 'things', name: '波子', ...pic('childhood/marbles'), theme: '童年玩樂、朋友',
      intro: '玻璃波子放喺地下，用手指一彈，撞中人哋粒波就贏。',
      question: '你細個有冇同朋友彈過波子？通常喺邊度玩？' },
    { id: 'table', round: 'things', name: '木飯桌', ...pic('childhood/dining-table'), theme: '家庭飲食、日常生活',
      intro: '以前唔少家庭都會用木飯桌，一家人圍住食飯。',
      question: '你細個通常同邊個一齊食飯？' },
    { id: 'laundry', round: 'things', name: '晾衫竹', ...pic('childhood/laundry-pole'), theme: '家務、居住環境',
      intro: '衫洗好就晾喺竹篙上面，伸出窗外或者掛喺街頭巷尾。',
      question: '細個需唔需要幫屋企做家務？' },
    { id: 'bucket', round: 'things', name: '鐵水桶', ...pic('childhood/iron-bucket'), theme: '取水、生活條件',
      intro: '以前唔係家家戶戶都有自來水，好多人要拎住鐵水桶去街喉或者山邊取水。',
      question: '你細個屋企係點樣取水？有冇試過拎水桶去擔水？' },
    { id: 'bowls', round: 'things', name: '碗筷', ...pic('childhood/bowls-chopsticks'), theme: '家庭飲食',
      intro: '公雞碗、竹筷子，一家人食飯嘅日常。',
      question: '你記唔記得細個食飯用嘅碗筷係點樣？屋企通常食啲咩？' },
    { id: 'squatter', round: 'things', name: '寮屋', ...pic('childhood/squatter-hut'), theme: '居住環境、街坊生活',
      intro: '好多家庭喺山邊用木板、鐵皮搭屋；就算冇住過，都可能見過或者有街坊住。',
      question: '你細個住喺咩屋？附近嘅街坊鄰里係點樣？' },
  ],
  finalQuestion: '仲有冇邊啲童年趣事／回憶，係你特別難忘嘅呢？',
}

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
