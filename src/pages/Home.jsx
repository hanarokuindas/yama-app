import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import characters from '../data/characters.json'
import { DAILY_MISSIONS, todayString } from '../data/missions'
import GameIcon from '../components/GameIcon'
import CountUp from '../components/CountUp'
import { Celebration, Confetti } from '../components/Celebration'
import { BG } from '../assets/backgrounds'
import { UI } from '../assets/ui'
import { senpaiPose, senpaiMini } from '../assets/characters/senpai'
import { takaoPose } from '../assets/characters/takao'
import { yatsugatakePose } from '../assets/characters/yatsugatake'
import { hakonePose } from '../assets/characters/hakone'
import { sfx } from '../utils/sound'
import IntroStory from '../components/IntroStory'
import MissionWindow from '../components/MissionWindow'
import MenuWindow from '../components/MenuWindow'
import { Plank } from '../components/ui'
import { maintenanceState } from '../data/maintenanceActivities'

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

/* ─────────────────────── プロフィール設定 ─────────────────────── */
function ProfileScreen({ onComplete }) {
  const setPlayerName = useGameStore((s) => s.setPlayerName)
  const setPlayerWeight = useGameStore((s) => s.setPlayerWeight)
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!name.trim()) { sfx.miss(); return setError('ニックネームを入れてね') }
    const w = parseFloat(weight)
    if (weight.trim() && (isNaN(w) || w <= 0)) { sfx.miss(); return setError('体重は数字で入れてね（空欄でもOK）') }
    sfx.confirm()
    setPlayerName(name.trim())
    setPlayerWeight(weight.trim() ? w : null)
    onComplete()
  }

  return (
    <div style={s.fullOverlay}>
      <div style={s.profileCard}>
        <div style={s.profileSide}>
          <img src={senpaiMini.glassesSmile} alt="先輩" style={s.profileFace} draggable={false} />
          <h2 style={s.profileTitle}>キミのことを{'\n'}教えてね</h2>
        </div>
        <div style={s.profileForm}>
          <label style={s.formLabel}>ニックネーム</label>
          <input style={s.formInput} placeholder="例：やまびこ" value={name}
            onChange={(e) => { setName(e.target.value); setError('') }} maxLength={12} />
          <label style={s.formLabel}>体重 (kg)<span style={s.formOptional}>任意</span></label>
          <input style={s.formInput} type="number" inputMode="decimal" placeholder="例：60" value={weight}
            onChange={(e) => { setWeight(e.target.value); setError('') }} />
          <p style={s.formNote}>
            体重は、登山やトレーニングで使ったカロリーを計算するのに使うよ。
            空欄なら60kgとして計算するね。あとからメニューで変えられるよ
          </p>
          {error && <p style={s.formError}>{error}</p>}
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={handleSubmit}>決定！</button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────── ログインボーナス（木の看板） ─────────────────────── */
function LoginBonusModal({ streak, bonus, onClose }) {
  return (
    <div style={s.popupOverlay} onClick={() => { sfx.confirm(); onClose() }}>
      <Confetti count={30} />
      <div style={s.signboard} onClick={(e) => e.stopPropagation()}>
        <div className="icon-label" style={s.signTitle}>ログインボーナス</div>
        <div style={s.signDays}>
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <div key={d} style={{ ...s.signDay, ...(d <= streak ? s.signDayOn : null) }}>{d}</div>
          ))}
        </div>
        <div className="icon-label" style={s.signStreak}>{streak}日目のログイン！</div>
        <div style={s.signReward}>
          <GameIcon name="pcoin" size={44} />
          <span style={s.signAmount}>+{bonus.toLocaleString()}</span>
        </div>
        <button className="btn-primary" style={s.signBtn}
          onClick={() => { sfx.coin(); onClose() }}>うけとる！</button>
      </div>
    </div>
  )
}

/* ─────────────────────── 丸太にのせたアイコン ─────────────────────── */
function LogIcon({ label, icon, locked, badge, onClick, tut, small = false }) {
  return (
    <button style={s.logBtn} onClick={onClick} data-tut={tut}>
      <span style={{ ...s.logDisk, ...(small ? s.logDiskSmall : null) }}>
        <GameIcon name={locked ? 'lock' : icon} size={64}
          style={{ width: '74%', height: '74%', ...(locked ? { filter: 'grayscale(1)', opacity: 0.75 } : null) }} />
        {badge && <span style={s.badge}>!</span>}
      </span>
      <span className="icon-label" style={small ? s.logLabelSmall : s.logLabel}>{label}</span>
    </button>
  )
}

