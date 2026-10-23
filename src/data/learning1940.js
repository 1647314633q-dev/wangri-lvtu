// 第二章「求學歲月」· 1940 年代出世嘅長者
// 香港要到 1971 年先全面推行免費小學教育，所以唔係個個長者都有返學。
// 流程：問有冇返過學 → A/B 揀學校類型 → 可選填年份 → 圖片名稱配對 → 回憶卡 →（B）離校訪談 → AI 整理自傳
import { pic } from '../lib/img.js'
// 圖片來源同版權狀況見 docs/photo-sources.md。換圖：放入 src/assets/images/learning/ 用同一個檔名覆蓋。

// ---------- 學校類型（A/B 路線揀） ----------
export const SCHOOL_TYPES = [
  { id: 'rooftop', name: '天台小學', big: true, ...pic('learning/rooftop-school-hillside'),
    credit: '天台學校上課情景（來源待確認）',
    intro: '以前香港部分徙置大廈嘅天台會用嚟開辦小學，為附近嘅小朋友提供讀書機會。',
    question: '你以前返學係咪要行樓梯上天台？嗰陣課室環境係點樣？' },
  { id: 'village', name: '鄉村學校（村校）', short: '村校', big: true, ...pic('learning/village-school-zongfu'),
    credit: '宗福學校師生合照（年份待考證）',
    intro: '以前新界同離島有唔少村校，為附近村落嘅小朋友提供教育。',
    question: '你以前返村校要行幾遠？學校附近有冇啲令你好難忘嘅地方？' },
  { id: 'kinder', name: '幼兒學校', ...pic('learning/kindergarten-1964'),
    credit: '兒童在幼稚園上課，1964 年 · 政府檔案處 HKRS365-1-119-1',
    intro: '有啲小朋友讀小學之前，會去幼稚園、託兒所，做手工、唱歌、畫畫。',
    question: '你細個喺學校有冇做過剪紙、穿珠或者其他手工活動？' },
  { id: 'general', name: '其他學校', sub: '例如官立、津貼或私立小學', ...pic('learning/classmates'),
    credit: '學童，1966 年 · 政府檔案處 HKRS365-1-188-2',
    intro: '官立、津貼、私立小學，各有各嘅校舍同規矩。',
    question: '你以前間學校係點樣㗎？最記得邊位老師？' },
]
export const typeById = id => SCHOOL_TYPES.find(t => t.id === id)

export const SCHOOL_QUESTION = {
  question: '你以前讀過邊一種學校？睇下呢啲舊相，有冇一間似你以前讀過嘅學校？',
  note: '可以揀多過一種。唔肯定都唔緊要。',
}
export const YEARS_QUESTION = '你仲記唔記得大概邊一年返過呢間學校？'
export const NAME_QUESTION = '你以前讀嗰間學校叫咩名？'

// ---------- 配對物件 ----------
const ph = (id, name, img, intro, question) => ({ id, name, ...img, intro, question })

// A／B 路線：課室入面嘅嘢（PDF 建議：成績表、木課桌、課本、練習簿；另加校鐘、學校校門）
const COMMON = [
  { id: 'report', name: '成績表', ...pic('learning/report-card'), credit: '開明學校成績報告表 · 香港教育大學香港教育數碼圖像資料庫',
    intro: '每個學期派成績表，分數、操行、名次，仲要俾屋企人簽名。',
    question: '以前派成績表，你會唔會好緊張？屋企人點睇？' },
  { id: 'desk', name: '木課桌', ...pic('learning/wooden-desks'), credit: '展覽重建嘅舊式課室（現代照片，來源待確認）',
    intro: '木課桌、木椅，有啲枱面可以揭開放書，仲有同學喺度刻字。',
    question: '以前間課室係點樣㗎？你仲記唔記得坐你隔籬嘅同學？' },
  { id: 'textbook', name: '課本', ...pic('learning/textbooks-1967'), credit: '1967 年課程《健康教育》課本（年代較後，只作參考）',
    intro: '以前嘅課本好多時要兄弟姊妹傳落去用，用完包好書皮。',
    question: '你細個最鍾意讀邊一科？' },
  ph('exercise', '練習簿', pic('learning/exercise-book'), '抄生字、做算術、寫作文，一本練習簿寫滿老師嘅紅筆。',
    '以前做功課，屋企人同老師有冇教導過你？'),
  ph('bell', '校鐘', pic('learning/school-bell'), '鐘聲一響就上堂、小息、放學，全校都聽住佢。',
    '你最期待上堂，定係放學之後嘅時間？'),
  ph('gate', '學校校門', pic('learning/school-gate'), '每朝行入校門，放學又由呢度行出去。',
    '你記唔記得以前返學條路係點行？'),
]
// A／B 路線：讀書以外，幫屋企同課餘生活
const AFTER = [
  ph('flowers', '穿膠花', pic('learning/plastic-flowers'), '五六十年代好多家庭接膠花返屋企穿，大人細路一齊做幫補家計。',
    '你以前有冇幫屋企人穿過膠花？仲記唔記得係點樣做？'),
  ph('threads', '剪線頭', pic('learning/thread-trimming'), '製衣廠做好嘅衫褲，要人逐件剪走多出嚟嘅線頭。',
    '你以前有冇幫人剪過衫褲啲線頭？通常喺屋企做定出去做？'),
  ph('shoeshine', '擦鞋仔', pic('learning/shoeshine'), '街邊有細路孭住擦鞋箱，幫路人擦皮鞋賺幾毫子。',
    '你細個有冇見過或者做過街邊擦鞋嘅工作？'),
  ph('paper', '賣報紙', pic('learning/newspaper-selling'), '有啲細路一早去攞報紙，喺街頭叫賣。',
    '你以前有冇賣過報紙，或者幫屋企人做過其他小生意？'),
  ph('grocery', '雜貨店', pic('learning/grocery'), '街口嘅士多、雜貨舖，乜都有得賣，好多係一家人一齊打理。',
    '你細個有冇幫屋企人睇舖、搬貨或者招呼客人？'),
  ph('lunchbox', '鐵飯盒', pic('learning/lunchbox'), '一個鐵飯盒裝住屋企煮好嘅飯餸，帶去學校或者開工。',
    '你以前返學或者做嘢嗰陣，有冇帶飯盒？通常邊個幫你準備？'),
]
const TRANSFER = { id: 'transfer', name: '轉校', ...pic('learning/transfer'),
  intro: '有啲人因為搬屋、學位或者屋企安排，讀過唔止一間學校。',
  question: '你讀過唔止一間學校，轉校嗰陣係點樣？有冇啲事令你好難忘？' }

