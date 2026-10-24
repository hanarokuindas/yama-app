import { lazy, Suspense, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BG } from '../assets/backgrounds'
import { UI } from '../assets/ui'
import { ROUTE } from '../assets/route'
import GameIcon from '../components/GameIcon'
import Specimen from '../components/Specimen'
import { CloseButton } from '../components/ui'
import { FS } from '../components/uiStyles'
import { useGameStore } from '../stores/gameStore'
import characters from '../data/characters.json'
import { EXPLORE_AREAS, AREA_BY_ID, ALBUM_MOUNTAINS, exploreSpecies, limitedSpecies, mountainCourses } from '../data/album'
import { yatsugatakeMini, yatsugatakeFull } from '../assets/characters/yatsugatake'
import { takaoMini, takaoFull } from '../assets/characters/takao'
import { hakoneMini, hakoneFull } from '../assets/characters/hakone'
import { sfx } from '../utils/sound'

/* アルバム（修正指示：本の見開き。目次 → 山探索の3エリア／登った山／マップ → 各アイテムのページ）。
   中の文字は Kaisei Decol。先輩と所持装備は載せない */

const GOD_IMG = {
  yatsugatake: { mini: yatsugatakeMini.laugh, full: yatsugatakeFull.stand1 },
  takao: { mini: takaoMini.smile, full: takaoFull.armsCrossed1 },
  hakone: { mini: hakoneMini.grin, full: hakoneFull.stand1 },
}
const PER_PAGE = 24 // エリアのページ1枚に並べるマスの数（8列×3段）
// 日本地図のデータは大きいので、マップを開いたときに読み込む
const JapanMap = lazy(() => import('../components/JapanMap'))

