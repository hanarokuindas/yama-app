import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import coursesData from '../data/courses.json'
import itemsData from '../data/items.json'
import ClimbingGame from '../games/ClimbingGame'
import { Confetti } from '../components/Celebration'

const MOUNTAINS = [
  { id: 'takao', name: '高尾山', emoji: '🌲', color: '#27ae60' },
  { id: 'yatsugatake', name: '八ヶ岳連峰', emoji: '⛰️', color: '#7f8c8d' },
  { id: 'hakone', name: '箱根山', emoji: '🌋', color: '#c0392b' },
]

// 温泉 300pt 回復
const ONSEN_COST = 300
const ONSEN_RECOVER = 5

// お土産一覧
const SOUVENIRS = [
  { id: 'takao_manju', name: '高尾まんじゅう', price: 200, mountainId: 'takao', emoji: '🍡' },
  { id: 'yatsu_beer', name: '八ヶ岳地ビール', price: 500, mountainId: 'yatsugatake', emoji: '🍺' },
  { id: 'hakone_yosegi', name: '箱根寄木細工', price: 800, mountainId: 'hakone', emoji: '🎁' },
]

// ──────────────────────────────────────────
// 装備チェック画面
// ──────────────────────────────────────────
function EquipmentCheck({ course, onReady, onBack }) {
  const inventory = useGameStore((s) => s.inventory)
  const ownedIds = new Set(inventory.map((i) => i.id))
  const required = course.requiredItems || []
  const allOk = required.every((id) => ownedIds.has(id))

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>装備チェック</h3>
      <p style={{ color: '#ccc', fontSize: 13, marginBottom: 12 }}>{course.mountainName} / {course.name}</p>
      <div style={styles.equipList}>
        {required.map((id) => {
          const item = itemsData.find((i) => i.id === id)
          const ok = ownedIds.has(id)
          return (
            <div key={id} style={{ ...styles.equipRow, opacity: ok ? 1 : 0.6 }}>
              <span>{item?.icon || '📦'} {item?.name || id}</span>
              <span>{ok ? '✅' : '❌'}</span>
            </div>
          )
        })}
      </div>
      {!allOk && (
        <p style={{ color: '#e74c3c', fontSize: 13, margin: '8px 0' }}>
          装備が足りません。ショップで揃えてから来てね！
        </p>
      )}
      <button
        style={{ ...styles.primaryBtn, opacity: allOk ? 1 : 0.5 }}
        disabled={!allOk}
        onClick={onReady}
      >
        出発！
      </button>
      <button style={styles.backBtn} onClick={onBack}>戻る</button>
    </div>
  )
}

// ──────────────────────────────────────────
// 温泉画面
// ──────────────────────────────────────────
function OnsenScreen({ onNext, onSkip }) {
  const spendPoints = useGameStore((s) => s.spendPoints)
  const recover = useGameStore((s) => s.recover)
  const [used, setUsed] = useState(false)

  const handleOnsen = () => {
    if (spendPoints(ONSEN_COST)) {
      recover(ONSEN_RECOVER)
      setUsed(true)
    } else {
      alert('ポイントが足りません')
    }
  }

  return (
    <div style={styles.card}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>♨️</div>
      <h3 style={styles.cardTitle}>お疲れさま！温泉へどうぞ</h3>
      {!used ? (
        <>
          <p style={{ color: '#ccc', fontSize: 14, marginBottom: 16 }}>
            入湯料 {ONSEN_COST}pt で体力が回復するよ！
          </p>
          <button style={styles.primaryBtn} onClick={handleOnsen}>
            入湯する（{ONSEN_COST}pt）
          </button>
          <button style={styles.backBtn} onClick={onSkip}>スキップ</button>
        </>
      ) : (
        <>
          <p style={{ color: '#27ae60', fontSize: 16, marginBottom: 16 }}>
            体力が回復した！（各ステータス +{ONSEN_RECOVER}）
          </p>
          <button style={styles.primaryBtn} onClick={onNext}>次へ</button>
        </>
      )}
    </div>
  )
}

