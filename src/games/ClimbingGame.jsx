import { useState, useEffect, useCallback } from 'react'

// ステージ定義
const STAGE_TYPES = [
  {
    key: 'rocky',
    name: '岩場',
    emoji: '🪨',
    bg: 'linear-gradient(180deg, #2c2c54 0%, #40407a 100%)',
    items: ['🪨', '💎', '⛏️', '🦇', '🔮'],
    target: '💎',
    desc: '光る宝石を見つけてタップ！',
    statKey: 'arms', // 腕力が影響
  },
  {
    key: 'trail',
    name: '登山道',
    emoji: '🌿',
    bg: 'linear-gradient(180deg, #1a3a1a 0%, #2d5a1b 100%)',
    items: ['🌿', '🍄', '🦋', '🐾', '🌸'],
    target: '🌸',
    desc: '山の花を見つけてタップ！',
    statKey: 'legs', // 脚力が影響
  },
  {
    key: 'meadow',
    name: '草原',
    emoji: '🌼',
    bg: 'linear-gradient(180deg, #1a3a0a 0%, #3a6b1a 100%)',
    items: ['🌼', '🦗', '🌺', '🍀', '🌻'],
    target: '🌻',
    desc: 'ひまわりを見つけてタップ！',
    statKey: 'core', // 体幹が影響
  },
]

// コースのステージ構成（難易度に応じて）
function buildStages(difficulty) {
  if (difficulty <= 1) return ['trail', 'meadow', 'rocky']
  if (difficulty === 2) return ['rocky', 'trail', 'meadow', 'rocky']
  return ['rocky', 'trail', 'meadow', 'rocky', 'trail']
}

// ステータスに基づく制限時間
function calcTimeLimit(stageType, player) {
  const base = 20
  const stat = player[stageType.statKey] || 0
  const bonus = Math.min(20, Math.floor(stat / 10))
  return base + bonus
}

// ランダムなアイテム配置
function generateItems(stage, count = 8) {
  const nonTargets = stage.items.filter((e) => e !== stage.target)
  const arr = []
  // ターゲットを2〜3個含める
  const targetCount = 2 + Math.floor(Math.random() * 2)
  for (let i = 0; i < targetCount; i++) arr.push(stage.target)
  while (arr.length < count) {
    arr.push(nonTargets[Math.floor(Math.random() * nonTargets.length)])
  }
  // シャッフル＋座標
  return arr
    .sort(() => Math.random() - 0.5)
    .map((emoji, idx) => ({
      id: idx,
      emoji,
      isTarget: emoji === stage.target,
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 70,
      tapped: false,
    }))
}

