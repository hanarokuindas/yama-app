import { BODY, VIEW } from '../utils/pose'

const SKIN = '#f6eedf'
const SKIN_FAR = '#bdb3a2'
const LINE = '#241e38'
const LIMB = 10
const TORSO = 15
const EDGE = 3.5 // フチの太さ

const seg = (a, b) => `M${a[0]},${a[1]} L${b[0]},${b[1]}`
const path3 = (a, b, c) => `M${a[0]},${a[1]} L${b[0]},${b[1]} L${c[0]},${c[1]}`

// フチ付きの太い線（手足・胴）
function Stroke({ d, color, width }) {
  return (
    <>
      <path d={d} stroke={LINE} strokeWidth={width + EDGE * 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

/* 1コマぶんの人物。focus の部位（体幹・脚・腕）を色で強調する。
   jitter はコマごとに変わる値で、手描きの線のゆらぎ（パラパラ漫画の味）を出す */
export default function MotionFigure({ pts, view, focus, color, floor, scroll = 0, jitter = 0, filterId }) {
  const near = (part) => (focus === part ? color : SKIN)
  const far = (part) => (focus === part ? `${color}b0` : SKIN_FAR)

  const headR = BODY.head
  const ground = 181

  return (
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="1" seed={jitter} />
          <feDisplacementMap in="SourceGraphic" scale="2.4" />
        </filter>
      </defs>

      {/* 床 */}
      {floor === 'mat' ? (
        <rect x={14} y={ground - 3} width={VIEW - 28} height={9} rx={4.5} fill={`${color}55`} stroke={`${color}99`} strokeWidth={1.5} />
      ) : (
        <>
          <ellipse cx={pts.hip[0]} cy={ground + 1} rx={34} ry={4} fill="rgba(0,0,0,0.28)" />
          <line x1={10} y1={ground + 2} x2={VIEW - 10} y2={ground + 2}
            stroke="rgba(255,255,255,0.35)" strokeWidth={2} strokeLinecap="round"
            strokeDasharray={scroll ? '14 10' : undefined} strokeDashoffset={-scroll} />
        </>
      )}

      <g filter={`url(#${filterId})`}>
        {view === 'front' ? (
          <>
            <Stroke d={path3(pts.hipL, pts.kneeL, pts.ankleL)} color={near('legs')} width={LIMB} />
            <Stroke d={path3(pts.hipR, pts.kneeR, pts.ankleR)} color={near('legs')} width={LIMB} />
            <Stroke d={seg(pts.ankleL, pts.toeL)} color={near('legs')} width={LIMB - 2} />
            <Stroke d={seg(pts.ankleR, pts.toeR)} color={near('legs')} width={LIMB - 2} />
            <path
              d={`M${pts.shoulderL[0]},${pts.shoulderL[1]} L${pts.shoulderR[0]},${pts.shoulderR[1]} L${pts.hipR[0]},${pts.hipR[1]} L${pts.hipL[0]},${pts.hipL[1]} Z`}
              fill={near('core')} stroke={LINE} strokeWidth={EDGE * 2} strokeLinejoin="round" paintOrder="stroke"
            />
            <Stroke d={path3(pts.shoulderL, pts.elbowL, pts.handL)} color={near('arms')} width={LIMB - 1} />
            <Stroke d={path3(pts.shoulderR, pts.elbowR, pts.handR)} color={near('arms')} width={LIMB - 1} />
            <Stroke d={seg(pts.shoulder, pts.head)} color={SKIN} width={8} />
            <circle cx={pts.head[0]} cy={pts.head[1]} r={headR} fill={SKIN} stroke={LINE} strokeWidth={EDGE} />
            {/* 目（頭の傾きに合わせて置く） */}
            <FrontEyes head={pts.head} neck={pts.shoulder} />
          </>
        ) : (
          <>
            {/* 奥の手足 → 胴 → 頭 → 手前の手足 の順に重ねる */}
            <Stroke d={path3(pts.shoulder, pts.elbowF, pts.handF)} color={far('arms')} width={LIMB - 1} />
            <Stroke d={path3(pts.hip, pts.kneeF, pts.ankleF)} color={far('legs')} width={LIMB} />
            <Stroke d={seg(pts.ankleF, pts.toeF)} color={far('legs')} width={LIMB - 2} />
            <Stroke d={seg(pts.hip, pts.shoulder)} color={near('core')} width={TORSO} />
            <Stroke d={seg(pts.shoulder, pts.head)} color={SKIN} width={8} />
            <circle cx={pts.head[0]} cy={pts.head[1]} r={headR} fill={SKIN} stroke={LINE} strokeWidth={EDGE} />
            <SideEye head={pts.head} neck={pts.shoulder} />
            <Stroke d={path3(pts.hip, pts.kneeN, pts.ankleN)} color={near('legs')} width={LIMB} />
            <Stroke d={seg(pts.ankleN, pts.toeN)} color={near('legs')} width={LIMB - 2} />
            <Stroke d={path3(pts.shoulder, pts.elbowN, pts.handN)} color={near('arms')} width={LIMB - 1} />
          </>
        )}
      </g>
    </svg>
  )
}

// 横顔の目：首→頭の向きに対して前（右回り90°）側に置く
function SideEye({ head, neck }) {
  const ux = head[0] - neck[0]
  const uy = head[1] - neck[1]
  const len = Math.hypot(ux, uy) || 1
  const [ax, ay] = [ux / len, uy / len]   // 首から頭へ
  const [fx, fy] = [-ay, ax]             // 顔の前方向
  return <circle cx={head[0] + fx * 5.5 + ax * 1.5} cy={head[1] + fy * 5.5 + ay * 1.5} r={1.9} fill={LINE} />
}

function FrontEyes({ head, neck }) {
  const ux = head[0] - neck[0]
  const uy = head[1] - neck[1]
  const len = Math.hypot(ux, uy) || 1
  const [ax, ay] = [ux / len, uy / len]
  const [sx, sy] = [-ay, ax]
  return (
    <>
      <circle cx={head[0] + sx * 4 + ax * 1} cy={head[1] + sy * 4 + ay * 1} r={1.7} fill={LINE} />
      <circle cx={head[0] - sx * 4 + ax * 1} cy={head[1] - sy * 4 + ay * 1} r={1.7} fill={LINE} />
    </>
  )
}