// ──────────────────────────────────────────
// お土産画面
// ──────────────────────────────────────────
function SouvenirScreen({ mountainId, onDone }) {
  const addPoints = useGameStore((s) => s.addPoints)
  const spendPoints = useGameStore((s) => s.spendPoints)
  const [bought, setBought] = useState([])

  const souvenirs = SOUVENIRS.filter((s) => s.mountainId === mountainId)

  const handleBuy = (s) => {
    if (bought.includes(s.id)) return
    if (!spendPoints(s.price)) return alert('ポイントが足りません')
    // お供えボーナス
    addPoints(Math.floor(s.price * 0.3))
    setBought([...bought, s.id])
  }

  return (
    <div style={styles.card}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🎁</div>
      <h3 style={styles.cardTitle}>お土産コーナー</h3>
      <p style={{ color: '#ccc', fontSize: 13, marginBottom: 16 }}>
        買うと山神へのお供えになり、ご利益ボーナスがもらえるよ！
      </p>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {souvenirs.map((s) => (
          <div key={s.id} style={styles.souvenirRow}>
            <span style={{ fontSize: 24 }}>{s.emoji}</span>
            <span style={{ flex: 1, color: '#fff', fontSize: 14 }}>{s.name}</span>
            <span style={{ color: '#ffd700', fontSize: 13, marginRight: 8 }}>{s.price}pt</span>
            <button
              style={{ ...styles.buyBtn, opacity: bought.includes(s.id) ? 0.5 : 1 }}
              onClick={() => handleBuy(s)}
              disabled={bought.includes(s.id)}
            >
              {bought.includes(s.id) ? '購入済' : '買う'}
            </button>
          </div>
        ))}
      </div>
      <button style={styles.primaryBtn} onClick={onDone}>ホームへ戻る</button>
    </div>
  )
}