// C／唔記得 路線：生活與學習技能（三回）
const LIFE_WORK = [
  ph('c-flowers', '穿膠花', pic('learning/plastic-flowers'), '五六十年代好多家庭接膠花返屋企穿，幫補家計。',
    '你以前有冇幫屋企人穿過膠花？係邊個教你做㗎？'),
  ph('c-threads', '剪線頭', pic('learning/thread-trimming'), '製衣廠做好嘅衫褲，要人逐件剪走多出嚟嘅線頭。',
    '你以前有冇幫人剪過衫褲啲線頭？通常喺邊度做？'),
  ph('c-shoebox', '擦鞋箱', pic('learning/shoeshine'), '一個木箱、一把鞋刷、一盒鞋油，就可以喺街邊幫人擦鞋。',
    '你以前有冇做過擦鞋嘅工作，或者見過街邊嘅擦鞋仔？'),
  ph('c-paper', '報紙', pic('learning/newspaper-selling'), '有啲細路一早去攞報紙，喺街頭叫賣。',
    '你細個有冇賣過報紙？或者有冇幫屋企做過其他小生意？'),
  ph('c-grocery', '雜貨店', pic('learning/grocery'), '街口嘅士多、雜貨舖，好多係一家人一齊打理。',
    '你有冇試過幫屋企人睇舖，或者喺雜貨店做嘢？'),
]
const LIFE_SKILL = [
  ph('c-lunchbox', '鐵飯盒', pic('learning/lunchbox'), '一個鐵飯盒裝住屋企煮好嘅飯餸，帶去開工。',
    '你以前出街做嘢或者幫屋企做事，有冇帶過飯盒？'),
  ph('c-scale', '磅秤', pic('learning/scale'), '舖頭用磅秤秤貨，買賣都要睇得準。',
    '你以前有冇幫人賣貨、秤嘢或者做買賣？'),
  ph('c-sewing', '針線盒', pic('learning/sewing-box'), '針、線、頂針，以前好多衫褲都係自己補、自己縫。',
    '你以前有冇學過縫衫或者做其他手工？'),
  ph('c-carpentry', '木工工具', pic('learning/carpentry-tools'), '鋸、刨、鎚，跟師傅學手藝，由斟茶掃地做起。',
    '你以前有冇跟過師傅學手藝？學過啲咩？'),
  ph('c-net', '漁網', pic('learning/fishing-net'), '水上人家同漁村，細路好細個就要幫手補網、出海。',
    '你細個有冇接觸過捕魚或者水上生活？'),
]
const LIFE_LEARN = [
  ph('c-oldpaper', '舊報紙', pic('learning/old-newspaper'), '冇返學嘅人，好多都係睇報紙、問人，慢慢識字。',
    '你以前係點樣學認字㗎？有冇人教過你讀報紙？'),
  ph('c-abacus', '算盤', pic('learning/abacus'), '以前做生意計數，靠嘅就係一個算盤。',
    '你有冇學過打算盤？係邊個教你計數？'),
  ph('c-brush', '毛筆', pic('learning/brush'), '毛筆、墨硯、紙，一筆一劃學寫字。',
    '你以前有冇學過寫字？係點樣學識㗎？'),
  ph('c-radio', '收音機', pic('learning/radio'), '收音機播新聞、粵曲、講古，一家人圍住聽。',
    '你細個有冇聽收音機？有冇試過聽廣播學新嘢？'),
]

