import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import characters from '../data/characters.json'
import { DAILY_MISSIONS } from '../data/missions'
import CountUp from '../components/CountUp'
import { Celebration, Confetti } from '../components/Celebration'
import WorldMap from '../components/WorldMap'
import { senpaiPose } from '../assets/characters/senpai'
import { sfx } from '../utils/sound'

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
        <button style={s.popupCloseBtn} onClick={onClose}>✕ 閉じる</button>
      </div>
    </div>
  )
}

/* ─────────────────────── ログインボーナス ─────────────────────── */
function LoginBonusModal({ streak, bonus, onClose }) {
  return (
    <div style={{ ...s.popupOverlay, alignItems: 'center' }} onClick={() => { sfx.confirm(); onClose() }}>
      <Confetti count={30} />
      <div style={{ ...s.loginCard }} onClick={(e) => e.stopPropagation()}>
        <div style={s.loginRibbon}>デイリーログインボーナス</div>
        <div style={{ fontSize: 56, margin: '14px 0 6px', animation: 'popIn 0.5s ease' }}>🎁</div>
        <div style={s.loginStreakRow}>
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <div key={d} style={{
              ...s.loginDay,
              background: d <= streak ? 'linear-gradient(135deg,#f5c842,#e0a800)' : 'rgba(255,255,255,0.08)',
              color: d <= streak ? '#1a0e00' : '#667',
            }}>{d}</div>
          ))}
        </div>
        <p style={{ color: '#aab', fontSize: 12, margin: '10px 0 4px' }}>{streak}日目のログイン！</p>
        <p style={{ color: '#f5c842', fontSize: 26, fontWeight: 900, animation: 'popIn 0.5s 0.2s both' }}>
          ⭐ +{bonus.toLocaleString()} pt
        </p>
        <button className="btn-primary" style={{ marginTop: 18 }}
          onClick={() => { sfx.coin(); onClose() }}>うけとる！</button>
      </div>
    </div>
  )
}

