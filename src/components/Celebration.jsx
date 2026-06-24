import { useMemo } from 'react'

const COLORS = ['#f5c842', '#2ecc71', '#3b82f6', '#a855f7', '#ec4899', '#ffe98a']

// index から決定的に 0..1 の疑似乱数を作る（純粋関数なのでrender中でも安全）
function rand(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

// 紙吹雪オーバーレイ（pointer-events無効で操作を邪魔しない）
export function Confetti({ count = 40 }) {
  const pieces = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: rand(i + 1) * 100,
      delay: rand(i + 2) * 0.6,
      dur: 1.8 + rand(i + 3) * 1.4,
      color: COLORS[i % COLORS.length],
      size: 6 + rand(i + 4) * 8,
      rounded: rand(i + 5) > 0.5,
    })), [count])

  return (
    <div style={styles.confettiLayer} aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: -20,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.rounded ? '50%' : 2,
            animation: `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}

// 中央に大きく出る祝福バナー（紙吹雪＋後光＋メッセージ）
export function Celebration({ icon = '🎊', title, subtitle, onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <Confetti />
      <div style={styles.glow} />
      <div style={styles.burstCard}>
        <div style={styles.icon}>{icon}</div>
        <h2 style={styles.title}>{title}</h2>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        <p style={styles.tapHint}>タップして閉じる</p>
      </div>
    </div>
  )
}

const styles = {
  confettiLayer: {
    position: 'fixed',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 2000,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1500,
    animation: 'overlayFade 0.3s ease',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    background: 'radial-gradient(circle, rgba(245,200,66,0.5) 0%, transparent 65%)',
    animation: 'glowPulse 1.6s ease-in-out infinite',
    pointerEvents: 'none',
  },
  burstCard: {
    position: 'relative',
    textAlign: 'center',
    padding: '32px 28px',
    animation: 'burst 0.6s cubic-bezier(.22,1,.36,1)',
    zIndex: 1,
  },
  icon: { fontSize: 72, marginBottom: 8, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 900,
    textShadow: '0 0 20px rgba(245,200,66,0.6)',
    marginBottom: 6,
  },
  subtitle: { color: '#f5c842', fontSize: 16, fontWeight: 700 },
  tapHint: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 20 },
}
