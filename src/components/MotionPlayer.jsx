import { useEffect, useId, useMemo, useState } from 'react'
import MotionFigure from './MotionFigure'
import { MOTIONS } from '../data/motions'
import { MOTION_IMAGES } from '../assets/motions'
import { buildTimeline, solvePose, FRAME_MS } from '../utils/pose'
import { sfx } from '../utils/sound'

/* トレーニングのパラパラアニメ再生。
   手描きのコマ（assets/motions/<id>/）があればそれを、無ければコードで描いた人物を使う。
   counting のときは回数を数える。children はステージに重ねて表示する */
export default function MotionPlayer({ menuId, focus, color, counting = false, size = 220, children }) {
  const motion = MOTIONS[menuId]
  const images = MOTION_IMAGES[menuId]
  const timeline = useMemo(() => buildTimeline(motion), [motion])
  const solved = useMemo(
    () => timeline.frames.map((f) => solvePose(f.pose, motion.view)),
    [timeline, motion.view],
  )
  const filterId = `boil${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), FRAME_MS)
    return () => clearInterval(id)
  }, [])

  const len = timeline.frames.length
  const idx = (tick + timeline.start) % len
  const frame = timeline.frames[idx]
  const reps = motion.count ? Math.floor((tick * motion.count) / len) : 0

  // 1回ごとに小さく鳴らす（歩数は数が多くうるさいので鳴らさない）
  const beep = counting && motion.count === 1
  useEffect(() => {
    if (beep && reps > 0) sfx.tick()
  }, [beep, reps])

  // 手描きコマ：決められた枚数そろっていれば art の対応で声かけと同期、違えば1周に均等に割り振る
  const synced = images && motion.art && images.length === Math.max(...motion.art) + 1
  const image = images && (synced
    ? images[motion.art[frame.key]]
    : images[Math.floor((idx / len) * images.length)])

  return (
    <div style={st.wrap}>
      <div style={{
        ...st.stage, width: size, height: size,
        background: `radial-gradient(circle at 50% 62%, ${color}38 0%, ${color}10 46%, rgba(255,255,255,0.03) 72%)`,
        borderColor: `${color}55`,
      }}>
        <div style={st.figure}>
          {image
            ? <img src={image} alt="" style={st.img} draggable={false} />
            : (
              <MotionFigure
                pts={solved[idx]} view={motion.view} focus={focus} color={color}
                floor={motion.floor} scroll={motion.scroll ? tick * 6 : 0}
                jitter={(tick % 3) + 1} filterId={filterId}
              />
            )}
        </div>
        {counting && motion.count > 0 && (
          <div style={{ ...st.reps, borderColor: `${color}aa` }}>
            <span key={reps} style={st.repsNum}>{reps}</span>
            <span style={st.repsUnit}>{motion.unit}</span>
          </div>
        )}
        {children}
      </div>
      <p key={frame.cue} style={{ ...st.cue, color: counting ? '#fff' : '#dde' }}>{frame.cue}</p>
    </div>
  )
}

const st = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  stage: {
    position: 'relative', borderRadius: 24,
    border: '1.5px solid', overflow: 'hidden',
    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.35)',
  },
  figure: { position: 'absolute', inset: '6% 6% 4%' },
  img: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
  reps: {
    position: 'absolute', top: 10, left: 10,
    display: 'flex', alignItems: 'baseline', gap: 2,
    background: 'rgba(8,10,24,0.72)', border: '1.5px solid',
    borderRadius: 14, padding: '3px 10px',
  },
  repsNum: { color: '#fff', fontSize: 20, fontWeight: 900, animation: 'popIn 0.3s ease', display: 'inline-block' },
  repsUnit: { color: '#aab', fontSize: 11, fontWeight: 700 },
  cue: {
    margin: 0, fontSize: 17, fontWeight: 900, letterSpacing: 0.5,
    textShadow: '0 2px 8px rgba(0,0,0,0.6)', minHeight: 26, textAlign: 'center',
    animation: 'popIn 0.3s ease',
  },
}
