import { useCallback, useEffect, useState } from 'react'
import { CHAPTER as CHILDHOOD, FAMILY_CARDS, familySummary } from './data/childhood1940.js'
import { ROUTES, chapterFor, schoolSummary } from './data/learning1940.js'
import { decadeFromAge } from './data/chapters.js'
import { load, save, clearAll, EMPTY } from './lib/storage.js'
import { Cover, AgeAsk, ChapterCover, Congrats } from './components/Screens.jsx'
import MatchGame from './components/MatchGame.jsx'
import MemoryCard, { FinalCard } from './components/MemoryCard.jsx'
import StoryPage from './components/StoryPage.jsx'
import Album from './components/Album.jsx'
import { RouteQuestion, RouteIntro, Interview } from './components/Learning.jsx'
import PairMatch from './components/PairMatch.jsx'
import { SchoolType, SchoolYears } from './components/School.jsx'
import { personalizeQuestion } from './lib/ai.js'
import FamilyPanel, { FamilyTab } from './components/FamilyPanel.jsx'

// 每一章嘅顯示設定
const META = {
  childhood: {
    n: 1, no: '第一章', title: '童年時光', years: '1940 – 1950', coverNote: '配對兩張一樣嘅詞語，打開一段童年回憶。',
    seal: '童', done: '恭喜你完成童年時光嘅探索！', unit: '樣童年物件', storyLabel: '整理我的童年故事', heading: '我的童年', storyTitle: '我的童年故事',
    empty: '你今次未有分享童年回憶，所以未可以整理故事。我哋唔會幫你作故事。',
    finalTitle: '你嘅童年',
    storyContext: '故事可以按以下次序組織（只寫佢有分享嘅部分）：我的家庭與成長背景、童年的居住環境、童年玩樂與朋友、家庭生活與日常回憶、難忘的人和事情。如果佢冇分享家庭資料，就唔好寫任何關於爸爸、媽媽、兄弟姊妹或者家境嘅內容。',
  },
  learning: {
    n: 2, no: '第二章', title: '求學歲月', years: '1946 – 1960', coverNote: '有冇返過學都唔緊要，講吓你當年點樣學習、點樣長大。',
    seal: '學', done: '恭喜你完成求學歲月嘅探索！', unit: '樣物件', storyLabel: '整理我的求學歲月', heading: '我的求學歲月', storyTitle: '我的求學歲月',
    empty: '你今次未有分享呢段日子嘅回憶，所以未可以整理故事。我哋唔會幫你作故事。',
    finalTitle: '求學歲月',
    storyContext: '故事可以包括（只寫佢有分享嘅部分）：曾經讀過咩類型嘅學校、大概喺咩年代讀書、學校環境、老師同同學、難忘嘅學校生活、升學或者中途離校嘅經歷、後來點樣繼續學習同成長。',
  },
}

