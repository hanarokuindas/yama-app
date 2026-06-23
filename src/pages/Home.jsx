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

// ──────────────────────────────────────────
// イントロ画面
// ──────────────────────────────────────────
function IntroScreen({ onComplete }) {
  const [step, setStep] = useState(0)
  const lines = [
    '🌄 ようこそ、山の世界へ！',
    '山を登り、鍛え、整備して\n大自然と向き合おう。',
    'まずは自己紹介してね！',
  ]

  return (
    <div style={styles.fullOverlay}>
      <div style={styles.introCard}>
        <p style={styles.introText}>{lines[step]}</p>
        {step < lines.length - 1 ? (
          <button style={styles.primaryBtn} onClick={() => setStep(step + 1)}>次へ</button>
        ) : (
          <button style={styles.primaryBtn} onClick={onComplete}>はじめる！</button>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// プロフィール入力
// ──────────────────────────────────────────
function ProfileScreen({ onComplete }) {
  const setPlayerName = useGameStore((s) => s.setPlayerName)
  const setPlayerWeight = useGameStore((s) => s.setPlayerWeight)
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
    <div style={styles.fullOverlay}>
      <div style={styles.introCard}>
        <h2 style={{ marginBottom: 16, fontSize: 20 }}>プロフィール設定</h2>
        <label style={styles.label}>ニックネーム</label>
        <input
          style={styles.input}
          placeholder="例：やまびこ"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={12}
        />
        <label style={styles.label}>体重 (kg)</label>
        <input
          style={styles.input}
          type="number"
          placeholder="例：65"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <button style={styles.primaryBtn} onClick={handleSubmit}>決定！</button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// ホーム本体
// ──────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const player = useGameStore((s) => s.player)
  const flags = useGameStore((s) => s.flags)
  const mountains = useGameStore((s) => s.mountains)
  const completeIntro = useGameStore((s) => s.completeIntro)
  const completeProfile = useGameStore((s) => s.completeProfile)
  const applyMountainDecay = useGameStore((s) => s.applyMountainDecay)

  // マウント時に1度だけ、解禁済みキャラからランダムに挨拶を決定
  const [{ charName, greeting }] = useState(() => {
    const charIds = ['senpai', 'yatsugatake', 'takao', 'hakone'].filter((id) => {
      if (id === 'senpai') return true
      return mountains[id]?.firstAccessed
    })
    const id = charIds[Math.floor(Math.random() * charIds.length)]
    return { charName: characters[id]?.shortName || '', greeting: getRandomGreeting(id) }
  })

  // 山の荒廃をマウント時に反映
  useEffect(() => {
    applyMountainDecay()
  }, [applyMountainDecay])

  // ステータス計算
  const total = Math.floor((player.core + player.legs + player.arms) / 3)

  // 山整備お知らせ
  const needsMaintenance = Object.values(mountains).some(
    (m) => m.unlocked && m.maintenanceLevel < 50
  )

  // メニューアイテム
  const menuItems = [
    { label: '山整備', icon: '🪚', path: '/maintenance', badge: needsMaintenance },
    { label: 'アルバム', icon: '📷', path: '/album' },
    { label: '登山', icon: '⛰️', path: '/climbing' },
    { label: '山探索', icon: '🔍', path: '/explore' },
    { label: 'トレーニング', icon: '💪', path: '/training' },
    { label: 'AR撮影', icon: '📱', path: '/ar', locked: !flags.arUnlocked },
  ]

  if (!flags.introCompleted) {
    return <IntroScreen onComplete={completeIntro} />
  }
  if (!flags.profileCompleted) {
    return <ProfileScreen onComplete={completeProfile} />
  }

  return (
    <div style={styles.container}>
      {/* ステータスバー */}
      <div style={styles.statusBar}>
        <span style={styles.statusItem}>⭐ {player.points.toLocaleString()}pt</span>
        <span style={styles.statusItem}>💪 総合{total}</span>
      </div>

      {/* タイトル */}
      <div style={styles.titleArea}>
        <h1 style={styles.title}>山 ア プ リ</h1>
      </div>

      {/* キャラ挨拶 */}
      {greeting && (
        <div style={styles.greetCard}>
          <span style={styles.greetChar}>{charName}</span>
          <p style={styles.greetText}>{greeting}</p>
        </div>
      )}

      {/* ステータス詳細 */}
      <div style={styles.statsBox}>
        <StatBar label="体幹" value={player.core} color="#e67e22" />
        <StatBar label="脚力" value={player.legs} color="#27ae60" />
        <StatBar label="腕力" value={player.arms} color="#2980b9" />
      </div>

      {/* メインメニュー */}
      <div style={styles.menuGrid}>
        {menuItems.map((item) => (
          <button
            key={item.label}
            style={{
              ...styles.menuBtn,
              opacity: item.locked ? 0.5 : 1,
            }}
            onClick={() => !item.locked && navigate(item.path)}
            disabled={item.locked}
          >
            <span style={styles.menuIcon}>{item.icon}</span>
            <span style={styles.menuLabel}>{item.label}</span>
            {item.badge && <span style={styles.badge}>!</span>}
            {item.locked && <span style={styles.lockTag}>🔒</span>}
          </button>
        ))}
      </div>

      {/* メニューボタン */}
      <button style={styles.menuSmallBtn} onClick={() => navigate('/menu')}>
        ≡ メニュー
      </button>
    </div>
  )
}

function StatBar({ label, value, color }) {
  const max = 500
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#fff', marginBottom: 2 }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #1a3a5c 0%, #2d6a4f 60%, #40916c 100%)',
    paddingBottom: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statusBar: {
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 16,
    padding: '10px 16px',
    background: 'rgba(0,0,0,0.3)',
    boxSizing: 'border-box',
  },
  statusItem: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  titleArea: { padding: '20px 0 8px' },
  title: { color: '#fff', fontSize: 28, letterSpacing: 8, textShadow: '1px 2px 8px rgba(0,0,0,0.5)', margin: 0 },
  greetCard: {
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: '12px 16px',
    width: 'calc(100% - 32px)',
    maxWidth: 360,
    marginBottom: 12,
    backdropFilter: 'blur(4px)',
  },
  greetChar: { color: '#ffd700', fontSize: 12, fontWeight: 'bold', display: 'block', marginBottom: 4 },
  greetText: { color: '#fff', fontSize: 14, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' },
  statsBox: {
    width: 'calc(100% - 32px)',
    maxWidth: 360,
    marginBottom: 16,
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 12,
    width: 'calc(100% - 32px)',
    maxWidth: 360,
    marginBottom: 12,
  },
  menuBtn: {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    position: 'relative',
    backdropFilter: 'blur(4px)',
  },
  menuIcon: { fontSize: 28 },
  menuLabel: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    background: '#e74c3c',
    color: '#fff',
    borderRadius: '50%',
    width: 18,
    height: 18,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  lockTag: { position: 'absolute', top: 4, right: 4, fontSize: 14 },
  menuSmallBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff',
    borderRadius: 20,
    padding: '8px 24px',
    fontSize: 14,
    cursor: 'pointer',
  },
  fullOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(180deg, #1a3a5c 0%, #2d6a4f 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  introCard: {
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 32,
    width: 'calc(100% - 48px)',
    maxWidth: 340,
    textAlign: 'center',
    color: '#fff',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  introText: { fontSize: 18, lineHeight: 1.8, marginBottom: 24, whiteSpace: 'pre-wrap' },
  label: { display: 'block', textAlign: 'left', fontSize: 13, color: '#ccc', marginBottom: 4, marginTop: 12 },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.4)',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 16,
    boxSizing: 'border-box',
    outline: 'none',
  },
  primaryBtn: {
    marginTop: 20,
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
}
