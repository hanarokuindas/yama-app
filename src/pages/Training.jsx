import { useState, useEffect } from 'react'
import GameIcon from '../components/GameIcon'
import { useGameStore } from '../stores/gameStore'
import { Confetti } from '../components/Celebration'
import { HomeButton } from '../components/PlankButton'
import PlankButton from '../components/PlankButton'
import { PointPlank, Plank } from '../components/ui'
import { ui, FS } from '../components/uiStyles'
import { sfx } from '../utils/sound'
import { senpaiFull, senpaiMini } from '../assets/characters/senpai'
import { BG } from '../assets/backgrounds'
import MotionPlayer, { MotionStrip } from '../components/MotionPlayer'
import { HOWTO } from '../data/howto'
import { MOTIONS, hasMotion } from '../data/motions'
import { TUTORIALS } from '../data/tutorial'
import TRAININGS from '../data/trainings.json'
import { STAT } from '../data/stats'

/* トレーニング（横画面・最新ラフ p28〜35）
   体幹・脚力・腕力の3メニュー。振り分けは「手本動画」表の 脚／腕／体 の〇（2つにまたがる種目は両方に出る）。
   初回は先輩のあいさつ。実施中は先輩ミニ①②、最後までやったら⑤⑦、途中でやめたら⑧⑩をパラパラ切り替える。
   回数／時間・左右の切り替え・セット・先輩コメントは表のとおりに進める（tools/import_trainings.py）。 */

const MENUS = [
  { stat: 'core', label: '体幹メニュー', icon: 'yoga' },
  { stat: 'legs', label: '脚力メニュー', icon: 'leg' },
  { stat: 'arms', label: '腕力メニュー', icon: 'muscle' },
]

const SIDE_LABEL = { lr: '左右', alt: '左右交互' }
const DEMO_MIN_SEC = 4 // 準備画面のお手本は1回を最低4秒かけて見せる
const TIP_SEC = 10     // 実施中の先輩コメントの切り替え間隔
const FLIP_MS = 700    // 先輩ミニのパラパラの間隔

const INTRO = [
  'はじめましてだよね！\nボクは一応、キミたちの先輩かな\nよろしくね！',
  'ここでは体づくりをしていくよ！\n自分のペースでいいからね',
  '鍛えたいトレーニングを選んだら、\nモーションに合わせて実際にやってみよう！',
]

// 上がる能力値。筋トレは4秒で1、ストレッチは8秒で1を、表で印のついた能力に分ける
function gainsOf(t) {
  const per = t.group === 'ストレッチ' ? 8 : 4
  const each = Math.max(2, Math.round(t.total / per / t.stats.length))
  return t.stats.map((stat) => ({ stat, value: each }))
}

// 進め方の説明（左右・セット）
function flowText(t) {
  if (t.side === 'lr') return '左 → 切り替え10秒 → 右 の順に進むよ'
  if (t.side === 'alt') return '左右交互に、合わせて数えるよ'
  const rest = t.phases.find((p) => p.rest)
  if (rest) return `セットの間に${rest.sec}秒休憩があるよ`
  return ''
}

// 経過秒数から今どの区間（左・切り替え・右・セット…）にいるか
function locate(t, elapsed) {
  let acc = 0
  for (let i = 0; i < t.phases.length; i++) {
    const p = t.phases[i]
    if (elapsed < acc + p.sec) return { i, p, inPhase: elapsed - acc }
    acc += p.sec
  }
  const last = t.phases.length - 1
  return { i: last, p: t.phases[last], inPhase: t.phases[last].sec }
}

// お手本アニメの1周の秒数。回数指定なら1回の秒数（左右交互は2回で1周）
function cycleOf(t, p) {
  if (p.reps) return (p.sec / p.reps) * (t.side === 'alt' ? 2 : 1)
  return MOTIONS[t.id]?.cycle ?? 3
}

const formatSec = (sec) => `${Math.max(0, Math.ceil(sec))}秒`

