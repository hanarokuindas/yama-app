import { useState, useEffect } from 'react'
import { BG } from '../assets/backgrounds'
import GameIcon from '../components/GameIcon'
import { useGameStore } from '../stores/gameStore'
import { sfx } from '../utils/sound'
import {
  ACTIVITIES, getCost, getRestore, formatDuration, remainingMinutes, rushCost, maintenanceState,
} from '../data/maintenanceActivities'

const MOUNTAINS = [
  { id: 'satoyama', name: 'ふもとの里山', emoji: 'herb' },
  { id: 'takao', name: '高尾山', emoji: 'forest' },
  { id: 'yatsugatake', name: '八ヶ岳連峰', emoji: 'mountain' },
  { id: 'hakone', name: '箱根山', emoji: 'volcano' },
]

function MaintenanceBar({ level }) {
  const { color, label, penalty } = maintenanceState(level)
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#fff', marginBottom: 4 }}>
        <span>整備状態</span>
        <span style={{ color }}>{label} {level}%</span>
      </div>
      <div style={{ height: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 5 }}>
        <div style={{ height: '100%', width: `${level}%`, background: color, borderRadius: 5, transition: 'width 0.5s' }} />
      </div>
      <div style={{ color: penalty ? color : '#8a90a8', fontSize: 12, marginTop: 6 }}>
        {penalty
          ? `道が荒れていて、登山の必要体力が +${Math.round(penalty * 100)}% になっているよ`
          : '道は歩きやすいよ（61%以上なら登山に影響なし）'}
      </div>
    </div>
  )
}

