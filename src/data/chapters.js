// 章節結構：將來加入其他章節，只需要喺呢度加資料，並喺 src/data/ 加一個詞匯檔。
export const CHAPTERS = [
  { id: 'childhood', no: '第一章', title: '童年時光', ready: true },
  { id: 'learning', no: '第二章', title: '求學歲月', ready: true },
  { id: 'society', no: '第三章', title: '踏入社會', ready: false },
  { id: 'work', no: '第四章', title: '工作打拼', ready: false, hidden: true },
  { id: 'retire', no: '第五章', title: '退休生活', ready: false, hidden: true },
]

// 支援嘅年代。試玩版只完成 1940 年代。
export const DECADES = [1940, 1950, 1960, 1970]
export const READY_DECADES = [1940]

export function decadeFromAge(age, now = new Date()) {
  const birthYear = now.getFullYear() - age
  const decade = Math.floor(birthYear / 10) * 10
  return { birthYear, decade }
}
