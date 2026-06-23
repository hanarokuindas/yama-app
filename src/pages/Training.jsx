import { useState, useRef } from 'react'
import { useGameStore } from '../stores/gameStore'

const MENUS = [
  {
    id: 'plank',
    name: 'プランク',
    icon: '🧘',
    stat: 'core',
    statLabel: '体幹',
    color: '#e67e22',
    duration: 60,
    gain: 15,
    description: '体幹を鍛える！腕とつま先で体を一直線に。',
    tips: 'お腹に力を入れて、腰が落ちないように！',
  },
  {
    id: 'situp',
    name: '腹筋',
    icon: '🔥',
    stat: 'core',
    statLabel: '体幹',
    color: '#e67e22',
    duration: 90,
    gain: 20,
    description: '腹筋をしっかり動かそう！',
    tips: '首を引っ張らず、お腹で起き上がる感覚で！',
  },
  {
    id: 'squat',
    name: 'スクワット',
    icon: '🏋️',
    stat: 'legs',
    statLabel: '脚力',
    color: '#27ae60',
    duration: 90,
    gain: 20,
    description: '脚力UP！膝を曲げて腰を落とす。',
    tips: '膝がつま先より前に出ないように注意！',
  },
  {
    id: 'walk',
    name: 'ウォーキング',
    icon: '🚶',
    stat: 'legs',
    statLabel: '脚力',
    color: '#27ae60',
    duration: 300,
    gain: 50,
    description: '5分歩くだけでも脚力アップ！',
    tips: 'リズムよく歩こう。腕も振るといいよ！',
  },
  {
    id: 'lunge',
    name: 'ランジ',
    icon: '🦵',
    stat: 'legs',
    statLabel: '脚力',
    color: '#27ae60',
    duration: 120,
    gain: 30,
    description: '太ももとお尻に効く！片足ずつ前に踏み出す。',
    tips: '背筋を伸ばして、ゆっくり丁寧に！',
  },
  {
    id: 'pushup',
    name: '腕立て',
    icon: '💪',
    stat: 'arms',
    statLabel: '腕力',
    color: '#2980b9',
    duration: 60,
    gain: 15,
    description: '腕力＆上半身をまとめて鍛えよう！',
    tips: '肘を体につけながらゆっくり降ろして！',
  },
  {
    id: 'stretch_neck',
    name: '首ストレッチ',
    icon: '😤',
    stat: 'core',
    statLabel: '体幹',
    color: '#e67e22',
    duration: 60,
    gain: 8,
    description: '首・肩のコリをほぐそう。',
    tips: '無理に引っ張らず、気持ちいい範囲で！',
  },
  {
    id: 'stretch_leg',
    name: '腿裏ストレッチ',
    icon: '🧘',
    stat: 'legs',
    statLabel: '脚力',
    color: '#27ae60',
    duration: 120,
    gain: 12,
    description: 'ハムストリングをじっくり伸ばそう。',
    tips: 'ゆっくり息を吐きながら伸ばして！',
  },
]

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}秒`
}

export default function Training() {
  const player = useGameStore((s) => s.player)
  const addCore = useGameStore((s) => s.addCore)
  const addLegs = useGameStore((s) => s.addLegs)
  const addArms = useGameStore((s) => s.addArms)
  const addPoints = useGameStore((s) => s.addPoints)

  const [phase, setPhase] = useState('list') // list / ready / doing / done / failed
  const [selected, setSelected] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef(null)

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const startTraining = (menu) => {
    setSelected(menu)
    setTimeLeft(menu.duration)
    setPhase('ready')
  }

  const beginCountdown = () => {
    setPhase('doing')
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setPhase('done')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSkip = () => {
    clearTimer()
    setPhase('failed')
  }

  const handleComplete = () => {
    clearTimer()
    if (selected.stat === 'core') addCore(selected.gain)
    else if (selected.stat === 'legs') addLegs(selected.gain)
    else if (selected.stat === 'arms') addArms(selected.gain)
    addPoints(selected.gain * 10)
    setPhase('list')
    setSelected(null)
  }

  const pct = selected ? Math.round(((selected.duration - timeLeft) / selected.duration) * 100) : 0

  const statColor = { core: '#e67e22', legs: '#27ae60', arms: '#2980b9' }

  if (phase === 'list') {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>トレーニング</h2>
        <div style={styles.statsRow}>
          <StatChip label="体幹" value={player.core} color="#e67e22" />
          <StatChip label="脚力" value={player.legs} color="#27ae60" />
          <StatChip label="腕力" value={player.arms} color="#2980b9" />
        </div>
        <div style={styles.menuList}>
          {MENUS.map((menu) => (
            <button key={menu.id} style={styles.menuCard} onClick={() => startTraining(menu)}>
              <span style={styles.menuIcon}>{menu.icon}</span>
              <div style={styles.menuInfo}>
                <span style={styles.menuName}>{menu.name}</span>
                <span style={{ fontSize: 12, color: '#ccc' }}>{menu.description}</span>
              </div>
              <div style={styles.menuMeta}>
                <span style={{ ...styles.statBadge, background: statColor[menu.stat] }}>
                  {menu.statLabel} +{menu.gain}
                </span>
                <span style={styles.duration}>{formatTime(menu.duration)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'ready') {
    return (
      <div style={styles.container}>
        <div style={styles.trainingCard}>
          <span style={{ fontSize: 56 }}>{selected.icon}</span>
          <h3 style={styles.trainTitle}>{selected.name}</h3>
          <p style={styles.trainDesc}>{selected.description}</p>
          <div style={{ ...styles.tipBox, borderColor: statColor[selected.stat] }}>
            <span style={{ color: statColor[selected.stat], fontWeight: 'bold', fontSize: 12 }}>先輩より</span>
            <p style={{ color: '#fff', fontSize: 14, margin: '4px 0 0' }}>{selected.tips}</p>
          </div>
          <p style={styles.trainTime}>⏱ {formatTime(selected.duration)}</p>
          <button style={styles.startBtn} onClick={beginCountdown}>スタート！</button>
          <button style={styles.backBtn} onClick={() => setPhase('list')}>戻る</button>
        </div>
      </div>
    )
  }

  if (phase === 'doing') {
    return (
      <div style={styles.container}>
        <div style={styles.trainingCard}>
          <span style={{ fontSize: 56 }}>{selected.icon}</span>
          <h3 style={styles.trainTitle}>{selected.name}</h3>
          {/* タイマー円グラフ */}
          <div style={styles.timerRing}>
            <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={60} cy={60} r={50} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={10} />
              <circle
                cx={60} cy={60} r={50} fill="none"
                stroke={statColor[selected.stat]}
                strokeWidth={10}
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.9s linear' }}
              />
            </svg>
            <span style={styles.timerLabel}>{timeLeft}秒</span>
          </div>
          <p style={styles.tipInline}>{selected.tips}</p>
          <button style={styles.giveupBtn} onClick={handleSkip}>やめる</button>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div style={styles.container}>
        <div style={styles.trainingCard}>
          <span style={{ fontSize: 56 }}>🎉</span>
          <h3 style={styles.trainTitle}>完了！</h3>
          <p style={styles.trainDesc}>よくがんばった！</p>
          <div style={styles.rewardBox}>
            <p style={{ color: statColor[selected.stat], fontWeight: 'bold' }}>
              {selected.statLabel} +{selected.gain}
            </p>
            <p style={{ color: '#ffd700' }}>⭐ +{selected.gain * 10}pt</p>
          </div>
          <button style={styles.startBtn} onClick={handleComplete}>OK</button>
        </div>
      </div>
    )
  }

  if (phase === 'failed') {
    return (
      <div style={styles.container}>
        <div style={styles.trainingCard}>
          <span style={{ fontSize: 56 }}>😅</span>
          <h3 style={styles.trainTitle}>途中でやめちゃった…</h3>
          <p style={styles.trainDesc}>次は最後まで頑張ってみよう！</p>
          <button style={styles.backBtn} onClick={() => { setPhase('list'); setSelected(null) }}>
            メニューに戻る
          </button>
        </div>
      </div>
    )
  }

  return null
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ color, fontWeight: 'bold', fontSize: 18 }}>{value}</div>
      <div style={{ color: '#aaa', fontSize: 12 }}>{label}</div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #2c3e50 0%, #3a7d44 100%)',
    paddingBottom: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 22, padding: '16px 0 8px' },
  statsRow: {
    display: 'flex',
    width: 'calc(100% - 32px)',
    maxWidth: 360,
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: '12px 0',
    marginBottom: 16,
  },
  menuList: { width: 'calc(100% - 32px)', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 8 },
  menuCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: '12px 16px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  menuIcon: { fontSize: 28, flexShrink: 0 },
  menuInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  menuName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  menuMeta: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  statBadge: { color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 10, fontWeight: 'bold' },
  duration: { color: '#aaa', fontSize: 12 },
  trainingCard: {
    margin: '40px 16px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 32,
    width: 'calc(100% - 32px)',
    maxWidth: 340,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    backdropFilter: 'blur(8px)',
  },
  trainTitle: { color: '#fff', fontSize: 22, margin: 0 },
  trainDesc: { color: '#ddd', fontSize: 14, margin: 0 },
  tipBox: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid',
    borderRadius: 8,
    padding: 10,
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  tipInline: { color: '#ddd', fontSize: 13, fontStyle: 'italic' },
  trainTime: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  startBtn: {
    width: '100%',
    padding: '12px 0',
    background: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: 24,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  backBtn: {
    width: '100%',
    padding: '10px 0',
    background: 'rgba(255,255,255,0.1)',
    color: '#aaa',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 24,
    fontSize: 14,
    cursor: 'pointer',
  },
  giveupBtn: {
    width: '100%',
    padding: '10px 0',
    background: 'rgba(231,76,60,0.3)',
    color: '#e74c3c',
    border: '1px solid #e74c3c',
    borderRadius: 24,
    fontSize: 14,
    cursor: 'pointer',
  },
  timerRing: { position: 'relative', width: 120, height: 120 },
  timerLabel: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  rewardBox: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    fontSize: 18,
  },
}
