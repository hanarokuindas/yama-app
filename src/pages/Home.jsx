import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import characters from '../data/characters.json'
import CountUp from '../components/CountUp'
import { Celebration } from '../components/Celebration'

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

/* メニューポップアップ */
function MenuPopup({ onClose, navigate, needsMaintenance }) {
  const menuItems = [
    { label: 'ガイドブック', icon: '📖', action: null },
    { label: 'マイプロフィール', icon: '👤', action: null },
    { label: 'SNS', icon: '📲', action: null },
    { label: '装備', icon: '🎒', path: '/shop' },
    { label: '山探しえか', icon: '🗺️', action: null },
    { label: 'サウンド', icon: '🔊', action: null },
  ]
  return (
    <div style={s.popupOverlay} onClick={onClose}>
      <div style={s.popup} onClick={(e) => e.stopPropagation()}>
        <div style={s.popupTitle}>MENU</div>
        {menuItems.map((item) => (
          <button key={item.label} style={s.popupItem}
            onClick={() => { if (item.path) { navigate(item.path); onClose() } else onClose() }}>
            <span style={{ fontSize: 18, marginRight: 10 }}>{item.icon}</span>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{item.label}</span>
          </button>
        ))}
        <button style={s.popupClose} onClick={onClose}>✕ 閉じる</button>
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
  const [menuOpen, setMenuOpen] = useState(false)

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

  const [levelUp, setLevelUp] = useState(null)
  const [prevLevel, setPrevLevel] = useState(level)
  if (level !== prevLevel) {
    setPrevLevel(level)
    if (level > prevLevel) setLevelUp(level)
  }

  const needsMaintenance = Object.values(mountains).some(
    (m) => m.unlocked && m.maintenanceLevel < 50
  )

  if (!flags.introCompleted) return <IntroScreen onComplete={completeIntro} />
  if (!flags.profileCompleted) return <ProfileScreen onComplete={completeProfile} />

  return (
    <div style={s.container}>
      {/* 世界マップ全画面エリア */}
      <div style={s.worldMap}>
        {/* 背景レイヤー（将来的に背景画像に置き換え） */}
        <div style={s.bgSky} />
        <div style={s.bgMountainFar} />
        <div style={s.bgMountainMid} />
        <div style={s.bgGround} />
        <div style={s.bgForestL} />
        <div style={s.bgForestR} />
        <div style={s.bgPath} />

        {/* 上部ステータス（右上） */}
        <div style={s.statsOverlay}>
          <div style={s.statRow}>
            <span style={s.statIcon}>⭐</span>
            <CountUp value={player.points} style={s.statVal} />
          </div>
          <div style={s.statRow}>
            <span style={s.statIcon}>💪</span>
            <span style={s.statVal}><CountUp value={total} format={(n) => n} /></span>
          </div>
        </div>

        {/* プレイヤー名（左上） */}
        <div style={s.playerBadge}>
          <span style={s.lvBadge}>Lv.{level}</span>
          <span style={s.playerName}>{player.name || 'やまびこ'}</span>
        </div>

        {/* マップ上のナビゲーションホットスポット */}
        <MapSpot top="22%" left="62%" label="登山" icon="⛰️" color="#3b82f6"
          onClick={() => navigate('/climbing')} />
        <MapSpot top="18%" left="30%" label="山探索" icon="🔍" color="#8b5cf6"
          onClick={() => navigate('/explore')} />
        <MapSpot top="55%" left="15%" label="トレーニング" icon="💪" color="#f59e0b"
          onClick={() => navigate('/training')} />
        <MapSpot top="48%" left="72%" label="山整備" icon="🪚" color="#10b981"
          badge={needsMaintenance} onClick={() => navigate('/maintenance')} />
        <MapSpot top="10%" left="75%" label="アルバム" icon="🖼️" color="#ec4899"
          onClick={() => navigate('/shop')} />
        <MapSpot top="30%" left="82%" label="AR撮影" icon="📱" color="#06b6d4"
          locked={!flags.arUnlocked} onClick={() => !flags.arUnlocked || navigate('/ar')} />

        {/* キャラクター + セリフ */}
        <div style={s.charArea}>
          {/* キャラ画像プレースホルダー（将来的にキャラ立ち絵に置き換え） */}
          <div style={s.charFigure}>
            <span style={{ fontSize: 52 }}>🧗</span>
          </div>
          {greeting && (
            <div style={s.speechBubble}>
              <div style={s.charLabel}>{charName}</div>
              <p style={s.speechText}>{greeting}</p>
              <div style={s.bubbleTailBottom} />
            </div>
          )}
        </div>

        {/* メニューボタン（下部中央） */}
        <button style={s.menuBtn} onClick={() => setMenuOpen(true)}>
          <span style={{ fontSize: 18 }}>☰</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Menu</span>
        </button>
      </div>

      {menuOpen && (
        <MenuPopup onClose={() => setMenuOpen(false)} navigate={navigate} needsMaintenance={needsMaintenance} />
      )}

      {levelUp && (
        <Celebration
          icon="🎉"
          title={`Lv.${levelUp} に到達！`}
          subtitle="体力がアップした！この調子で山に挑もう！"
          onClose={() => setLevelUp(null)}
        />
      )}
    </div>
  )
}

/* マップ上のスポットボタン */
function MapSpot({ top, left, label, icon, color, badge, locked, onClick }) {
  return (
    <button
      style={{
        ...s.spot,
        top, left,
        opacity: locked ? 0.4 : 1,
        '--spot-color': color,
      }}
      onClick={onClick}
    >
      <div style={{ ...s.spotIcon, background: `${color}33`, border: `2px solid ${color}99`, boxShadow: `0 0 12px ${color}66` }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <span style={{ ...s.spotLabel, textShadow: '0 1px 4px #000, 0 0 8px #000' }}>{label}</span>
      {badge && <span style={s.spotBadge}>!</span>}
      {locked && <span style={{ position: 'absolute', top: -4, right: -4, fontSize: 14 }}>🔒</span>}
    </button>
  )
}

const s = {
  container: {
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    position: 'relative',
  },

  /* ---- 世界マップ ---- */
  worldMap: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },

  /* 背景レイヤー（CSS山岳景色） */
  bgSky: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg, #0a1628 0%, #1a2d4a 40%, #2d4a2d 100%)',
  },
  bgMountainFar: {
    position: 'absolute', bottom: '38%', left: 0, right: 0, height: '50%',
    background: 'linear-gradient(180deg, transparent 0%, #1a3a2a 60%, #1a3a2a 100%)',
    clipPath: 'polygon(0% 100%, 5% 55%, 12% 70%, 20% 35%, 28% 60%, 35% 20%, 45% 50%, 52% 30%, 60% 55%, 68% 15%, 75% 45%, 83% 25%, 90% 50%, 95% 40%, 100% 60%, 100% 100%)',
    filter: 'blur(1px)',
  },
  bgMountainMid: {
    position: 'absolute', bottom: '28%', left: 0, right: 0, height: '45%',
    background: 'linear-gradient(180deg, #1a4a2a 0%, #2a5a3a 100%)',
    clipPath: 'polygon(0% 100%, 8% 60%, 18% 75%, 30% 40%, 42% 65%, 50% 35%, 58% 55%, 68% 30%, 78% 55%, 88% 45%, 95% 60%, 100% 50%, 100% 100%)',
  },
  bgGround: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '32%',
    background: 'linear-gradient(180deg, #2a5a1a 0%, #1a4010 50%, #0d2a08 100%)',
  },
  bgForestL: {
    position: 'absolute', bottom: '25%', left: '-5%', width: '35%', height: '30%',
    background: 'radial-gradient(ellipse at bottom, #1a5a18 40%, transparent 75%)',
    transform: 'scaleX(1.2)',
    opacity: 0.85,
  },
  bgForestR: {
    position: 'absolute', bottom: '22%', right: '-5%', width: '40%', height: '35%',
    background: 'radial-gradient(ellipse at bottom, #1a5a18 40%, transparent 75%)',
    transform: 'scaleX(1.2)',
    opacity: 0.85,
  },
  bgPath: {
    position: 'absolute', bottom: '25%', left: '30%', width: '40%', height: '20%',
    background: 'linear-gradient(180deg, transparent, rgba(210,180,140,0.25) 60%, transparent)',
    borderRadius: '0 0 50% 50%',
    transform: 'rotate(-5deg)',
  },

  /* ---- ステータスオーバーレイ（右上） ---- */
  statsOverlay: {
    position: 'absolute', top: 12, right: 12,
    display: 'flex', flexDirection: 'column', gap: 4,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(245,200,66,0.3)',
    borderRadius: 12, padding: '8px 12px',
    zIndex: 10,
  },
  statRow: { display: 'flex', alignItems: 'center', gap: 6 },
  statIcon: { fontSize: 14 },
  statVal: { color: '#f5c842', fontWeight: 900, fontSize: 14 },

  /* ---- プレイヤーバッジ（左上） ---- */
  playerBadge: {
    position: 'absolute', top: 12, left: 12,
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(245,200,66,0.3)',
    borderRadius: 20, padding: '6px 12px',
    zIndex: 10,
  },
  lvBadge: {
    background: 'linear-gradient(135deg, #f5c842, #e0a800)',
    color: '#1a1000', fontWeight: 900, fontSize: 11,
    borderRadius: 10, padding: '2px 7px',
  },
  playerName: { color: '#fff', fontWeight: 700, fontSize: 13 },

  /* ---- マップスポット ---- */
  spot: {
    position: 'absolute',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    background: 'none', border: 'none', cursor: 'pointer',
    transform: 'translate(-50%, -50%)',
    zIndex: 5,
    padding: 0,
    WebkitTapHighlightColor: 'transparent',
  },
  spotIcon: {
    width: 52, height: 52, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    transition: 'transform 0.15s',
  },
  spotLabel: {
    color: '#fff', fontSize: 11, fontWeight: 900,
    whiteSpace: 'nowrap',
    background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 6,
  },
  spotBadge: {
    position: 'absolute', top: -4, right: -4,
    background: '#e74c3c', color: '#fff', borderRadius: '50%',
    width: 18, height: 18, fontSize: 11, fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 6px rgba(231,76,60,0.6)',
  },

  /* ---- キャラクターエリア（下部中央） ---- */
  charArea: {
    position: 'absolute', bottom: '12%', left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    zIndex: 8,
    width: '80%', maxWidth: 320,
  },
  charFigure: {
    width: 80, height: 80,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
    marginBottom: 4,
  },
  speechBubble: {
    background: 'rgba(255,255,255,0.92)',
    borderRadius: 14, padding: '10px 14px',
    position: 'relative', width: '100%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  charLabel: { color: '#7b5cf0', fontSize: 11, fontWeight: 900, marginBottom: 3 },
  speechText: { color: '#222', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 },
  bubbleTailBottom: {
    position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
    width: 0, height: 0,
    borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
    borderBottom: '9px solid rgba(255,255,255,0.92)',
  },

  /* ---- メニューボタン（下部中央） ---- */
  menuBtn: {
    position: 'absolute', bottom: 20, left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 24, padding: '10px 24px',
    color: '#fff', cursor: 'pointer',
    zIndex: 10,
    boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
  },

  /* ---- メニューポップアップ ---- */
  popupOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    zIndex: 200,
  },
  popup: {
    background: 'linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%)',
    border: '1px solid rgba(245,200,66,0.25)',
    borderRadius: '24px 24px 0 0', padding: '20px 20px 36px',
    width: '100%', maxWidth: 480,
    animation: 'burst 0.3s cubic-bezier(.22,1,.36,1)',
  },
  popupTitle: {
    color: '#f5c842', fontSize: 12, fontWeight: 700, letterSpacing: 3,
    textAlign: 'center', marginBottom: 16,
  },
  popupItem: {
    display: 'flex', alignItems: 'center',
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '13px 16px',
    marginBottom: 8, cursor: 'pointer',
  },
  popupClose: {
    display: 'block', width: '100%',
    background: 'none', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12, padding: '12px', marginTop: 8,
    color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer',
  },

  /* ---- オーバーレイ系（イントロ/プロフィール） ---- */
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
