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

function getGreeting(charId) {
  const char = characters[charId]
  if (!char) return ''
  const slot = getTimeSlot()
  const lines = char.greetings[slot] || []
  return lines[Math.floor(Math.random() * lines.length)] || ''
}

/* ─────────────────────── イントロ ─────────────────────── */
function IntroScreen({ onComplete }) {
  const [step, setStep] = useState(0)
  const lines = [
    { icon: '🌄', text: 'ようこそ、山の世界へ！' },
    { icon: '⛰️', text: '山を登り、鍛え、整備して\n大自然と向き合おう。' },
    { icon: '✨', text: 'まずは自己紹介してね！' },
  ]
  const cur = lines[step]
  return (
    <div style={s.fullOverlay}>
      <div style={s.introCard}>
        <div style={{ fontSize: 64, marginBottom: 20, animation: 'popIn 0.4s ease' }}>{cur.icon}</div>
        <p style={s.introText}>{cur.text}</p>
        <button className="btn-primary" style={{ marginTop: 32, maxWidth: 240 }}
          onClick={() => step < lines.length - 1 ? setStep(step + 1) : onComplete()}>
          {step < lines.length - 1 ? '次へ ›' : 'はじめる！'}
        </button>
        <div style={s.dots}>
          {lines.map((_, i) => <div key={i} style={{ ...s.dot, background: i === step ? '#f5c842' : 'rgba(255,255,255,0.25)' }} />)}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────── プロフィール設定 ─────────────────────── */
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
    <div style={s.fullOverlay}>
      <div style={s.introCard}>
        <div style={s.profileBadge}>PROFILE SETUP</div>
        <h2 style={s.profileTitle}>プロフィール設定</h2>
        <label style={s.formLabel}>ニックネーム</label>
        <input style={s.formInput} placeholder="例：やまびこ" value={name}
          onChange={(e) => setName(e.target.value)} maxLength={12} />
        <label style={s.formLabel}>体重 (kg)</label>
        <input style={s.formInput} type="number" placeholder="例：65" value={weight}
          onChange={(e) => setWeight(e.target.value)} />
        <button className="btn-primary" style={{ marginTop: 28 }} onClick={handleSubmit}>決定！</button>
      </div>
    </div>
  )
}

