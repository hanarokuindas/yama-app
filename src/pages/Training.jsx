import { useState, useEffect } from 'react'
import GameIcon from '../components/GameIcon'
import { useGameStore } from '../stores/gameStore'
import { Confetti } from '../components/Celebration'
import { sfx } from '../utils/sound'
import { senpaiPose, senpaiMini } from '../assets/characters/senpai'
import { BG } from '../assets/backgrounds'
import MotionPlayer, { MotionStrip } from '../components/MotionPlayer'
import { HOWTO } from '../data/howto'
import { MOTIONS, hasMotion } from '../data/motions'
import { TUTORIALS } from '../data/tutorial'
import TRAININGS from '../data/trainings.json'

/* 種目は「手本動画」表から作った src/data/trainings.json（tools/import_trainings.py）。
   回数／時間・左右の切り替え・セット・先輩コメントは表のとおりに進める。 */

const GROUPS = [
  { id: '脚力', icon: 'leg' },
  { id: 'ヒップ', icon: 'lift' },
  { id: '腕・胸筋', icon: 'muscle' },
  { id: '腹筋', icon: 'fire' },
  { id: '背筋', icon: 'breath' },
  { id: '体幹', icon: 'yoga' },
  { id: 'ストレッチ', icon: 'stretch' },
]
const GROUP_ICON = Object.fromEntries(GROUPS.map((g) => [g.id, g.icon]))

const STAT = {
  legs: { label: '脚力', color: '#27ae60' },
  arms: { label: '腕力', color: '#2980b9' },
  core: { label: '体幹', color: '#e67e22' },
}
const SIDE_LABEL = { lr: '左右', alt: '左右交互' }
const DEMO_MIN_SEC = 4 // 準備画面のお手本は1回を最低4秒かけて見せる
const TIP_SEC = 10     // 実施中の先輩コメントの切り替え間隔

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

// 時間はすべて「X分YY秒」で表示する（例：1分30秒、0分45秒）
function formatSec(sec) {
  const s = Math.max(0, Math.ceil(sec))
  return `${Math.floor(s / 60)}分${String(s % 60).padStart(2, '0')}秒`
}

