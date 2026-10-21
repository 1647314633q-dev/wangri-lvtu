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

// 「我的家庭」五張卡喺 family.js（唔包圖片，Node 測試同匯出都用得）
export { FAMILY_CARDS, familyById, familySummary } from './family.js'
