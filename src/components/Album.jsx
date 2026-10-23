import { useState } from 'react'
import { CHAPTERS } from '../data/chapters.js'
import { FAMILY_CARDS } from '../data/family.js'
import MemoryEditor from './MemoryEditor.jsx'
import { ReadAloud } from './StoryPage.jsx'
import { downloadMemoir } from '../lib/export.js'

function TwoTap({ label, armed, onConfirm, className = 'btn ghost' }) {
  const [a, setA] = useState(false)
  return <button type="button" className={className} onClick={() => {
    if (!a) { setA(true); setTimeout(() => setA(false), 4000); return }
    setA(false); onConfirm()
  }}>{a ? armed : label}</button>
}

const STATUS = { none: '冇乜印象', noexp: '冇呢段經歷（已收起）', skipped: '跳過咗', undefined: '未有回憶' }

// pages: { [chapterId]: { cfg, data, stale, storyTitle, notStarted, onStart, onStory, onEditMemory, onDeleteMemory, onEditExtra, onDeleteExtra, onEditInterview, onDeleteInterview } }
export default function Album({ pages, initialTab = 'childhood', onReset, profileText, onEditProfile }) {
  const [editing, setEditing] = useState(null)
  const [tab, setTab] = useState(initialTab)
  const visible = CHAPTERS.filter(c => !c.hidden)
  const meta = CHAPTERS.find(c => c.id === tab)
  const P = pages[tab]

  return (
    <section className="album">
      <header className="album-head">
        <p className="kicker">往日旅途</p>
        <h1 className="h1">我的人生自傳</h1>
        <div className="btnrow center-row">
          <button type="button" className="btn" onClick={() => downloadMemoir(pages)}>下載自傳文字檔</button>
          {onEditProfile && <button type="button" className="btn ghost" onClick={onEditProfile}>{profileText ? profileText + ' · 修改' : '修改出世年份'}</button>}
        </div>
      </header>
      <nav className="chapter-tabs" aria-label="章節">
        {visible.map(c => (
          <button key={c.id} type="button" className={'tab' + (tab === c.id ? ' on' : '') + (c.ready ? '' : ' locked')}
            onClick={() => { setTab(c.id); setEditing(null) }} aria-pressed={tab === c.id}>
            <span className="tab-no">{c.no}</span><span className="tab-title">{c.title}</span>
            {!c.ready && <span className="tab-lock">即將推出</span>}
          </button>
        ))}
      </nav>

      {!meta.ready || !P ? (
        <div className="album-page locked-page">
          <h2>{meta.no}：{meta.title}</h2>
          <p className="lead">呢一章仲喺製作緊，敬請期待。</p>
        </div>
      ) : P.notStarted ? (
        <div className="album-page locked-page">
          <h2>{meta.no}：{meta.title}</h2>
          <p className="lead">呢一章未開始。</p>
          <button type="button" className="btn primary big" onClick={P.onStart}>開始{meta.title}</button>
        </div>
      ) : (
        <div className="album-page">
          <h2>{meta.no}：{meta.title}</h2>
          <p className="note">{P.cfg.years} 年代 · 香港{P.cfg.route ? ' · 路線：' + P.cfg.route.label : ''}</p>

          {P.expText && (
            <section className="school-info">
              <h3>我揀過嘅經歷</h3>
              <p className="mini-text">{P.expText}</p>
              <p className="note">只係用嚟揀配對物件，唔會寫入自傳。改咗之後，已經開始嘅回合唔會變。</p>
              <button type="button" className="btn" onClick={P.onEditExp}>修改我的經歷</button>
            </section>
          )}

          {P.schoolText && (
            <section className="school-info">
              <h3>學校資料</h3>
              <p className="mini-text">{P.schoolText}</p>
              <button type="button" className="btn" onClick={P.onEditSchool}>修改學校資料</button>
            </section>
          )}

          {P.family && (
            <section className="family-album">
              <h3>我的家庭</h3>
              <p className="note">額外支線：想講先講，有分享嘅內容先會寫入自傳。</p>
              <div className="memgrid">
                {FAMILY_CARDS.map(c => {
                  const f = P.family[c.id]
                  const has = f && f.status === 'shared'
                  const key = 'fam:' + c.id
                  return (
                    <article key={c.id} className={'mini' + (has ? '' : ' empty')}>
                      <div className="photo-mount qbox family-qbox" aria-hidden="true">{c.seal}</div>
                      <div className="mini-body">
                        <h4>{c.name}</h4>
                        {editing === key ? (
                          <MemoryEditor initial={has ? f.text : ''} onSave={v => { P.onEditFamily(c.id, v); setEditing(null) }} onCancel={() => setEditing(null)} />
                        ) : has ? (
                          <>
                            <p className="mini-text">{f.text}</p>
                            {(f.follow || []).filter(x => x.a).map((x, i) => <p key={i} className="mini-text"><span className="muted">{x.q}</span><br />{x.a}</p>)}
                            <div className="btnrow small">
                              <button type="button" className="btn" onClick={() => setEditing(key)}>修改</button>
                              <TwoTap label="刪除" armed="再按一次確認刪除" onConfirm={() => P.onDeleteFamily(c.id)} />
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="mini-text muted">{f && f.status === 'none' ? '沒有相關經歷' : f && f.status === 'skipped' ? '跳過咗' : '未傾'}</p>
                            <div className="btnrow small"><button type="button" className="btn" onClick={() => setEditing(key)}>補充回憶</button></div>
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          <section className="album-story">
            <h3>{P.storyTitle}</h3>
            {P.data.story && P.data.story.text ? (
              <>
                <div className="story-text">{P.data.story.text}</div>
                {P.stale && <p className="note warn">你之後改過回憶，可以重新整理故事。</p>}
                <div className="btnrow">
                  <ReadAloud text={P.data.story.text} />
                  <button type="button" className="btn" onClick={P.onStory}>✏️ 修改或重新整理</button>
                </div>
              </>
            ) : (
              <>
                <p className="lead">未整理故事。</p>
                <button type="button" className="btn primary" onClick={P.onStory}>整理我的故事</button>
              </>
            )}
          </section>

          <h3>回憶卡</h3>
          <div className="memgrid">
            {P.cfg.items.map(it => {
              const m = P.data.memories[it.id]
              const has = m && m.status === 'shared'
              const key = tab + ':' + it.id
              return (
                <article key={it.id} className={'mini' + (has ? '' : ' empty')}>
                  <figure className="photo-mount"><img src={it.image} alt={it.name} /></figure>
                  <div className="mini-body">
                    <h4>{it.name}</h4>
                    {editing === key ? (
                      <MemoryEditor initial={has ? m.text : ''} onSave={v => { P.onEditMemory(it.id, v); setEditing(null) }} onCancel={() => setEditing(null)} />
                    ) : has ? (
                      <>
                        <p className="mini-text">{m.text}</p>
                        {(m.follow || []).filter(x => x.a).map((x, i) => <p key={i} className="mini-text"><span className="muted">{x.q}</span><br />{x.a}</p>)}
                        <div className="btnrow small">
                          <button type="button" className="btn" onClick={() => setEditing(key)}>修改</button>
                          <TwoTap label="刪除" armed="再按一次確認刪除" onConfirm={() => P.onDeleteMemory(it.id)} />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="mini-text muted">{STATUS[m && m.status]}</p>
                        <div className="btnrow small"><button type="button" className="btn" onClick={() => setEditing(key)}>補充回憶</button></div>
                      </>
                    )}
                  </div>
                </article>
              )
            })}

            {(P.data.interview || []).map((h, i) => {
              const key = tab + ':iv' + i
              return (
                <article key={key} className={'mini' + (h.skipped ? ' empty' : '')}>
                  <div className="photo-mount qbox small" aria-hidden="true">談</div>
                  <div className="mini-body">
                    <h4>離校之後 · {i + 1}</h4>
                    <p className="note">{h.q}</p>
                    {editing === key ? (
                      <MemoryEditor initial={h.a || ''} onSave={v => { P.onEditInterview(i, v); setEditing(null) }} onCancel={() => setEditing(null)} />
                    ) : !h.skipped && h.a ? (
                      <>
                        <p className="mini-text">{h.a}</p>
                        <div className="btnrow small">
                          <button type="button" className="btn" onClick={() => setEditing(key)}>修改</button>
                          <TwoTap label="刪除" armed="再按一次確認刪除" onConfirm={() => P.onDeleteInterview(i)} />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="mini-text muted">跳過咗</p>
                        <div className="btnrow small"><button type="button" className="btn" onClick={() => setEditing(key)}>補充回憶</button></div>
                      </>
                    )}
                  </div>
                </article>
              )
            })}

            <article className={'mini' + (P.data.extra ? '' : ' empty')}>
              <div className="photo-mount qbox" aria-hidden="true">？</div>
              <div className="mini-body">
                <h4>其他難忘回憶</h4>
                {editing === tab + ':extra' ? (
                  <MemoryEditor initial={P.data.extra ? P.data.extra.text : ''} onSave={v => { P.onEditExtra(v); setEditing(null) }} onCancel={() => setEditing(null)} />
                ) : P.data.extra ? (
                  <>
                    <p className="mini-text">{P.data.extra.text}</p>
                    <div className="btnrow small">
                      <button type="button" className="btn" onClick={() => setEditing(tab + ':extra')}>修改</button>
                      <TwoTap label="刪除" armed="再按一次確認刪除" onConfirm={P.onDeleteExtra} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mini-text muted">未有補充</p>
                    <div className="btnrow small"><button type="button" className="btn" onClick={() => setEditing(tab + ':extra')}>補充回憶</button></div>
                  </>
                )}
              </div>
            </article>
          </div>
          {P.next && <div className="btnrow center-row"><button type="button" className="btn primary big" onClick={P.onNext}>{P.next}</button></div>}
        </div>
      )}
      <div className="reset-row">
        <TwoTap label="清除所有紀錄，由頭開始" armed="再按一次：清除所有回憶" onConfirm={onReset} />
      </div>
    </section>
  )
}
