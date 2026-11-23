import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BG } from '../assets/backgrounds'
import { ROUTE } from '../assets/route'
import { UI } from '../assets/ui'
import GameIcon from '../components/GameIcon'
import Specimen from '../components/Specimen'
import PlankButton, { HomeButton } from '../components/PlankButton'
import { PointPlank, Window } from '../components/ui'
import { ui, FS } from '../components/uiStyles'
import { Confetti } from '../components/Celebration'
import { useGameStore } from '../stores/gameStore'
import coursesData from '../data/courses.json'
import itemsData from '../data/items.json'
import encyclopedia from '../data/encyclopedia.json'
import characters from '../data/characters.json'
import { MOUNTAINS } from '../data/mountains'
import { BOUNTY_MOUNTAIN, albumProgress } from '../data/album'
import { requiredItemsFor, isWinter } from '../data/equipment'
import {
  isUnderMaintenance, remainingMinutes, formatDuration, maintenanceState, requiredStaminaFor, isClosed, CLOSED_BELOW,
} from '../data/maintenanceActivities'
import TripleMatchGame from '../games/TripleMatchGame'
import { withFurigana } from '../utils/furigana'
import { buildSummitText, shareText } from '../utils/share'
import { sfx } from '../utils/sound'
import { yatsugatakeFull, yatsugatakeMini } from '../assets/characters/yatsugatake'
import { takaoPose, takaoMini } from '../assets/characters/takao'
import { hakonePose, hakoneMini } from '../assets/characters/hakone'
import { senpaiFull, senpaiMini } from '../assets/characters/senpai'

const JapanMap = lazy(() => import('../components/JapanMap'))

/*
 * 登山（横画面・最新ラフ 2026-11 どおり）
 *
 * 登山トップ（山を選ぶ）→ 山の紹介（3秒で次へ・タップで飛ばす）→ コース選択 → コース情報 → 装備チェック
 * → ルート図 → ステージ（山探索と同じミニゲーム。コースのゲーム段取りどおり）×N
 *   ステージの合間：体力が足りないと「疲労困憊…！」、バランスが悪いと最終ステージの手前で「体に異変…！」、
 *   ミニゲームに失敗すると「迷った…！」で脱落 → 山神のなぐさめ → 数秒後にホームへ（5回続けて脱落するとヒント）
 *   たまに出来事（雷・倒木・増水・仲間の不調）が起きると、登山トップへ戻る（なぐさめなし）。ご利益があればはね返す
 * → 登頂（山神の全身とひとこと）→ 温泉（300pt）→ お土産屋（看板の1品をお供え）→ ご利益 → ホーム
 */

const ONSEN_COST = 300
const ONSEN_RATE = 0.7        // 温泉で戻るのは、登山で失った分の7割まで（議事録 2026-10-11）
const EVENT_CHANCE = 0.08     // ステージの合間に出来事が起きる割合
const HINT_AFTER = 5          // 続けて脱落したらヒントを出す回数
const MAP_MS = 3000           // 山の紹介を出しておく時間
const ROUTE_MS = 2000         // ルート図を出しておく時間
const CONSOLE_MS = 6000       // なぐさめのあと、ホームへ戻るまで

// 山神（ふもとの里山は先輩）
const GODS = {
  yatsugatake: {
    name: 'ヤツガタケ', full: yatsugatakeFull.stand1, full2: yatsugatakeFull.stand2, mini: yatsugatakeMini.laugh,
    summit: 'よく登りきったね\n山頂からの眺めはどうだい？',
  },
  takao: {
    name: 'タカオ', full: takaoPose.intro[0], full2: takaoPose.intro[1], mini: takaoMini?.smile || takaoPose.home[0],
    summit: 'よく来たな\nここからの眺めは格別だろう？',
  },
  hakone: {
    name: 'ハコネ', full: hakonePose.intro[0], full2: hakonePose.intro[1], mini: hakoneMini?.smile || hakonePose.home[0],
    summit: 'やったね！山頂だよ！\nおれ、ずっと応援してたんだ！',
  },
  satoyama: {
    name: '', full: senpaiFull.pointing, full2: senpaiFull.cheering, mini: senpaiMini.smileCheer,
    summit: 'おつかれさま！ 山頂だよ！\nこの調子で高尾山にも挑戦しよう',
    hello: 'ここは、ふもとの里山。\n登山の練習にぴったりの小さな山だよ（テスト用）',
  },
}
const CONSOLE_TEXT = '辿り着けなかったかあ…！\nあんまり気にするなよ？ 次がある！！'

// 脱落の理由（一問一答 2026-10）
const FAILS = {
  stamina: { title: '疲労困憊…！', text: 'これ以上は危険だから下山しよう', hint: 'トレーニングで総合体力を上げてから挑もう。コースの推奨体力も見てね' },
  balance: { title: '体に異変…！', text: '体のバランスがくずれてしまった。無理せず下山しよう', hint: '体幹・脚力・腕力のどれかが足りないみたい。苦手なトレーニングを補強しよう' },
  lost: { title: '迷った…！', text: '道がわからなくなってしまった。明るいうちに下山しよう', hint: '山探索でレベルを上げておくと、ステージを進みやすくなるよ。ブースターも使ってみてね' },
}

// ステージの合間の出来事
const EVENTS = [
  { id: 'thunder', icon: 'event_thunder', title: '急な雨…！雷も！', text: 'これ以上は進めないよ。登山トップに戻ろう' },
  { id: 'fallentree', icon: 'event_fallentree', title: '倒木で道がふさがれている…！', text: 'これ以上は進めないよ。登山トップに戻ろう' },
  { id: 'flood', icon: 'event_flood', title: '沢があふれている…！', text: 'これ以上は進めないよ。登山トップに戻ろう' },
  { id: 'sickfriend', icon: 'event_sickfriend', title: '仲間の具合が悪くなった…！', text: '無理をせず、登山トップに戻ろう' },
]

// ステージの合間に出来事が起きるか（起きたらその出来事）
function rollEvent() {
  return Math.random() < EVENT_CHANCE ? EVENTS[Math.floor(Math.random() * EVENTS.length)] : null
}

const AREA_BG = { rock: BG.stage.rocky, trail: BG.stage.trail, meadow: BG.stage.meadow }
const SPECIES = Object.fromEntries(encyclopedia.map((e) => [e.id, e]))
const ITEMS = Object.fromEntries(itemsData.map((i) => [i.id, i]))

const stars = (n) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n))
const totalOf = (p) => Math.floor((p.core + p.legs + p.arms) / 3)

// コースの限定アイテム ＋ その山の「山の恵み」
function limitedFor(course) {
  const bounty = Object.keys(BOUNTY_MOUNTAIN).filter((id) => BOUNTY_MOUNTAIN[id] === course.mountainId)
  return [...course.limited, ...bounty].map((id) => SPECIES[id]).filter(Boolean)
}