// お手本の大きさ（画面の高さに合わせる）
function useStageH() {
  const get = () => {
    const el = document.querySelector('.app-stage')
    return el ? el.clientHeight : window.innerHeight
  }
  const [h, setH] = useState(get)
  useEffect(() => {
    const on = () => setH(get())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return h
}

// 2枚の絵を交互に出す（パラパラ）
function Flip({ a, b, style, alt = '先輩' }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), FLIP_MS)
    return () => clearInterval(id)
  }, [])
  return <img src={on ? b : a} alt={alt} style={style} draggable={false} />
}

export default function Training() {
  const player = useGameStore((s) => s.player)
  const addCore = useGameStore((s) => s.addCore)
  const addLegs = useGameStore((s) => s.addLegs)
  const addArms = useGameStore((s) => s.addArms)
  const addPoints = useGameStore((s) => s.addPoints)
  const recordMission = useGameStore((s) => s.recordMission)
  const tutorialEvent = useGameStore((s) => s.tutorialEvent)
  const tutorialActive = useGameStore((s) => s.tutorial !== null)
  const introSeen = useGameStore((s) => !!s.tutorialSeen.trainingIntro)
  const markSeen = useGameStore((s) => s.markSeen)
  // チュートリアルでプランクを選ぶ場面では、プランクのある「体幹」を開いておく
  const tutorialPick = useGameStore((s) => (
    s.tutorial?.id === 'start' && TUTORIALS.start.steps[s.tutorial.step]?.id === 'pickTraining'
  ))
  const stageH = useStageH()

  const [screen, setScreen] = useState('list') // list / ready / doing / done / failed
  const [menu, setMenu] = useState('core')
  const [selected, setSelected] = useState(null)
  const [startAt, setStartAt] = useState(0)
  const [now, setNow] = useState(0)
  const [introIdx, setIntroIdx] = useState(0)
  const [listPose] = useState(() => (Math.random() < 0.5 ? senpaiFull.pointing : senpaiFull.cheering))

  const shownMenu = tutorialPick ? 'core' : menu
  const elapsed = (now - startAt) / 1000
  const cur = selected && screen === 'doing' ? locate(selected, elapsed) : null
  const reps = cur?.p.reps ? Math.min(cur.p.reps, Math.floor(cur.inPhase / (cur.p.sec / cur.p.reps))) : 0
  const total = Math.floor((player.core + player.legs + player.arms) / 3)
  const level = Math.floor(total / 50) + 1

  useEffect(() => {
    if (screen !== 'doing') return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if ((t - startAt) / 1000 >= selected.total) {
        clearInterval(id)
        sfx.clear()
        setScreen('done')
      }
    }, 100)
    return () => clearInterval(id)
  }, [screen, startAt, selected])

  // 1回ごとに小さく鳴らす。区間が変わったら合図
  useEffect(() => {
    if (screen === 'doing' && reps > 0) sfx.tick()
  }, [screen, reps])
  const phaseIdx = cur?.i ?? 0
  useEffect(() => {
    if (screen === 'doing' && phaseIdx > 0) sfx.go()
  }, [screen, phaseIdx])

  const open = (t) => { sfx.tap(); setSelected(t); setScreen('ready') }

  const begin = () => {
    sfx.go()
    const t = Date.now()
    setStartAt(t)
    setNow(t)
    setScreen('doing')
  }

  const complete = () => {
    const gains = gainsOf(selected)
    for (const g of gains) {
      if (g.stat === 'core') addCore(g.value)
      else if (g.stat === 'legs') addLegs(g.value)
      else addArms(g.value)
    }
    addPoints(gains.reduce((s, g) => s + g.value, 0) * 10)
    recordMission('train')
    tutorialEvent('trained')
    sfx.coin()
    setScreen('list')
    setSelected(null)
  }

  const backToList = () => { sfx.cancel(); setScreen('list'); setSelected(null) }

  /* ───────── 初回：先輩のあいさつ（チュートリアル中は案内が同じことを言うので出さない） ───────── */
  if (!introSeen && !tutorialActive) {
    const next = () => {
      sfx.tap()
      if (introIdx < INTRO.length - 1) setIntroIdx(introIdx + 1)
      else markSeen('trainingIntro')
    }
    return (
      <div style={st.root} onClick={next}>
        <div style={st.bg} />
        <img src={senpaiFull.pointing} alt="先輩" style={st.introChara} draggable={false} />
        <div style={st.introBox}>
          <p style={st.introText}>{INTRO[introIdx]}</p>
          <span style={st.more}>▼</span>
        </div>
      </div>
    )
  }

  /* ───────── 一覧 ───────── */
  if (screen === 'list') {
    const items = TRAININGS.filter((t) => t.stats.includes(shownMenu))
    return (
      <div style={st.root}>
        <div style={st.bg} />
        <div style={st.topBar}>
          <div style={st.topLeft}>
            <PointPlank points={player.points} />
            <Plank tut="train-stats">
              <span style={st.lvChip}>体力Lv.{level}</span>
              {MENUS.map((m) => (
                <span key={m.stat} style={{ ...st.statText, background: STAT[m.stat].color }}>
                  {STAT[m.stat].label} {player[m.stat]}
                </span>
              ))}
            </Plank>
          </div>
          <HomeButton />
        </div>

        <img src={listPose} alt="先輩" style={st.listChara} draggable={false} />

        <div style={st.listPanel}>
          <div style={st.tabs}>
            {MENUS.map((m) => {
              const on = m.stat === shownMenu
              return (
                <button key={m.stat}
                  style={{ ...st.tab, ...(on ? { background: STAT[m.stat].color, color: '#fff', border: `2px solid ${STAT[m.stat].color}` } : null) }}
                  onClick={() => { sfx.tap(); setMenu(m.stat) }}>
                  <GameIcon name={m.icon} size={22} /> {m.label}
                </button>
              )
            })}
          </div>
          <div style={st.grid}>
            {items.map((t) => (
              <button key={t.id} style={st.card} data-tut={`train-${t.id}`} onClick={() => open(t)}>
                <div style={st.cardTop}>
                  <span style={st.cardName}>{t.name}</span>
                  {t.group === 'ストレッチ' && <span style={st.stretchTag}>ストレッチ</span>}
                </div>
                {t.note && <span style={st.cardNote}>{t.note}</span>}
                <span style={st.cardSpec}>
                  {t.side && <span style={st.sideTag}>{SIDE_LABEL[t.side]}</span>}
                  {t.spec}
                </span>
                <span style={st.badges}>
                  {gainsOf(t).map((g) => (
                    <span key={g.stat} style={{ ...st.statBadge, background: STAT[g.stat].color }}>
                      {STAT[g.stat].label} +{g.value}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const t = selected
  const color = STAT[t.stats[0]].color
  const firstWork = t.phases.find((p) => !p.rest)
  const motionSize = Math.round(stageH * 0.56)

  /* ───────── 準備（お手本） ───────── */
  if (screen === 'ready') {
    return (
      <div style={st.root}>
        <div style={st.bg} />
        <div style={st.readyLeft}>
          <div style={st.trainTitle}>{t.name}</div>
          {hasMotion(t.id) ? (
            <MotionPlayer id={t.id} cycle={Math.max(cycleOf(t, firstWork) * 1.5, DEMO_MIN_SEC)} color={color} size={motionSize}>
              <span style={st.demoTag}>お手本（ゆっくり）</span>
            </MotionPlayer>
          ) : <NoMotion icon={MENUS.find((m) => m.stat === t.stats[0]).icon} color={color} size={motionSize} />}
        </div>
        <div style={st.readyRight}>
          <div style={st.specBox}>
            <div style={st.specMain}>
              {t.side && <span style={st.sideTag}>{SIDE_LABEL[t.side]}</span>}
              {t.spec}
            </div>
            {flowText(t) && <div style={st.specSub}>{flowText(t)}</div>}
            {t.note && <div style={st.specSub}>{t.note}</div>}
          </div>
          <div style={st.readyScroll}>
            {hasMotion(t.id) && <MotionStrip id={t.id} color={color} />}
            {HOWTO[t.id] && (
              <div style={st.howto}>
                <div style={st.howtoHead}>やり方</div>
                <ol style={st.howtoList}>
                  {HOWTO[t.id].map((line) => <li key={line}>{line}</li>)}
                </ol>
              </div>
            )}
            {t.tips.length > 0 && (
              <div style={{ ...st.tipBox, borderColor: color }}>
                <img src={senpaiMini.glassesSmile} alt="先輩" style={{ height: 52, flexShrink: 0 }} draggable={false} />
                <ul style={st.tipList}>
                  {t.tips.map((tip) => <li key={tip}>{tip}</li>)}
                </ul>
              </div>
            )}
          </div>
          <div style={st.btnRow}>
            <button style={st.subBtn} onClick={backToList}>もどる</button>
            <button style={st.mainBtn} onClick={begin}>スタート！</button>
          </div>
        </div>
      </div>
    )
  }

  /* ───────── 実施中 ───────── */
  if (screen === 'doing' && cur) {
    const { p, inPhase, i } = cur
    const next = t.phases[i + 1]
    const works = t.phases.filter((x) => !x.rest)
    const tip = t.tips.length ? t.tips[Math.floor(elapsed / TIP_SEC) % t.tips.length] : ''
    return (
      <div style={st.root}>
        <div style={st.bg} />
        <div style={st.progressBg}>
          <div style={{ ...st.progressFill, width: `${Math.min(100, (elapsed / t.total) * 100)}%`, background: color }} />
        </div>
        <div style={st.doingLeft}>
          {p.rest ? (
            <div style={{ ...st.restCard, width: motionSize, height: motionSize, borderColor: `${color}66` }}>
              <div style={st.restLabel}>{p.label === '切り替え' ? '反対側に切り替え' : '休憩'}</div>
              <div style={st.restCount}>{Math.ceil(p.sec - inPhase)}</div>
              {next && <div style={st.restNext}>次は {next.label}{next.reps ? ` ${next.reps}回` : ` ${formatSec(next.sec)}`}</div>}
            </div>
          ) : hasMotion(t.id) ? (
            <MotionPlayer id={t.id} cycle={cycleOf(t, p)} time={inPhase} mirror={p.label === '右'} color={color} size={motionSize} />
          ) : (
            <NoMotion icon={MENUS.find((m) => m.stat === t.stats[0]).icon} color={color} size={motionSize} />
          )}
        </div>
        <div style={st.doingRight}>
          <div style={st.trainTitle}>{t.name}</div>
          {works.length > 1 && (
            <div style={st.phaseRow}>
              {t.phases.map((x, k) => !x.rest && (
                <span key={k} style={{
                  ...st.phaseChip,
                  background: k === i ? color : k < i ? `${color}55` : '#fff',
                  color: k === i ? '#fff' : 'var(--brown-text)',
                }}>{x.label}</span>
              ))}
            </div>
          )}
          <div style={st.counterRow}>
            {p.reps && !p.rest ? (
              <div style={st.counter}>
                <span style={{ ...st.counterNum, color }}>{reps}</span>
                <span style={st.counterUnit}>/ {p.reps}回</span>
              </div>
            ) : null}
            <TimerRing pct={(inPhase / p.sec) * 100} left={p.sec - inPhase} color={color} />
          </div>
          {tip && (
            <div style={st.liveTip}>
              <Flip a={senpaiMini.megaphone} b={senpaiMini.megaphoneShout} style={{ height: 'clamp(48px, 16cqh, 96px)', flexShrink: 0 }} />
              <span>{tip}</span>
            </div>
          )}
          <button style={st.subBtn} onClick={() => { sfx.cancel(); setScreen('failed') }}>やめる</button>
        </div>
      </div>
    )
  }

  /* ───────── 完了 ───────── */
  if (screen === 'done') {
    const gains = gainsOf(t)
    const pts = gains.reduce((s, g) => s + g.value, 0) * 10
    return (
      <div style={st.root}>
        <div style={st.bg} />
        <Confetti count={36} />
        <Flip a={senpaiMini.armsCrossed} b={senpaiMini.armsCrossedSmile} style={st.resultChara} />
        <div style={st.resultCard}>
          <div style={st.resultTitle}>完了！ よくがんばったね！</div>
          <div style={st.resultGains}>
            {gains.map((g) => (
              <span key={g.stat} style={{ ...st.gainChip, background: STAT[g.stat].color }}>{STAT[g.stat].label} +{g.value}</span>
            ))}
            <span style={st.gainPt}><GameIcon name="pcoin" size={24} /> +{pts}pt</span>
          </div>
          <button style={st.mainBtn} onClick={complete}>OK</button>
        </div>
      </div>
    )
  }

  /* ───────── 中断 ───────── */
  return (
    <div style={st.root}>
      <div style={st.bg} />
      <Flip a={senpaiMini.winkCheer} b={senpaiMini.surprised} style={st.resultChara} />
      <div style={st.resultCard}>
        <div style={st.resultTitle}>途中でやめちゃった…</div>
        <p style={st.resultText}>次は最後までがんばってみよう！</p>
        <PlankButton label="メニューにもどる" onClick={backToList} />
      </div>
    </div>
  )
}

// お手本アニメの画像がまだない種目
function NoMotion({ icon, color, size }) {
  return (
    <div style={{
      ...st.noMotion, width: size, height: size,
      background: `radial-gradient(circle at 50% 50%, ${color}30 0%, rgba(255,255,255,0.5) 70%)`,
      borderColor: `${color}55`,
    }}>
      <GameIcon name={icon} size={Math.round(size * 0.36)} />
      <span style={st.noMotionText}>お手本アニメは準備中</span>
    </div>
  )
}

// 区間の残り時間の円グラフ
function TimerRing({ pct, left, color }) {
  const sz = 96
  const r = 40
  return (
    <div style={{ position: 'relative', width: sz, height: sz }}>
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="#fff" stroke="var(--beige-edge)" strokeWidth={7} />
        <circle
          cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${2 * Math.PI * r}`}
          strokeDashoffset={`${2 * Math.PI * r * (1 - Math.min(100, pct) / 100)}`}
        />
      </svg>
      <span style={st.ringLabel}>{formatSec(left)}</span>
    </div>
  )
}

const panel = {
  background: 'rgba(250,244,232,0.95)',
  border: '3px solid var(--beige-edge)',
  borderRadius: 20,
  boxShadow: '0 8px 28px rgba(40,25,10,0.3)',
  color: 'var(--brown-text)',
}
const btnBase = {
  border: 'none', borderRadius: 99, cursor: 'pointer', fontWeight: 800,
  padding: 'clamp(6px, 2cqh, 12px) clamp(16px, 3cqw, 30px)', fontSize: FS(3.8, 14, 20),
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, whiteSpace: 'nowrap',
}

const st = {
  root: { position: 'relative', width: '100%', height: '100cqh', overflow: 'hidden', userSelect: 'none' },
  bg: {
    position: 'absolute', inset: 0,
    backgroundImage: `linear-gradient(rgba(239,228,207,0.35), rgba(239,228,207,0.35)), url(${BG.training})`,
    backgroundSize: 'cover', backgroundPosition: 'center',
  },

  /* はじめのあいさつ */
  introChara: { position: 'absolute', left: '6cqw', bottom: 0, height: '90cqh', objectFit: 'contain', animation: 'popIn 0.5s ease' },
  introBox: { ...ui.bubble, position: 'absolute', left: '36cqw', right: '6cqw', bottom: '8cqh', padding: '4cqh 3cqw', cursor: 'pointer' },
  introText: { fontSize: FS(4.6, 16, 26), lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--brown-text)', fontWeight: 800 },
  more: { position: 'absolute', right: 18, bottom: 10, color: '#e0a000', animation: 'blink 1.2s infinite' },

  /* 一覧 */
  topBar: {
    position: 'absolute', top: '2cqh', left: '1.5cqw', right: '1.5cqw', zIndex: 20,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
  },
  topLeft: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  lvChip: {
    background: 'linear-gradient(135deg, #f8c537, #e0a000)', color: '#4a2e00', fontWeight: 800,
    fontSize: FS(3.4, 12, 18), borderRadius: 99, padding: '1px 10px', whiteSpace: 'nowrap',
  },
  statText: { fontSize: FS(3.2, 11, 17), marginLeft: 4, color: '#fff', fontWeight: 800, borderRadius: 99, padding: '1px 9px', whiteSpace: 'nowrap' },
  listChara: {
    position: 'absolute', left: '1cqw', bottom: 0, height: '78cqh', maxWidth: '24cqw',
    objectFit: 'contain', objectPosition: 'bottom', pointerEvents: 'none',
  },
  listPanel: {
    ...panel, position: 'absolute', left: '25cqw', right: '2cqw', top: '15cqh', bottom: '3cqh',
    display: 'flex', flexDirection: 'column', padding: '1.6cqh 1.4cqw', gap: '1.4cqh',
  },
  tabs: { display: 'flex', gap: 8 },
  tab: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    background: '#fff', color: 'var(--brown-text)', border: '2px solid var(--beige-edge)',
    borderRadius: 14, padding: 'clamp(4px, 1.6cqh, 10px) 6px', fontSize: FS(3.6, 13, 19), fontWeight: 800,
    cursor: 'pointer', boxShadow: '0 3px 0 var(--beige-edge)',
  },
  grid: {
    flex: 1, overflowY: 'auto', display: 'grid', gap: '1.2cqh 0.9cqw', alignContent: 'start',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(190px, 28cqw), 1fr))', paddingBottom: 6,
  },
  card: {
    background: 'linear-gradient(180deg, #fffaf0, #f1e6d0)', border: '2px solid var(--beige-edge)',
    borderRadius: 14, boxShadow: '0 4px 0 #cdb68e', padding: '1.2cqh 0.8cqw', cursor: 'pointer',
    textAlign: 'left', color: 'var(--brown-text)', display: 'flex', flexDirection: 'column', gap: 3,
  },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  cardName: { fontSize: FS(3.4, 12, 17), fontWeight: 800, lineHeight: 1.3 },
  cardNote: { fontSize: 11, color: '#8a6a45' },
  cardSpec: { fontSize: FS(3, 11, 15), display: 'flex', alignItems: 'center', gap: 5, fontWeight: 800 },
  stretchTag: { fontSize: 10, background: '#9fd3a8', color: '#1a5a2a', borderRadius: 8, padding: '1px 6px', flexShrink: 0 },
  sideTag: { background: '#efe4cf', fontSize: 10, fontWeight: 800, borderRadius: 6, padding: '1px 6px' },
  badges: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  statBadge: { color: '#fff', fontSize: 10.5, padding: '1px 8px', borderRadius: 10, fontWeight: 800 },

  /* 準備 */
  readyLeft: {
    position: 'absolute', left: '3cqw', top: '4cqh', bottom: '4cqh', width: '44cqw',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2cqh',
  },
  readyRight: {
    ...panel, position: 'absolute', left: '50cqw', right: '2.5cqw', top: '4cqh', bottom: '4cqh',
    display: 'flex', flexDirection: 'column', gap: '1.4cqh', padding: '2cqh 1.6cqw',
  },
  readyScroll: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.4cqh' },
  trainTitle: {
    ...panel, borderRadius: 99, padding: '4px 22px', fontSize: FS(5, 17, 28), fontWeight: 800, textAlign: 'center',
  },
  demoTag: {
    position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.9)', border: '1px solid var(--beige-edge)',
    borderRadius: 10, padding: '2px 9px', color: 'var(--brown-text)', fontSize: 11, fontWeight: 800,
  },
  specBox: { background: '#fff', borderRadius: 12, padding: '1.2cqh 1cqw', border: '2px solid var(--beige-edge)' },
  specMain: { fontSize: FS(4.4, 15, 24), fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 },
  specSub: { fontSize: FS(3, 11, 15), color: '#8a6a45', marginTop: 4 },
  howto: { background: '#fff', borderRadius: 12, padding: '1.2cqh 1cqw' },
  howtoHead: { color: '#e0a000', fontSize: 13, fontWeight: 800, marginBottom: 4 },
  howtoList: { margin: 0, paddingLeft: 20, fontSize: FS(3.1, 12, 16), lineHeight: 1.65, fontWeight: 700 },
  tipBox: {
    display: 'flex', gap: 8, alignItems: 'flex-start',
    background: '#fffdf7', border: '2px solid', borderRadius: 12, padding: '1cqh 1cqw',
  },
  tipList: { margin: 0, paddingLeft: 18, fontSize: FS(3, 12, 15), lineHeight: 1.65, fontWeight: 700 },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  mainBtn: { ...btnBase, background: 'linear-gradient(180deg, #f8c537, #e0a000)', color: '#4a2e00', boxShadow: '0 3px 0 #b07800' },
  subBtn: { ...btnBase, background: '#fff', color: 'var(--brown-text)', border: '2px solid var(--beige-edge)', boxShadow: '0 3px 0 var(--beige-edge)' },

  /* 実施中 */
  progressBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'rgba(255,255,255,0.5)' },
  progressFill: { height: '100%', transition: 'width 0.2s linear' },
  doingLeft: {
    position: 'absolute', left: '3cqw', top: '4cqh', bottom: '4cqh', width: '50cqw',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  doingRight: {
    position: 'absolute', left: '55cqw', right: '3cqw', top: '6cqh', bottom: '6cqh',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2.4cqh',
  },
  phaseRow: { display: 'flex', gap: 6 },
  phaseChip: { fontSize: 13, fontWeight: 800, borderRadius: 10, padding: '3px 14px', border: '2px solid var(--beige-edge)' },
  counterRow: { display: 'flex', alignItems: 'center', gap: '3cqw' },
  counter: { ...panel, display: 'flex', alignItems: 'baseline', gap: 4, padding: '1cqh 2cqw', borderRadius: 16 },
  counterNum: { fontSize: FS(12, 36, 72), fontWeight: 800, lineHeight: 1 },
  counterUnit: { fontSize: FS(3.6, 13, 20), fontWeight: 800 },
  ringLabel: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--brown-text)', fontSize: 18, fontWeight: 800,
  },
  restCard: {
    ...panel, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  restLabel: { fontSize: FS(5, 16, 26), fontWeight: 800 },
  restCount: { color: '#e0a000', fontSize: FS(18, 48, 110), fontWeight: 800, lineHeight: 1 },
  restNext: { fontSize: FS(3.4, 12, 18), fontWeight: 800, color: '#8a6a45' },
  liveTip: {
    ...ui.bubble, display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    padding: '1.4cqh 1.2cqw', fontSize: FS(3.6, 13, 19), fontWeight: 800, lineHeight: 1.5, color: 'var(--brown-text)',
  },
  noMotion: {
    position: 'relative', borderRadius: 24, border: '1.5px solid',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  noMotionText: { color: '#8a6a45', fontSize: 12, fontWeight: 800 },

  /* 結果 */
  resultChara: { position: 'absolute', left: '8cqw', bottom: '6cqh', height: '70cqh', objectFit: 'contain' },
  resultCard: {
    ...panel, position: 'absolute', left: '42cqw', right: '6cqw', top: '50%', transform: 'translateY(-50%)',
    padding: '4cqh 3cqw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3cqh',
  },
  resultTitle: { fontSize: FS(6, 20, 34), fontWeight: 800 },
  resultText: { fontSize: FS(3.8, 14, 20), fontWeight: 800 },
  resultGains: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  gainChip: { color: '#fff', fontSize: FS(4, 14, 22), fontWeight: 800, borderRadius: 99, padding: '4px 16px' },
  gainPt: { display: 'inline-flex', alignItems: 'center', gap: 4, color: '#b07800', fontSize: FS(4.4, 15, 24), fontWeight: 800 },
}