/* ─────────────────────── ホームメイン ─────────────────────── */
// ホームに出るキャラ。山神は、その山に初めて行ったあとから出る
const HOME_POSES = { senpai: senpaiPose.home, takao: takaoPose.home, yatsugatake: yatsugatakePose.home, hakone: hakonePose.home }

export default function Home() {
  const navigate = useNavigate()
  const player = useGameStore((st) => st.player)
  const flags = useGameStore((st) => st.flags)
  const mountains = useGameStore((st) => st.mountains)
  const completeIntro = useGameStore((st) => st.completeIntro)
  const completeProfile = useGameStore((st) => st.completeProfile)
  const applyMountainDecay = useGameStore((st) => st.applyMountainDecay)
  const checkDailyLogin = useGameStore((st) => st.checkDailyLogin)
  const unlockClimbing = useGameStore((st) => st.unlockClimbing)
  const daily = useGameStore((st) => st.daily)
  const tutorialActive = useGameStore((st) => st.tutorial !== null)
  const climbTutorialSeen = useGameStore((st) => !!st.tutorialSeen.climb)
  const startTutorial = useGameStore((st) => st.startTutorial)
  const [missionOpen, setMissionOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loginBonus, setLoginBonus] = useState(null)

  const [{ callName, greeting, homePose }] = useState(() => {
    const ids = Object.keys(HOME_POSES).filter(
      (id) => id === 'senpai' || mountains[id]?.firstAccessed
    )
    const id = ids[Math.floor(Math.random() * ids.length)]
    const poseSet = HOME_POSES[id]
    const pose = poseSet[Math.floor(Math.random() * poseSet.length)]
    // 吹き出しの名前は山神だけ（カタカナの呼び名）。先輩は名前を出さない
    return { callName: characters[id]?.callName || '', greeting: getGreeting(id), homePose: pose }
  })

  useEffect(() => { applyMountainDecay() }, [applyMountainDecay])

  // ログインボーナスはチュートリアルが終わってから出す
  const profileDone = flags.profileCompleted
  useEffect(() => {
    if (!profileDone || tutorialActive) return
    const t = setTimeout(() => {
      const result = checkDailyLogin()
      if (result) setLoginBonus(result)
    }, 600)
    return () => clearTimeout(t)
  }, [profileDone, tutorialActive, checkDailyLogin])

  const total = Math.floor((player.core + player.legs + player.arms) / 3)
  const level = Math.floor(total / 50) + 1
  const [levelUp, setLevelUp] = useState(null)
  const [prevLevel, setPrevLevel] = useState(level)
  if (level !== prevLevel) {
    setPrevLevel(level)
    if (level > prevLevel) setLevelUp(level)
  }

  // 登山解禁: 総合体力20以上で1回限り解禁演出（企画書p25）
  const CLIMB_UNLOCK_REQ = 20
  // 描画中にストアを書き換えると他の画面部品も更新されて React が警告するので、描画後に行う
  const reachedClimb = !flags.climbingUnlocked && total >= CLIMB_UNLOCK_REQ
  const [climbUnlockShow, setClimbUnlockShow] = useState(false)
  useEffect(() => {
    if (!reachedClimb) return
    unlockClimbing()
    setClimbUnlockShow(true) // eslint-disable-line react-hooks/set-state-in-effect -- 解禁した瞬間に1回だけ出す演出
  }, [reachedClimb, unlockClimbing])

  // 整備度が登山に響きはじめる（60%以下）山があれば知らせる
  const needsMaintenance = Object.values(mountains).some(
    (m) => m.unlocked && m.firstAccessed && maintenanceState(m.maintenanceLevel).penalty > 0
  )

  const missionToday = daily.missionDate === todayString()
  const missionReady = missionToday && DAILY_MISSIONS.some(
    (m) => (daily.missionProgress[m.id] || 0) >= m.goal && !daily.missionClaimed.includes(m.id)
  )

  const go = (path) => { sfx.confirm(); navigate(path) }

  if (!flags.introCompleted) return <IntroStory returning={flags.profileCompleted} onComplete={completeIntro} />
  if (!flags.profileCompleted) return <ProfileScreen onComplete={completeProfile} />

  return (
    <div style={s.root}>
      <div style={s.bg} />

      {/* ══════════ 左上：Lv・名前・ポイント・炎・今日のミッション ══════════ */}
      <div style={s.statusArea} data-tut="home-stats">
        <Plank>
          <span style={s.lvChip}>Lv.{level}</span>
          <span className="icon-label" style={s.nameText}>{player.name || 'やまびこ'}さん</span>
        </Plank>
        <Plank>
          <GameIcon name="pcoin" size={32} style={s.plankIcon} />
          <CountUp value={player.points} style={s.pointNum} />
          <GameIcon name="flame" size={32} style={{ ...s.plankIcon, marginLeft: 10, transform: 'scale(1.4)' }} />
          <span className="icon-label" style={s.flameNum}>{total}</span>
        </Plank>
      </div>
      <Plank style={s.missionPlank} onClick={() => { sfx.tap(); setMissionOpen(true) }} tut="home-mission">
        <GameIcon name="clipboard" size={28} style={s.plankIcon} />
        <span className="icon-label" style={s.missionText}>今日のミッション</span>
        {missionReady && <span style={{ ...s.badge, top: -4, right: -4 }}>!</span>}
      </Plank>

      {/* ══════════ キャラクターと吹き出し ══════════ */}
      <div style={s.charWrap}>
        <div style={s.charFloat}>
          <img src={homePose} alt={callName || '先輩'} style={s.charImg} draggable={false} />
        </div>
      </div>
      {greeting && (
        <div style={s.bubble}>
          {callName && <div style={s.bubbleName}>{callName}</div>}
          <p style={s.bubbleText}>{greeting}</p>
          <div style={s.bubbleTail} />
        </div>
      )}

      {/* ══════════ 右上：AR撮影・メニュー ══════════ */}
      <div style={s.topRight}>
        <LogIcon small label="AR撮影" icon="camera" locked={!flags.arUnlocked}
          onClick={() => { if (flags.arUnlocked) go('/ar'); else sfx.miss() }} />
        <LogIcon small label="メニュー" icon="menu" tut="home-menu" onClick={() => { sfx.confirm(); setMenuOpen(true) }} />
      </div>

      {/* ══════════ 右：山探索・トレーニング・登山・山整備 ══════════ */}
      <div style={s.rightColumn}>
        <LogIcon label="山探索" icon="search" tut="spot-explore" onClick={() => go('/explore')} />
        <LogIcon label="トレーニング" icon="dumbbell" tut="spot-training" onClick={() => go('/training')} />
        <LogIcon label="登山" icon="hikinggear" tut="spot-climb" locked={!flags.climbingUnlocked}
          onClick={() => { if (flags.climbingUnlocked) go('/climbing'); else sfx.miss() }} />
        <LogIcon label="山整備" icon="chainsaw" badge={needsMaintenance} onClick={() => go('/maintenance')} />
      </div>

      {/* ══════════ 右下：アルバム・装備 ══════════ */}
      <div style={s.bottomRight}>
        <LogIcon label="アルバム" icon="albumbook" onClick={() => go('/album')} />
        <LogIcon label="装備" icon="trekkingshoes" onClick={() => go('/shop')} />
      </div>

      {missionOpen && <MissionWindow onClose={() => setMissionOpen(false)} />}
      {menuOpen && <MenuWindow onClose={() => setMenuOpen(false)} />}
      {loginBonus && (
        <LoginBonusModal streak={loginBonus.streak} bonus={loginBonus.bonus}
          onClose={() => setLoginBonus(null)} />
      )}

      {climbUnlockShow && (
        <Celebration
          icon={<GameIcon name="mountain" size={80} />}
          title="登山が解禁された！"
          subtitle="まずは「ふもとの里山」（推奨体力30）で登山に慣れよう！"
          onClose={() => {
            setClimbUnlockShow(false)
            if (!climbTutorialSeen && !tutorialActive) startTutorial('climb')
          }}
        />
      )}

      {levelUp && (
        <Celebration
          icon={<GameIcon name="trophy" size={80} />}
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
   大きさは画面の高さ（cqh）を基準にして、スマホでもパソコンでも同じ見た目にする
══════════════════════════════════════════════════════ */
const ICON = 'clamp(44px, 14cqh, 104px)'       // 右の丸太アイコン
const ICON_SM = 'clamp(36px, 10.5cqh, 78px)'   // 右上の小さい丸太アイコン
const FS = (cqh, min, max) => `clamp(${min}px, ${cqh}cqh, ${max}px)`

const s = {
  root: {
    position: 'relative',
    width: '100%',
    height: '100cqh',
    overflow: 'hidden',
    userSelect: 'none',
  },
  bg: {
    position: 'absolute', inset: 0,
    backgroundImage: `url(${BG.home})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center 40%',
  },

  /* ─── 左上 ─── */
  statusArea: {
    position: 'absolute', top: '2.5cqh', left: '1.5cqw', zIndex: 20,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1cqh',
  },
  plankIcon: { width: 'clamp(22px, 7cqh, 42px)', height: 'clamp(22px, 7cqh, 42px)' },
  lvChip: {
    background: 'linear-gradient(135deg, #f8c537, #e0a000)',
    color: '#4a2e00', fontWeight: 800, fontSize: FS(3.6, 12, 20),
    borderRadius: 99, padding: '1px 9px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  nameText: { fontSize: FS(4.6, 15, 26) },
  pointNum: {
    color: 'var(--yamabuki)', fontWeight: 800, fontSize: FS(5, 16, 28),
    textShadow: '0 0 2px #5a3a10, 0 0 2px #5a3a10, 0 1px 2px #5a3a10',
    letterSpacing: 0.5,
  },
  flameNum: { fontSize: FS(5, 16, 28) },
  missionPlank: {
    position: 'absolute', top: 'calc(2.5cqh + 2 * clamp(34px, 10.5cqh, 66px) + 3cqh)', left: '1.5cqw', zIndex: 20,
    height: 'clamp(32px, 9.5cqh, 60px)',
  },
  missionText: { fontSize: FS(4, 13, 22) },

  /* ─── キャラクター ─── */
  charWrap: {
    position: 'absolute', bottom: 0, left: '46%', transform: 'translateX(-50%)',
    height: '90cqh', zIndex: 10,
    pointerEvents: 'none',
  },
  charFloat: { height: '100%', animation: 'charFloat 3.4s ease-in-out infinite' },
  charImg: {
    height: '100%', width: 'auto', display: 'block',
    filter: 'drop-shadow(0 8px 16px rgba(40,30,10,0.35))',
  },
  bubble: {
    position: 'absolute', left: '2cqw', bottom: '5cqh', zIndex: 15,
    width: 'min(31cqw, 400px)',
    background: '#fffdf7',
    borderRadius: 18, padding: 'clamp(8px, 3cqh, 18px) clamp(12px, 4cqh, 22px)',
    boxShadow: '0 4px 18px rgba(60,40,20,0.25)',
    border: '2px solid var(--beige-edge)',
  },
  bubbleName: {
    color: 'var(--brown-text)', fontSize: FS(3.6, 12, 18), fontWeight: 800,
    marginBottom: 2, letterSpacing: 1,
  },
  bubbleText: {
    color: 'var(--brown-text)', fontSize: FS(4.4, 14, 22), fontWeight: 700, lineHeight: 1.6,
    whiteSpace: 'pre-wrap', margin: 0,
  },
  bubbleTail: {
    position: 'absolute', right: -10, bottom: '32%',
    width: 16, height: 16,
    background: '#fffdf7',
    borderTop: '2px solid var(--beige-edge)',
    borderRight: '2px solid var(--beige-edge)',
    transform: 'rotate(45deg)',
  },

  /* ─── 右のアイコン ─── */
  topRight: {
    position: 'absolute', top: '2cqh', right: '1.5cqw', zIndex: 20,
    display: 'flex', gap: '1.5cqw',
  },
  rightColumn: {
    position: 'absolute', top: '22cqh', bottom: '2cqh', right: '1.5cqw', zIndex: 20,
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center',
    width: `calc(${ICON} + 4cqw)`,
  },
  bottomRight: {
    position: 'absolute', bottom: '2cqh', right: `calc(${ICON} + 7cqw)`, zIndex: 20,
    display: 'flex', gap: '2cqw',
  },
  logBtn: {
    position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  },
  logDisk: {
    position: 'relative',
    width: ICON, height: ICON,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: `url(${UI.logRound}) center / contain no-repeat`,
    filter: 'drop-shadow(0 3px 4px rgba(60,40,20,0.35))',
  },
  logDiskSmall: { width: ICON_SM, height: ICON_SM },
  logLabel: { fontSize: FS(3.8, 12, 20), marginTop: '-0.6cqh' },
  logLabelSmall: { fontSize: FS(3.2, 11, 17), marginTop: '-0.4cqh' },
  badge: {
    position: 'absolute', top: 0, right: 0,
    background: '#e74c3c', color: '#fff',
    borderRadius: '50%', width: 20, height: 20,
    fontSize: 13, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 0 2px #fff, 0 0 6px rgba(231,76,60,0.8)',
  },

  /* ─── ログインボーナス（木の看板） ─── */
  signboard: {
    position: 'relative',
    width: 'min(64cqw, 150cqh, 640px)', aspectRatio: '1400 / 818',
    background: `url(${UI.signboard}) center / 100% 100% no-repeat`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '2.2cqh',
    padding: '6% 8%',
    filter: 'drop-shadow(0 10px 24px rgba(40,25,10,0.5))',
    animation: 'popIn 0.45s cubic-bezier(.22,1,.36,1)',
    margin: 'auto',
  },
  signTitle: { fontSize: FS(6.4, 20, 40), letterSpacing: 3 },
  signDays: { display: 'flex', gap: 'clamp(4px, 1.4cqh, 10px)' },
  signDay: {
    width: 'clamp(26px, 8.5cqh, 52px)', height: 'clamp(26px, 8.5cqh, 52px)', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: FS(4, 13, 22), fontWeight: 800,
    background: 'rgba(250,244,232,0.85)', color: '#a8977f',
    border: '2px solid rgba(90,60,30,0.35)',
  },
  signDayOn: {
    background: 'linear-gradient(135deg, #f8c537, #e0a000)', color: '#4a2e00',
    border: '2px solid #fff3c4',
  },
  signStreak: { fontSize: FS(4, 13, 22) },
  signReward: { display: 'flex', alignItems: 'center', gap: 8, animation: 'popIn 0.5s 0.2s both' },
  signAmount: {
    color: 'var(--yamabuki)', fontSize: FS(8, 26, 48), fontWeight: 800,
    textShadow: '0 0 3px #5a3a10, 0 0 3px #5a3a10, 0 2px 3px #5a3a10',
  },
  signBtn: { width: 'auto', padding: '10px 40px', fontSize: FS(4.4, 14, 22) },

  /* ─── ポップアップ ─── */
  popupOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(40,28,14,0.45)',
    backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200,
  },
  /* ─── プロフィール入力 ─── */
  fullOverlay: {
    position: 'fixed', inset: 0,
    backgroundImage: `linear-gradient(rgba(40,28,14,0.35), rgba(40,28,14,0.45)), url(${BG.intro})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  profileCard: {
    display: 'flex', alignItems: 'center', gap: 'clamp(10px, 4cqw, 40px)',
    background: 'var(--beige)',
    border: '3px solid var(--beige-edge)',
    borderRadius: 24, padding: 'clamp(12px, 4cqh, 32px) clamp(16px, 4cqw, 40px)',
    width: 'min(720px, 94cqw)', maxHeight: '96cqh', overflowY: 'auto',
    boxShadow: '0 10px 40px rgba(40,25,10,0.45)',
  },
  profileSide: { flex: '0 0 34%', textAlign: 'center' },
  profileFace: {
    height: 'clamp(90px, 38cqh, 240px)', width: 'auto', display: 'block', margin: '0 auto 6px',
    filter: 'drop-shadow(0 6px 14px rgba(60,40,20,0.3))',
  },
  profileTitle: {
    color: 'var(--brown-text)', fontSize: FS(5.4, 18, 28), fontWeight: 800, whiteSpace: 'pre-wrap',
  },
  profileForm: { flex: 1, minWidth: 0 },
  formLabel: {
    display: 'block', textAlign: 'left', color: 'var(--brown-text)',
    fontSize: 13, fontWeight: 800, marginBottom: 4, marginTop: 10,
  },
  formOptional: { color: '#a8977f', marginLeft: 8, fontSize: 12 },
  formInput: {
    width: '100%', padding: '10px 12px',
    background: '#fff',
    border: '2px solid var(--beige-edge)',
    borderRadius: 12, color: 'var(--brown-text)', fontSize: 16, outline: 'none',
  },
  formNote: { color: '#7a6a5c', fontSize: 12, lineHeight: 1.6, textAlign: 'left', margin: '8px 0 0' },
  formError: { color: '#d0402b', fontSize: 13, fontWeight: 800, margin: '8px 0 0' },
}