// ──────────────────────────────────────────
// 登山メイン
// ──────────────────────────────────────────
export default function Climbing() {
  const navigate = useNavigate()
  const player = useGameStore((s) => s.player)
  const mountains = useGameStore((s) => s.mountains)
  const flags = useGameStore((s) => s.flags)
  const completeCourse = useGameStore((s) => s.completeCourse)
  const setMountainAccessed = useGameStore((s) => s.setMountainAccessed)
  const addAlbumEntry = useGameStore((s) => s.addAlbumEntry)
  const unlockAR = useGameStore((s) => s.unlockAR)
  const addPoints = useGameStore((s) => s.addPoints)

  const [phase, setPhase] = useState('mountain') // mountain / course / intro / equip / game / result / onsen / souvenir
  const [selectedMountain, setSelectedMountain] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [gameResult, setGameResult] = useState(null) // success / early_fail / mid_fail / balance_fail

  const total = Math.floor((player.core + player.legs + player.arms) / 3)

  const handleSelectMountain = (m) => {
    setSelectedMountain(m)
    if (!mountains[m.id]?.firstAccessed) {
      setMountainAccessed(m.id)
      setPhase('intro')
    } else {
      setPhase('course')
    }
  }

  const handleGameComplete = (result) => {
    setGameResult(result)
    if (result === 'success') {
      completeCourse(selectedMountain.id, selectedCourse.id)
      addPoints(selectedCourse.reward)
      addAlbumEntry({ mountainId: selectedMountain.id, courseId: selectedCourse.id, courseName: selectedCourse.name, mountainName: selectedMountain.name })
      if (!flags.arUnlocked) unlockAR()
    }
    setPhase('result')
  }

  const courses = coursesData.filter((c) => c.mountainId === selectedMountain?.id)
  const summited = mountains[selectedMountain?.id]?.summitedCourses || []

  // ── 山選択 ──
  if (phase === 'mountain') {
    return (
      <div style={styles.container}>
        <div style={styles.pageTitle}>CLIMBING</div>
        <div style={styles.list}>
          {MOUNTAINS.map((m) => {
            const unlocked = mountains[m.id]?.unlocked
            return (
              <button
                key={m.id}
                style={{ ...styles.mountainCard, borderColor: unlocked ? m.color : '#555', opacity: unlocked ? 1 : 0.5 }}
                onClick={() => unlocked && handleSelectMountain(m)}
                disabled={!unlocked}
              >
                <span style={{ fontSize: 40 }}>{m.emoji}</span>
                <div>
                  <div style={styles.mountainName}>{m.name}</div>
                  {!unlocked && <div style={{ color: '#888', fontSize: 12 }}>🔒 未解禁</div>}
                </div>
                {unlocked && <span style={{ color: m.color, fontSize: 20 }}>›</span>}
              </button>
            )
          })}
        </div>
        <button style={styles.shopLink} onClick={() => navigate('/shop')}>🛒 登山ショップへ</button>
      </div>
    )
  }

  // ── 山紹介（初回のみ） ──
  if (phase === 'intro') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <span style={{ fontSize: 56 }}>{selectedMountain.emoji}</span>
          <h3 style={styles.cardTitle}>{selectedMountain.name}</h3>
          <p style={{ color: '#ddd', lineHeight: 1.8, marginBottom: 20 }}>
            {`はじめまして！ ${selectedMountain.name}だよ。\nたくさん遊びに来てね！`}
          </p>
          <button style={styles.primaryBtn} onClick={() => setPhase('course')}>コース選択へ</button>
        </div>
      </div>
    )
  }

  // ── コース選択 ──
  if (phase === 'course') {
    return (
      <div style={styles.container}>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 900, padding: '18px 0 4px' }}>{selectedMountain.name}</h2>
        <p style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>総合体力: {total}</p>
        <div style={styles.list}>
          {courses.map((c) => {
            const done = summited.includes(c.id)
            const reqTotal = c.requiredStamina * 5
            const canTry = total >= reqTotal * 0.5
            return (
              <button
                key={c.id}
                style={{ ...styles.courseCard, opacity: canTry ? 1 : 0.6 }}
                onClick={() => { setSelectedCourse(c); setPhase('equip') }}
              >
                <div style={styles.courseHeader}>
                  <span style={styles.courseName}>{c.name} {done ? '🏔️' : ''}</span>
                  <span style={styles.diff}>{'★'.repeat(c.difficulty)}</span>
                </div>
                <div style={{ color: '#ccc', fontSize: 12 }}>{c.description}</div>
                <div style={styles.courseFooter}>
                  <span style={{ color: '#aaa', fontSize: 12 }}>推奨体力: {reqTotal}</span>
                  <span style={{ color: '#ffd700', fontSize: 12 }}>🏆 {c.reward}pt</span>
                </div>
              </button>
            )
          })}
        </div>
        <button style={styles.backBtn} onClick={() => setPhase('mountain')}>← 山選択へ</button>
      </div>
    )
  }

  // ── 装備チェック ──
  if (phase === 'equip') {
    return (
      <div style={styles.container}>
        <EquipmentCheck
          course={selectedCourse}
          onReady={() => setPhase('game')}
          onBack={() => setPhase('course')}
        />
      </div>
    )
  }

  // ── ミニゲーム ──
  if (phase === 'game') {
    return (
      <div style={styles.container}>
        <ClimbingGame
          course={selectedCourse}
          player={player}
          onComplete={handleGameComplete}
        />
      </div>
    )
  }

  // ── 結果 ──
  if (phase === 'result') {
    const success = gameResult === 'success'
    const messages = {
      success: `🏔️ 登頂成功！ +${selectedCourse.reward}pt`,
      early_fail: '体力不足でここまでが限界だった…トレーニングを積もう！',
      mid_fail: 'もう一息だった！もっとトレーニングしてリベンジだ！',
      balance_fail: 'バランスが崩れて転倒！苦手なトレーニングを補強しよう！',
    }
    return (
      <div style={styles.container}>
        {success && <Confetti count={50} />}
        <div style={styles.card}>
          <span style={{ fontSize: 56, animation: success ? 'popIn 0.5s ease' : 'none', display: 'inline-block' }}>{success ? '🎊' : '😓'}</span>
          <h3 style={styles.cardTitle}>{success ? '登頂成功！' : '脱落…'}</h3>
          <p style={{ color: success ? '#2ecc71' : '#e74c3c', fontSize: 15, lineHeight: 1.6 }}>
            {messages[gameResult]}
          </p>
          {success ? (
            <button style={styles.primaryBtn} onClick={() => setPhase('onsen')}>♨️ 温泉へ</button>
          ) : (
            <button style={styles.primaryBtn} onClick={() => setPhase('mountain')}>ホームへ</button>
          )}
        </div>
      </div>
    )
  }

  // ── 温泉 ──
  if (phase === 'onsen') {
    return (
      <div style={styles.container}>
        <OnsenScreen
          onNext={() => setPhase('souvenir')}
          onSkip={() => setPhase('souvenir')}
        />
      </div>
    )
  }

  // ── お土産 ──
  if (phase === 'souvenir') {
    return (
      <div style={styles.container}>
        <SouvenirScreen
          mountainId={selectedMountain.id}
          onDone={() => navigate('/')}
        />
      </div>
    )
  }

  return null
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #0d1a2a 50%, #0a1a12 100%)',
    paddingBottom: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  pageTitle: { color: '#f5c842', fontSize: 12, fontWeight: 700, letterSpacing: 3, padding: '18px 0 10px' },
  list: { width: 'calc(100% - 32px)', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 },
  mountainCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid',
    borderRadius: 16,
    padding: '16px 20px',
    cursor: 'pointer',
    textAlign: 'left',
    justifyContent: 'space-between',
  },
  mountainName: { color: '#fff', fontSize: 18, fontWeight: 900 },
  courseCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: '14px 16px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  courseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  courseName: { color: '#fff', fontSize: 16, fontWeight: 900 },
  diff: { color: '#f5c842' },
  courseFooter: { display: 'flex', justifyContent: 'space-between', marginTop: 4 },
  card: {
    margin: '32px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(245,200,66,0.2)',
    borderRadius: 24,
    padding: '28px 24px',
    width: 'calc(100% - 32px)',
    maxWidth: 340,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    backdropFilter: 'blur(12px)',
    boxShadow: '0 0 40px rgba(123,92,240,0.15)',
  },
  cardTitle: { color: '#fff', fontSize: 22, fontWeight: 900, margin: 0 },
  equipList: { width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 },
  equipRow: {
    display: 'flex',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: '8px 12px',
    color: '#fff',
    fontSize: 14,
  },
  souvenirRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: '10px 12px',
  },
  buyBtn: {
    padding: '6px 14px',
    background: 'linear-gradient(135deg, #f5c842, #e0a800)',
    color: '#3a2a00',
    border: 'none',
    borderRadius: 16,
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
  },
  shopLink: {
    color: '#f5c842',
    background: 'rgba(245,200,66,0.1)',
    border: '1px solid rgba(245,200,66,0.3)',
    borderRadius: 20,
    padding: '9px 22px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
  },
  primaryBtn: {
    width: '100%',
    padding: '14px 0',
    background: 'linear-gradient(135deg, #2ecc71, #1a8a47)',
    color: '#fff',
    border: 'none',
    borderRadius: 30,
    fontSize: 16,
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(46,204,113,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
  },
  backBtn: {
    width: '100%',
    padding: '11px 0',
    background: 'rgba(255,255,255,0.08)',
    color: '#aab',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 30,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
  },
}