const dateText = (iso) => {
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export default function Album() {
  const location = useLocation()
  const navigate = useNavigate()
  const discovered = useGameStore((s) => s.discovered)
  const mountains = useGameStore((s) => s.mountains)
  const album = useGameStore((s) => s.album)
  // 山探索の終了画面から来たときは、そのエリアのページを開く
  const [view, setView] = useState(() => (
    location.state?.area ? { name: 'area', area: location.state.area, page: 0 } : { name: 'toc' }
  ))
  const [detail, setDetail] = useState(null)

  const open = (v) => { sfx.tap(); setView(v) }
  const toToc = () => setView({ name: 'toc' })
  // そのコースに初めて登った日（登頂写真の記録から）
  const firstClimb = (courseId) => album.filter((a) => a.courseId === courseId).map((a) => a.date).sort()[0]

  let body
  if (view.name === 'area') {
    body = <AreaPage view={view} setView={setView} discovered={discovered} onDetail={setDetail} onClose={toToc} />
  } else if (view.name === 'mountain') {
    body = <MountainPage view={view} setView={setView} discovered={discovered} mountains={mountains}
      firstClimb={firstClimb} onDetail={setDetail} onClose={toToc} />
  } else if (view.name === 'map') {
    const climbed = ALBUM_MOUNTAINS.filter((m) => mountains[m.id]?.summitedCourses?.length).map((m) => m.id)
    body = (
      <Paper title="マップ" onClose={toToc}>
        <div style={st.mapArea}>
          <Suspense fallback={<p style={st.note}>地図を読み込んでいます…</p>}><JapanMap climbed={climbed} /></Suspense>
        </div>
      </Paper>
    )
  } else {
    body = (
      <Book>
        <div style={{ ...st.pageLeft, ...st.tocPage }}>
          <span style={st.tag}>目次</span>
          <div style={st.tocLabel}>山探索</div>
          <div style={st.tocList}>
            {EXPLORE_AREAS.map((a, i) => {
              const list = exploreSpecies(a.id)
              const got = list.filter((e) => discovered.includes(e.id)).length
              return (
                <button key={a.id} style={st.tocItem} onClick={() => open({ name: 'area', area: a.id, page: 0 })}>
                  <span style={st.tocNo}>{i + 1}．</span>
                  <span style={st.tocName}>{a.label}</span>
                  <span style={st.tocCount}>{got}/{list.length}</span>
                  <GameIcon name={a.icon} size={48} style={st.tocIcon} />
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ ...st.pageRight, ...st.tocPage }}>
          <button style={{ ...st.tag, ...st.tagBtn, alignSelf: 'flex-end' }} onClick={() => { sfx.cancel(); navigate('/') }}>ホーム</button>
          <div style={st.tocLabel}>登った山</div>
          <div style={st.tocList}>
            {ALBUM_MOUNTAINS.map((m, i) => {
              const released = mountains[m.id]?.unlocked
              const climbed = mountains[m.id]?.summitedCourses?.length > 0
              return (
                <button key={m.id} style={{ ...st.tocItem, ...(released ? null : st.tocLocked) }}
                  onClick={() => (released ? open({ name: 'mountain', id: m.id, tab: 'course' }) : sfx.miss())}>
                  <span style={st.tocNo}>{i + 1}座．</span>
                  <span style={st.tocName}>{released ? m.name : '？？？'}</span>
                  {climbed && <GameIcon name="flagGoal" size={28} style={st.tocFlag} />}
                </button>
              )
            })}
          </div>
          <button style={st.mapBtn} onClick={() => open({ name: 'map' })}>
            <GameIcon name="mappin" size={40} style={{ width: 'clamp(24px, 8cqh, 44px)', height: 'clamp(24px, 8cqh, 44px)' }} />
            <span style={st.mapLabel}>マップ</span>
          </button>
        </div>
      </Book>
    )
  }

  return (
    <div style={st.root}>
      {body}
      {detail && <DetailSpread detail={detail} onClose={() => { sfx.cancel(); setDetail(null) }} />}
    </div>
  )
}

/* 本の見開き（背景の本の絵に合わせて、左右のページの位置に中身を置く） */
function Book({ children }) {
  return (
    <div style={st.bookStage}>
      <div style={st.book}>{children}</div>
    </div>
  )
}

/* 古い紙のページ（一覧・マップ） */
function Paper({ title, tabs, onClose, children }) {
  return (
    <div style={st.paper}>
      <div style={st.paperHead}>
        <div style={st.labelFrame}>{title}</div>
        {tabs}
      </div>
      <div style={st.paperBody}>{children}</div>
      <div style={st.paperFoot}><CloseButton onClick={onClose} /></div>
    </div>
  )
}

/* ───────── 山探索のエリア ───────── */
function AreaPage({ view, setView, discovered, onDetail, onClose }) {
  const area = AREA_BY_ID[view.area]
  const list = exploreSpecies(view.area)
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE))
  const page = Math.min(view.page, pages - 1)
  const items = list.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const got = list.filter((e) => discovered.includes(e.id)).length

  const tabs = (
    <div style={st.tabs}>
      {EXPLORE_AREAS.filter((a) => a.id !== view.area).map((a) => (
        <button key={a.id} style={st.tab} onClick={() => { sfx.tap(); setView({ name: 'area', area: a.id, page: 0 }) }}>
          {a.label}
        </button>
      ))}
      <span style={st.count}>{got} / {list.length}</span>
    </div>
  )
  return (
    <Paper title={area.label} tabs={tabs} onClose={onClose}>
      <div style={st.grid}>
        {items.map((e) => {
          const found = discovered.includes(e.id)
          return (
            <button key={e.id} style={{ ...st.cell, ...(found ? null : st.cellLocked) }}
              onClick={() => { if (found) { sfx.tap(); onDetail({ type: 'species', sp: e }) } else sfx.miss() }}>
              {found ? (
                <>
                  <Specimen sp={e} size={64} style={st.cellPic} />
                  <span style={st.cellName}>{e.name}</span>
                </>
              ) : <GameIcon name="lock" size={40} style={st.lock} />}
            </button>
          )
        })}
      </div>
      {pages > 1 && (
        <div style={st.pager}>
          {page > 0 && <button style={st.pageBtn} onClick={() => { sfx.tap(); setView({ ...view, page: page - 1 }) }}>‹ 前のページ</button>}
          <span style={st.pageNo}>{page + 1} / {pages}</span>
          {page < pages - 1 && <button style={st.pageBtn} onClick={() => { sfx.tap(); setView({ ...view, page: page + 1 }) }}>次のページ ›</button>}
        </div>
      )}
    </Paper>
  )
}

/* ───────── 登った山 ───────── */
function MountainPage({ view, setView, discovered, mountains, firstClimb, onDetail, onClose }) {
  const m = ALBUM_MOUNTAINS.find((x) => x.id === view.id)
  const summited = mountains[m.id]?.summitedCourses || []
  const courses = mountainCourses(m.id)
  const items = limitedSpecies(m.id)

  const tabs = (
    <div style={st.tabs}>
      {[['course', 'コース情報'], ['limited', '限定アイテム']].map(([id, label]) => (
        <button key={id} style={{ ...st.tab, ...(view.tab === id ? st.tabOn : null) }}
          onClick={() => { sfx.tap(); setView({ ...view, tab: id }) }}>{label}</button>
      ))}
    </div>
  )
  return (
    <Paper title={m.name} tabs={tabs} onClose={onClose}>
      <div style={st.mountainBody}>
        <button style={st.godBtn} onClick={() => { sfx.tap(); onDetail({ type: 'god', mountainId: m.id }) }}>
          <img src={GOD_IMG[m.id].mini} alt="" style={st.godMini} draggable={false} />
          <span style={st.godAsk}>どんな神様？</span>
        </button>
        <div style={st.mountainScroll}>
        <div style={st.mountainGrid}>
          {view.tab === 'course' && courses.map((c) => {
            const done = summited.includes(c.id)
            const date = done && firstClimb(c.id)
            return (
              <button key={c.id} style={{ ...st.cell, ...(done ? null : st.cellLocked) }}
                onClick={() => { if (done) { sfx.tap(); onDetail({ type: 'course', course: c, date }) } else sfx.miss() }}>
                {done ? (
                  <>
                    <GameIcon name="flagGoal" size={40} style={st.flag} />
                    <span style={st.courseName}>{c.name}</span>
                    {date && <span style={st.courseDate}>{dateText(date)}</span>}
                  </>
                ) : <GameIcon name="lock" size={40} style={st.lock} />}
              </button>
            )
          })}
          {view.tab === 'limited' && items.map((e) => {
            const found = discovered.includes(e.id)
            return (
              <button key={e.id} style={{ ...st.cell, ...(found ? null : st.cellLocked) }}
                onClick={() => { if (found) { sfx.tap(); onDetail({ type: 'species', sp: e }) } else sfx.miss() }}>
                {found ? (
                  <>
                    <Specimen sp={e} size={64} style={st.cellPic} />
                    <span style={st.cellName}>{e.name}</span>
                  </>
                ) : <GameIcon name="lock" size={40} style={st.lock} />}
              </button>
            )
          })}
        </div>
        </div>
      </div>
      {view.tab === 'limited' && (
        <p style={st.note}>限定アイテムは、この山の登山でまれに見つかるよ</p>
      )}
    </Paper>
  )
}

/* ───────── 各アイテムのページ（アルバム風の見開き） ───────── */
function DetailSpread({ detail, onClose }) {
  let left, right
  if (detail.type === 'species') {
    const sp = detail.sp
    left = (
      <>
        <div style={st.photo}>
          <span style={st.photoPaper}><Specimen sp={sp} size={200} style={st.photoPic} /></span>
        </div>
        <div style={st.photoCaption}>{sp.name}{sp.reading ? `／${sp.reading}` : ''}</div>
        <div style={st.metaRow}>
          <span style={st.meta}>{sp.areaName}</span>
          {sp.mountain && <span style={st.meta}>限定アイテム</span>}
          {sp.course && <span style={st.meta}>{sp.course}</span>}
        </div>
      </>
    )
    right = <p style={st.desc}>{sp.desc}</p>
  } else if (detail.type === 'course') {
    const c = detail.course
    left = (
      <>
        <div style={{ ...st.photo, aspectRatio: '1.3 / 1' }}>
          <span style={st.photoPaper}><img src={ROUTE.map} alt="" style={st.photoImg} draggable={false} /></span>
        </div>
        <div style={st.photoCaption}>{`${c.mountainName} ${c.name}`}</div>
        {detail.date && <div style={st.metaRow}><span style={st.meta}>はじめて登った日 {dateText(detail.date)}</span></div>}
      </>
    )
    right = (
      <div>
        <div style={st.courseTitle}>{c.name}</div>
        <InfoRow label="むずかしさ" value={'★'.repeat(c.difficulty) + '☆'.repeat(Math.max(0, 3 - c.difficulty))} />
        <InfoRow label="きょり" value={`${c.distance}km`} />
        <InfoRow label="時間" value={c.duration} />
        <InfoRow label="消費カロリー" value={`約${c.calories}kcal`} />
        <p style={{ ...st.desc, marginTop: 10 }}>{c.description}</p>
      </div>
    )
  } else {
    const ch = characters[detail.mountainId]
    left = <img src={GOD_IMG[detail.mountainId].full} alt="" style={st.godFull} draggable={false} />
    right = (
      <div>
        <div style={st.courseTitle}>どんな神様？</div>
        <div style={st.godName}>{ch.callName}（{ch.name}）</div>
        <p style={st.desc}>{ch.intro.join('\n')}</p>
        <p style={st.pending}>くわしい紹介は準備中です</p>
      </div>
    )
  }
  return (
    <div style={st.detailOverlay}>
      <Book>
        <div style={{ ...st.pageLeft, ...st.detailLeft }}>{left}</div>
        <div style={{ ...st.pageRight, ...st.detailRight }}>{right}</div>
      </Book>
      <div style={st.detailClose}><CloseButton onClick={onClose} /></div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={st.infoRow}>
      <span style={st.infoLabel}>{label}</span>
      <span style={st.infoValue}>{value}</span>
    </div>
  )
}

// 本の絵（1920x1072）の中のページの位置（％）
const PAGE = { top: 13, bottom: 14, leftL: 12.5, leftR: 52, width: 36 }

const st = {
  root: { position: 'relative', height: '100cqh', overflow: 'hidden', fontFamily: 'var(--font-album)', color: 'var(--brown-text)' },

  bookStage: {
    position: 'absolute', inset: 0,
    background: `url(${BG.albumBook}) center / cover no-repeat`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  book: {
    position: 'relative', height: 'min(100cqh, calc(100cqw * 1072 / 1920))', aspectRatio: '1920 / 1072',
    background: `url(${BG.albumBook}) center / 100% 100% no-repeat`,
    containerType: 'size',
  },
  pageLeft: { position: 'absolute', top: `${PAGE.top}%`, bottom: `${PAGE.bottom}%`, left: `${PAGE.leftL}%`, width: `${PAGE.width}%` },
  pageRight: { position: 'absolute', top: `${PAGE.top}%`, bottom: `${PAGE.bottom}%`, left: `${PAGE.leftR}%`, width: `${PAGE.width}%` },

  tocPage: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  tag: {
    alignSelf: 'flex-start',
    border: '2px solid #8a6a45', borderRadius: 4, padding: '1px 14px',
    fontSize: 'clamp(11px, 3.6cqh, 20px)', fontWeight: 700, letterSpacing: 4, color: '#6b4f33',
    background: 'rgba(255,255,255,0.35)',
  },
  tagBtn: { cursor: 'pointer', fontFamily: 'inherit' },
  tocLabel: {
    marginTop: '3cqh',
    padding: '0.5em 1.6em',
    background: `url(${UI.labelFrame}) center / 100% 100% no-repeat`,
    fontSize: 'clamp(14px, 5.6cqh, 30px)', fontWeight: 700, letterSpacing: 4, color: '#5a4030',
  },
  tocList: { marginTop: '3cqh', width: '86%', display: 'flex', flexDirection: 'column', gap: '2.4cqh' },
  tocItem: {
    position: 'relative', display: 'flex', alignItems: 'baseline', gap: 6,
    background: 'none', border: 'none', borderBottom: '2px solid rgba(110,80,50,0.55)',
    padding: '0 0 2px', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--brown-text)', textAlign: 'left',
  },
  tocLocked: { opacity: 0.5 },
  tocNo: { fontSize: 'clamp(12px, 4.2cqh, 24px)', fontWeight: 700 },
  tocName: { flex: 1, fontSize: 'clamp(12px, 4.5cqh, 26px)', fontWeight: 700, whiteSpace: 'nowrap' },
  tocCount: { fontSize: 'clamp(9px, 3cqh, 18px)', color: '#8b7a66', marginRight: 'clamp(28px, 10cqh, 66px)', whiteSpace: 'nowrap' },
  tocIcon: { position: 'absolute', right: 0, bottom: 2, width: 'clamp(30px, 11cqh, 64px)', height: 'clamp(30px, 11cqh, 64px)' },
  tocFlag: { width: 'clamp(18px, 6cqh, 34px)', height: 'clamp(18px, 6cqh, 34px)', alignSelf: 'center' },
  mapBtn: {
    marginTop: 'auto', alignSelf: 'flex-end',
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'rgba(255,255,255,0.4)', border: '2px solid #8a6a45', borderRadius: 10,
    padding: '2px 12px 2px 6px', cursor: 'pointer', fontFamily: 'inherit',
  },
  mapLabel: { fontSize: 'clamp(12px, 4.4cqh, 24px)', fontWeight: 700, color: 'var(--brown-text)' },

  paper: {
    position: 'absolute', inset: 0,
    background: `url(${BG.albumPaper}) center / cover no-repeat`,
    display: 'flex', flexDirection: 'column',
    padding: '2cqh 3cqw 1.5cqh',
  },
  paperHead: { display: 'flex', alignItems: 'center', gap: '2cqw', flexShrink: 0 },
  labelFrame: {
    padding: '0.5em 2em',
    background: `url(${UI.labelFrame}) center / 100% 100% no-repeat`,
    fontSize: FS(4.6, 14, 26), fontWeight: 700, letterSpacing: 2, color: '#5a4030', whiteSpace: 'nowrap',
  },
  tabs: { flex: 1, display: 'flex', alignItems: 'center', gap: '1.6cqw' },
  tab: {
    background: 'none', border: 'none', borderBottom: '3px solid rgba(110,80,50,0.4)',
    padding: '2px 10px', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: FS(3.8, 12, 20), fontWeight: 700, color: '#7a6450',
  },
  tabOn: { color: '#3d5a1e', borderBottom: '3px solid #6b8e3a' },
  count: { marginLeft: 'auto', fontSize: FS(3.4, 11, 18), color: '#8b7a66' },
  paperBody: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: '2cqh' },
  paperFoot: { display: 'flex', justifyContent: 'center', flexShrink: 0, paddingTop: '1cqh' },

  // 8列×3段のマスが、上下の帯を除いた高さに収まる幅
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 'clamp(5px, 1.4cqh, 12px)',
    width: 'min(100%, calc((100cqh - 30cqh) * 8 / 3))', margin: '0 auto', alignContent: 'start',
  },
  cell: {
    position: 'relative', aspectRatio: '1 / 1',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
    background: 'rgba(250,244,232,0.85)', border: '2px solid rgba(160,130,95,0.55)', borderRadius: 6,
    boxShadow: '0 2px 4px rgba(90,60,30,0.2)', cursor: 'pointer', fontFamily: 'inherit', padding: 3,
    overflow: 'hidden',
  },
  cellLocked: { background: 'rgba(230,220,200,0.7)', cursor: 'default' },
  cellPic: { width: '64%', height: '64%' },
  cellName: { fontSize: FS(2.5, 8.5, 13), fontWeight: 700, lineHeight: 1.15, textAlign: 'center', color: 'var(--brown-text)' },
  lock: { width: '46%', height: '46%', filter: 'grayscale(1)', opacity: 0.55 },
  flag: { width: '40%', height: '40%' },
  courseName: { fontSize: FS(2.6, 9, 14), fontWeight: 700, lineHeight: 1.2, textAlign: 'center', color: 'var(--brown-text)' },
  courseDate: { fontSize: FS(2, 7.5, 11), color: '#8b7a66' },
  pager: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, marginTop: 'auto', paddingTop: 4 },
  pageBtn: {
    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: FS(3.6, 12, 20), fontWeight: 700, color: '#5a4030',
  },
  pageNo: { fontSize: FS(3, 11, 16), color: '#8b7a66' },

  mountainBody: { flex: 1, minHeight: 0, display: 'flex', gap: '2cqw', alignItems: 'flex-start' },
  // 限定アイテムが多い山もあるので、マスの欄だけ縦にスクロールする
  mountainScroll: { flex: 1, alignSelf: 'stretch', minHeight: 0, overflowY: 'auto', padding: '2px 4px 6px 2px' },
  mountainGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'clamp(5px, 1.4cqh, 12px)' },
  godBtn: {
    flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  godMini: { height: 'clamp(90px, 46cqh, 300px)', width: 'auto', filter: 'drop-shadow(0 4px 6px rgba(60,40,20,0.3))' },
  godAsk: { fontSize: FS(3.6, 12, 20), fontWeight: 700, color: '#5a4030', transform: 'rotate(-6deg)', marginTop: -6 },
  note: { fontSize: FS(3, 10.5, 16), color: '#8b7a66', textAlign: 'center', margin: '4px 0 0' },

  mapArea: { flex: 1, minHeight: 0 },

  detailOverlay: { position: 'absolute', inset: 0, zIndex: 50, animation: 'overlayFade 0.25s ease' },
  detailClose: { position: 'absolute', left: 0, right: 0, bottom: '1.5cqh', display: 'flex', justifyContent: 'center', zIndex: 2 },
  detailLeft: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2cqh' },
  detailRight: { overflowY: 'auto', paddingRight: 6 },
  photo: {
    position: 'relative', height: '62%', aspectRatio: '444 / 512',
    background: `url(${UI.photoFrame}) center / 100% 100% no-repeat`,
    filter: 'drop-shadow(0 4px 6px rgba(60,40,20,0.3))', transform: 'rotate(-3deg)',
  },
  photoPaper: {
    position: 'absolute', left: '11%', right: '11%', top: '8%', bottom: '21%',
    background: 'linear-gradient(160deg, #fffdf6, #efe6d2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  photoPic: { width: '86%', height: '86%' },
  photoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  photoCaption: { fontSize: 'clamp(13px, 5.4cqh, 30px)', fontWeight: 700, textAlign: 'center', color: '#3e3028' },
  metaRow: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  meta: {
    fontSize: 'clamp(9px, 3cqh, 15px)', border: '1.5px solid rgba(110,80,50,0.5)', borderRadius: 99,
    padding: '0 10px', color: '#6b4f33',
  },
  desc: {
    fontSize: 'clamp(12px, 4.4cqh, 24px)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0,
    color: '#3e3028', fontWeight: 500,
  },
  courseTitle: { fontSize: 'clamp(15px, 6cqh, 32px)', fontWeight: 700, color: '#3e3028', marginBottom: '2cqh' },
  infoRow: { display: 'flex', gap: 12, borderBottom: '1.5px dashed rgba(110,80,50,0.35)', padding: '0.8cqh 0' },
  infoLabel: { width: '38%', fontSize: 'clamp(11px, 3.8cqh, 20px)', color: '#8b7a66' },
  infoValue: { fontSize: 'clamp(12px, 4.2cqh, 22px)', fontWeight: 700, color: '#3e3028' },
  godFull: { height: '100%', width: 'auto', filter: 'drop-shadow(0 6px 10px rgba(60,40,20,0.3))' },
  godName: { fontSize: 'clamp(12px, 4.4cqh, 24px)', fontWeight: 700, marginBottom: '2cqh', color: '#6b4f33' },
  pending: { fontSize: 'clamp(10px, 3.2cqh, 16px)', color: '#a8977f', marginTop: '2cqh' },
}
