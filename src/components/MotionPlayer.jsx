import { useEffect, useState } from 'react'
import { MOTIONS } from '../data/motions'
import { MOTION_IMAGES } from '../assets/motions'

const CUE_MIN_SEC = 3 // 声かけは最低この秒数は同じものを出す

/* お手本アニメ（画像コマのパラパラ再生）。
   time を渡すとその秒数のコマを出す（トレーニング中は回数カウントと同期させる）。
   渡さなければ自分で時間を進める（準備画面のお手本）。
   cycle は1周の秒数、mirror は左右反転。children はステージに重ねて表示する */
export default function MotionPlayer({ id, cycle, time, mirror = false, color, size = 220, children }) {
  const motion = MOTIONS[id]
  const images = MOTION_IMAGES[id]
  const own = useOwnClock(time === undefined)
  const t = time === undefined ? own : time

  const totalW = motion.seq.reduce((s, f) => s + f.w, 0)
  let pos = ((t % cycle) / cycle) * totalW
  let frame = motion.seq[motion.seq.length - 1]
  for (const f of motion.seq) {
    if (pos < f.w) { frame = f; break }
    pos -= f.w
  }
  const flip = mirror !== !!frame.flip
  // 声かけは1回の動作ごとに次へ（速い種目でも最低3秒は同じ）
  const cue = motion.cues[Math.floor(t / Math.max(cycle, CUE_MIN_SEC)) % motion.cues.length]

  return (
    <div style={st.wrap}>
      <div style={{
        ...st.stage, width: size, height: size,
        background: `radial-gradient(circle at 50% 62%, ${color}38 0%, ${color}10 46%, rgba(255,255,255,0.03) 72%)`,
        borderColor: `${color}55`,
      }}>
        <img src={images[frame.i]} alt="" draggable={false}
          style={{ ...st.img, transform: flip ? 'scaleX(-1)' : 'none' }} />
        {children}
      </div>
      <p style={st.cue}>{cue}</p>
    </div>
  )
}

/* コマを①②③と並べた図。動きの流れを止まった絵で見せる */
export function MotionStrip({ id, color }) {
  const motion = MOTIONS[id]
  const images = MOTION_IMAGES[id]
  return (
    <div style={st.strip}>
      {motion.labels.map((label, i) => (
        <div key={i} style={st.stripItem}>
          {i > 0 && <span style={st.arrow}>›</span>}
          <div style={{ ...st.thumb, borderColor: `${color}55` }}>
            <span style={{ ...st.num, background: color }}>{i + 1}</span>
            <img src={images[i]} alt="" draggable={false} style={st.thumbImg} />
          </div>
          <span style={st.label}>{label}</span>
        </div>
      ))}
    </div>
  )
}

function useOwnClock(active) {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!active) return
    const start = Date.now()
    const id = setInterval(() => setT((Date.now() - start) / 1000), 100)
    return () => clearInterval(id)
  }, [active])
  return t
}

const st = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  stage: {
    position: 'relative', borderRadius: 24,
    border: '1.5px solid', overflow: 'hidden',
    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.35)',
  },
  img: { position: 'absolute', inset: '4%', width: '92%', height: '92%', objectFit: 'contain', display: 'block' },
  cue: {
    margin: 0, color: '#fff', fontSize: 16, fontWeight: 900, letterSpacing: 0.5,
    textShadow: '0 2px 8px rgba(0,0,0,0.6)', minHeight: 24, textAlign: 'center',
  },

  strip: { display: 'flex', width: '100%', justifyContent: 'center', gap: 2 },
  stripItem: {
    position: 'relative', flex: '1 1 0', minWidth: 0, maxWidth: 104,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },
  arrow: {
    position: 'absolute', left: -9, top: 30,
    color: '#f5c842', fontSize: 20, fontWeight: 900,
  },
  thumb: {
    position: 'relative', width: '86%', aspectRatio: '1 / 1',
    background: 'rgba(255,255,255,0.05)', border: '1.5px solid', borderRadius: 12,
  },
  num: {
    position: 'absolute', top: 3, left: 3, zIndex: 1,
    width: 18, height: 18, borderRadius: '50%',
    color: '#fff', fontSize: 11, fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  thumbImg: { position: 'absolute', inset: '6%', width: '88%', height: '88%', objectFit: 'contain' },
  label: { color: '#dde', fontSize: 11, fontWeight: 700, lineHeight: 1.35, textAlign: 'center' },
}
