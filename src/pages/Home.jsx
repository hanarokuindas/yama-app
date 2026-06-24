import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import characters from '../data/characters.json'

function getTimeSlot() {
  const h = new Date().getHours()
  if (h >= 3 && h < 9) return 'am3_9'
  if (h >= 9 && h < 17) return 'am9_pm4'
  if (h >= 17 && h < 22) return 'pm5_pm10'
  return 'pm10_am3'
}

function getRandomGreeting(charId) {
  const char = characters[charId]
  if (!char) return ''
  const slot = getTimeSlot()
  const lines = char.greetings[slot] || []
  return lines[Math.floor(Math.random() * lines.length)] || ''
}

function IntroScreen({ onComplete }) {
  const [step, setStep] = useState(0)
  const lines = [
    { icon: '🌄', text: 'ようこそ、山の世界へ！' },
    { icon: '⛰️', text: '山を登り、鍛え、整備して\n大自然と向き合おう。' },
    { icon: '✨', text: 'まずは自己紹介してね！' },
  ]
  const current = lines[step]

  return (
    <div style={s.overlay}>
      <div style={s.introWrap}>
        <div style={s.introIcon}>{current.icon}</div>
        <p style={s.introText}>{current.text}</p>
        <button
          className="btn-primary"
          style={{ marginTop: 28 }}
          onClick={() => step < lines.length - 1 ? setStep(step + 1) : onComplete()}
        >
          {step < lines.length - 1 ? '次へ ›' : 'はじめる！'}
        </button>
        <div style={s.dots}>
          {lines.map((_, i) => (
            <div key={i} style={{ ...s.dot, background: i === step ? '#f5c842' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProfileScreen({ onComplete }) {
  const setPlayerName = useGameStore((state) => state.setPlayerName)
  const setPlayerWeight = useGameStore((state) => state.setPlayerWeight)
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')

  const handleSubmit = () => {
    if (!name.trim()) return alert('名前を入力してください')
    const w = parseFloat(weight)
    if (isNaN(w) || w <= 0) return alert('体重を入力してください')
    setPlayerName(name.trim())
    setPlayerWeight(w)
    onComplete()
  }

  return (
    <div style={s.overlay}>
      <div style={s.introWrap}>
        <p style={{ color: '#f5c842', fontSize: 13, fontWeight: 700, marginBottom: 8, letterSpacing: 2 }}>PROFILE SETUP</p>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 900, marginBottom: 20 }}>プロフィール設定</h2>
        <label style={s.label}>ニックネーム</label>
        <input style={s.input} placeholder="例：やまびこ" value={name} onChange={(e) => setName(e.target.value)} maxLength={12} />
        <label style={s.label}>体重 (kg)</label>
        <input style={s.input} type="number" placeholder="例：65" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <button className="btn-primary" style={{ marginTop: 24 }} onClick={handleSubmit}>決定！</button>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const player = useGameStore((state) => state.player)
  const flags = useGameStore((state) => state.flags)
  const mountains = useGameStore((state) => state.mountains)
  const completeIntro = useGameStore((state) => state.completeIntro)
  const completeProfile = useGameStore((state) => state.completeProfile)
  const applyMountainDecay = useGameStore((state) => state.applyMountainDecay)

  const [{ charName, greeting }] = useState(() => {
    const charIds = ['senpai', 'yatsugatake', 'takao', 'hakone'].filter((id) => {
      if (id === 'senpai') return true
      return mountains[id]?.firstAccessed
    })
    const id = charIds[Math.floor(Math.random() * charIds.length)]
    return { charName: characters[id]?.shortName || '', greeting: getRandomGreeting(id) }
  })

  useEffect(() => { applyMountainDecay() }, [applyMountainDecay])

  const total = Math.floor((player.core + player.legs + player.arms) / 3)
  const level = Math.floor(total / 50) + 1

  const needsMaintenance = Object.values(mountains).some(
    (m) => m.unlocked && m.maintenanceLevel < 50
  )

  const menuItems = [
    { label: '登山', icon: '⛰️', path: '/climbing', color: '#3b82f6' },
    { label: '山探索', icon: '🔍', path: '/explore', color: '#8b5cf6' },
    { label: 'トレーニング', icon: '💪', path: '/training', color: '#f59e0b' },
    { label: '山整備', icon: '🪚', path: '/maintenance', color: '#10b981', badge: needsMaintenance },
    { label: 'ショップ', icon: '🛒', path: '/shop', color: '#ec4899' },
    { label: 'AR撮影', icon: '📱', path: '/ar', color: '#06b6d4', locked: !flags.arUnlocked },
  ]

  if (!flags.introCompleted) return <IntroScreen onComplete={completeIntro} />
  if (!flags.profileCompleted) return <ProfileScreen onComplete={completeProfile} />

  return (
    <div style={s.container}>
      <div style={s.bgGlow1} />
      <div style={s.bgGlow2} />

      {/* 上部ステータスバー */}
      <div style={s.topBar}>
        <div style={s.playerName}>
          <span style={{ color: '#f5c842', fontSize: 10, fontWeight: 700 }}>PLAYER</span>
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 900, marginLeft: 6 }}>{player.name || 'やまびこ'}</span>
        </div>
        <div style={s.pointsBadge}>
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ color: '#f5c842', fontWeight: 900, fontSize: 14 }}>{player.points.toLocaleString()}</span>
          <span style={{ color: '#aab', fontSize: 11 }}>pt</span>
        </div>
      </div>

      {/* タイトル */}
      <div style={s.titleWrap}>
        <div style={s.titleSub}>YAMA APP</div>
        <h1 style={s.title}>山 ア プ リ</h1>
      </div>

      {/* キャラクターエリア */}
      <div style={s.charArea}>
        <div style={s.charFrame}>
          <span style={{ fontSize: 36 }}>⛰️</span>
        </div>
        {greeting && (
          <div style={s.speechBubble}>
            <div style={s.charLabel}>{charName}</div>
            <p style={s.speechText}>{greeting}</p>
            <div style={s.bubbleTail} />
          </div>
        )}
      </div>

      {/* ステータスカード */}
      <div style={s.statsCard}>
        <div style={s.statsHeader}>
          <span style={s.statsTitle}>STATS</span>
          <span style={{ color: '#f5c842', fontSize: 18, fontWeight: 900 }}>Lv.{level}</span>
        </div>
        <GaugeBar label="体幹" value={player.core} color="#f59e0b" />
        <GaugeBar label="脚力" value={player.legs} color="#10b981" />
        <GaugeBar label="腕力" value={player.arms} color="#3b82f6" />
        <div style={s.totalRow}>
          <span style={{ color: '#aab', fontSize: 12 }}>総合体力</span>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>
            {total}<span style={{ color: '#aab', fontSize: 11, marginLeft: 2 }}>/ 500</span>
          </span>
        </div>
      </div>

      {/* メインメニュー */}
      <div style={s.sectionLabel}>MENU</div>
      <div style={s.menuGrid}>
        {menuItems.map((item) => (
          <button
            key={item.label}
            style={{ ...s.menuBtn, opacity: item.locked ? 0.45 : 1 }}
            onClick={() => !item.locked && navigate(item.path)}
            disabled={item.locked}
          >
            <div style={{ ...s.menuIconWrap, background: `${item.color}22`, border: `1px solid ${item.color}55` }}>
              <span style={s.menuIcon}>{item.icon}</span>
            </div>
            <span style={s.menuLabel}>{item.label}</span>
            {item.badge && <span style={s.badge}>!</span>}
            {item.locked && <span style={s.lockTag}>🔒</span>}
          </button>
        ))}
      </div>

      <div style={{ height: 80 }} />
    </div>
  )
}

function GaugeBar({ label, value, color }) {
  const max = 500
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: '#ccd', fontWeight: 700 }}>{label}</span>
        <span style={{ color: '#fff', fontWeight: 700 }}>
          {value}<span style={{ color: '#667', fontSize: 10 }}>/500</span>
        </span>
      </div>
      <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: 99,
          transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
          boxShadow: `0 0 8px ${color}88`,
        }} />
      </div>
    </div>
  )
}

