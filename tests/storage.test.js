import test from 'node:test'
import assert from 'node:assert/strict'
import { migrate } from '../src/lib/storage.js'

// 上一版（schema 1）嘅真實存檔格式
const OLD = {
  profile: { age: 81, birthYear: 1945, decade: 1940, playing: 1940 },
  childhood: { cleared: ['marbles', 'table', 'laundry', 'bucket', 'bowls', 'squatter'], memories: { table: { status: 'shared', text: '張枱係爸爸整嘅', updatedAt: 5 } },
    family: { father: { status: 'shared', text: '爸爸做木工', follow: [{ q: '教過你咩？', a: '刨木' }] } }, extra: { text: '細個喺天台玩' }, finalDone: true, story: { text: '我細個…', source: 'local', saved: true } },
  learning: { route: 'B', cleared: ['report'], memories: { report: { status: 'shared', text: '好緊張' } }, interview: [{ q: '點解冇讀？', a: '要做嘢' }], interviewDone: true, school: { types: ['rooftop'], typesDone: true, yearsDone: true }, finalDone: false },
}

test('舊存檔：回憶、配對進度、家庭、教育路線、自傳全部保留，新章節補預設值', () => {
  const s = migrate(structuredClone(OLD))
  assert.deepEqual(s.childhood.cleared, OLD.childhood.cleared)
  assert.equal(s.childhood.memories.table.text, '張枱係爸爸整嘅')
  assert.equal(s.childhood.family.father.follow[0].a, '刨木')
  assert.equal(s.childhood.story.text, '我細個…')
  assert.equal(s.learning.route, 'B')
  assert.equal(s.learning.interview[0].a, '要做嘢')
  assert.equal(s.learning.school.types[0], 'rooftop')
  assert.equal(s.childhood.plan, null, '舊存檔冇 plan：由 journey 按原有回合處理')
  for (const id of ['society', 'events', 'later']) assert.deepEqual(s[id].cleared, [])
  assert.equal(s.profile.group, '1940'); assert.equal(s.profile.birthYear, 1945)
  assert.equal(s.schema, 2)
})

test('舊存檔 1955 年出世：唔再當作 1940 組', () => {
  assert.equal(migrate({ profile: { age: 71, birthYear: 1955, decade: 1950, playing: 1940 } }).profile.group, '1950')
})

test('壞咗或者冇存檔：用預設值，唔會出錯', () => {
  assert.equal(migrate(null).profile, null)
  assert.equal(migrate('x').exp.done, false)
})