export default function Training() {
  const player = useGameStore((s) => s.player)
  const addCore = useGameStore((s) => s.addCore)
  const addLegs = useGameStore((s) => s.addLegs)
  const addArms = useGameStore((s) => s.addArms)
  const addPoints = useGameStore((s) => s.addPoints)
  const recordMission = useGameStore((s) => s.recordMission)
  const tutorialEvent = useGameStore((s) => s.tutorialEvent)
  // チュートリアルでプランクを選ぶ場面では、プランクのある「体幹」を開いておく
  const tutorialPick = useGameStore((s) => (
    s.tutorial?.id === 'start' && TUTORIALS.start.steps[s.tutorial.step]?.id === 'pickTraining'
  ))

  const [screen, setScreen] = useState('list') // list / ready / doing / done / failed
  const [group, setGroup] = useState('脚力')
  const [selected, setSelected] = useState(null)
  const [startAt, setStartAt] = useState(0)
  const [now, setNow] = useState(0)

  const shownGroup = tutorialPick ? '体幹' : group
  const elapsed = (now - startAt) / 1000
  const cur = selected && screen === 'doing' ? locate(selected, elapsed) : null
  const reps = cur?.p.reps ? Math.min(cur.p.reps, Math.floor(cur.inPhase / (cur.p.sec / cur.p.reps))) : 0

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

  /* ───────── 一覧 ───────── */
  if (screen === 'list') {
    const items = TRAININGS.filter((t) => t.group === shownGroup)
    return (
      <div style={styles.container}>
        <div style={styles.title}>TRAINING</div>
        <div style={styles.statsRow} data-tut="train-stats">
          <StatChip label="体幹" value={player.core} color={STAT.core.color} />
          <StatChip label="脚力" value={player.legs} color={STAT.legs.color} />
          <StatChip label="腕力" value={player.arms} color={STAT.arms.color} />
        </div>

        <div style={styles.tabs}>
          {GROUPS.map((g) => {
            const on = g.id === shownGroup
            return (
              <button key={g.id}
                style={{
                  ...styles.tab,
                  background: on ? 'linear-gradient(135deg,#f5c842,#e0a800)' : 'rgba(255,255,255,0.07)',
                  color: on ? '#1a0e00' : '#aab',
                  borderColor: on ? 'transparent' : 'rgba(255,255,255,0.14)',
                }}
                onClick={() => { sfx.tap(); setGroup(g.id) }}>
                <GameIcon name={g.icon} size={16} /> {g.id}
              </button>
            )
          })}
        </div>

        <div style={styles.menuList}>
          {items.map((t) => (
            <button key={t.id} style={styles.menuCard} data-tut={`train-${t.id}`} onClick={() => open(t)}>
              <GameIcon name={GROUP_ICON[t.group]} size={30} />
              <div style={styles.menuInfo}>
                <span style={styles.menuName}>
                  {t.name}
                  {hasMotion(t.id) && <span style={styles.animTag}>お手本</span>}
                </span>
                {t.note && <span style={styles.menuNote}>{t.note}</span>}
                <span style={styles.menuSpec}>
                  {t.side && <span style={styles.sideTag}>{SIDE_LABEL[t.side]}</span>}
                  {t.spec}
                </span>
              </div>
              <div style={styles.menuMeta}>
                {gainsOf(t).map((g) => (
                  <span key={g.stat} style={{ ...styles.statBadge, background: STAT[g.stat].color }}>
                    {STAT[g.stat].label} +{g.value}
                  </span>
                ))}
                <span style={styles.duration}>{formatSec(t.total)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const t = selected
  const color = STAT[t.stats[0]].color
  const firstWork = t.phases.find((p) => !p.rest)

  /* ───────── 準備（お手本） ───────── */
  if (screen === 'ready') {
    return (
      <div style={styles.container}>
        <div style={styles.trainingCard}>
          <h3 style={styles.trainTitle}>{t.name}</h3>
          {t.note && <p style={styles.trainNote}>{t.note}</p>}
          {hasMotion(t.id) ? (
            <>
              {/* 形が見えるよう、実際より遅く再生する */}
              <MotionPlayer id={t.id} cycle={Math.max(cycleOf(t, firstWork) * 1.5, DEMO_MIN_SEC)} color={color} size={210}>
                <span style={styles.demoTag}>お手本（ゆっくり）</span>
              </MotionPlayer>
              <MotionStrip id={t.id} color={color} />
            </>
          ) : <NoMotion icon={GROUP_ICON[t.group]} color={color} size={150} />}

          {HOWTO[t.id] && (
            <div style={styles.howto}>
              <div style={styles.howtoHead}>やり方</div>
              <ol style={styles.howtoList}>
                {HOWTO[t.id].map((line) => <li key={line} style={styles.howtoItem}>{line}</li>)}
              </ol>
            </div>
          )}

          <div style={styles.specBox}>
            <div style={styles.specMain}>
              {t.side && <span style={styles.sideTag}>{SIDE_LABEL[t.side]}</span>}
              {t.spec}
            </div>
            {flowText(t) && <div style={styles.specSub}>{flowText(t)}</div>}
          </div>

          {t.tips.length > 0 && (
            <div style={{ ...styles.tipBox, borderColor: color }}>
              <div style={styles.tipHead}>
                <img src={senpaiPose.training[0]} alt="先輩" style={{ height: 48 }} draggable={false} />
                <span style={{ color, fontWeight: 900, fontSize: 12 }}>先輩より</span>
              </div>
              <ul style={styles.tipList}>
                {t.tips.map((tip) => <li key={tip}>{tip}</li>)}
              </ul>
            </div>
          )}

          <button style={styles.startBtn} onClick={begin}>スタート！</button>
          <button style={styles.backBtn} onClick={() => { sfx.cancel(); setScreen('list') }}>戻る</button>
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
    const ring = <TimerRing pct={(inPhase / p.sec) * 100} left={p.sec - inPhase} color={color} />
    const counter = p.reps ? (
      <div style={{ ...styles.reps, borderColor: `${color}aa` }}>
        <span style={styles.repsNum}>{reps}</span>
        <span style={styles.repsUnit}>/ {p.reps}回</span>
      </div>
    ) : null

    return (
      <div style={styles.container}>
        <div style={styles.trainingCard}>
          <div style={styles.progressBg}>
            <div style={{ ...styles.progressFill, width: `${Math.min(100, (elapsed / t.total) * 100)}%`, background: color }} />
          </div>
          <h3 style={styles.trainTitle}>{t.name}</h3>
          {works.length > 1 && (
            <div style={styles.phaseRow}>
              {t.phases.map((x, k) => !x.rest && (
                <span key={k} style={{
                  ...styles.phaseChip,
                  background: k === i ? color : k < i ? `${color}55` : 'rgba(255,255,255,0.08)',
                  color: k === i ? '#fff' : '#aab',
                }}>{x.label}</span>
              ))}
            </div>
          )}

          {p.rest ? (
            <div style={{ ...styles.restCard, borderColor: `${color}66` }}>
              <div style={styles.restLabel}>{p.label === '切り替え' ? '反対側に切り替え' : '休憩'}</div>
              <div style={styles.restCount}>{Math.ceil(p.sec - inPhase)}</div>
              {next && <div style={styles.restNext}>次は {next.label}{next.reps ? ` ${next.reps}回` : ` ${formatSec(next.sec)}`}</div>}
            </div>
          ) : hasMotion(t.id) ? (
            <MotionPlayer id={t.id} cycle={cycleOf(t, p)} time={inPhase} mirror={p.label === '右'} color={color} size={248}>
              {counter}
              <div style={styles.ringSlot}>{ring}</div>
            </MotionPlayer>
          ) : (
            <NoMotion icon={GROUP_ICON[t.group]} color={color} size={200}>
              {counter}
              <div style={styles.ringSlot}>{ring}</div>
            </NoMotion>
          )}

          {tip && (
            <div style={styles.liveTip}>
              <img src={senpaiMini.winkCheer} alt="" style={{ height: 40, flexShrink: 0 }} draggable={false} />
              <span>{tip}</span>
            </div>
          )}
          <button style={styles.giveupBtn} onClick={() => { sfx.cancel(); setScreen('failed') }}>やめる</button>
        </div>
      </div>
    )
  }

  /* ───────── 完了 ───────── */
  if (screen === 'done') {
    const gains = gainsOf(t)
    const pts = gains.reduce((s, g) => s + g.value, 0) * 10
    return (
      <div style={styles.container}>
        <Confetti count={36} />
        <div style={styles.trainingCard}>
          <img src={senpaiPose.praise[0]} alt="先輩" style={{ height: 110, animation: 'popIn 0.5s ease' }} draggable={false} />
          <h3 style={styles.trainTitle}>完了！</h3>
          <p style={styles.trainDesc}>よくがんばった！</p>
          <div style={{ ...styles.rewardBox, animation: 'popIn 0.5s 0.15s both' }}>
            {gains.map((g) => (
              <p key={g.stat} style={{ color: STAT[g.stat].color, fontWeight: 900, margin: '2px 0' }}>
                {STAT[g.stat].label} +{g.value}
              </p>
            ))}
            <p style={{ color: '#f5c842', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center', margin: '6px 0 0' }}>
              <GameIcon name="star" size={18} /> +{pts}pt
            </p>
          </div>
          <button style={styles.startBtn} onClick={complete}>OK</button>
        </div>
      </div>
    )
  }

  /* ───────── 中断 ───────── */
  return (
    <div style={styles.container}>
      <div style={styles.trainingCard}>
        <img src={senpaiPose.think[2]} alt="先輩" style={{ height: 110 }} draggable={false} />
        <h3 style={styles.trainTitle}>途中でやめちゃった…</h3>
        <p style={styles.trainDesc}>次は最後まで頑張ってみよう！</p>
        <button style={styles.backBtn} onClick={() => { setScreen('list'); setSelected(null) }}>
          メニューに戻る
        </button>
      </div>
    </div>
  )
}

// お手本アニメの画像がまだない種目
function NoMotion({ icon, color, size, children }) {
  return (
    <div style={{
      ...styles.noMotion, width: size, height: size,
      background: `radial-gradient(circle at 50% 50%, ${color}30 0%, rgba(255,255,255,0.03) 70%)`,
      borderColor: `${color}55`,
    }}>
      <GameIcon name={icon} size={Math.round(size * 0.36)} />
      <span style={styles.noMotionText}>お手本アニメは準備中</span>
      {children}
    </div>
  )
}

// 区間の残り時間の円グラフ
function TimerRing({ pct, left, color }) {
  const sz = 64
  const r = 26
  return (
    <div style={{ position: 'relative', width: sz, height: sz }}>
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="rgba(8,10,24,0.72)" stroke="rgba(255,255,255,0.15)" strokeWidth={5} />
        <circle
          cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${2 * Math.PI * r}`}
          strokeDashoffset={`${2 * Math.PI * r * (1 - Math.min(100, pct) / 100)}`}
        />
      </svg>
      <span style={styles.ringLabel}>{formatSec(left)}</span>
    </div>
  )
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ color, fontWeight: 900, fontSize: 18 }}>{value}</div>
      <div style={{ color: '#aab', fontSize: 12 }}>{label}</div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundImage: `linear-gradient(rgba(8,10,24,0.72), rgba(8,10,24,0.82)), url(${BG.training})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    paddingBottom: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: { color: '#f5c842', fontSize: 12, fontWeight: 700, letterSpacing: 3, padding: '18px 0 10px' },
  statsRow: {
    display: 'flex', width: 'calc(100% - 32px)', maxWidth: 360,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, padding: '12px 0', marginBottom: 12,
  },
  tabs: {
    display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center',
    width: 'calc(100% - 24px)', maxWidth: 380, marginBottom: 12,
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: 4,
    border: '1px solid', borderRadius: 16, padding: '6px 11px',
    fontSize: 12, fontWeight: 900, cursor: 'pointer',
  },
  menuList: { width: 'calc(100% - 32px)', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 8 },
  menuCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
  },
  menuInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 },
  menuName: { color: '#fff', fontSize: 15, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  menuNote: { color: '#aab', fontSize: 11 },
  menuSpec: { color: '#ccd', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 },
  animTag: {
    background: 'rgba(245,200,66,0.16)', border: '1px solid rgba(245,200,66,0.5)',
    color: '#f5c842', fontSize: 9.5, fontWeight: 900, borderRadius: 8, padding: '1px 6px',
  },
  sideTag: {
    background: 'rgba(255,255,255,0.12)', color: '#dde', fontSize: 10, fontWeight: 900,
    borderRadius: 6, padding: '1px 6px',
  },
  menuMeta: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  statBadge: { color: '#fff', fontSize: 10.5, padding: '2px 8px', borderRadius: 10, fontWeight: 700 },
  duration: { color: '#aab', fontSize: 12 },

  trainingCard: {
    margin: '24px 16px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.2)',
    borderRadius: 24, padding: '24px 22px',
    width: 'calc(100% - 32px)', maxWidth: 360,
    textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    backdropFilter: 'blur(12px)', boxShadow: '0 0 40px rgba(123,92,240,0.15)',
  },
  trainTitle: { color: '#fff', fontSize: 22, fontWeight: 900, margin: 0 },
  trainNote: { color: '#aab', fontSize: 12, margin: '-6px 0 0' },
  trainDesc: { color: '#ccd', fontSize: 14, margin: 0 },
  demoTag: {
    position: 'absolute', top: 10, left: 10,
    background: 'rgba(8,10,24,0.72)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10, padding: '2px 9px',
    color: '#dde', fontSize: 10.5, fontWeight: 900, letterSpacing: 1,
  },
  specBox: {
    width: '100%', background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '10px 12px',
  },
  specMain: { color: '#fff', fontSize: 17, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  specSub: { color: '#aab', fontSize: 11.5, marginTop: 4 },
  tipBox: {
    background: 'rgba(0,0,0,0.3)', border: '1px solid', borderRadius: 12,
    padding: '8px 12px 10px', width: '100%', boxSizing: 'border-box', textAlign: 'left',
  },
  tipHead: { display: 'flex', alignItems: 'center', gap: 8 },
  tipList: { color: '#eef', fontSize: 12.5, lineHeight: 1.7, margin: '4px 0 0', paddingLeft: 18 },
  startBtn: {
    width: '100%', padding: '14px 0',
    background: 'linear-gradient(135deg, #2ecc71, #1a8a47)', color: '#fff',
    border: 'none', borderRadius: 30, fontSize: 16, fontWeight: 900, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(46,204,113,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
  },
  backBtn: {
    width: '100%', padding: '11px 0',
    background: 'rgba(255,255,255,0.08)', color: '#aab',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 30,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  giveupBtn: {
    width: '100%', padding: '11px 0',
    background: 'rgba(231,76,60,0.18)', color: '#e74c3c',
    border: '1px solid rgba(231,76,60,0.6)', borderRadius: 30,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },

  progressBg: { width: '100%', height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99, transition: 'width 0.2s linear' },
  phaseRow: { display: 'flex', gap: 6, justifyContent: 'center', marginTop: -4 },
  phaseChip: { fontSize: 11.5, fontWeight: 900, borderRadius: 10, padding: '3px 12px' },
  reps: {
    position: 'absolute', top: 10, left: 10,
    display: 'flex', alignItems: 'baseline', gap: 3,
    background: 'rgba(8,10,24,0.72)', border: '1.5px solid',
    borderRadius: 14, padding: '3px 10px',
  },
  repsNum: { color: '#fff', fontSize: 22, fontWeight: 900 },
  repsUnit: { color: '#aab', fontSize: 11, fontWeight: 700 },
  ringSlot: { position: 'absolute', top: 8, right: 8 },
  ringLabel: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 10.5, fontWeight: 900, letterSpacing: -0.3,
  },
  restCard: {
    width: 248, height: 248, borderRadius: 24, border: '1.5px solid',
    background: 'rgba(0,0,0,0.3)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  restLabel: { color: '#fff', fontSize: 18, fontWeight: 900 },
  restCount: { color: '#f5c842', fontSize: 64, fontWeight: 900, lineHeight: 1 },
  restNext: { color: '#aab', fontSize: 13, fontWeight: 700 },
  noMotion: {
    position: 'relative', borderRadius: 24, border: '1.5px solid',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  noMotionText: { color: '#8a90a8', fontSize: 11, fontWeight: 700 },
  liveTip: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '6px 10px',
    color: '#eef', fontSize: 13, fontWeight: 700, textAlign: 'left', lineHeight: 1.5,
  },
  howto: {
    width: '100%', background: 'rgba(0,0,0,0.25)', borderRadius: 12,
    padding: '10px 12px', textAlign: 'left', boxSizing: 'border-box',
  },
  howtoHead: { color: '#f5c842', fontSize: 12, fontWeight: 900, letterSpacing: 1, marginBottom: 4 },
  howtoList: { margin: 0, paddingLeft: 20, color: '#fff' },
  howtoItem: { fontSize: 13, lineHeight: 1.65, marginBottom: 3 },
  rewardBox: { background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 16, width: '100%', fontSize: 18 },
}