// ---------- 路線 ----------
export const ROUTES = {
  A: { id: 'A', label: '有接受過小學教育', short: '校園回憶', school: true,
    context: '佢細個有接受過小學教育。',
    finalQuestion: '讀書嗰陣，仲有冇邊件事係你特別難忘？' },
  B: { id: 'B', label: '有返過學，但中途離校', short: '校園回憶同後來嘅路', school: true,
    context: '佢細個返過學，但中途離開咗學校。',
    interview: [
      '後來冇再讀落去，係發生咗咩事？唔想講可以跳過。',
      '離開學校之後，你屋企嘅生活係點樣？',
      '之後你有冇再學嘢，或者開始出嚟做嘢？',
    ],
    finalQuestion: '回望嗰段日子，有冇邊件事你想留低俾屋企人知道？' },
  C: { id: 'C', label: '沒有接受過正規小學教育', short: '生活與學習技能',
    context: '佢冇接受過正規小學教育，係喺生活、家庭同工作入面學嘢同成長。',
    intro: '學嘢唔一定喺課室。我哋傾吓你喺屋企、喺生活、喺工作學識嘅嘢。',
    finalQuestion: '細個學識嘅嘢之中，有冇一樣你到而家都仲用緊？' },
  U: { id: 'U', label: '不記得／跳過', short: '生活與學習技能',
    context: '佢冇講有冇返過學，唔好假設佢有或者冇返學。',
    intro: '冇問題。我哋就由日常生活入面學識嘅嘢開始傾。',
    finalQuestion: '細個學識嘅嘢之中，有冇一樣你到而家都仲用緊？' },
}

export const ROUTE_QUESTION = {
  question: '你細個有冇返過學呀？',
  note: '以前唔係個個小朋友都有機會返學，香港要到 1971 年先有免費小學教育。點答都冇問題。',
  options: [
    { route: 'A', label: '有接受過小學教育' },
    { route: 'B', label: '有返過學，但中途離校' },
    { route: 'C', label: '沒有接受過正規小學教育' },
    { route: 'U', label: '不記得／跳過' },
  ],
}

const HINT = '點左邊一張相，再點右邊同名嘅字'

const typeItem = t => ({ id: 'type-' + t.id, name: t.short || t.name, image: t.image, placeholder: t.placeholder, credit: t.credit, intro: t.intro, question: t.question })

// 所有第二章原有物件（按 id 查；舊存檔、配對進度靠呢啲 id）
export const LEARNING_ITEMS = Object.fromEntries(
  [...COMMON, ...AFTER, TRANSFER, ...LIFE_WORK, ...LIFE_SKILL, ...LIFE_LEARN, ...SCHOOL_TYPES.map(typeItem)].map(i => [i.id, i]))

// 按路線同學校資料組合今章內容
export function chapterFor(learning) {
  const r = ROUTES[learning && learning.route]
  if (!r) return null
  const s = learning.school || {}
  let rounds, items
  if (r.school) {
    const typeItems = (s.types || []).map(id => typeById(id)).filter(Boolean).map(typeItem)
    if ((s.types || []).length > 1 || s.multi) typeItems.push(TRANSFER)
    rounds = []
    if (typeItems.length) rounds.push({ id: 'types', title: '你讀過嘅學校', hint: HINT, items: typeItems })
    rounds.push({ id: 'objects', title: '課室入面嘅嘢', hint: HINT, items: COMMON })
    rounds.push({ id: 'after', title: '讀書以外嘅日子', hint: HINT, items: AFTER })
  } else {
    rounds = [
      { id: 'work', title: '幫補家計', hint: HINT, items: LIFE_WORK },
      { id: 'skill', title: '生活手藝', hint: HINT, items: LIFE_SKILL },
      { id: 'learn', title: '自己學識嘅嘢', hint: HINT, items: LIFE_LEARN },
    ]
  }
  items = rounds.flatMap(x => x.items.map(it => ({ ...it, round: x.id })))
  return {
    id: 'learning', no: '第二章', title: '求學歲月', years: '1946–1960',
    route: r, school: s, rounds: rounds.map(x => ({ ...x, title: '第二章 · ' + x.title })), items,
    finalQuestion: r.finalQuestion, pairMode: true,
  }
}

// 學校資料嘅文字描述（俾 AI 同自傳頁用）
export function schoolSummary(s) {
  if (!s) return ''
  const parts = []
  const names = (s.types || []).map(id => typeById(id)).filter(Boolean).map(t => t.name)
  if (names.length) parts.push('讀過嘅學校類型：' + names.join('、'))
  if (s.multi) parts.push('讀過不止一種學校')
  if (s.unsure) parts.push('唔記得讀過邊種學校')
  if (s.name) parts.push('學校名稱：' + s.name)
  if (s.start) parts.push('大約 ' + s.start + ' 年開始讀')
  if (s.end) parts.push('大約 ' + s.end + ' 年離校')
  if (s.decade) parts.push('大約喺 ' + s.decade + ' 讀書')
  return parts.join('；')
}