// ──────────────────────────────────────────
// ステージゲーム本体
// ──────────────────────────────────────────
function StagePlay({ stage, player, onClear, onFail }) {
  const timeLimit = calcTimeLimit(stage, player)
  const [items, setItems] = useState(() => generateItems(stage))
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [tapped, setTapped] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          onFail('time')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const handleTap = (item) => {
    if (tapped.includes(item.id)) return
    const newTapped = [...tapped, item.id]
    setTapped(newTapped)

    if (item.isTarget) {
      setMessage('+OK!')
      // 全ターゲット取得でクリア
      const remainTargets = items.filter((i) => i.isTarget && !newTapped.includes(i.id))
      if (remainTargets.length === 0) {
        setTimeout(() => onClear(), 500)
      }
    } else {
      setMessage('違う！')
    }
    setTimeout(() => setMessage(''), 800)
  }

  const targets = items.filter((i) => i.isTarget && !tapped.includes(i.id))
  const pct = (timeLeft / timeLimit) * 100

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* ヘッダー */}
      <div style={stageStyles.header}>
        <span style={{ color: '#fff', fontWeight: 'bold' }}>{stage.emoji} {stage.name}</span>
        <span style={{ color: pct < 30 ? '#e74c3c' : '#fff', fontWeight: 'bold' }}>{timeLeft}秒</span>
      </div>
      {/* タイマーバー */}
      <div style={stageStyles.timerBar}>
        <div style={{ ...stageStyles.timerFill, width: `${pct}%`, background: pct < 30 ? '#e74c3c' : '#27ae60' }} />
      </div>
      {/* 指示 */}
      <div style={stageStyles.instr}>
        <span style={{ fontSize: 28 }}>{stage.target}</span>
        <span style={{ color: '#fff', fontSize: 14 }}>{stage.desc}</span>
        <span style={{ color: '#ffd700', fontSize: 13 }}>残り {targets.length}個</span>
      </div>
      {/* ゲームフィールド */}
      <div style={{ ...stageStyles.field, background: stage.bg }}>
        {items.map((item) => {
          const done = tapped.includes(item.id)
          return (
            <button
              key={item.id}
              onClick={() => handleTap(item)}
              style={{
                position: 'absolute',
                left: `${item.x}%`,
                top: `${item.y}%`,
                fontSize: 32,
                background: 'none',
                border: 'none',
                cursor: done ? 'default' : 'pointer',
                opacity: done ? 0.2 : 1,
                transition: 'opacity 0.3s',
                transform: 'translate(-50%, -50%)',
              }}
              disabled={done}
            >
              {item.emoji}
            </button>
          )
        })}
        {message && (
          <div style={stageStyles.floatMsg}>{message}</div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// 登山ゲーム全体制御
// ──────────────────────────────────────────
export default function ClimbingGame({ course, player, onComplete }) {
  const stages = buildStages(course.difficulty)
  const [stageIdx, setStageIdx] = useState(0)
  const [cleared, setCleared] = useState([])
  const [phase, setPhase] = useState('intro') // intro / playing / between / summit / fail
  const [failReason, setFailReason] = useState('')

  const total = Math.floor((player.core + player.legs + player.arms) / 3)
  const reqTotal = course.requiredStamina * 5
  const currentStageKey = stages[stageIdx]
  const currentStage = STAGE_TYPES.find((s) => s.key === currentStageKey)

  // ステージ間の体力チェック
  const checkStamina = useCallback((completedIdx) => {
    const progress = (completedIdx + 1) / stages.length
    const required = reqTotal * progress
    if (total < required * 0.5) return 'early_fail'
    const coreRatio = player.core / Math.max(1, total)
    const legsRatio = player.legs / Math.max(1, total)
    if (coreRatio < 0.2 || legsRatio < 0.2) return 'balance_fail'
    return null
  }, [total, reqTotal, player])

  const handleStageClear = () => {
    const newCleared = [...cleared, currentStageKey]
    setCleared(newCleared)
    const check = checkStamina(stageIdx)
    if (check && stageIdx < stages.length - 1) {
      setFailReason(check)
      setPhase('fail')
      return
    }
    if (stageIdx >= stages.length - 1) {
      if (total >= reqTotal) {
        setPhase('summit')
      } else {
        setFailReason('mid_fail')
        setPhase('fail')
      }
    } else {
      setPhase('between')
    }
  }

  const handleStageFail = () => {
    setFailReason('early_fail')
    setPhase('fail')
  }

  const handleNextStage = () => {
    setStageIdx(stageIdx + 1)
    setPhase('playing')
  }

  if (phase === 'intro') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <span style={{ fontSize: 48 }}>⛰️</span>
          <h3 style={styles.title}>{course.mountainName}</h3>
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{course.name}</p>
          <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6 }}>{course.description}</p>
          <div style={styles.infoBox}>
            <p style={styles.infoRow}>📏 {course.distance}km</p>
            <p style={styles.infoRow}>⏱ {course.duration}</p>
            <p style={styles.infoRow}>🔥 約{course.calories}kcal</p>
            <p style={styles.infoRow}>📊 {stages.length}ステージ</p>
          </div>
          <p style={{ color: '#ffd700', fontSize: 13 }}>あなたの総合体力: {total} / 推奨: {reqTotal}</p>
          <button style={styles.primaryBtn} onClick={() => setPhase('playing')}>
            登山スタート！
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'playing') {
    return (
      <div style={styles.container}>
        <div style={styles.progressBar}>
          {stages.map((s, i) => {
            const st = STAGE_TYPES.find((t) => t.key === s)
            return (
              <div key={i} style={{ ...styles.progressStep, background: i <= stageIdx ? '#27ae60' : 'rgba(255,255,255,0.2)' }}>
                {st?.emoji}
              </div>
            )
          })}
        </div>
        <StagePlay
          stage={currentStage}
          player={player}
          onClear={handleStageClear}
          onFail={handleStageFail}
        />
      </div>
    )
  }

  if (phase === 'between') {
    const nextStage = STAGE_TYPES.find((s) => s.key === stages[stageIdx + 1])
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <span style={{ fontSize: 40 }}>✅</span>
          <h3 style={styles.title}>{currentStage?.name} クリア！</h3>
          <p style={{ color: '#ccc', fontSize: 14 }}>次のエリア: {nextStage?.emoji} {nextStage?.name}</p>
          <p style={{ color: '#aaa', fontSize: 13 }}>
            ステージ {stageIdx + 1}/{stages.length}
          </p>
          <button style={styles.primaryBtn} onClick={handleNextStage}>次へ進む</button>
        </div>
      </div>
    )
  }

  if (phase === 'summit') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <span style={{ fontSize: 56 }}>🏔️</span>
          <h3 style={styles.title}>登頂成功！</h3>
          <p style={{ color: '#ffd700', fontSize: 16 }}>全{stages.length}ステージ完走！</p>
          <p style={{ color: '#2ecc71', fontSize: 20, fontWeight: 'bold' }}>+{course.reward}pt</p>
          <button style={styles.primaryBtn} onClick={() => onComplete('success')}>結果へ</button>
        </div>
      </div>
    )
  }

  if (phase === 'fail') {
    const msgs = {
      early_fail: '疲労によりこれ以上は進めない…体力レベルを上げてね！',
      mid_fail: 'もう一息だった！もっとトレーニングしてリベンジだ！',
      balance_fail: 'バランスが崩れて転んだ…苦手なトレーニングを補強しよう！',
      time: '時間切れ…もっと素早く行動しよう！',
    }
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <span style={{ fontSize: 56 }}>😓</span>
          <h3 style={styles.title}>脱落…</h3>
          <p style={{ color: '#e74c3c', fontSize: 14, lineHeight: 1.6 }}>
            {msgs[failReason] || 'またチャレンジしてね！'}
          </p>
          <button style={styles.primaryBtn} onClick={() => onComplete(failReason)}>戻る</button>
        </div>
      </div>
    )
  }

  return null
}