export default function App() {
  const [state, setState] = useState(load)
  const [screen, setScreen] = useState('cover')
  const [history, setHistory] = useState([])
  const [openItem, setOpenItem] = useState(null)
  const [toast, setToast] = useState('')
  const [roundDone, setRoundDone] = useState(null)
  const [albumTab, setAlbumTab] = useState('childhood')
  const [familyOpen, setFamilyOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1180)

  useEffect(() => { save(state) }, [state])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t) }, [toast])
  useEffect(() => { window.scrollTo(0, 0) }, [screen])

  const [view, chId] = screen.split(':')
  const setChap = (id, fn) => setState(s => ({ ...s, [id]: fn(s[id]) }))
  const cfgOf = id => id === 'childhood' ? CHILDHOOD : chapterFor(state.learning)

  function go(next) { setHistory(h => [...h, screen]); setScreen(next); setOpenItem(null); setRoundDone(null) }
  function back() {
    setOpenItem(null); setRoundDone(null)
    setHistory(h => {
      if (!h.length) { setScreen('cover'); return h }
      setScreen(h[h.length - 1]); return h.slice(0, -1)
    })
  }

  function entriesOf(id) {
    const cfg = cfgOf(id), d = state[id]
    if (!cfg) return []
    const list = []
    const sum = id === 'learning' ? schoolSummary(d.school) : ''
    if (sum) list.push({ id: 'school', meta: true, name: '學校資料', question: '讀過咩學校、大約幾時', text: sum })
    if (id === 'childhood') {
      FAMILY_CARDS.forEach(c => {
        const f = (d.family || {})[c.id]
        if (!f || f.status !== 'shared') return
        list.push({ id: 'fam-' + c.id, name: '我的家庭 · ' + c.name, question: c.question, text: f.text })
        ;(f.follow || []).forEach((x, k) => { if (x.a) list.push({ id: 'fam-' + c.id + k, name: '我的家庭 · ' + c.name, question: x.q, text: x.a }) })
      })
    }
    cfg.items
      .filter(i => d.memories[i.id] && d.memories[i.id].status === 'shared')
      .forEach(i => list.push({ id: i.id, name: i.name, question: i.question, text: d.memories[i.id].text }))
    ;(d.interview || []).forEach((h, k) => { if (!h.skipped && h.a) list.push({ id: 'iv' + k, name: '離開學校之後', question: h.q, text: h.a }) })
    if (d.extra) list.push({ id: 'extra', name: '其他難忘回憶', question: cfg.finalQuestion, text: d.extra.text })
    return list
  }
  function staleOf(id) {
    const d = state[id]
    const latest = Math.max(0, ...Object.values(d.memories).map(m => m.updatedAt || 0), d.extra ? d.extra.updatedAt || 0 : 0, ...(d.interview || []).map(h => h.updatedAt || 0), ...Object.values(d.family || {}).map(f => f.updatedAt || 0))
    return !!(d.story && d.story.updatedAt && latest > d.story.updatedAt)
  }

  function phaseOf(id) {
    const d = state[id], cfg = cfgOf(id)
    if (id === 'learning' && !d.route) return 'route'
    if (id === 'learning' && cfg.route.school) {
      if (!d.school || !d.school.typesDone) return 'schooltype'
      if (!d.school.yearsDone) return 'years'
    } else if (id === 'learning' && !d.started) return 'intro'
    const round = cfg.rounds.find(r => cfg.items.some(i => i.round === r.id && !d.cleared.includes(i.id)))
    if (round) return 'match'
    if (cfg.route && cfg.route.interview && !d.interviewDone) return 'interview'
    if (!d.finalDone) return 'final'
    return 'done'
  }

  function matched(id, itemId) {
    setChap(id, c => ({ ...c, cleared: c.cleared.includes(itemId) ? c.cleared : [...c.cleared, itemId] }))
    setOpenItem(cfgOf(id).items.find(i => i.id === itemId))
  }
  function checkRound(id, it) {
    const cfg = cfgOf(id)
    const r = cfg.rounds.find(x => x.id === it.round)
    const left = cfg.items.filter(i => i.round === r.id && i.id !== it.id && !state[id].cleared.includes(i.id)).length
    if (!left) setRoundDone(r)
  }
  function closeCard(id, status, text) {
    const it = openItem
    setChap(id, c => ({ ...c, memories: { ...c.memories, [it.id]: status === 'shared' ? { status, text, updatedAt: Date.now() } : { status, updatedAt: Date.now() } } }))
    if (status === 'shared') setToast('已保存「' + it.name + '」嘅回憶')
    setOpenItem(null)
    checkRound(id, it)
  }
  // 跳過唔熟悉嘅圖片：當作已完成，唔彈回憶卡（之後喺自傳頁仍然可以補充）
  function skipItem(id, itemId) {
    const it = cfgOf(id).items.find(i => i.id === itemId)
    setChap(id, c => ({ ...c, cleared: c.cleared.includes(itemId) ? c.cleared : [...c.cleared, itemId], memories: { ...c.memories, [itemId]: { status: 'skipped', updatedAt: Date.now() } } }))
    setToast('已跳過「' + it.name + '」')
    checkRound(id, it)
  }
  function saveFamily(cardId, rec) {
    setChap('childhood', c => ({ ...c, family: { ...(c.family || {}), [cardId]: rec } }))
    if (rec.status === 'shared') setToast('已保存家庭回憶')
  }

  const learningContext = () => {
    const cfg = cfgOf('learning')
    if (!cfg) return ''
    return [cfg.route.context, schoolSummary(state.learning.school), state.profile ? '佢大約 ' + state.profile.birthYear + ' 年出世。' : ''].filter(Boolean).join(' ')
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const askLearning = useCallback(item => personalizeQuestion(item, learningContext()), [state.learning.route, state.learning.school])
  // 第一章：只有長者已保存家庭資料先會調整問題；冇就用一般問題
  const famText = familySummary(state.childhood.family)
  const askChildhood = useCallback(item => famText ? personalizeQuestion(item, '佢之前喺「我的家庭」分享過：\n' + famText) : Promise.resolve(null), [famText])

  function continueJourney() {
    const c = state.childhood, l = state.learning
    if (!c.finalDone) return go(c.cleared.length ? 'play:childhood' : 'ch:childhood')
    if (!c.story) return go('congrats:childhood')
    if (!l.route) return go('ch:learning')
    if (!l.finalDone) return go('play:learning')
    return go('congrats:learning')
  }

  const hasSave = !!state.profile && (state.childhood.cleared.length > 0 || state.childhood.finalDone)
  const M = chId ? META[chId] : null

  function renderPlay(id) {
    const d = state[id], cfg = cfgOf(id), phase = phaseOf(id), m = META[id]
    if (phase === 'route') return <RouteQuestion onPick={r => { setChap(id, c => ({ ...structuredClone(EMPTY.learning), route: r })); setToast('已記低：' + ROUTES[r].label) }} />
    if (phase === 'schooltype') return <SchoolType initial={d.school || {}}
      onBack={() => setChap(id, () => structuredClone(EMPTY.learning))}
      onDone={v => setChap(id, c => ({ ...c, school: { ...(c.school || {}), ...v, typesDone: true } }))} />
    if (phase === 'years') return <SchoolYears initial={d.school || {}} birthYear={state.profile && state.profile.birthYear}
      onBackToTypes={v => setChap(id, c => ({ ...c, school: { ...c.school, ...v, typesDone: false } }))}
      onDone={v => { setChap(id, c => ({ ...c, school: { ...c.school, ...v, yearsDone: true } })); setToast(v.skippedYears ? '冇問題，之後想起可以再補' : '已記低學校資料') }} />
    if (phase === 'intro') return <RouteIntro route={cfg.route} onStart={() => setChap(id, c => ({ ...c, started: true }))} onChange={() => setChap(id, () => structuredClone(EMPTY.learning))} />
    const round = cfg.rounds.find(r => cfg.items.some(i => i.round === r.id && !d.cleared.includes(i.id)))
    const roundIdx = roundDone ? cfg.rounds.findIndex(r => r.id === roundDone.id) : -1
    const nextRound = roundDone ? cfg.rounds[roundIdx + 1] : null
    return (
      <>
        <div className="progress" aria-label="進度">
          {cfg.items.map(i => <span key={i.id} className={d.cleared.includes(i.id) ? 'on' : ''} />)}
          <em>{cfg.items.filter(i => d.cleared.includes(i.id)).length}／{cfg.items.length}</em>
        </div>
        {roundDone ? (
          <section className="paper-sheet narrow center-text">
            <p className="seal" aria-hidden="true">✓</p>
            <h2 className="h2">{roundDone.title.split(' · ').pop()}，全部配對完成！</h2>
            <button type="button" className="btn primary big" onClick={() => setRoundDone(null)}>
              {nextRound ? '下一回：' + nextRound.title.split(' · ').pop() : phase === 'interview' ? '繼續：傾吓離開學校之後' : '打開最後一張回憶卡'}
            </button>
          </section>
        ) : phase === 'match' ? (
          cfg.pairMode
            ? <PairMatch round={round} items={cfg.items.filter(i => i.round === round.id)} cleared={d.cleared} onMatched={itemId => matched(id, itemId)} onSkip={itemId => skipItem(id, itemId)} disabled={!!openItem} />
            : <MatchGame round={round} items={cfg.items.filter(i => i.round === round.id)} cleared={d.cleared} onMatched={itemId => matched(id, itemId)} disabled={!!openItem} />
        ) : openItem ? null : phase === 'interview' ? (
          <Interview route={cfg.route} history={d.interview || []}
            onAnswer={h => setChap(id, c => ({ ...c, interview: [...(c.interview || []), { ...h, updatedAt: Date.now() }] }))}
            onDone={() => setChap(id, c => ({ ...c, interviewDone: true }))} />
        ) : phase === 'final' ? (
          <FinalCard question={cfg.finalQuestion} title={m.finalTitle}
            onShare={text => { setChap(id, c => ({ ...c, extra: { text, updatedAt: Date.now() }, finalDone: true })); go('congrats:' + id) }}
            onNone={() => { setChap(id, c => ({ ...c, finalDone: true })); go('congrats:' + id) }} />
        ) : renderCongrats(id)}
        {openItem && (
          <MemoryCard item={openItem} existing={d.memories[openItem.id] && d.memories[openItem.id].text}
            loadQuestion={id === 'learning' ? askLearning : askChildhood}
            onShare={text => closeCard(id, 'shared', text)} onNone={() => closeCard(id, 'none')} onSkip={() => closeCard(id, 'skipped')} />
        )}
      </>
    )
  }

  function renderCongrats(id) {
    const m = META[id], cfg = cfgOf(id)
    return <Congrats seal={m.seal} title={m.done} unit={m.unit} storyLabel={m.storyLabel}
      shared={entriesOf(id).length} total={cfg.items.length}
      onStory={() => go('story:' + id)} onAlbum={() => { setAlbumTab(id); go('album') }}
      next={id === 'childhood' ? '繼續第二章：求學歲月' : null} onNext={() => go('ch:learning')} />
  }

  function pageFor(id) {
    const d = state[id], cfg = cfgOf(id)
    if (!cfg) return { notStarted: true, onStart: () => go('ch:' + id) }
    const upd = fn => setChap(id, fn)
    return {
      cfg, data: d, stale: staleOf(id), storyTitle: META[id].storyTitle,
      schoolText: id === 'learning' && cfg.route.school ? (schoolSummary(d.school) || '未填學校資料') : '',
      family: id === 'childhood' ? (d.family || {}) : null,
      onEditFamily: (k, text) => { upd(c => ({ ...c, family: { ...(c.family || {}), [k]: { ...((c.family || {})[k] || {}), status: 'shared', text, updatedAt: Date.now() } } })); setToast('已更新家庭回憶') },
      onDeleteFamily: k => { upd(c => { const f = { ...(c.family || {}) }; delete f[k]; return { ...c, family: f } }); setToast('已刪除家庭回憶') },
      onEditSchool: () => go('school:learning'),
      onStory: () => go('story:' + id),
      onEditMemory: (k, text) => { upd(c => ({ ...c, memories: { ...c.memories, [k]: { status: 'shared', text, updatedAt: Date.now() } } })); setToast('已更新回憶') },
      onDeleteMemory: k => { upd(c => { const mm = { ...c.memories }; delete mm[k]; return { ...c, memories: mm } }); setToast('已刪除回憶') },
      onEditExtra: text => { upd(c => ({ ...c, extra: { text, updatedAt: Date.now() } })); setToast('已更新回憶') },
      onDeleteExtra: () => { upd(c => ({ ...c, extra: null })); setToast('已刪除回憶') },
      onEditInterview: (i, a) => { upd(c => ({ ...c, interview: c.interview.map((h, k) => k === i ? { ...h, a, skipped: false, updatedAt: Date.now() } : h) })); setToast('已更新回憶') },
      onDeleteInterview: i => { upd(c => ({ ...c, interview: c.interview.map((h, k) => k === i ? { ...h, a: '', skipped: true, updatedAt: Date.now() } : h) })); setToast('已刪除回憶') },
      next: id === 'childhood' && state.childhood.finalDone && !state.learning.finalDone ? '繼續第二章：求學歲月' : null,
      onNext: () => go(state.learning.route ? 'play:learning' : 'ch:learning'),
    }
  }

  return (
    <div className={'app' + (view === 'play' && chId === 'childhood' && familyOpen ? ' family-open' : '')}>
      {view !== 'cover' && (
        <header className="topbar">
          <button type="button" className="btn back" onClick={back}>← 返回</button>
          <span className="brand">往日旅途</span>
          <button type="button" className="btn" onClick={() => view !== 'album' && go('album')} disabled={view === 'album'}>📖 我的自傳</button>
        </header>
      )}

      <main className="stage">
        {view === 'cover' && <Cover onOpen={() => go(state.profile ? 'ch:childhood' : 'age')} hasSave={hasSave} onContinue={continueJourney} />}

        {view === 'age' && <AgeAsk initial={state.profile && state.profile.age} onConfirm={age => {
          const { birthYear, decade } = decadeFromAge(age)
          setState(s => ({ ...s, profile: { age, birthYear, decade, playing: 1940 } }))
          go('ch:childhood')
        }} />}

        {view === 'ch' && <ChapterCover n={M.n} no={M.no} title={M.title} years={M.years} note={M.coverNote}
          onEnter={() => go((chId === 'childhood' ? state.childhood.finalDone : state.learning.finalDone) ? 'congrats:' + chId : 'play:' + chId)} />}

        {view === 'play' && renderPlay(chId)}

        {view === 'congrats' && renderCongrats(chId)}

        {view === 'school' && <SchoolEdit learning={state.learning} birthYear={state.profile && state.profile.birthYear}
          onSave={school => { setChap('learning', c => ({ ...c, school: { ...c.school, ...school, typesDone: true, yearsDone: true } })); setToast('已更新學校資料'); back() }} onCancel={back} />}

        {view === 'story' && <StoryPage key={chId + (state[chId].story ? 'has' : 'new')} entries={entriesOf(chId)} profile={state.profile} story={state[chId].story}
          chapterNo={M.no} chapterTitle={M.title} heading={M.heading} emptyText={M.empty}
          context={[chId === 'learning' ? learningContext() : '', M.storyContext].filter(Boolean).join('\n')}
          onSave={story => setChap(chId, c => ({ ...c, story }))} onBack={back}
          onAlbum={() => { setToast('已保存到你嘅人生自傳'); setAlbumTab(chId); go('album') }} />}

        {view === 'album' && <Album key={albumTab} initialTab={albumTab}
          pages={{ childhood: pageFor('childhood'), learning: pageFor('learning') }}
          onReset={() => { clearAll(); setState(structuredClone(EMPTY)); setHistory([]); setScreen('cover'); setToast('已清除所有紀錄') }} />}
      </main>
      {view === 'play' && chId === 'childhood' && (
        <>
          <FamilyTab open={familyOpen} count={Object.values(state.childhood.family || {}).filter(f => f.status === 'shared').length} onToggle={() => setFamilyOpen(o => !o)} />
          <FamilyPanel open={familyOpen} family={state.childhood.family} context={state.profile ? '佢大約 ' + state.profile.birthYear + ' 年出世，童年喺 1940–50 年代嘅香港。' : ''}
            onSave={saveFamily} onClose={() => setFamilyOpen(false)} />
        </>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

function SchoolEdit({ learning, birthYear, onSave, onCancel }) {
  const [step, setStep] = useState('types')
  const [draft, setDraft] = useState(learning.school || {})
  if (step === 'types') return <SchoolType initial={draft} onBack={onCancel} onDone={v => { setDraft(d => ({ ...d, ...v })); setStep('years') }} />
  return <SchoolYears initial={draft} birthYear={birthYear} onBackToTypes={v => { setDraft(d => ({ ...d, ...v })); setStep('types') }} onDone={v => onSave({ ...draft, ...v })} />
}