export default function Maintenance() {
  const player = useGameStore((s) => s.player)
  const mountains = useGameStore((s) => s.mountains)
  const spendPoints = useGameStore((s) => s.spendPoints)
  const startMaintenance = useGameStore((s) => s.startMaintenance)
  const recordMission = useGameStore((s) => s.recordMission)
  const collectMaintenance = useGameStore((s) => s.collectMaintenance)
  const rushMaintenance = useGameStore((s) => s.rushMaintenance)

  const [selected, setSelected] = useState(null) // mountainId
  const [message, setMessage] = useState('')
  const [, setTick] = useState(0)                // 残り時間の表示を1分ごとに更新する

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const mt = selected ? mountains[selected] : null
  const level = mt?.maintenanceLevel ?? 100
  const leftMin = remainingMinutes(mt)
  const working = mt?.workingActivity
    ? ACTIVITIES.find((a) => a.id === mt.workingActivity)
    : null

  const startWork = (activity) => {
    const cost = getCost(activity, level)
    if (!spendPoints(cost)) {
      setMessage(`ポイントが足りません（必要: ${cost.toLocaleString()}pt）`)
      setTimeout(() => setMessage(''), 2000)
      return
    }
    sfx.confirm()
    startMaintenance(selected, activity.id, activity.duration)
    recordMission('maintain')
  }

  const collect = () => {
    sfx.item()
    collectMaintenance(selected, getRestore(working, level))
  }

  const rush = () => {
    if (rushMaintenance(selected)) sfx.coin()
    else {
      setMessage('ポイントが足りません')
      setTimeout(() => setMessage(''), 2000)
    }
  }

  // 作業中／完了待ち
  if (working) {
    const pct = Math.max(0, Math.min(100, (1 - leftMin / working.duration) * 100))
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <GameIcon name={working.icon} size={56} />
          <h3 style={styles.title}>{working.name}</h3>
          {leftMin > 0 ? (
            <>
              <p style={{ color: '#ccc', fontSize: 14 }}>
                作業中… 残り {formatDuration(leftMin)}
              </p>
              <div style={styles.progressRing}>
                <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={50} cy={50} r={42} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={8} />
                  <circle
                    cx={50} cy={50} r={42} fill="none"
                    stroke="#27ae60" strokeWidth={8}
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <span style={styles.ringLabel}>{Math.round(pct)}%</span>
              </div>
              <p style={styles.noteBox}>
                作業が終わるまで、この山には登れないよ。<br />
                アプリを閉じても時間は進むから、またあとで見に来てね。
              </p>
              {message && <p style={{ color: '#e74c3c', fontSize: 13 }}>{message}</p>}
              <button style={styles.rushBtn} onClick={rush}>
                ポイントで早める（{rushCost(mt).toLocaleString()}pt）
              </button>
              <button style={styles.backBtn} onClick={() => setSelected(null)}>山選択へ</button>
            </>
          ) : (
            <>
              <GameIcon name="check" size={44} />
              <p style={{ color: '#27ae60', fontSize: 16 }}>整備完了！</p>
              <button style={styles.primaryBtn} onClick={collect}>
                受け取る（+{getRestore(working, level)}%）
              </button>
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
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 900, padding: '18px 0 8px' }}><GameIcon name={mInfo?.emoji} size={24} style={{ marginRight: 6 }} />{mInfo?.name}</h2>
        <div style={styles.mainCard}>
          <MaintenanceBar level={level} />
          {level < 30 && (
            <div style={styles.alertBox}>
              山が荒廃しています！整備の費用が10倍、登山の必要体力が+50%になっています。早く整備して！
            </div>
          )}
          <p style={{ color: '#aaa', fontSize: 13, margin: '8px 0' }}>
            ★ {player.points.toLocaleString()}pt 所持
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
                <GameIcon name={a.icon} size={30} />
                <div style={styles.actInfo}>
                  <span style={styles.actName}>{a.name}</span>
                  <span style={{ color: '#ccc', fontSize: 12 }}>{a.desc}</span>
                </div>
                <div style={styles.actMeta}>
                  <span style={{ color: '#ffd700', fontSize: 13 }}>{cost.toLocaleString()}pt</span>
                  <span style={{ color: '#27ae60', fontSize: 12 }}>+{restore}%</span>
                  <span style={{ color: '#8a90a8', fontSize: 11 }}>{formatDuration(a.duration)}</span>
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
      <p style={{ color: '#ccc', fontSize: 13, marginBottom: 12, textAlign: 'center', padding: '0 16px', lineHeight: 1.7 }}>
        登った山は、整備度が1日に5%ずつ下がるよ。<br />
        60%以下になると道が荒れて、登山で脱落しやすくなるよ。<br />
        大きな作業ほど割安だけど、そのぶん長く登れなくなるよ。
      </p>
      <div style={styles.list}>
        {MOUNTAINS.map((m) => {
          const mt = mountains[m.id]
          if (!mt?.unlocked) return null
          const lv = mt.maintenanceLevel
          const { color, penalty } = maintenanceState(lv)
          const busy = remainingMinutes(mt)
          return (
            <button key={m.id} style={styles.mountCard} onClick={() => setSelected(m.id)}>
              <GameIcon name={m.emoji} size={40} />
              <div style={{ flex: 1 }}>
                <div style={styles.mountName}>
                  {m.name}
                  {busy > 0 && <span style={styles.busyChip}>整備中 残り{formatDuration(busy)}</span>}
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, marginTop: 6 }}>
                  <div style={{ height: '100%', width: `${lv}%`, background: color, borderRadius: 3 }} />
                </div>
                <div style={{ color, fontSize: 12, marginTop: 2 }}>
                  整備 {lv}%{penalty > 0 && `（登山の必要体力 +${Math.round(penalty * 100)}%）`}
                </div>
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
    backgroundImage: `linear-gradient(rgba(8,10,24,0.72), rgba(8,10,24,0.82)), url(${BG.stage.trail})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
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
  noteBox: {
    color: '#aab', fontSize: 11.5, lineHeight: 1.7, textAlign: 'center',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '10px 12px', margin: '4px 0',
  },
  rushBtn: {
    width: '100%', padding: '11px 0',
    background: 'linear-gradient(135deg, #f5c842, #e0a800)',
    color: '#1a0e00', border: 'none', borderRadius: 24,
    fontSize: 14, fontWeight: 900, cursor: 'pointer',
  },
  busyChip: {
    background: 'rgba(245,200,66,0.18)', border: '1px solid rgba(245,200,66,0.5)',
    color: '#f5c842', fontSize: 10, fontWeight: 900,
    borderRadius: 8, padding: '2px 7px', marginLeft: 6,
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
