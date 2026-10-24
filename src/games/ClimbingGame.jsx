import { useState, useEffect, useRef } from 'react'
import GameIcon from '../components/GameIcon'
import { sfx } from '../utils/sound'
import { maintenanceState, requiredStaminaFor } from '../data/maintenanceActivities'
import { BG } from '../assets/backgrounds'

// ステージ定義
const STAGE_TYPES = [
  {
    key: 'rocky',
    name: '岩場',
    emoji: 'rock',
    bg: BG.stage.rocky,
    items: ['rock', 'gem', 'pickaxe', 'bat', 'orb'],
    target: 'gem',
    desc: '光る宝石を見つけてタップ！',
    statKey: 'arms', // 腕力が影響
  },
  {
    key: 'trail',
    name: '登山道',
    emoji: 'herb',
    bg: BG.stage.trail,
    items: ['herb', 'mushroom', 'butterfly', 'paw', 'blossom'],
    target: 'blossom',
    desc: '山の花を見つけてタップ！',
    statKey: 'legs', // 脚力が影響
  },
  {
    key: 'meadow',
    name: '草原',
    emoji: 'daisy',
    bg: BG.stage.meadow,
    items: ['daisy', 'cricket', 'hibiscus', 'clover', 'sunflower'],
    target: 'sunflower',
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

const ITEM_COUNT = 14   // 1ステージに散らばる数
const MISS_PENALTY = 3  // ちがうものをタップしたら減る秒数

// ステータスに基づく制限時間
function calcTimeLimit(stageType, player) {
  const base = 15
  const stat = player[stageType.statKey] || 0
  const bonus = Math.min(15, Math.floor(stat / 10))
  return base + bonus
}

// ランダムなアイテム配置
function generateItems(stage, count = ITEM_COUNT) {
  const nonTargets = stage.items.filter((e) => e !== stage.target)
  const arr = []
  // ターゲットを3〜4個含める
  const targetCount = 3 + Math.floor(Math.random() * 2)
  for (let i = 0; i < targetCount; i++) arr.push(stage.target)
  while (arr.length < count) {
    arr.push(nonTargets[Math.floor(Math.random() * nonTargets.length)])
  }
  // 4×4 のマスに1つずつ置き、マスの中で少しずらす（重なって目印が隠れないように）
  const COLS = 4, ROWS = 4
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => i).sort(() => Math.random() - 0.5)
  return arr
    .sort(() => Math.random() - 0.5)
    .map((emoji, idx) => {
      const cell = cells[idx]
      const col = cell % COLS, row = Math.floor(cell / COLS)
      return {
        id: idx,
        emoji,
        isTarget: emoji === stage.target,
        x: 12 + (col + 0.5) * (76 / COLS) + (Math.random() - 0.5) * 8,
        y: 8 + (row + 0.5) * (84 / ROWS) + (Math.random() - 0.5) * 8,
        tapped: false,
      }
    })
}

// ──────────────────────────────────────────
// ステージゲーム本体
// ──────────────────────────────────────────
function StagePlay({ stage, player, onClear, onFail }) {
  const timeLimit = calcTimeLimit(stage, player)
  const [items] = useState(() => generateItems(stage))
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [tapped, setTapped] = useState([])
  const [message, setMessage] = useState(null) // { text, good }
  const doneRef = useRef(false)

  useEffect(() => {
    const id = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  // 時間切れ。state の更新関数の中で親を更新しないよう、ここで判定する
  useEffect(() => {
    if (timeLeft === 0 && !doneRef.current) { doneRef.current = true; onFail('time') }
  }, [timeLeft, onFail])

  const handleTap = (item) => {
    if (doneRef.current || tapped.includes(item.id)) return

    if (item.isTarget) {
      const newTapped = [...tapped, item.id]
      setTapped(newTapped)
      sfx.tap()
      setMessage({ text: 'OK!', good: true })
      // 全ターゲット取得でクリア
      const remainTargets = items.filter((i) => i.isTarget && !newTapped.includes(i.id))
      if (remainTargets.length === 0) {
        doneRef.current = true
        setTimeout(() => onClear(), 500)
      }
    } else {
      // ちがうものは消えずに残り、時間が減る
      sfx.miss()
      setTimeLeft((t) => Math.max(0, t - MISS_PENALTY))
      setMessage({ text: `ちがう！ -${MISS_PENALTY}秒`, good: false })
    }
    setTimeout(() => setMessage(null), 800)
  }

  const targets = items.filter((i) => i.isTarget && !tapped.includes(i.id))
  const pct = (timeLeft / timeLimit) * 100

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* ヘッダー */}
      <div style={stageStyles.header}>
        <span style={{ color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}><GameIcon name={stage.emoji} size={20} /> {stage.name}</span>
        <span style={{ color: pct < 30 ? '#e74c3c' : '#fff', fontWeight: 'bold' }}>{timeLeft}秒</span>
      </div>
      {/* タイマーバー */}
      <div style={stageStyles.timerBar}>
        <div style={{ ...stageStyles.timerFill, width: `${pct}%`, background: pct < 30 ? '#e74c3c' : '#27ae60' }} />
      </div>
      {/* 指示 */}
      <div style={stageStyles.instr}>
        <GameIcon name={stage.target} size={32} />
        <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>{stage.desc}<br /><span style={{ color: '#aab', fontSize: 11 }}>ちがうものをタップすると -{MISS_PENALTY}秒</span></span>
        <span style={{ color: '#ffd700', fontSize: 13 }}>残り {targets.length}個</span>
      </div>
      {/* ゲームフィールド */}
      <div style={{ ...stageStyles.field, backgroundImage: `linear-gradient(rgba(0,0,0,0.28), rgba(0,0,0,0.38)), url(${stage.bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
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
              <GameIcon name={item.emoji} size={36} />
            </button>
          )
        })}
        {message && (
          <div style={{ ...stageStyles.floatMsg, color: message.good ? '#ffd700' : '#ff6b6b' }}>{message.text}</div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// 登山ゲーム全体制御
// ──────────────────────────────────────────
export default function ClimbingGame({ course, player, blessingPct = 0, maintenanceLevel = 100, onComplete, onCancel }) {
  const stages = buildStages(course.difficulty)
  const [stageIdx, setStageIdx] = useState(0)
  const [cleared, setCleared] = useState([])
  const [phase, setPhase] = useState('intro') // intro / playing / between

  const baseTotal = Math.floor((player.core + player.legs + player.arms) / 3)
  // ご利益のぶんだけ総合体力を底上げして判定する
  const total = Math.floor(baseTotal * (1 + blessingPct))
  // 整備度が低い山は道が荒れていて、必要体力が上がる（＝途中で脱落しやすい）
  const baseReq = course.requiredStamina * 5
  const reqTotal = requiredStaminaFor(course, maintenanceLevel)
  const mt = maintenanceState(maintenanceLevel)
  const currentStageKey = stages[stageIdx]
  const currentStage = STAGE_TYPES.find((s) => s.key === currentStageKey)

  // ステージ間の体力チェック
  const checkStamina = (completedIdx) => {
    const progress = (completedIdx + 1) / stages.length
    const required = reqTotal * progress
    if (total < required * 0.5) return 'early_fail'
    const coreRatio = player.core / Math.max(1, total)
    const legsRatio = player.legs / Math.max(1, total)
    if (coreRatio < 0.2 || legsRatio < 0.2) return 'balance_fail'
    return null
  }

  const handleStageClear = () => {
    const newCleared = [...cleared, currentStageKey]
    setCleared(newCleared)
    const check = checkStamina(stageIdx)
    if (check && stageIdx < stages.length - 1) {
      onComplete(check, newCleared.length)
      return
    }
    if (stageIdx >= stages.length - 1) {
      onComplete(total >= reqTotal ? 'success' : 'mid_fail', newCleared.length)
    } else {
      setPhase('between')
    }
  }

  // 結果は登山画面（Climbing）の結果画面でまとめて見せる
  const handleStageFail = (reason) => onComplete(reason || 'early_fail', cleared.length)

  const handleNextStage = () => {
    setStageIdx(stageIdx + 1)
    setPhase('playing')
  }

  if (phase === 'intro') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <GameIcon name="mountain" size={52} />
          <h3 style={styles.title}>{course.mountainName}</h3>
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{course.name}</p>
          <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6 }}>{course.description}</p>
          <div style={styles.infoBox}>
            <p style={styles.infoRow}>距離 {course.distance}km</p>
            <p style={styles.infoRow}>⏱ {course.duration}</p>
            <p style={styles.infoRow}>消費 約{course.calories}kcal</p>
            <p style={styles.infoRow}>全 {stages.length}ステージ</p>
          </div>
          <p style={{ color: total >= reqTotal ? '#7ee8a5' : '#ffd700', fontSize: 13, margin: 0 }}>あなたの総合体力: {total} / 推奨: {reqTotal}</p>
          {mt.penalty > 0 && (
            <p style={{ color: mt.color, fontSize: 12, fontWeight: 700, margin: 0 }}>
              整備度 {maintenanceLevel}%（{mt.label}）で道が荒れている：推奨 {baseReq} → {reqTotal}
            </p>
          )}
          {total < reqTotal && (
            <p style={styles.warn}>
              推奨体力に {reqTotal - total} 足りないよ。山頂まで登りきれずに脱落するかも。
              脱落すると体力とポイントが減るから、鍛えてから来るのがおすすめ！
            </p>
          )}
          <p style={{ color: '#aab', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
            各ステージで、指示された目印を時間内に全部タップしよう。ちがうものをタップすると時間が減るよ
          </p>
          {blessingPct > 0 && (
            <p style={{ color: '#7ee8a5', fontSize: 12, fontWeight: 700 }}>
              ご利益で +{Math.round(blessingPct * 100)}%（{baseTotal} → {total}）
            </p>
          )}
          <button style={styles.primaryBtn} onClick={() => setPhase('playing')}>
            {total >= reqTotal ? '登山スタート！' : 'それでも登る'}
          </button>
          {onCancel && <button style={styles.subBtn} onClick={onCancel}>やめておく</button>}
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
                <GameIcon name={st?.emoji} size={22} />
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
          <GameIcon name="check" size={44} />
          <h3 style={styles.title}>{currentStage?.name} クリア！</h3>
          <p style={{ color: '#ccc', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>次のエリア: <GameIcon name={nextStage?.emoji} size={20} /> {nextStage?.name}</p>
          <p style={{ color: '#aaa', fontSize: 13 }}>
            ステージ {stageIdx + 1}/{stages.length}
          </p>
          <button style={styles.primaryBtn} onClick={handleNextStage}>次へ進む</button>
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
  warn: {
    color: '#ffb4a8', fontSize: 12.5, lineHeight: 1.65, margin: 0,
    background: 'rgba(231,76,60,0.14)', border: '1px solid rgba(231,76,60,0.45)',
    borderRadius: 10, padding: '8px 12px', textAlign: 'left',
  },
  subBtn: {
    width: '100%', padding: '10px 0',
    background: 'rgba(255,255,255,0.08)', color: '#aab',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 24,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
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