const s = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #0d1a2a 50%, #0a1a12 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    position: 'relative', overflow: 'hidden',
  },
  bgGlow1: {
    position: 'absolute', top: -80, right: -60, width: 260, height: 260,
    background: 'radial-gradient(circle, rgba(123,92,240,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgGlow2: {
    position: 'absolute', top: 200, left: -80, width: 240, height: 240,
    background: 'radial-gradient(circle, rgba(46,204,113,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  topBar: {
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 16px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 1,
  },
  playerName: { display: 'flex', alignItems: 'center' },
  pointsBadge: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.3)',
    borderRadius: 20, padding: '4px 10px',
  },
  titleWrap: { paddingTop: 16, paddingBottom: 4, textAlign: 'center', zIndex: 1 },
  titleSub: { color: '#f5c842', fontSize: 10, fontWeight: 700, letterSpacing: 4, marginBottom: 2 },
  title: {
    color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: 10,
    textShadow: '0 0 20px rgba(245,200,66,0.4), 0 2px 8px rgba(0,0,0,0.6)',
  },
  charArea: {
    display: 'flex', alignItems: 'flex-end', gap: 12,
    padding: '12px 16px', width: '100%', maxWidth: 420, zIndex: 1,
  },
  charFrame: {
    width: 80, height: 80, flexShrink: 0,
    background: 'linear-gradient(135deg, rgba(123,92,240,0.3), rgba(46,204,113,0.2))',
    border: '2px solid rgba(245,200,66,0.4)', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 20px rgba(245,200,66,0.2)',
  },
  speechBubble: {
    flex: 1, background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 14, padding: '10px 14px', backdropFilter: 'blur(8px)', position: 'relative',
  },
  charLabel: { color: '#f5c842', fontSize: 11, fontWeight: 700, marginBottom: 4 },
  speechText: { color: '#fff', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  bubbleTail: {
    position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
    width: 0, height: 0,
    borderTop: '6px solid transparent', borderBottom: '6px solid transparent',
    borderRight: '8px solid rgba(255,255,255,0.08)',
  },
  statsCard: {
    width: 'calc(100% - 32px)', maxWidth: 420,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, padding: '14px 16px', marginBottom: 16, zIndex: 1,
  },
  statsHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  statsTitle: { color: '#f5c842', fontSize: 11, fontWeight: 700, letterSpacing: 2 },
  totalRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  sectionLabel: {
    color: '#f5c842', fontSize: 11, fontWeight: 700, letterSpacing: 3,
    width: 'calc(100% - 32px)', maxWidth: 420, marginBottom: 10, zIndex: 1,
  },
  menuGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
    gap: 10, width: 'calc(100% - 32px)', maxWidth: 420, zIndex: 1,
  },
  menuBtn: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, padding: '14px 8px 12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    cursor: 'pointer', position: 'relative', backdropFilter: 'blur(4px)',
    transition: 'transform 0.1s, background 0.15s',
  },
  menuIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  menuIcon: { fontSize: 26 },
  menuLabel: { color: '#dde', fontSize: 11, fontWeight: 700 },
  badge: {
    position: 'absolute', top: 6, right: 6,
    background: '#e74c3c', color: '#fff', borderRadius: '50%',
    width: 18, height: 18, fontSize: 11, fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 6px rgba(231,76,60,0.6)',
  },
  lockTag: { position: 'absolute', top: 5, right: 5, fontSize: 13 },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'linear-gradient(180deg, #0a0a1a 0%, #0d1a2a 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  introWrap: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,200,66,0.25)',
    borderRadius: 24, padding: '36px 28px',
    width: 'calc(100% - 48px)', maxWidth: 340,
    textAlign: 'center', backdropFilter: 'blur(12px)',
    boxShadow: '0 0 40px rgba(123,92,240,0.2)',
  },
  introIcon: { fontSize: 56, marginBottom: 16 },
  introText: { color: '#fff', fontSize: 18, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontWeight: 700 },
  dots: { display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 },
  dot: { width: 8, height: 8, borderRadius: '50%', transition: 'background 0.3s' },
  label: { display: 'block', textAlign: 'left', color: '#aab', fontSize: 12, marginBottom: 6, marginTop: 14 },
  input: {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10, color: '#fff', fontSize: 16, outline: 'none',
  },
}
