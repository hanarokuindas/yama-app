import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'

const MOUNTAINS = [
  { id: 'takao', name: '高尾山', emoji: '🌲' },
  { id: 'yatsugatake', name: '八ヶ岳連峰', emoji: '⛰️' },
  { id: 'hakone', name: '箱根山', emoji: '🌋' },
]

// 整備アクティビティ定義
const ACTIVITIES = [
  { id: 'trash', name: 'ゴミ拾い', icon: '🗑️', cost: 1000, restore: 5, duration: 10, desc: '山道のゴミを拾って清潔に！' },
  { id: 'branch', name: '枝切り', icon: '✂️', cost: 10000, restore: 10, duration: 30, desc: '危険な枝を除去！' },
  { id: 'grass', name: '草刈り', icon: '🌾', cost: 10000, restore: 10, duration: 30, desc: '登山道の草を刈る！' },
  { id: 'patrol', name: '巡回', icon: '👣', cost: 10000, restore: 8, duration: 20, desc: '山のパトロール！' },
  { id: 'trail', name: '登山道整備', icon: '🛠️', cost: 20000, restore: 20, duration: 60, desc: '道の補修や整備！' },
  { id: 'planting', name: '植栽', icon: '🌱', cost: 80000, restore: 40, duration: 120, desc: '木を植えて緑化！' },
  { id: 'thinning', name: '間伐', icon: '🪵', cost: 100000, restore: 50, duration: 180, desc: '森を健康に保つ！' },
]

// 荒廃時は各コストが10倍
function getCost(activity, maintenanceLevel) {
  if (maintenanceLevel < 30) return activity.cost * 10
  return activity.cost
}

function getRestore(activity, maintenanceLevel) {
  if (maintenanceLevel < 30) return activity.restore * 0.5
  return activity.restore
}