// バランス：いちばん低い体力が、総合体力のこの割合より低いと最終ステージの手前で脱落（体力面★が高いほど厳しい）
const balanceRatio = (course) => 0.2 + 0.05 * Math.max(0, (course.stamina || 1) - 1)
const balanceBad = (player, course) => {
  const total = totalOf(player)
  return total > 0 && Math.min(player.core, player.legs, player.arms) < total * balanceRatio(course)
}

// お供えのご利益：その場で上がる体力（3つとも）
const blessingUp = (price) => Math.max(2, Math.round(price / 500))

export default function Climbing() {
  const navigate = useNavigate()
  const player = useGameStore((s) => s.player)
  const mountains = useGameStore((s) => s.mountains)
  const flags = useGameStore((s) => s.flags)
  const blessing = useGameStore((s) => s.blessing)
  const failStreak = useGameStore((s) => s.climbFailStreak)
  const discovered = useGameStore((s) => s.discovered)
  const store = useGameStore.getState

  const [phase, setPhase] = useState('top')
  const [mountain, setMountain] = useState(null)   // MOUNTAINS の1件
  const [course, setCourse] = useState(null)
  const [stageIdx, setStageIdx] = useState(0)
  const [interlude, setInterlude] = useState(null) // ステージの合間に出すもの { kind: 'route' | 'guard', event? }
  const [fail, setFail] = useState(null)           // { reason }
  const [event, setEvent] = useState(null)
  const [found, setFound] = useState([])           // この登山で見つけた限定アイテム
  const [summit, setSummit] = useState(null)       // { firstSummit, unlockedMaintenance, unlockedAR, worn }
  const [worn, setWorn] = useState([])
  const [msg, setMsg] = useState('')
  const [stageKey, setStageKey] = useState(0)

  const total = totalOf(player)
  const mt = mountain ? mountains[mountain.id] : null
  const mtLevel = mt?.maintenanceLevel ?? 100
  const mtState = maintenanceState(mtLevel)
  const god = mountain ? GODS[mountain.id] : null
  const limited = useMemo(() => (course ? limitedFor(course) : []), [course])

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3200) }

  /* ───────── 山を選ぶ ───────── */
  const pickMountain = (m) => {
    const state = mountains[m.id]
    if (isUnderMaintenance(state)) {
      sfx.miss(); flash(`${m.name}は整備作業中だよ。あと${formatDuration(remainingMinutes(state))}で終わるよ`); return
    }
    if (isClosed(state?.maintenanceLevel ?? 100)) {
      sfx.miss(); flash(`${m.name}は荒れすぎていて登れないよ（整備度${state.maintenanceLevel}%）。山整備で${CLOSED_BELOW}%以上にしよう`); return
    }
    sfx.confirm()
    if (!state?.firstAccessed) store().setMountainAccessed(m.id)
    setMountain(m)
    setPhase('map')
  }

  /* ───────── 出発（装備を1回ぶん使う） ───────── */
  const depart = () => {
    sfx.go()
    setWorn(store().spendClimbGear(requiredItemsFor(course)))
    setFound([])
    setStageIdx(0)
    setInterlude({ kind: 'route' })
    setPhase('between')
  }

  /* ───────── ステージ k に入る前の判定 ───────── */
  const N = course?.stages.length || 0
  const enterStage = (idx) => {
    const p = store().player
    const k = idx + 1
    const req = requiredStaminaFor(course, mtLevel)
    const need = k === N ? req : (req * (k - 1)) / N
    if (k > 1 && totalOf(p) < need) return failClimb('stamina', idx)
    if (k === N && N > 1 && balanceBad(p, course)) return failClimb('balance', idx)
    const ev = k > 1 ? rollEvent() : null
    if (ev) {
      if (store().blessing) {
        store().consumeBlessing()
        setStageIdx(idx)
        setInterlude({ kind: 'guard', event: ev })
        setPhase('between')
        return
      }
      return eventClimb(ev, idx)
    }
    setStageIdx(idx)
    setInterlude({ kind: 'route' })
    setPhase('between')
  }

  const startStage = () => { setStageKey((n) => n + 1); setPhase('stage') }

  const handleMatch = (sp, info) => {
    if (info?.limited) {
      store().discover(sp.id)
      setFound((f) => (f.some((x) => x.id === sp.id) ? f : [...f, sp]))
    } else {
      store().recordMatch(sp.id)
    }
  }

  const handleStageEnd = ({ ok }) => {
    if (!ok) return failClimb('lost', stageIdx)
    if (stageIdx + 1 >= N) return summitClimb()
    enterStage(stageIdx + 1)
  }

  /* ───────── 結果 ───────── */
  const reqBase = course?.requiredTotal || 0 // 疲労は整備度に関係なく本来の必要体力で計算
  const failPenalty = course ? Math.min(Math.floor(course.reward * 0.1), 500) : 0

  function failClimb(reason, clearedStages) {
    sfx.miss()
    const s = store()
    s.recordMission('climb', mountain.id)
    s.applyFatigue(Math.ceil(reqBase * 0.02 * Math.max(1, clearedStages)))
    s.spendPoints(Math.min(failPenalty, s.player.points))
    s.recordClimbResult(false)
    setFail({ reason })
    setPhase('fail')
  }

  function eventClimb(ev, clearedStages) {
    sfx.miss()
    const s = store()
    s.recordMission('climb', mountain.id)
    s.applyFatigue(Math.ceil(reqBase * 0.02 * Math.max(1, clearedStages)))
    setEvent(ev)
    setPhase('event')
  }

  function summitClimb() {
    sfx.fanfare()
    const s = store()
    const firstSummit = Object.values(s.mountains).every((m) => !m.summitedCourses?.length)
    s.recordMission('climb', mountain.id)
    s.completeCourse(mountain.id, course.id)
    s.addPoints(course.reward)
    s.addAlbumEntry({ mountainId: mountain.id, courseId: course.id, courseName: course.name, mountainName: mountain.name })
    const unlockedAR = !s.flags.arUnlocked
    const unlockedMaintenance = !s.flags.maintenanceUnlocked
    if (unlockedAR) s.unlockAR()
    if (unlockedMaintenance) s.unlockMaintenance()
    s.applyFatigue(Math.ceil(reqBase * 0.1))
    s.recordClimbResult(true)
    setSummit({ firstSummit, unlockedAR, unlockedMaintenance })
    setPhase('summit')
  }

  /* ───────── 画面 ───────── */
  if (!flags.climbingUnlocked) {
    return (
      <Screen bg={BG.intro}>
        <div style={st.centerCard}>
          <GameIcon name="lock" size={56} />
          <div style={st.cardTitle}>登山はまだ解放されていないよ</div>
          <p style={st.cardText}>山探索Lv.3・総合体力20で解放されるよ</p>
          <HomeButton />
        </div>
      </Screen>
    )
  }

  if (phase === 'top') {
    return (
      <Screen bg={BG.intro}>
        <TopBar points={player.points} onGear={() => { sfx.confirm(); navigate('/shop') }} />
        <div style={st.topTitle}>
          <span className="icon-label" style={st.titleText}>どの山に登る？</span>
          <span className="icon-label" style={st.subText}>総合体力 {total}</span>
        </div>
        <div style={st.mountainRow}>
          {MOUNTAINS.map((m) => {
            const state = mountains[m.id] || {}
            const list = coursesData.filter((c) => c.mountainId === m.id)
            const done = state.summitedCourses?.length || 0
            const level = state.maintenanceLevel ?? 100
            const ms = maintenanceState(level)
            const busy = remainingMinutes(state)
            const closed = isClosed(level)
            return (
              <button key={m.id} style={{ ...st.mountainTile, ...(closed || busy ? st.dim : null) }} onClick={() => pickMountain(m)}>
                <img src={GODS[m.id].mini} alt="" style={st.mountainFace} draggable={false} />
                <div style={st.mountainName}>{m.short}</div>
                {m.test && <div style={st.testTag}>テスト用</div>}
                <div style={st.mountainSub}>{list.length}コース・登頂 {done}</div>
                {busy > 0
                  ? <div style={{ ...st.mountainNote, color: '#b07800' }}>整備作業中 あと{formatDuration(busy)}</div>
                  : closed
                    ? <div style={{ ...st.mountainNote, color: '#c0392b' }}>荒れていて登れない（{level}%）</div>
                    : ms.penalty > 0 && <div style={{ ...st.mountainNote, color: ms.color }}>整備{ms.label} 必要体力+{Math.round(ms.penalty * 100)}%</div>}
              </button>
            )
          })}
        </div>
        {blessing && (
          <div style={st.blessingChip}><GameIcon name="event_blessing" size={22} /> {blessing.name}のご利益：次の登山で災害をはね返す</div>
        )}
        {msg && <div style={st.toast}>{msg}</div>}
      </Screen>
    )
  }

  if (phase === 'map') {
    return <MountainIntro mountain={mountain} god={god} onNext={() => setPhase('course')} />
  }

  if (phase === 'course') {
    const list = coursesData.filter((c) => c.mountainId === mountain.id)
    const summited = mt?.summitedCourses || []
    return (
      <Screen bg={BG.intro}>
        <TopBar points={player.points} onBack={() => { sfx.cancel(); setPhase('top') }} onGear={() => { sfx.confirm(); navigate('/shop') }} />
        <img src={god.full2 || god.full} alt={god.name} style={st.godSide} draggable={false} />
        <div style={st.coursePanel}>
          <div style={st.panelHead}>
            <span style={st.panelTitle}>{mountain.name}のコース</span>
            <span style={st.panelSub}>総合体力 {total}</span>
          </div>
          {mtState.penalty > 0 && (
            <div style={{ ...st.warn, color: mtState.color }}>
              整備度 {mtLevel}%（{mtState.label}）。道が荒れていて必要体力が +{Math.round(mtState.penalty * 100)}% になっているよ
            </div>
          )}
          <div style={st.courseGrid}>
            {list.map((c) => {
              const req = requiredStaminaFor(c, mtLevel)
              const ok = total >= req
              return (
                <button key={c.id} style={st.courseCard} onClick={() => { sfx.confirm(); setCourse(c); setPhase('info') }}>
                  <div style={st.courseTop}>
                    <span style={st.courseName}>{c.name}</span>
                    {summited.includes(c.id) && <GameIcon name="flagGoal" size={20} />}
                  </div>
                  <div style={st.courseStars}>{'★'.repeat(c.difficulty)}<span style={{ opacity: 0.25 }}>{'★'.repeat(Math.max(0, 5 - c.difficulty))}</span></div>
                  <div style={st.courseFoot}>
                    <span style={{ color: ok ? '#1a8a47' : '#c0392b' }}>推奨体力 {req}</span>
                    <span style={st.reward}><GameIcon name="pcoin" size={16} />{c.reward.toLocaleString()}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </Screen>
    )
  }

  if (phase === 'info') {
    return (
      <CourseInfo
        course={course} mountain={mountain} god={god} weight={player.weight} total={total}
        req={requiredStaminaFor(course, mtLevel)} limited={limited} discovered={discovered}
        onBack={() => { sfx.cancel(); setPhase('course') }}
        onNext={() => { sfx.confirm(); setPhase('equip') }}
      />
    )
  }

  if (phase === 'equip') {
    return (
      <EquipCheck course={course} onBack={() => setPhase('info')} onDepart={depart}
        onShop={() => { sfx.confirm(); navigate('/shop') }} />
    )
  }

  if (phase === 'between') {
    return (
      <Interlude
        course={course} stageIdx={stageIdx} kind={interlude?.kind} event={interlude?.event}
        onNext={startStage}
      />
    )
  }

  if (phase === 'stage') {
    const stg = course.stages[stageIdx]
    return (
      <TripleMatchGame
        key={stageKey}
        area={stg.area}
        level={stg.level}
        match={stg.match}
        short={stg.short}
        many={stg.many}
        limited={limited}
        label={`ステージ ${stageIdx + 1}/${N}`}
        okText={stageIdx + 1 >= N ? '山頂へ！' : 'ステージ突破！'}
        quitText="登山をやめて下山する？"
        onMatch={handleMatch}
        onEnd={handleStageEnd}
        onQuit={() => { sfx.cancel(); setPhase('top') }}
      />
    )
  }

  if (phase === 'fail') {
    return (
      <FailScreen
        reason={fail.reason} god={god} penalty={failPenalty} worn={worn}
        hint={failStreak >= HINT_AFTER ? FAILS[fail.reason].hint : null}
        maintenanceHint={mtState.penalty > 0}
        onHome={() => navigate('/')}
      />
    )
  }

  if (phase === 'event') {
    return (
      <Screen bg={ROUTE.map}>
        <div style={st.shade} />
        <div style={st.centerCard}>
          <GameIcon name={event.icon} size={96} />
          <div style={st.cardTitle}>{event.title}</div>
          <p style={st.cardText}>{event.text}</p>
          {worn.length > 0 && <p style={st.wornText}>{worn.map((w) => w.name).join('・')}が消耗しました！</p>}
          <button style={st.mainBtn} onClick={() => { sfx.confirm(); setPhase('top') }}>登山トップへ</button>
        </div>
      </Screen>
    )
  }

  if (phase === 'summit') {
    return (
      <SummitScreen
        course={course} mountain={mountain} god={god} found={found} info={summit} worn={worn}
        total={total} discovered={discovered} playerName={player.name}
        onNext={() => { sfx.confirm(); setPhase('onsen') }}
      />
    )
  }

  if (phase === 'onsen') {
    return <Onsen onNext={() => setPhase('souvenir')} />
  }

  if (phase === 'souvenir') {
    return <Souvenir course={course} mountain={mountain} god={god} onDone={() => navigate('/')} />
  }

  return null
}

/* ══════════════════════════ 部品 ══════════════════════════ */

function Screen({ bg, children, style }) {
  return (
    <div style={{ ...st.root, ...style }}>
      <div style={{ ...st.bg, backgroundImage: `url(${bg})` }} />
      {children}
    </div>
  )
}

function TopBar({ points, onBack, onGear }) {
  return (
    <div style={st.topBar}>
      <PointPlank points={points} />
      <div style={st.topBtns}>
        {onBack && <PlankButton label="もどる" onClick={onBack} />}
        <PlankButton label="装備" icon="trekkingshoes" tut="climb-shop" onClick={onGear} />
        <HomeButton />
      </div>
    </div>
  )
}

/* 山の紹介：県・標高・ひとこと、山神の上半身とあいさつ。3秒で次へ（タップで飛ばす） */
function MountainIntro({ mountain, god, onNext }) {
  const done = useRef(false)
  const next = () => { if (done.current) return; done.current = true; onNext() }
  useEffect(() => {
    const t = setTimeout(next, MAP_MS)
    return () => clearTimeout(t)
  })
  const hello = characters[mountain.id]?.hello || god.hello || ''
  return (
    <Screen bg={BG.intro}>
      <div style={st.introWrap} onClick={() => { sfx.tap(); next() }}>
        <div style={st.introMap}>
          {mountain.lat && (
            <Suspense fallback={null}><JapanMap climbed={[]} /></Suspense>
          )}
        </div>
        <div style={st.introInfo}>
          <div style={st.introName}>{mountain.name}</div>
          <div style={st.introMeta}>{mountain.pref}{mountain.height && `・標高 ${mountain.height}`}</div>
          <p style={st.introText}>{withFurigana(mountain.intro)}</p>
        </div>
        <div style={st.introGod}>
          <img src={god.full} alt={god.name} style={st.godBust} draggable={false} />
        </div>
        <div style={st.introBubble}>
          {god.name && <div style={st.bubbleName}>{god.name}</div>}
          <p style={st.bubbleText}>{withFurigana(hello)}</p>
        </div>
        <div style={st.tapNote}>タップで次へ</div>
      </div>
    </Screen>
  )
}

/* コース情報：所在地・スタート/ゴール・時間・距離・消費カロリー（ルート定数×体重）・道のり★・体力面★・紹介文 */
function CourseInfo({ course, mountain, god, weight, total, req, limited, discovered, onBack, onNext }) {
  const kcal = Math.round(course.routeConst * weight)
  const ok = total >= req
  const rows = [
    ['標高', course.altitude],
    ['所在地', course.location],
    ['スタート／ゴール', course.startGoal],
    ['時間・距離', [course.duration || (course.hours && `${course.hours}時間`), course.distance && `${course.distance}km`].filter(Boolean).join('　')],
    ['消費カロリー', `約${kcal.toLocaleString()}kcal（体重${weight}kgのとき）`],
  ].filter(([, v]) => v)
  return (
    <Screen bg={BG.intro}>
      <img src={god.full} alt={god.name} style={st.godSide} draggable={false} />
      <div style={st.infoPanel}>
        <div style={st.panelHead}>
          <span style={st.panelTitle}>{course.name}</span>
          <span style={st.panelSub}>{mountain.short}</span>
        </div>
        <div style={st.infoBody}>
          <div style={st.infoCols}>
            <table style={st.infoTable}>
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}><th style={st.th}>{k}</th><td style={st.td}>{withFurigana(String(v))}</td></tr>
                ))}
                <tr><th style={st.th}>道のり</th><td style={{ ...st.td, color: '#e0a000' }}>{stars(course.difficulty)}</td></tr>
                <tr><th style={st.th}>体力面</th><td style={{ ...st.td, color: '#e0a000' }}>{stars(course.stamina)}</td></tr>
                <tr>
                  <th style={st.th}>推奨体力</th>
                  <td style={{ ...st.td, color: ok ? '#1a8a47' : '#c0392b' }}>{req}（いま {total}{ok ? '' : `・あと${req - total}`}）</td>
                </tr>
                <tr><th style={st.th}>ステージ</th><td style={st.td}>{course.stages.length}つ</td></tr>
                <tr><th style={st.th}>登頂ポイント</th><td style={st.td}>{course.reward.toLocaleString()}pt</td></tr>
              </tbody>
            </table>
            {limited.length > 0 && (
              <div style={st.limitedBox}>
                <div style={st.limitedTitle}>このコースで出会えるかも</div>
                <div style={st.limitedRow}>
                  {limited.slice(0, 6).map((sp) => {
                    const got = discovered.includes(sp.id)
                    return (
                      <div key={sp.id} style={st.limitedItem}>
                        <Specimen sp={sp} size={40} style={got ? null : { filter: 'brightness(0) opacity(0.35)' }} />
                        <span style={st.limitedName}>{got ? sp.name : '？？？'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <p style={st.desc}>{withFurigana(course.description)}</p>
        </div>
        <div style={st.btnRow}>
          <button style={st.subBtn} onClick={onBack}>もどる</button>
          <button style={st.mainBtn} onClick={onNext}>装備チェックへ</button>
        </div>
      </div>
    </Screen>
  )
}

/* 装備チェック：コースに要る装備（冬は季節の物も）。足りない物はここで買える */
function EquipCheck({ course, onBack, onDepart, onShop }) {
  const inventory = useGameStore((s) => s.inventory)
  const points = useGameStore((s) => s.player.points)
  const spendPoints = useGameStore((s) => s.spendPoints)
  const addItem = useGameStore((s) => s.addItem)
  const [confirm, setConfirm] = useState(false)
  const [msg, setMsg] = useState('')
  const owned = new Set(inventory.map((i) => i.id))
  const required = requiredItemsFor(course).map((id) => ITEMS[id]).filter(Boolean)
  const missing = required.filter((it) => !owned.has(it.id))
  const cost = missing.reduce((n, it) => n + it.price, 0)
  const winter = isWinter() && course.seasonalItems?.length > 0

  const buy = () => {
    setConfirm(false)
    if (!spendPoints(cost)) {
      sfx.miss(); setMsg(`ポイントが足りないよ（あと${(cost - points).toLocaleString()}pt）`); return
    }
    sfx.coin()
    missing.forEach((it) => addItem(it))
    setMsg('')
  }

  return (
    <Screen bg={BG.shop}>
      <div style={st.equipPanel}>
        <div style={st.panelHead}>
          <span style={st.panelTitle}>装備チェック</span>
          <span style={st.panelSub}>{course.name}・{required.length - missing.length}/{required.length}</span>
          <PointPlank points={points} style={{ marginLeft: 'auto', transform: 'scale(0.8)', transformOrigin: 'right center' }} />
        </div>
        {winter && <div style={st.warn}>冬（12〜3月）は季節の装備も必要だよ</div>}
        <div style={st.equipGrid}>
          {required.map((it) => {
            const ok = owned.has(it.id)
            return (
              <div key={it.id} style={{ ...st.equipCell, ...(ok ? null : st.equipMissing) }} title={it.name}>
                <GameIcon name={it.icon || 'box'} size={34} style={ok ? null : { opacity: 0.45 }} />
                <span style={st.equipName}>{it.name}</span>
                <span style={st.equipMark}>{ok ? '✓' : `${it.price.toLocaleString()}pt`}</span>
              </div>
            )
          })}
        </div>
        {msg && <div style={{ ...st.warn, color: '#c0392b' }}>{msg}</div>}
        <div style={st.btnRow}>
          <button style={st.subBtn} onClick={() => { sfx.cancel(); onBack() }}>もどる</button>
          <button style={st.subBtn} onClick={onShop}>装備ショップへ</button>
          {missing.length > 0
            ? <button style={st.mainBtn} onClick={() => { sfx.tap(); setConfirm(true) }}>足りない{missing.length}点をまとめて買う（{cost.toLocaleString()}pt）</button>
            : <button style={st.mainBtn} onClick={onDepart}>出発！</button>}
        </div>
      </div>
      {confirm && (
        <Window title="まとめて購入" width={460} onClose={() => setConfirm(false)}>
          <p style={st.confirmText}>足りない装備{missing.length}点（{cost.toLocaleString()}pt）{'\n'}購入でよろしいですか？</p>
          <div style={{ ...st.btnRow, justifyContent: 'center' }}>
            <button style={st.subBtn} onClick={() => { sfx.cancel(); setConfirm(false) }}>やめる</button>
            <button style={st.mainBtn} onClick={buy}>購入する</button>
          </div>
        </Window>
      )}
    </Screen>
  )
}

/* ステージの合間：ルート図に今のステージを出す（約2秒）。ご利益で出来事をはね返したときはそれも出す */
function Interlude({ course, stageIdx, kind, event, onNext }) {
  const done = useRef(false)
  const next = () => { if (done.current) return; done.current = true; onNext() }
  useEffect(() => {
    const t = setTimeout(next, kind === 'guard' ? ROUTE_MS + 1500 : ROUTE_MS)
    return () => clearTimeout(t)
  })
  const N = course.stages.length
  const stg = course.stages[stageIdx]
  return (
    <Screen bg={ROUTE.map}>
      <div style={st.routeWrap} onClick={() => { sfx.tap(); next() }}>
        <div style={st.routeTitle}>{course.name}</div>
        <div style={st.routeDots}>
          {course.stages.map((s, i) => (
            <span key={i} style={{ ...st.routeDot, ...(i < stageIdx ? st.routeDone : null), ...(i === stageIdx ? st.routeNow : null) }}>
              {i === N - 1 ? <GameIcon name="flagGoal" size={18} /> : i + 1}
            </span>
          ))}
        </div>
        {kind === 'guard' ? (
          <div style={st.routeCard}>
            <GameIcon name="event_blessing" size={72} />
            <div style={st.cardTitle}>{event.title.replace(/…！.*$/, '')}…！</div>
            <p style={st.cardText}>でも、ご利益ではね返した！ このまま進もう</p>
          </div>
        ) : (
          <div style={st.routeCard}>
            <div style={{ ...st.stageThumb, backgroundImage: `url(${AREA_BG[stg.area]})` }} />
            <div style={st.cardTitle}>ステージ {stageIdx + 1}/{N}{stageIdx === N - 1 ? '（最後）' : ''}</div>
            <p style={st.cardText}>
              {'★'.repeat(stg.level)}{stg.match > 3 ? ` ・${stg.match}つそろえ` : ''}{stg.short ? ' ・時短' : ''}{stg.many ? ' ・アイテム多め' : ''}
            </p>
          </div>
        )}
        <div style={st.tapNote}>タップで次へ</div>
      </div>
    </Screen>
  )
}

/* 脱落：ルート図に理由 → 山神のなぐさめ → 数秒後にホームへ */
function FailScreen({ reason, god, penalty, worn, hint, maintenanceHint, onHome }) {
  const [step, setStep] = useState('reason')
  const f = FAILS[reason]
  const lastFatigue = useGameStore((s) => s.lastFatigue)
  useEffect(() => {
    if (step !== 'console') return
    const t = setTimeout(onHome, CONSOLE_MS)
    return () => clearTimeout(t)
  }, [step, onHome])

  if (step === 'reason') {
    return (
      <Screen bg={ROUTE.map}>
        <div style={st.shade} />
        <div style={st.centerCard} onClick={() => { sfx.tap(); setStep('console') }}>
          <div style={{ ...st.cardTitle, fontSize: FS(8, 24, 44), color: '#c0392b' }}>{f.title}</div>
          <p style={st.cardText}>{f.text}</p>
          <p style={st.smallText}>疲労で体力が {lastFatigue} 減って、{penalty}pt 失った…</p>
          {worn.length > 0 && <p style={st.wornText}>{worn.map((w) => w.name).join('・')}が消耗しました！</p>}
          <button style={st.mainBtn}>次へ</button>
        </div>
      </Screen>
    )
  }
  return (
    <Screen bg={BG.intro}>
      <div style={st.consoleWrap} onClick={() => { sfx.tap(); onHome() }}>
        <img src={god.full} alt={god.name} style={st.godCenter} draggable={false} />
        <div style={st.consoleBubble}>
          {god.name && <div style={st.bubbleName}>{god.name}</div>}
          <p style={st.bubbleText}>{CONSOLE_TEXT}</p>
          {hint && <p style={st.hintText}>ヒント：{hint}</p>}
          {maintenanceHint && <p style={st.hintText}>道が荒れていたよ。山整備をすると登りやすくなるよ</p>}
        </div>
        <div style={st.tapNote}>数秒でホームへ戻るよ（タップですぐ戻る）</div>
      </div>
    </Screen>
  )
}

/* 登頂：山神の全身とひとこと。見つけた限定アイテム、解放のお知らせ */
function SummitScreen({ course, mountain, god, found, info, worn, total, discovered, playerName, onNext }) {
  const lastFatigue = useGameStore((s) => s.lastFatigue)
  const [shareMsg, setShareMsg] = useState('')
  const share = async () => {
    sfx.tap()
    const text = buildSummitText({ playerName, mountainName: mountain.name, courseName: course.name, total, rate: albumProgress(discovered).rate })
    const r = await shareText('山アプリ 登頂記録', text)
    setShareMsg(r === 'shared' ? '共有しました！' : r === 'copied' ? '登頂記録をコピーしました。SNSに貼り付けてね' : r === 'cancelled' ? '' : '共有できませんでした')
  }
  return (
    <Screen bg={BG.intro}>
      <Confetti count={50} />
      <img src={god.full2 || god.full} alt={god.name} style={st.godSide} draggable={false} />
      <div style={st.summitPanel}>
        <div style={st.summitRibbon}><span className="icon-label" style={st.ribbonText}>登頂成功！</span></div>
        <div style={st.summitBubble}>
          {god.name && <div style={st.bubbleName}>{god.name}</div>}
          <p style={st.bubbleText}>{god.summit}</p>
        </div>
        <div style={st.summitLines}>
          <div><b>{course.name}</b> +{course.reward.toLocaleString()}pt</div>
          <div style={st.smallText}>疲労で総合体力が {lastFatigue} 減った。温泉で回復しよう</div>
          {found.length > 0 && (
            <div style={st.foundRow}>
              {found.map((sp) => (
                <span key={sp.id} style={st.foundChip}><Specimen sp={sp} size={30} />{sp.name}がアルバムに！</span>
              ))}
            </div>
          )}
          {info?.unlockedMaintenance && <div style={st.unlockText}>山整備が解放されたよ！</div>}
          {info?.unlockedAR && <div style={st.unlockText}>AR撮影が解放されたよ！</div>}
          {worn.length > 0 && <div style={st.wornText}>{worn.map((w) => w.name).join('・')}が消耗しました！</div>}
        </div>
        <div style={st.btnRow}>
          <button style={st.subBtn} onClick={share}><GameIcon name="phone" size={16} /> 共有</button>
          <button style={st.mainBtn} onClick={onNext}>温泉へ</button>
        </div>
        {shareMsg && <div style={st.smallText}>{shareMsg}</div>}
      </div>
    </Screen>
  )
}

/* 温泉：入湯料300pt で、登山で失った分の7割まで回復 */
function Onsen({ onNext }) {
  const points = useGameStore((s) => s.player.points)
  const spendPoints = useGameStore((s) => s.spendPoints)
  const recover = useGameStore((s) => s.recover)
  const lastFatigue = useGameStore((s) => s.lastFatigue)
  const [used, setUsed] = useState(false)
  const [msg, setMsg] = useState('')
  const amount = lastFatigue > 0 ? Math.max(1, Math.floor(lastFatigue * ONSEN_RATE)) : 0
  const bathe = () => {
    if (!spendPoints(ONSEN_COST)) { sfx.miss(); setMsg('ポイントが足りないよ'); return }
    sfx.item(); recover(amount); setUsed(true)
  }
  return (
    <Screen bg={BG.onsen}>
      <div style={st.topBar}><PointPlank points={points} /></div>
      <div style={st.centerCard}>
        <GameIcon name="onsen" size={64} />
        <div style={st.cardTitle}>おつかれさま！ 温泉へどうぞ</div>
        {used ? (
          <>
            <p style={st.cardText}>体力が回復した！（体幹・脚力・腕力 +{amount}）</p>
            <p style={st.smallText}>疲れは完全には取れないから、鍛え続けよう</p>
            <button style={st.mainBtn} onClick={() => { sfx.confirm(); onNext() }}>お土産屋へ</button>
          </>
        ) : (
          <>
            <p style={st.cardText}>入湯料 {ONSEN_COST}pt で、登山で失った {lastFatigue} のうち {amount} ぶん回復するよ</p>
            {msg && <p style={{ ...st.smallText, color: '#c0392b' }}>{msg}</p>}
            <div style={st.btnRow}>
              <button style={st.subBtn} onClick={() => { sfx.cancel(); onNext() }}>入らない</button>
              <button style={st.mainBtn} onClick={bathe}>入湯する（{ONSEN_COST}pt）</button>
            </div>
          </>
        )}
      </div>
    </Screen>
  )
}

/* お土産屋：看板に人気のお土産が1つランダムに出る。買うと山神へのお供えになり、ご利益がつく */
function Souvenir({ course, mountain, god, onDone }) {
  const points = useGameStore((s) => s.player.points)
  const spendPoints = useGameStore((s) => s.spendPoints)
  const grantBlessing = useGameStore((s) => s.grantBlessing)
  const [item] = useState(() => course.souvenirs[Math.floor(Math.random() * course.souvenirs.length)] || null)
  const [confirm, setConfirm] = useState(false)
  const [offered, setOffered] = useState(null) // 上がった体力
  const [msg, setMsg] = useState('')

  const buy = () => {
    setConfirm(false)
    if (!spendPoints(item.price)) { sfx.miss(); setMsg('ポイントが足りないよ'); return }
    sfx.fanfare()
    const up = blessingUp(item.price)
    grantBlessing(mountain.id, item.name, up)
    setOffered(up)
  }

  if (offered) {
    return (
      <Screen bg={BG.intro}>
        <Confetti count={30} />
        <img src={god.full} alt={god.name} style={st.godSide} draggable={false} />
        <div style={st.summitPanel}>
          <div style={st.summitBubble}>
            {god.name && <div style={st.bubbleName}>{god.name}</div>}
            <p style={st.bubbleText}>{item.name}をありがとう！{'\n'}ご利益があるように見守っているよ</p>
          </div>
          <div style={st.summitLines}>
            <div style={st.unlockText}>滋養がついて体力もアップ！ 体幹・脚力・腕力 +{offered}</div>
            <div style={st.smallText}><GameIcon name="event_blessing" size={18} /> 次の登山で、ステージの合間の災害を1回はね返せるよ</div>
          </div>
          <div style={st.btnRow}><button style={st.mainBtn} onClick={() => { sfx.confirm(); onDone() }}>ホームへ</button></div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen bg={BG.shop}>
      <div style={st.topBar}><PointPlank points={points} /></div>
      <div style={st.souvenirWrap}>
        <div style={st.signboard}>
          <div style={st.signTitle}>人気のお土産</div>
          {item ? (
            <>
              <GameIcon name="gift" size={64} />
              <div style={st.signName}>{item.name}</div>
              <div style={st.signPrice}><GameIcon name="pcoin" size={22} />{item.price.toLocaleString()}pt</div>
            </>
          ) : <div style={st.signName}>今日は売り切れ…</div>}
        </div>
        <div style={st.souvenirSide}>
          <p style={st.cardText}>お土産を買うと、{god.name ? `${god.name}へのお供え` : 'お供え'}になるよ。{'\n'}その場で体力が上がって、次の登山の災害よけにもなるんだ</p>
          {msg && <p style={{ ...st.smallText, color: '#c0392b' }}>{msg}</p>}
          <div style={st.btnRow}>
            <button style={st.subBtn} onClick={() => { sfx.cancel(); onDone() }}>買わずに帰る</button>
            {item && <button style={st.mainBtn} onClick={() => { sfx.tap(); setConfirm(true) }}>買ってお供えする</button>}
          </div>
        </div>
      </div>
      {confirm && (
        <Window title="お土産" width={440} onClose={() => setConfirm(false)}>
          <p style={st.confirmText}>{item.name}（{item.price.toLocaleString()}pt）{'\n'}購入でよろしいですか？</p>
          <div style={{ ...st.btnRow, justifyContent: 'center' }}>
            <button style={st.subBtn} onClick={() => { sfx.cancel(); setConfirm(false) }}>やめる</button>
            <button style={st.mainBtn} onClick={buy}>購入する</button>
          </div>
        </Window>
      )}
    </Screen>
  )
}


/* ══════════════════════════ スタイル ══════════════════════════ */
const panel = {
  background: 'rgba(250,244,232,0.96)',
  border: '3px solid var(--beige-edge)',
  borderRadius: 20,
  boxShadow: '0 8px 28px rgba(40,25,10,0.35)',
  color: 'var(--brown-text)',
}
const btnBase = {
  border: 'none', borderRadius: 99, cursor: 'pointer', fontWeight: 800,
  padding: 'clamp(6px, 2cqh, 12px) clamp(14px, 3cqw, 26px)', fontSize: FS(3.6, 13, 18),
  display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
}

const st = {
  root: { position: 'relative', width: '100%', height: '100cqh', overflow: 'hidden', userSelect: 'none' },
  bg: { position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center' },
  shade: { position: 'absolute', inset: 0, background: 'rgba(40,28,14,0.35)' },
  dim: { filter: 'grayscale(0.7)', opacity: 0.7 },

  topBar: {
    position: 'absolute', top: '2cqh', left: '1.5cqw', right: '1.5cqw', zIndex: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  },
  topBtns: { display: 'flex', gap: 6 },
  topTitle: { position: 'absolute', top: '17cqh', left: 0, right: 0, textAlign: 'center', zIndex: 5 },
  titleText: { fontSize: FS(6.5, 20, 36), display: 'block' },
  subText: { fontSize: FS(3.8, 13, 20) },

  mountainRow: {
    position: 'absolute', left: '4cqw', right: '4cqw', top: '33cqh', bottom: '12cqh',
    display: 'flex', gap: '2cqw', justifyContent: 'center', alignItems: 'stretch',
  },
  mountainTile: {
    ...panel, flex: '1 1 0', maxWidth: 260, cursor: 'pointer', position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1cqh',
    padding: '2cqh 1cqw',
  },
  mountainFace: { height: '22cqh', objectFit: 'contain' },
  mountainName: { fontSize: FS(5.4, 17, 30), fontWeight: 800 },
  mountainSub: { fontSize: FS(3.2, 11, 16) },
  mountainNote: { fontSize: FS(2.9, 10, 14), fontWeight: 800, textAlign: 'center' },
  testTag: {
    position: 'absolute', top: 8, right: 8, background: '#8a6a45', color: '#fff',
    fontSize: 11, borderRadius: 99, padding: '1px 8px',
  },
  blessingChip: {
    position: 'absolute', bottom: '3cqh', left: '50%', transform: 'translateX(-50%)',
    ...panel, borderRadius: 99, padding: '4px 16px', fontSize: FS(3.2, 12, 16),
    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
  },
  toast: {
    position: 'absolute', bottom: '10cqh', left: '50%', transform: 'translateX(-50%)', zIndex: 30,
    background: 'rgba(60,40,20,0.9)', color: '#fff', borderRadius: 12, padding: '8px 18px',
    fontSize: FS(3.4, 12, 17), maxWidth: '80cqw', textAlign: 'center',
  },

  /* 山の紹介 */
  introWrap: { position: 'absolute', inset: 0, cursor: 'pointer' },
  introMap: {
    position: 'absolute', left: '2cqw', top: '4cqh', width: '34cqw', height: '56cqh',
    pointerEvents: 'none', opacity: 0.95,
  },
  introInfo: { ...panel, position: 'absolute', left: '3cqw', bottom: '5cqh', width: '38cqw', padding: '2.5cqh 2cqw' },
  introName: { fontSize: FS(7, 22, 40), fontWeight: 800 },
  introMeta: { fontSize: FS(3.4, 12, 17), marginTop: 4, color: '#8a6a45' },
  introText: { fontSize: FS(3.4, 12, 17), lineHeight: 1.6, marginTop: 8, whiteSpace: 'pre-wrap' },
  introGod: {
    position: 'absolute', right: '4cqw', bottom: 0, width: '30cqw', height: '78cqh',
    overflow: 'hidden', display: 'flex', justifyContent: 'center',
  },
  godBust: { width: '100%', height: 'auto', objectFit: 'cover', objectPosition: 'top', alignSelf: 'flex-start', animation: 'popIn 0.5s ease' },
  introBubble: { ...ui.bubble, position: 'absolute', right: '35cqw', top: '10cqh', width: '26cqw', padding: '2cqh 1.6cqw' },
  bubbleName: { fontSize: FS(3.2, 12, 16), fontWeight: 800, color: '#e0a000', marginBottom: 2 },
  bubbleText: { fontSize: FS(3.4, 12, 18), lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--brown-text)' },
  tapNote: {
    position: 'absolute', bottom: '1.5cqh', right: '2cqw', color: '#fff', fontSize: FS(2.8, 10, 14),
    textShadow: '0 1px 3px rgba(0,0,0,0.7)', animation: 'blink 1.6s infinite',
  },

  /* コース選択・情報 */
  godSide: {
    position: 'absolute', left: '1cqw', bottom: 0, height: '82cqh', maxWidth: '30cqw',
    objectFit: 'contain', objectPosition: 'bottom', zIndex: 1, pointerEvents: 'none',
  },
  coursePanel: {
    ...panel, position: 'absolute', left: '30cqw', right: '2cqw', top: '15cqh', bottom: '3cqh', zIndex: 2,
    display: 'flex', flexDirection: 'column', padding: '2cqh 1.6cqw', gap: '1cqh',
  },
  panelHead: { display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' },
  panelTitle: { fontSize: FS(5, 16, 28), fontWeight: 800 },
  panelSub: { fontSize: FS(3.2, 11, 16), color: '#8a6a45' },
  warn: { fontSize: FS(3, 11, 15), fontWeight: 800, color: '#b07800' },
  courseGrid: {
    flex: 1, overflowY: 'auto', display: 'grid', gap: '1.4cqh 1cqw',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 30cqw), 1fr))', alignContent: 'start',
    paddingBottom: 6,
  },
  courseCard: {
    background: 'linear-gradient(180deg, #fffaf0, #f1e6d0)', border: '2px solid var(--beige-edge)',
    borderRadius: 14, boxShadow: '0 4px 0 #cdb68e', padding: '1.2cqh 0.9cqw', cursor: 'pointer',
    textAlign: 'left', color: 'var(--brown-text)', display: 'flex', flexDirection: 'column', gap: 3,
  },
  courseTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  courseName: { fontSize: FS(3.4, 12, 17), fontWeight: 800, lineHeight: 1.3 },
  courseStars: { color: '#e0a000', fontSize: FS(3, 11, 15), letterSpacing: 1 },
  courseFoot: { display: 'flex', justifyContent: 'space-between', fontSize: FS(2.8, 10, 14), fontWeight: 800 },
  reward: { display: 'inline-flex', alignItems: 'center', gap: 2, color: '#b07800' },

  infoPanel: {
    ...panel, position: 'absolute', left: '30cqw', right: '2cqw', top: '4cqh', bottom: '4cqh', zIndex: 2,
    display: 'flex', flexDirection: 'column', padding: '2cqh 1.8cqw', gap: '1.2cqh',
  },
  infoBody: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5cqh' },
  infoCols: { display: 'flex', gap: '2cqw', alignItems: 'flex-start', flexWrap: 'wrap' },
  infoTable: { borderCollapse: 'collapse', fontSize: FS(3.1, 11, 16), flex: '1 1 300px' },
  th: { textAlign: 'left', color: '#8a6a45', padding: '3px 12px 3px 0', whiteSpace: 'nowrap', verticalAlign: 'top' },
  td: { padding: '3px 0', fontWeight: 800 },
  limitedBox: { flex: '0 1 220px', background: '#fff', borderRadius: 12, border: '2px dashed var(--beige-edge)', padding: 8 },
  limitedTitle: { fontSize: FS(2.8, 10, 14), color: '#8a6a45', marginBottom: 4 },
  limitedRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  limitedItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60 },
  limitedName: { fontSize: 10, textAlign: 'center', lineHeight: 1.2 },
  desc: { fontSize: FS(3.2, 12, 16), lineHeight: 1.7, whiteSpace: 'pre-wrap', fontWeight: 700 },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' },
  mainBtn: { ...btnBase, background: 'linear-gradient(180deg, #f8c537, #e0a000)', color: '#4a2e00', boxShadow: '0 3px 0 #b07800' },
  subBtn: { ...btnBase, background: '#fff', color: 'var(--brown-text)', border: '2px solid var(--beige-edge)', boxShadow: '0 3px 0 var(--beige-edge)' },

  /* 装備チェック */
  equipPanel: {
    ...panel, position: 'absolute', inset: '4cqh 3cqw', display: 'flex', flexDirection: 'column',
    padding: '2cqh 1.8cqw', gap: '1.2cqh',
  },
  equipGrid: {
    flex: 1, overflowY: 'auto', display: 'grid', gap: 8, alignContent: 'start',
    gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))',
  },
  equipCell: {
    background: '#fff', border: '2px solid #9fd3a8', borderRadius: 12, padding: '6px 4px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minHeight: 92,
  },
  equipMissing: { border: '2px dashed #d9a0a0', background: '#fbf2ef' },
  equipName: { fontSize: 11, textAlign: 'center', lineHeight: 1.25, fontWeight: 800 },
  equipMark: { fontSize: 11, color: '#1a8a47', fontWeight: 800, marginTop: 'auto' },
  confirmText: { color: 'var(--brown-text)', fontSize: 16, lineHeight: 1.7, textAlign: 'center', whiteSpace: 'pre-wrap', marginBottom: 14 },

  /* ルート図 */
  routeWrap: { position: 'absolute', inset: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3cqh' },
  routeTitle: { ...panel, borderRadius: 99, padding: '6px 24px', fontSize: FS(4.6, 15, 26), fontWeight: 800 },
  routeDots: { display: 'flex', gap: '1.4cqw', alignItems: 'center' },
  routeDot: {
    width: 'clamp(28px, 8cqh, 48px)', height: 'clamp(28px, 8cqh, 48px)', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#fff', border: '3px solid var(--beige-edge)', color: 'var(--brown-text)', fontWeight: 800,
    fontSize: FS(3.4, 12, 18),
  },
  routeDone: { background: '#9fd3a8', borderColor: '#1a8a47' },
  routeNow: { background: '#f8c537', borderColor: '#b07800', transform: 'scale(1.2)', animation: 'popIn 0.4s ease' },
  routeCard: { ...panel, padding: '2.5cqh 3cqw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1cqh', minWidth: '34cqw' },
  stageThumb: { width: '28cqw', height: '18cqh', borderRadius: 12, backgroundSize: 'cover', backgroundPosition: 'center', border: '3px solid #fff' },

  /* 共通カード */
  centerCard: {
    ...panel, position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 5,
    width: 'min(560px, 80cqw)', padding: '3cqh 3cqw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.4cqh',
    textAlign: 'center',
  },
  cardTitle: { fontSize: FS(5.4, 17, 30), fontWeight: 800, color: 'var(--brown-text)' },
  cardText: { fontSize: FS(3.4, 12, 18), lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--brown-text)' },
  smallText: { fontSize: FS(2.9, 11, 15), color: '#8a6a45', lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  wornText: { fontSize: FS(3, 11, 15), color: '#d0702b', fontWeight: 800 },
  unlockText: { fontSize: FS(3.4, 12, 18), color: '#1a8a47', fontWeight: 800 },
  hintText: { fontSize: FS(3, 11, 15), color: '#b07800', fontWeight: 800, marginTop: 6, lineHeight: 1.6 },

  /* なぐさめ */
  consoleWrap: { position: 'absolute', inset: 0, cursor: 'pointer' },
  godCenter: { position: 'absolute', left: '8cqw', bottom: 0, height: '86cqh', objectFit: 'contain', animation: 'popIn 0.5s ease' },
  consoleBubble: { ...ui.bubble, position: 'absolute', left: '42cqw', top: '22cqh', width: '44cqw', padding: '3cqh 2cqw' },

  /* 登頂 */
  summitPanel: {
    ...panel, position: 'absolute', left: '32cqw', right: '3cqw', top: '8cqh', bottom: '6cqh', zIndex: 2,
    display: 'flex', flexDirection: 'column', padding: '2cqh 2cqw', gap: '1.6cqh', justifyContent: 'center',
  },
  summitRibbon: {
    alignSelf: 'center', background: `url(${UI.ribbon}) center / 100% 100% no-repeat`,
    padding: '1.4cqh 6cqw 2.4cqh',
  },
  ribbonText: { fontSize: FS(6, 20, 34) },
  summitBubble: { ...ui.bubble, padding: '1.6cqh 1.6cqw' },
  summitLines: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: FS(3.4, 12, 18) },
  foundRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  foundChip: {
    display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff8dc', border: '2px solid #f8c537',
    borderRadius: 99, padding: '2px 10px 2px 4px', fontSize: FS(2.9, 11, 15), fontWeight: 800,
  },

  /* お土産 */
  souvenirWrap: {
    position: 'absolute', left: '4cqw', right: '4cqw', top: '16cqh', bottom: '6cqh',
    display: 'flex', gap: '3cqw', alignItems: 'center', justifyContent: 'center',
  },
  signboard: {
    width: '36cqw', height: '68cqh', background: `url(${UI.signboard}) center / 100% 100% no-repeat`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.4cqh',
    padding: '6cqh 3cqw 10cqh', filter: 'drop-shadow(0 4px 8px rgba(40,25,10,0.4))',
  },
  signTitle: { fontSize: FS(3.6, 13, 19), color: '#fff', fontWeight: 800, textShadow: '0 1px 2px #5a3a10' },
  signName: { fontSize: FS(4.6, 15, 26), fontWeight: 800, color: '#fff', textAlign: 'center', textShadow: '0 1px 3px #5a3a10' },
  signPrice: { display: 'flex', alignItems: 'center', gap: 4, color: 'var(--yamabuki)', fontWeight: 800, fontSize: FS(4.2, 14, 24), textShadow: '0 0 2px #5a3a10, 0 1px 2px #5a3a10' },
  souvenirSide: { ...panel, flex: '0 1 44cqw', padding: '3cqh 2cqw', display: 'flex', flexDirection: 'column', gap: '2cqh' },
}
