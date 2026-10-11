import { useEffect, useState } from 'react'
import { MOTIONS } from '../data/motions'
import { MOTION_IMAGES } from '../assets/motions'

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
      <p key={frame.cue} style={st.cue}>{frame.cue}</p>
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
    animation: 'popIn 0.3s ease',
  },
}