function MaintenanceBar({ level }) {
  const color = level > 60 ? '#27ae60' : level > 30 ? '#f39c12' : '#e74c3c'
  const label = level > 60 ? '良好' : level > 30 ? '要注意' : '荒廃中！'
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#fff', marginBottom: 4 }}>
        <span>整備状態</span>
        <span style={{ color }}>{label} {level}%</span>
      </div>
      <div style={{ height: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 5 }}>
        <div style={{ height: '100%', width: `${level}%`, background: color, borderRadius: 5, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

export default function Maintenance() {
  const player = useGameStore((s) => s.player)
  const mountains = useGameStore((s) => s.mountains)
  const spendPoints = useGameStore((s) => s.spendPoints)
  const maintainMountain = useGameStore((s) => s.maintainMountain)

  const [selected, setSelected] = useState(null) // mountainId
  const [working, setWorking] = useState(null)   // activityId
  const [workTimer, setWorkTimer] = useState(0)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')

  const mt = selected ? mountains[selected] : null
  const level = mt?.maintenanceLevel ?? 100

  const startWork = (activity) => {
    const cost = getCost(activity, level)
    if (!spendPoints(cost)) {
      setMessage(`ポイントが足りません（必要: ${cost.toLocaleString()}pt）`)
      setTimeout(() => setMessage(''), 2000)
      return
    }
    setWorking(activity)
    setWorkTimer(activity.duration)
    setDone(false)

    const id = setInterval(() => {
      setWorkTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          const restore = getRestore(activity, level)
          maintainMountain(selected, restore)
          setDone(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleBack = () => {
    setWorking(null)
    setDone(false)
    setWorkTimer(0)
  }

  // 作業中
  if (working) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <span style={{ fontSize: 52 }}>{working.icon}</span>
          <h3 style={styles.title}>{working.name}</h3>
          {!done ? (
            <>
              <p style={{ color: '#ccc', fontSize: 14 }}>作業中… {workTimer}秒</p>
              <div style={styles.progressRing}>
                <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={50} cy={50} r={42} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={8} />
                  <circle
                    cx={50} cy={50} r={42} fill="none"
                    stroke="#27ae60" strokeWidth={8}
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (workTimer / working.duration)}`}
                    style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                  />
                </svg>
                <span style={styles.ringLabel}>{workTimer}s</span>
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: 40 }}>✅</span>
              <p style={{ color: '#27ae60', fontSize: 16 }}>整備完了！整備レベルが回復しました</p>
              <button style={styles.primaryBtn} onClick={handleBack}>戻る</button>
            </>
          )}
        </div>
      </div>
    )
  }

  // アクティビティ選択
  if (selected) {
    const unlockedMt = mountains[selected]
    if (!unlockedMt?.unlocked) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <p style={{ color: '#aaa' }}>この山はまだ解禁されていません</p>
            <button style={styles.backBtn} onClick={() => setSelected(null)}>戻る</button>
          </div>
        </div>
      )
    }
    const mInfo = MOUNTAINS.find((m) => m.id === selected)
    return (
      <div style={styles.container}>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 900, padding: '18px 0 8px' }}>{mInfo?.emoji} {mInfo?.name}</h2>
        <div style={styles.mainCard}>
          <MaintenanceBar level={level} />
          {level < 30 && (
            <div style={styles.alertBox}>
              ⚠️ 山が荒廃しています！コストが10倍になります。早く整備して！
            </div>
          )}
          <p style={{ color: '#aaa', fontSize: 13, margin: '8px 0' }}>
            ⭐ {player.points.toLocaleString()}pt 所持
          </p>
        </div>
        {message && <p style={{ color: '#e74c3c', fontSize: 14 }}>{message}</p>}
        <div style={styles.activityList}>
          {ACTIVITIES.map((a) => {
            const cost = getCost(a, level)
            const restore = getRestore(a, level)
            const canAfford = player.points >= cost
            return (
              <button
                key={a.id}
                style={{ ...styles.actCard, opacity: canAfford ? 1 : 0.5 }}
                onClick={() => canAfford && startWork(a)}
                disabled={!canAfford}
              >
                <span style={styles.actIcon}>{a.icon}</span>
                <div style={styles.actInfo}>
                  <span style={styles.actName}>{a.name}</span>
                  <span style={{ color: '#ccc', fontSize: 12 }}>{a.desc}</span>
                </div>
                <div style={styles.actMeta}>
                  <span style={{ color: '#ffd700', fontSize: 13 }}>{cost.toLocaleString()}pt</span>
                  <span style={{ color: '#27ae60', fontSize: 12 }}>+{restore}%</span>
                </div>
              </button>
            )
          })}
        </div>
        <button style={styles.backBtn} onClick={() => setSelected(null)}>← 山選択へ</button>
      </div>
    )
  }

  // 山選択
  return (
    <div style={styles.container}>
      <div style={styles.pageTitle}>MAINTENANCE</div>
      <p style={{ color: '#ccc', fontSize: 13, marginBottom: 12, textAlign: 'center', padding: '0 16px' }}>
        山を整備して自然を守ろう。放置すると荒廃するよ！
      </p>
      <div style={styles.list}>
        {MOUNTAINS.map((m) => {
          const mt = mountains[m.id]
          if (!mt?.unlocked) return null
          const lv = mt.maintenanceLevel
          const color = lv > 60 ? '#27ae60' : lv > 30 ? '#f39c12' : '#e74c3c'
          return (
            <button key={m.id} style={styles.mountCard} onClick={() => setSelected(m.id)}>
              <span style={{ fontSize: 36 }}>{m.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={styles.mountName}>{m.name}</div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, marginTop: 6 }}>
                  <div style={{ height: '100%', width: `${lv}%`, background: color, borderRadius: 3 }} />
                </div>
                <div style={{ color, fontSize: 12, marginTop: 2 }}>整備 {lv}%</div>
              </div>
              <span style={{ color: '#aaa', fontSize: 20 }}>›</span>
            </button>
          )
        })}
      </div>
    </div>
  )
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
  list: {
    width: 'calc(100% - 32px)',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  mountCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 14,
    padding: '14px 16px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  mountName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  mainCard: {
    width: 'calc(100% - 32px)',
    maxWidth: 360,
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: '12px 16px',
    marginBottom: 8,
    boxSizing: 'border-box',
  },
  alertBox: {
    background: 'rgba(231,76,60,0.2)',
    border: '1px solid #e74c3c',
    borderRadius: 8,
    padding: '8px 12px',
    color: '#e74c3c',
    fontSize: 13,
    marginTop: 8,
  },
  activityList: {
    width: 'calc(100% - 32px)',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  actCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: '12px 14px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  actIcon: { fontSize: 28, flexShrink: 0 },
  actInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  actName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  actMeta: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  card: {
    margin: '32px 16px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '28px 24px',
    width: 'calc(100% - 32px)',
    maxWidth: 340,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    backdropFilter: 'blur(8px)',
    textAlign: 'center',
  },
  title: { color: '#fff', fontSize: 22, margin: 0 },
  progressRing: { position: 'relative', width: 100, height: 100 },
  ringLabel: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
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
  backBtn: {
    width: 'calc(100% - 32px)',
    maxWidth: 360,
    padding: '10px 0',
    background: 'rgba(255,255,255,0.08)',
    color: '#aaa',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 24,
    fontSize: 14,
    cursor: 'pointer',
    marginTop: 4,
  },
}