/* ─────────────────────── メニューポップアップ ─────────────────────── */
function MenuPopup({ onClose, navigate }) {
  const items = [
    { label: 'ガイドブック', icon: '📖' },
    { label: 'マイプロフィール', icon: '👤' },
    { label: 'SNS', icon: '📲' },
    { label: '装備・ショップ', icon: '🎒', path: '/shop' },
    { label: 'サウンド', icon: '🔊' },
    { label: '利用規約', icon: '📄' },
  ]
  return (
    <div style={s.popupOverlay} onClick={onClose}>
      <div style={s.popup} onClick={(e) => e.stopPropagation()}>
        <div style={s.popupHandle} />
        <div style={s.popupHeader}>MENU</div>
        <div style={s.popupGrid}>
          {items.map((item) => (
            <button key={item.label} style={s.popupItem}
              onClick={() => { if (item.path) { navigate(item.path) } onClose() }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <span style={s.popupItemLabel}>{item.label}</span>
            </button>
          ))}
        </div>
        <button style={s.popupCloseBtn} onClick={onClose}>✕　閉じる</button>
      </div>
    </div>
  )
}

/* ─────────────────────── マップスポット ─────────────────────── */
function MapSpot({ top, left, label, icon, color, badge, locked, onClick, size = 'md' }) {
  const sz = size === 'sm' ? 42 : 52
  return (
    <button
      style={{ ...s.spot, top, left }}
      onClick={onClick}
    >
      <div style={{
        ...s.spotRing,
        width: sz, height: sz,
        background: locked ? 'rgba(80,80,80,0.7)' : `linear-gradient(135deg, ${color}ee, ${color}99)`,
        boxShadow: locked ? 'none' : `0 4px 16px ${color}88, inset 0 1px 0 rgba(255,255,255,0.4)`,
        animation: locked ? 'none' : 'spotPulse 2.4s ease-in-out infinite',
        opacity: locked ? 0.45 : 1,
      }}>
        <span style={{ fontSize: size === 'sm' ? 18 : 22, filter: locked ? 'grayscale(1)' : 'none' }}>
          {locked ? '🔒' : icon}
        </span>
      </div>
      <div style={s.spotTag}>
        <span style={s.spotLabel}>{label}</span>
        {badge && <span style={s.spotBadge}>!</span>}
      </div>
    </button>
  )
}

/* ─────────────────────── ホームメイン ─────────────────────── */
export default function Home() {
  const navigate = useNavigate()
  const player = useGameStore((st) => st.player)
  const flags = useGameStore((st) => st.flags)
  const mountains = useGameStore((st) => st.mountains)
  const completeIntro = useGameStore((st) => st.completeIntro)
  const completeProfile = useGameStore((st) => st.completeProfile)
  const applyMountainDecay = useGameStore((st) => st.applyMountainDecay)
  const [menuOpen, setMenuOpen] = useState(false)

  const [{ charName, greeting }] = useState(() => {
    const ids = ['senpai', 'yatsugatake', 'takao', 'hakone'].filter(
      (id) => id === 'senpai' || mountains[id]?.firstAccessed
    )
    const id = ids[Math.floor(Math.random() * ids.length)]
    return { charName: characters[id]?.shortName || '', greeting: getGreeting(id) }
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
    <div style={s.root}>

      {/* ══════════ 背景レイヤー（CSSワールドマップ） ══════════ */}
      {/* 空 */}
      <div style={s.sky} />
      {/* 雲 */}
      <div style={s.cloud1} />
      <div style={s.cloud2} />
      {/* 遠景の山（雪あり） */}
      <div style={s.mtFar} />
      <div style={s.mtFarPeak} />
      {/* 中景の山 */}
      <div style={s.mtMid} />
      {/* 丘 - 後 */}
      <div style={s.hillBack} />
      {/* 森 */}
      <div style={s.forestL} />
      <div style={s.forestR} />
      <div style={s.forestC} />
      {/* 川 */}
      <div style={s.river} />
      {/* 丘 - 前 */}
      <div style={s.hillFront} />
      {/* 地面 */}
      <div style={s.ground} />
      {/* 道 */}
      <div style={s.path} />
      {/* 光の差し込み */}
      <div style={s.sunRay} />

      {/* ══════════ 左上：プレイヤーバッジ ══════════ */}
      <div style={s.playerBadge}>
        <div style={s.lvChip}>Lv.{level}</div>
        <span style={s.playerNameText}>{player.name || 'やまびこ'}</span>
      </div>

      {/* ══════════ 右上：ステータス ══════════ */}
      <div style={s.statsPanel}>
        <div style={s.statItem}>
          <span style={s.statIcon}>❤️</span>
          <CountUp value={player.points} style={s.statNum} />
        </div>
        <div style={s.statItem}>
          <span style={s.statIcon}>💪</span>
          <span style={s.statNum}>{total}</span>
        </div>
      </div>

      {/* ══════════ マップホットスポット ══════════ */}
      <MapSpot top="20%" left="28%" label="山探索" icon="🔍" color="#7c3aed"
        onClick={() => navigate('/explore')} />
      <MapSpot top="14%" left="58%" label="登山" icon="⛰️" color="#1d4ed8"
        onClick={() => navigate('/climbing')} />
      <MapSpot top="32%" left="72%" label="アルバム" icon="🖼️" color="#db2777"
        onClick={() => navigate('/shop')} />
      <MapSpot top="50%" left="15%" label="トレーニング" icon="💪" color="#d97706"
        onClick={() => navigate('/training')} />
      <MapSpot top="56%" left="55%" label="山整備" icon="🪚" color="#059669"
        badge={needsMaintenance} onClick={() => navigate('/maintenance')} />
      <MapSpot top="60%" left="80%" label="AR撮影" icon="📷" color="#0891b2"
        locked={!flags.arUnlocked} size="sm"
        onClick={() => !flags.arUnlocked || navigate('/ar')} />

      {/* ══════════ キャラクター ══════════ */}
      <div style={s.charWrap}>
        {/* キャラ立ち絵プレースホルダー（画像追加後に <img> に置換） */}
        <div style={s.charFigure}>
          <span style={{ fontSize: 64, display: 'block', animation: 'charFloat 3s ease-in-out infinite' }}>🧗</span>
        </div>
        {greeting && (
          <div style={s.bubble}>
            <div style={s.bubbleName}>{charName}</div>
            <p style={s.bubbleText}>{greeting}</p>
            <div style={s.bubbleTail} />
          </div>
        )}
      </div>

      {/* ══════════ Menuボタン ══════════ */}
      <button style={s.menuBtn} onClick={() => setMenuOpen(true)}>
        <span style={{ fontSize: 16 }}>☰</span>
        <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>Menu</span>
      </button>

      {menuOpen && <MenuPopup onClose={() => setMenuOpen(false)} navigate={navigate} />}

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

/* ══════════════════════════════════════════════════════
   スタイル
══════════════════════════════════════════════════════ */
const s = {
  root: {
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    position: 'relative',
    userSelect: 'none',
  },

  /* ─── 空 ─── */
  sky: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg, #a8d8f0 0%, #c8e8f8 35%, #dff0e8 70%, #b8d8a0 100%)',
  },

  /* ─── 雲 ─── */
  cloud1: {
    position: 'absolute', top: '4%', left: '8%',
    width: 120, height: 36,
    background: 'rgba(255,255,255,0.85)',
    borderRadius: 40,
    boxShadow: '30px -8px 0 10px rgba(255,255,255,0.7), 60px 4px 0 6px rgba(255,255,255,0.65)',
    animation: 'cloudDrift 18s ease-in-out infinite alternate',
    filter: 'blur(2px)',
  },
  cloud2: {
    position: 'absolute', top: '10%', right: '5%',
    width: 90, height: 28,
    background: 'rgba(255,255,255,0.75)',
    borderRadius: 40,
    boxShadow: '24px -6px 0 8px rgba(255,255,255,0.6)',
    animation: 'cloudDrift 24s ease-in-out infinite alternate-reverse',
    filter: 'blur(1.5px)',
  },

  /* ─── 遠景の山 ─── */
  mtFar: {
    position: 'absolute', bottom: '45%', left: 0, right: 0, height: '40%',
    background: 'linear-gradient(180deg, transparent 0%, #9db8d0 50%, #7a9fb8 100%)',
    clipPath: 'polygon(0% 100%, 10% 50%, 20% 75%, 32% 28%, 44% 58%, 55% 22%, 65% 52%, 76% 18%, 86% 45%, 93% 30%, 100% 55%, 100% 100%)',
    opacity: 0.65,
    filter: 'blur(2px)',
  },
  mtFarPeak: {
    position: 'absolute', bottom: '52%', left: '52%',
    width: 80, height: 60,
    background: 'linear-gradient(180deg, #ffffff 0%, #e8f4ff 50%, #c8dff0 100%)',
    clipPath: 'polygon(50% 0%, 10% 100%, 90% 100%)',
    filter: 'blur(0.5px)',
    opacity: 0.9,
  },

  /* ─── 中景の山 ─── */
  mtMid: {
    position: 'absolute', bottom: '38%', left: 0, right: 0, height: '38%',
    background: 'linear-gradient(180deg, #5a8a4a 0%, #3d6b30 100%)',
    clipPath: 'polygon(0% 100%, 8% 55%, 20% 72%, 33% 38%, 46% 62%, 56% 35%, 66% 55%, 76% 32%, 85% 52%, 92% 42%, 100% 58%, 100% 100%)',
    filter: 'blur(0.5px)',
  },

  /* ─── 丘 後 ─── */
  hillBack: {
    position: 'absolute', bottom: '30%', left: 0, right: 0, height: '20%',
    background: 'linear-gradient(180deg, #6aaa50 0%, #4a8838 100%)',
    clipPath: 'ellipse(65% 60% at 40% 100%)',
  },

  /* ─── 森 ─── */
  forestL: {
    position: 'absolute', bottom: '25%', left: '-8%', width: '45%', height: '28%',
    background: 'radial-gradient(ellipse 50% 80% at 50% 100%, #2d6e24 30%, #1a4d14 60%, transparent 80%)',
    filter: 'blur(1px)',
  },
  forestR: {
    position: 'absolute', bottom: '22%', right: '-10%', width: '50%', height: '32%',
    background: 'radial-gradient(ellipse 50% 80% at 50% 100%, #2d6e24 25%, #1a4d14 55%, transparent 80%)',
    filter: 'blur(1px)',
  },
  forestC: {
    position: 'absolute', bottom: '30%', left: '30%', width: '40%', height: '20%',
    background: 'radial-gradient(ellipse 55% 70% at 50% 100%, #3d7a30 35%, #1a4d14 70%, transparent 90%)',
  },

  /* ─── 川 ─── */
  river: {
    position: 'absolute', bottom: '20%', left: '20%',
    width: '60%', height: '12%',
    background: 'linear-gradient(160deg, rgba(80,160,220,0.7) 0%, rgba(100,180,240,0.5) 50%, rgba(80,160,220,0.6) 100%)',
    borderRadius: '60% 40% 60% 40% / 40% 60% 40% 60%',
    transform: 'rotate(-8deg)',
    filter: 'blur(1px)',
    boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.4)',
  },

  /* ─── 丘 前 ─── */
  hillFront: {
    position: 'absolute', bottom: '12%', left: 0, right: 0, height: '22%',
    background: 'linear-gradient(180deg, #7dc460 0%, #58a040 60%, #3d7a28 100%)',
    clipPath: 'ellipse(70% 65% at 50% 100%)',
  },

  /* ─── 地面 ─── */
  ground: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '16%',
    background: 'linear-gradient(180deg, #68b84a 0%, #4a9030 50%, #2d6018 100%)',
  },

  /* ─── 道 ─── */
  path: {
    position: 'absolute', bottom: '10%', left: '35%',
    width: '30%', height: '20%',
    background: 'linear-gradient(180deg, rgba(200,170,120,0) 0%, rgba(200,170,120,0.4) 50%, rgba(200,170,120,0.2) 100%)',
    borderRadius: '50% 50% 0 0',
    transform: 'rotate(-3deg)',
  },

  /* ─── 光の差し込み ─── */
  sunRay: {
    position: 'absolute', top: 0, left: '55%',
    width: '60%', height: '60%',
    background: 'radial-gradient(ellipse at top, rgba(255,240,180,0.35) 0%, transparent 65%)',
    pointerEvents: 'none',
  },

  /* ─── プレイヤーバッジ（左上） ─── */
  playerBadge: {
    position: 'absolute', top: 12, left: 12,
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'linear-gradient(135deg, rgba(10,20,60,0.82), rgba(30,10,80,0.78))',
    border: '1.5px solid rgba(245,200,66,0.5)',
    borderRadius: 24, padding: '6px 14px 6px 8px',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
    zIndex: 20,
  },
  lvChip: {
    background: 'linear-gradient(135deg, #f5c842, #e0a800)',
    color: '#1a0e00', fontWeight: 900, fontSize: 11,
    borderRadius: 12, padding: '2px 8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },
  playerNameText: {
    color: '#fff', fontWeight: 700, fontSize: 13,
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  },

  /* ─── ステータスパネル（右上） ─── */
  statsPanel: {
    position: 'absolute', top: 12, right: 12,
    display: 'flex', flexDirection: 'column', gap: 4,
    background: 'linear-gradient(135deg, rgba(10,20,60,0.82), rgba(30,10,80,0.78))',
    border: '1.5px solid rgba(245,200,66,0.5)',
    borderRadius: 16, padding: '8px 14px',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
    zIndex: 20,
    minWidth: 100,
  },
  statItem: { display: 'flex', alignItems: 'center', gap: 6 },
  statIcon: { fontSize: 14 },
  statNum: { color: '#f5c842', fontWeight: 900, fontSize: 15, letterSpacing: 0.5 },

  /* ─── マップスポット ─── */
  spot: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    background: 'none', border: 'none', cursor: 'pointer',
    zIndex: 10, padding: 2,
    WebkitTapHighlightColor: 'transparent',
  },
  spotRing: {
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid rgba(255,255,255,0.5)',
    transition: 'transform 0.15s',
    position: 'relative',
    overflow: 'hidden',
  },
  spotTag: {
    display: 'flex', alignItems: 'center', gap: 3,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8, padding: '2px 8px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.4)',
  },
  spotLabel: {
    color: '#fff', fontSize: 11, fontWeight: 900,
    whiteSpace: 'nowrap', letterSpacing: 0.3,
    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
  },
  spotBadge: {
    background: '#e74c3c', color: '#fff',
    borderRadius: '50%', width: 14, height: 14,
    fontSize: 9, fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 4px rgba(231,76,60,0.8)',
  },

  /* ─── キャラクター ─── */
  charWrap: {
    position: 'absolute', bottom: '12%', left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    zIndex: 15, width: '78%', maxWidth: 300,
  },
  charFigure: {
    width: 80, height: 80,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.5))',
    marginBottom: 0,
  },
  bubble: {
    background: '#fff',
    borderRadius: 16, padding: '10px 16px',
    position: 'relative', width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.8)',
    border: '1.5px solid rgba(200,200,200,0.6)',
  },
  bubbleName: {
    color: '#7c3aed', fontSize: 11, fontWeight: 900,
    marginBottom: 4, letterSpacing: 0.5,
  },
  bubbleText: {
    color: '#222', fontSize: 13, lineHeight: 1.65,
    whiteSpace: 'pre-wrap', margin: 0,
  },
  bubbleTail: {
    position: 'absolute', top: -9, left: '50%',
    transform: 'translateX(-50%)',
    width: 0, height: 0,
    borderLeft: '9px solid transparent',
    borderRight: '9px solid transparent',
    borderBottom: '10px solid #fff',
    filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.1))',
  },

  /* ─── Menuボタン ─── */
  menuBtn: {
    position: 'absolute', bottom: 18, left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'linear-gradient(135deg, rgba(10,20,60,0.9), rgba(30,10,80,0.88))',
    border: '1.5px solid rgba(245,200,66,0.45)',
    borderRadius: 28, padding: '11px 32px',
    color: '#fff', cursor: 'pointer', zIndex: 20,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    WebkitTapHighlightColor: 'transparent',
  },

  /* ─── メニューポップアップ ─── */
  popupOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    zIndex: 200,
  },
  popup: {
    background: 'linear-gradient(180deg, #1a1a35 0%, #0d0d22 100%)',
    border: '1px solid rgba(245,200,66,0.3)',
    borderRadius: '28px 28px 0 0',
    padding: '12px 20px 40px',
    width: '100%', maxWidth: 480,
    animation: 'slideUp 0.3s cubic-bezier(.22,1,.36,1)',
    boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
  },
  popupHandle: {
    width: 40, height: 4, background: 'rgba(255,255,255,0.25)',
    borderRadius: 99, margin: '0 auto 16px',
  },
  popupHeader: {
    color: '#f5c842', fontSize: 12, fontWeight: 700, letterSpacing: 4,
    textAlign: 'center', marginBottom: 20,
  },
  popupGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
    marginBottom: 16,
  },
  popupItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, padding: '16px 8px',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  popupItemLabel: {
    color: '#dde', fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
    textAlign: 'center',
  },
  popupCloseBtn: {
    display: 'block', width: '100%',
    background: 'none', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14, padding: '13px',
    color: 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer',
    letterSpacing: 1,
  },

  /* ─── オーバーレイ（イントロ/プロフィール） ─── */
  fullOverlay: {
    position: 'fixed', inset: 0,
    background: 'linear-gradient(160deg, #0f1628 0%, #1a0d28 50%, #0a1820 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  introCard: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(245,200,66,0.3)',
    borderRadius: 28, padding: '40px 30px',
    width: 'calc(100% - 48px)', maxWidth: 340,
    textAlign: 'center',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
  },
  introText: {
    color: '#fff', fontSize: 19, lineHeight: 1.85, whiteSpace: 'pre-wrap', fontWeight: 700,
  },
  profileBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #f5c842, #e0a800)',
    color: '#1a0e00', fontSize: 11, fontWeight: 900, letterSpacing: 2,
    borderRadius: 20, padding: '3px 12px', marginBottom: 10,
  },
  profileTitle: {
    color: '#fff', fontSize: 20, fontWeight: 900, marginBottom: 20,
  },
  formLabel: {
    display: 'block', textAlign: 'left', color: '#aab',
    fontSize: 12, marginBottom: 6, marginTop: 16,
  },
  formInput: {
    width: '100%', padding: '13px 14px',
    background: 'rgba(255,255,255,0.09)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 12, color: '#fff', fontSize: 16, outline: 'none',
  },
  dots: { display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: '50%', transition: 'background 0.3s' },
}