const stageStyles = {
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 16px',
    background: 'rgba(0,0,0,0.5)',
    boxSizing: 'border-box',
  },
  timerBar: { width: '100%', height: 6, background: 'rgba(255,255,255,0.2)' },
  timerFill: { height: '100%', transition: 'width 0.9s linear, background 0.3s' },
  instr: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 16px',
    background: 'rgba(0,0,0,0.4)',
    width: '100%',
    boxSizing: 'border-box',
  },
  field: {
    position: 'relative',
    width: '100%',
    height: 360,
    overflow: 'hidden',
  },
  floatMsg: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#ffd700',
    fontSize: 24,
    fontWeight: 'bold',
    pointerEvents: 'none',
    textShadow: '1px 2px 4px rgba(0,0,0,0.8)',
  },
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #2d4a3e 100%)',
    paddingBottom: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  card: {
    margin: '32px 16px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '28px 24px',
    width: 'calc(100% - 32px)',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    backdropFilter: 'blur(8px)',
    textAlign: 'center',
  },
  title: { color: '#fff', fontSize: 22, margin: 0 },
  infoBox: { width: '100%', background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '8px 16px' },
  infoRow: { color: '#ddd', fontSize: 14, margin: '4px 0' },
  primaryBtn: {
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
  progressBar: {
    display: 'flex',
    gap: 4,
    padding: '8px 16px',
    width: '100%',
    boxSizing: 'border-box',
    justifyContent: 'center',
  },
  progressStep: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
  },
}
