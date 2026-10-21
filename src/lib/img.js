// 圖片解析：同一個檔名，有真實相片（jpg / png / webp）就用相片，冇就用示意插畫（svg）。
// 公開版（GitHub）冇包未取得授權嘅相片，所以會自動顯示示意插畫；
// 取得授權之後，將相片用同一個檔名放入對應資料夾，重新打包就會自動換走插畫。
const files = import.meta.glob('../assets/images/**/*.{jpg,jpeg,png,webp,svg}', { eager: true, import: 'default' })
const PHOTO_EXT = ['jpg', 'jpeg', 'png', 'webp']

export function img(path) {
  for (const ext of PHOTO_EXT) {
    const f = files['../assets/images/' + path + '.' + ext]
    if (f) return { src: f, photo: true }
  }
  const svg = files['../assets/images/' + path + '.svg']
  return { src: svg || '', photo: false }
}

// 物件資料用：{ image, placeholder }；credit 只喺真係用緊相片時先顯示
export function pic(path, credit) {
  const r = img(path)
  return { image: r.src, placeholder: !r.photo, credit: r.photo ? credit : undefined }
}