/* ─────────────────────── デイリーミッション ─────────────────────── */
function MissionPanel({ onClose }) {
  const daily = useGameStore((st) => st.daily)
  const claimMission = useGameStore((st) => st.claimMission)
  const today = new Date().toISOString().slice(0, 10)
  const progress = daily.missionDate === today ? daily.missionProgress : {}

  return (
    <div style={s.popupOverlay} onClick={onClose}>
      <div style={s.popup} onClick={(e) => e.stopPropagation()}>
        <div style={s.popupHandle} />
        <div style={s.popupHeader}>DAILY MISSION</div>
        {DAILY_MISSIONS.map((m) => {
          const cur = Math.min(progress[m.id] || 0, m.goal)
          const done = cur >= m.goal
          const claimed = daily.missionClaimed.includes(m.id)
          return (
            <div key={m.id} style={s.missionRow}>
              <span style={{ fontSize: 26 }}>{m.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.missionLabel}>{m.label}</div>
                <div style={s.missionBarBg}>
                  <div style={{ ...s.missionBarFill, width: `${(cur / m.goal) * 100}%` }} />
                </div>
                <div style={s.missionProgressText}>{cur}/{m.goal} 報酬 ⭐{m.reward}</div>
              </div>
              <button
                style={{
                  ...s.missionBtn,
                  background: claimed ? 'rgba(255,255,255,0.08)'
                    : done ? 'linear-gradient(135deg,#f5c842,#e0a800)' : 'rgba(255,255,255,0.08)',
                  color: claimed ? '#556' : done ? '#1a0e00' : '#667',
                  cursor: done && !claimed ? 'pointer' : 'default',
                }}
                disabled={!done || claimed}
                onClick={() => { if (claimMission(m.id, m.reward)) sfx.item() }}
              >
                {claimed ? '受取済' : done ? '受取る' : '未達成'}
              </button>
            </div>
          )
        })}
        <button style={s.popupCloseBtn} onClick={() => { sfx.cancel(); onClose() }}>✕ 閉じる</button>
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
  const checkDailyLogin = useGameStore((st) => st.checkDailyLogin)
  const daily = useGameStore((st) => st.daily)
  const [menuOpen, setMenuOpen] = useState(false)
  const [missionOpen, setMissionOpen] = useState(false)
  const [loginBonus, setLoginBonus] = useState(null)

  const [{ charName, greeting, homePose }] = useState(() => {
    const ids = ['senpai', 'yatsugatake', 'takao', 'hakone'].filter(
      (id) => id === 'senpai' || mountains[id]?.firstAccessed
    )
    const id = ids[Math.floor(Math.random() * ids.length)]
    const pose = senpaiPose.home[Math.floor(Math.random() * senpaiPose.home.length)]
    return { charName: characters[id]?.shortName || '', greeting: getGreeting(id), homePose: pose }
  })

  useEffect(() => { applyMountainDecay() }, [applyMountainDecay])

  const profileDone = flags.profileCompleted
  useEffect(() => {
    if (!profileDone) return
    const t = setTimeout(() => {
      const result = checkDailyLogin()
      if (result) setLoginBonus(result)
    }, 600)
    return () => clearTimeout(t)
  }, [profileDone, checkDailyLogin])

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

      {/* ══════════ 背景（SVGワールドマップ） ══════════ */}
      <WorldMap />

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

      {/* ══════════ ミッションボタン（左） ══════════ */}
      <button style={s.missionFab} onClick={() => { sfx.tap(); setMissionOpen(true) }}>
        <span style={{ fontSize: 20 }}>📋</span>
        <span style={{ fontSize: 9, fontWeight: 900, color: '#fff' }}>ミッション</span>
        {DAILY_MISSIONS.some((m) => {
          const today = new Date().toISOString().slice(0, 10)
          const prog = daily.missionDate === today ? daily.missionProgress : {}
          return (prog[m.id] || 0) >= m.goal && !daily.missionClaimed.includes(m.id)
        }) && <span style={s.spotBadge}>!</span>}
      </button>

      {/* ══════════ マップホットスポット ══════════ */}
      <MapSpot top="20%" left="28%" label="山探索" icon="🔍" color="#7c3aed"
        onClick={() => { sfx.confirm(); navigate('/explore') }} />
      <MapSpot top="14%" left="58%" label="登山" icon="⛰️" color="#1d4ed8"
        onClick={() => { sfx.confirm(); navigate('/climbing') }} />
      <MapSpot top="32%" left="72%" label="アルバム" icon="🖼️" color="#db2777"
        onClick={() => { sfx.confirm(); navigate('/album') }} />
      <MapSpot top="50%" left="15%" label="トレーニング" icon="💪" color="#d97706"
        onClick={() => { sfx.confirm(); navigate('/training') }} />
      <MapSpot top="56%" left="55%" label="山整備" icon="🪚" color="#059669"
        badge={needsMaintenance} onClick={() => { sfx.confirm(); navigate('/maintenance') }} />
      <MapSpot top="60%" left="80%" label="AR撮影" icon="📷" color="#0891b2"
        locked={!flags.arUnlocked} size="sm"
        onClick={() => { if (flags.arUnlocked) { sfx.confirm(); navigate('/ar') } else sfx.miss() }} />

      {/* ══════════ キャラクター ══════════ */}
      <div style={s.charWrap}>
        <div style={{ animation: 'charFloat 3.4s ease-in-out infinite' }}>
          <img src={homePose} alt="先輩" style={{ height: 170, display: 'block', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.35))' }} draggable={false} />
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
      <button style={s.menuBtn} onClick={() => { sfx.tap(); setMenuOpen(true) }}>
        <span style={{ fontSize: 16 }}>☰</span>
        <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>Menu</span>
      </button>

      {menuOpen && <MenuPopup onClose={() => setMenuOpen(false)} navigate={navigate} />}
      {missionOpen && <MissionPanel onClose={() => setMissionOpen(false)} />}
      {loginBonus && (
        <LoginBonusModal streak={loginBonus.streak} bonus={loginBonus.bonus}
          onClose={() => setLoginBonus(null)} />
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

  /* ─── ミッションFAB（左側） ─── */
  missionFab: {
    position: 'absolute', top: 64, left: 12,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    background: 'linear-gradient(135deg, rgba(10,20,60,0.82), rgba(30,10,80,0.78))',
    border: '1.5px solid rgba(245,200,66,0.5)',
    borderRadius: 14, padding: '8px 10px',
    cursor: 'pointer', zIndex: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
    backdropFilter: 'blur(8px)',
    WebkitTapHighlightColor: 'transparent',
  },

  /* ─── ログインボーナス ─── */
  loginCard: {
    background: 'linear-gradient(180deg, #1e1e40 0%, #12122a 100%)',
    border: '2px solid rgba(245,200,66,0.55)',
    borderRadius: 24, padding: '0 24px 28px',
    width: 'calc(100% - 56px)', maxWidth: 330,
    textAlign: 'center',
    boxShadow: '0 12px 60px rgba(0,0,0,0.7), 0 0 40px rgba(245,200,66,0.15)',
    animation: 'popIn 0.45s cubic-bezier(.22,1,.36,1)',
    margin: 'auto',
    alignSelf: 'center',
  },
  loginRibbon: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #f5c842, #e0a800)',
    color: '#1a0e00', fontSize: 13, fontWeight: 900, letterSpacing: 1,
    borderRadius: '0 0 14px 14px', padding: '8px 22px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  },
  loginStreakRow: {
    display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8,
  },
  loginDay: {
    width: 32, height: 32, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 900,
    border: '1px solid rgba(255,255,255,0.1)',
  },

  /* ─── ミッション ─── */
  missionRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 14, padding: '12px 14px', marginBottom: 10,
  },
  missionLabel: { color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 6 },
  missionBarBg: {
    height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden',
  },
  missionBarFill: {
    height: '100%', background: 'linear-gradient(90deg, #2ecc71, #7ee8a5)',
    borderRadius: 99, transition: 'width 0.5s ease',
    boxShadow: '0 0 6px rgba(46,204,113,0.7)',
  },
  missionProgressText: { color: '#889', fontSize: 10, marginTop: 4 },
  missionBtn: {
    border: 'none', borderRadius: 12,
    padding: '9px 14px', fontSize: 12, fontWeight: 900,
    flexShrink: 0, letterSpacing: 0.5,
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
