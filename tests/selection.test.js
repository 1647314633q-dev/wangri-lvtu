import test from 'node:test'
import assert from 'node:assert/strict'
import { MATERIALS, groupOf, planChildhood, planLearning, planSociety, planShared, usable, material, mergePlan, keyOf, carerOnly } from '../src/data/catalog.js'

const LEGACY_CH1 = ['marbles', 'table', 'laundry', 'bucket', 'bowls', 'squatter']
const words = plan => plan.rounds.flatMap(r => r.items).map(id => material(id)?.word || id)
const all = plan => plan.rounds.flatMap(r => r.items)

test('素材包 92 筆全部接入：原有 52 + 新增 40', () => {
  assert.equal(MATERIALS.length, 92)
  assert.equal(MATERIALS.filter(m => /^E\d\d$/.test(m.src)).length, 40)
  for (const m of MATERIALS) { assert.ok(m.question, m.src); assert.ok(m.photo.source, m.src) }
})

test('出生組：1940–1949、1950–1959、1960–1966；1967 唔會默默納入', () => {
  assert.equal(groupOf(1940), '1940'); assert.equal(groupOf(1949), '1940')
  assert.equal(groupOf(1955), '1950'); assert.equal(groupOf(1966), '1960')
  assert.equal(groupOf(1967), null); assert.equal(groupOf(1939), null)
})

test('三個出生組第一章都係同名配對，但內容唔同；1940 組保留原有 6 件同舊 ID', () => {
  const p = g => planChildhood({ group: g, legacyIds: LEGACY_CH1 })
  assert.deepEqual(p('1940').rounds[0].items, LEGACY_CH1)
  const a = new Set(words(p('1940'))), b = new Set(words(p('1950'))), c = new Set(words(p('1960')))
  assert.ok(a.has('公仔書') && !b.has('公仔書') && !c.has('公仔書'))
  assert.ok(b.has('積木') && c.has('遙控車'))
  for (const g of ['1940', '1950', '1960']) for (const r of p(g).rounds) assert.ok(r.items.length <= 6)
})

test('第二章 A／B／C／U：保留原有回合；1960 組課室物件有教育電視；C 唔出要正規上學嘅題，但保留圖書館', () => {
  const base = [{ id: 'objects', title: 'x', items: [] }, { id: 'learn', title: 'y', items: [{ id: 'c-oldpaper' }] }]
  const p60 = planLearning({ group: '1960', route: 'A', baseRounds: base })
  assert.ok(p60.rounds[0].items.includes('m-E02'))
  const p40 = planLearning({ group: '1940', route: 'A', baseRounds: base })
  assert.deepEqual(p40.rounds[0].items, ['report', 'desk', 'textbook', 'exercise', 'bell', 'gate'])
  const pc = planLearning({ group: '1960', route: 'C', baseRounds: base })
  assert.ok(!pc.rounds[0].items.includes('m-E02'))
  assert.ok(pc.rounds[1].items.includes('m-E03'))
  assert.ok(usable(material('m-E04'), { route: 'U' }), 'U 係唔知道，唔當作冇讀書')
})

test('同為 1955 年出世：工廠經歷同照顧家人經歷揀到唔同物件', () => {
  const factory = planSociety({ group: '1950', exp: { tags: { factory: 'yes' } } })
  const carer = planSociety({ group: '1950', exp: { tags: { care: 'yes', factory: 'no' } } })
  const f = words(factory), c = words(carer)
  assert.ok(f.includes('電子裝配') && f.includes('漂染缸') && !f.includes('煮飯地方'))
  assert.ok(c.includes('煮飯地方') && c.includes('洗衣地方') && c.includes('取水水桶') && c.includes('家庭手工'))
  assert.ok(!c.some(w => ['電子裝配', '公仔衫', '巴士車廠', '商場'].includes(w)), '照顧家人為主、冇工廠經歷：唔反覆問返工同工廠')
  assert.equal(carer.rounds[0].title, '家務與照顧家人')
  assert.ok(carerOnly({ tags: { care: 'yes', factory: 'no' } }))
})

test('同年出世、本人主要喺香港以外生活：唔出香港專屬街景', () => {
  const hk = words(planSociety({ group: '1960', exp: { tags: {} } }))
  const away = words(planSociety({ group: '1960', exp: { tags: { away: 'yes' }, where: 'away', place: '英國' } }))
  assert.ok(hk.includes('九鐵列車') && hk.includes('電車總站'))
  assert.ok(!away.includes('九鐵列車') && !away.includes('電車總站') && !away.includes('鴨寮街'))
  assert.ok(away.includes('離開熟悉地方'))
})

test('揀「冇」先收起；冇揀（唔肯定）唔當作冇', () => {
  const unknown = words(planSociety({ group: '1940', exp: { tags: {} } }))
  const no = words(planSociety({ group: '1940', exp: { tags: { factory: 'no' } } }))
  assert.ok(unknown.includes('紡織機器'))
  assert.ok(!no.includes('紡織機器') && !no.includes('假髮'))
  assert.ok(no.includes('收音機工場'), '收音機工場同時屬手藝，未確認冇手藝就保留')
})

test('八類經歷可以多選；每回合最多 6 件；同一物件唔會重複', () => {
  const tags = { trade: 'yes', factory: 'yes', care: 'yes', business: 'yes', rural: 'yes', away: 'yes', community: 'yes', education: 'yes' }
  const p = planSociety({ group: '1950', exp: { tags }, route: 'A' })
  for (const r of p.rounds) assert.ok(r.items.length <= 6)
  const keys = all(p).map(id => keyOf(material(id)))
  assert.equal(new Set(keys).size, keys.length)
  assert.ok(!words(p).includes('乘船出行') || !words(p).includes('渡輪碼頭'), '同一張相嘅渡輪碼頭／乘船出行唔會同時出')
  assert.ok(words(p).includes('水上學校'), 'A 路線 + 鄉郊：可以問水上學校')
  assert.ok(!words(planSociety({ group: '1950', exp: { tags }, route: 'C' })).includes('水上學校'))
})

test('跨章節去重：第一章已有鐵水桶，第三章唔再出取水水桶', () => {
  const used = new Set(['water-carry'])
  assert.ok(!words(planSociety({ group: '1940', exp: { tags: { care: 'yes' } }, used })).includes('取水水桶'))
  assert.ok(words(planSociety({ group: '1940', exp: { tags: { care: 'yes' } } })).includes('取水水桶'))
})

test('第四、五章：共用內容分細回合，跟本人經歷過濾', () => {
  const ev = planShared('events', { group: '1950', exp: { tags: {} } })
  assert.equal(all(ev).length, 8); assert.ok(ev.rounds.every(r => r.items.length <= 4))
  const later = planShared('later', { group: '1950', exp: { tags: { community: 'no' } } })
  assert.ok(!words(later).includes('相機') && !words(later).includes('義工活動'))
  const used = new Set(['photography'])
  assert.ok(!words(planShared('later', { group: '1950', exp: { tags: {} }, used })).includes('相機'))
})

test('改經歷之後：已經開始嘅回合保留，未開始嘅先換', () => {
  const old = planSociety({ group: '1950', exp: { tags: { factory: 'yes' } } })
  const fresh = planSociety({ group: '1950', exp: { tags: { care: 'yes' } } })
  const started = old.rounds[0].items[0]
  const merged = mergePlan(old, fresh, [started])
  assert.deepEqual(merged.rounds[0], old.rounds[0])
  assert.ok(words(merged).includes('煮飯地方'))
  assert.ok(!words(merged).includes('電子裝配'), '未開始嘅工廠回合按新選擇收起')
})
